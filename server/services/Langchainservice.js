// server/services/LangChainService.js
import { ChatGroq } from "@langchain/groq";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from "@langchain/pinecone";
import { CohereEmbeddings } from "@langchain/cohere";
import { RetrievalQAChain } from 'langchain/chains';
import { Pinecone } from "@pinecone-database/pinecone";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv"

dotenv.config();


class LangChainService {
  constructor() {
    // Validate required environment variables
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is required');
    }
    if (!process.env.COHERE_API_KEY) {
      throw new Error('COHERE_API_KEY is required');
    }
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('PINECONE_API_KEY is required');
    }

    this.groq = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY,
      temperature: 0.3,
      model: 'llama-3.3-70b-versatile'
    });

    this.embeddings = new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: "embed-english-v3.0"
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    this.index = null;
    this.systemPrompt = this.createSystemPrompt();
  }

  createSystemPrompt() {
    return `You are an AI-powered code editor assistant with access to the complete codebase context. Your role is to analyze code, understand requirements, and provide intelligent responses.

INSTRUCTIONS:
1. Analyze the user's query and the provided code context thoroughly
2. If the query requires code changes/edits to any file:
   - Provide the complete edited file content
   - Wrap the edited file with ###edit tags at the start and end
   - Format: ###edit:filename.ext at the beginning and ###edit at the end
   - Include the ENTIRE file content, not just the changed parts
   - Ensure all imports, dependencies, and existing functionality remain intact
3. Always provide a human-readable explanation of what was done or analyzed
4. If no code changes are needed, provide only the text response
5. Be precise and ensure code changes are syntactically correct
6. Consider the relationships between files when making changes
7. If the user mentions a specific filename that is currently open, prioritize that file for edits
8. Maintain code formatting, comments, and structure

RESPONSE FORMAT:
- If editing is required: 
  ###edit:filename.ext
  [complete file content with all imports, functions, and existing code]
  ###edit
  
  [Human readable explanation of changes made]

- If no editing is required:
  [Human readable explanation only]

IMPORTANT: When editing files, always include the complete file content to ensure nothing is lost or broken.

Remember: You have access to the complete codebase context, so consider file dependencies and relationships when making changes.`;
  }

  async initialize() {
    try {
      const indexName = process.env.PINECONE_INDEX || "codi";
      this.index = this.pinecone.Index(indexName);
      
      // Test connection to Pinecone
      await this.index.describeIndexStats();
      console.log('Successfully connected to Pinecone index:', indexName);
      
      return this.index;
    } catch (error) {
      console.error('Error initializing Pinecone:', error);
      throw new Error('Failed to initialize Pinecone connection');
    }
  }

  async processRepository(files, username, repoName) {
    try {
      // Validate inputs
      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new Error('Files array is required and cannot be empty');
      }
      if (!username || !repoName) {
        throw new Error('Username and repository name are required');
      }

      // Combine all files with metadata
      const docs = files.map(file => ({
        
        pageContent: file.content || '',
        metadata: {
          filename: file.name,
          path: file.path,
          language: file.language || 'unknown',
          username,
          repoName,
          size: file.content ? file.content.length : 0
        }
      })).filter(doc => doc.pageContent.trim().length > 0); // Filter out empty files

      if (docs.length === 0) {
        throw new Error('No valid documents with content to process');
      }

      // Split text into chunks with better configuration
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 300,
        separators: ['\n\n', '\n', ' ', '']
      });
      
      console.log(`Splitting ${docs.length} documents...`);
      
      const splitDocs = await textSplitter.splitDocuments(docs);
      console.log(`Documents split into ${splitDocs.length} chunks`);
      
      // Create vector store with namespace
      const namespace = `${username}-${repoName}`;
      const vectorStore = await PineconeStore.fromDocuments(
        splitDocs,
        this.embeddings,
        {
          pineconeIndex: this.index,
          namespace: namespace
        }
      );
      
      console.log(`Vector store created successfully for namespace: ${namespace}`);

      return { 
        success: true, 
        docCount: splitDocs.length,
        namespace: namespace,
        originalFileCount: files.length
      };
    } catch (error) {
      console.error('Error processing repository:', error);
      throw error;
    }
  }

  async queryRepository(query, username, repoName, currentFilename = null) {
    try {
      // Validate inputs
      if (!query || typeof query !== 'string') {
        throw new Error('Query is required and must be a string');
      }
      if (!username || !repoName) {
        throw new Error('Username and repository name are required');
      }

      const namespace = `${username}-${repoName}`;
      
      // Create vector store
      const vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        {
          pineconeIndex: this.index,
          namespace: namespace
        }
      );
      
      console.log(`Vector store created successfully for namespace: ${namespace}`);

      // Enhanced query with current filename context
      let enhancedQuery = query;
      if (currentFilename) {
        enhancedQuery = `Current file: ${currentFilename}\n\nQuery: ${query}`;
      }

      // Create custom prompt template with system prompt
      const promptTemplate = new PromptTemplate({
        template: `${this.systemPrompt}

Context from codebase:
{context}

${currentFilename ? `Currently opened file: ${currentFilename}` : ''}

User Query: {question}

Response:`,
        inputVariables: ["context", "question"]
      });

      // Create chain with custom prompt and better retrieval
      const chain = RetrievalQAChain.fromLLM(
        this.groq,
        vectorStore.asRetriever({
          k: 12, // Retrieve more documents for better context
          searchType: "similarity",
          searchKwargs: {
            filter: currentFilename ? { filename: currentFilename } : undefined
          }
        }),
        {
          returnSourceDocuments: false,
          prompt: promptTemplate
        }
      );
      
      console.log('Chain created successfully');

      // Execute query
      const response = await chain.call({
        query: enhancedQuery
      });

      console.log('Query response generated successfully');

      // Process and return response
      return {
        answer: response.text || response.content,
        namespace: namespace,
        currentFile: currentFilename
      };
    } catch (error) {
      console.error('Error querying repository:', error);
      throw error;
    }
  }

  // Method to delete a repository namespace
  async deleteRepository(username, repoName) {
    try {
      const namespace = `${username}-${repoName}`;
      await this.index.deleteAll({ namespace });
      console.log(`Successfully deleted namespace: ${namespace}`);
      return { success: true, namespace };
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  }

  // Method to list available namespaces (repositories)
  async listRepositories(username) {
    try {
      const stats = await this.index.describeIndexStats();
      const namespaces = Object.keys(stats.namespaces || {});
      const userNamespaces = namespaces.filter(ns => ns.startsWith(`${username}-`));
      
      return {
        success: true,
        repositories: userNamespaces.map(ns => ns.replace(`${username}-`, '')),
        totalNamespaces: userNamespaces.length
      };
    } catch (error) {
      console.error('Error listing repositories:', error);
      throw error;
    }
  }

  // Method to update system prompt dynamically
  updateSystemPrompt(newPrompt) {
    if (typeof newPrompt !== 'string' || newPrompt.trim().length === 0) {
      throw new Error('System prompt must be a non-empty string');
    }
    this.systemPrompt = newPrompt;
    console.log('System prompt updated successfully');
  }

  // Method to get current system prompt
  getSystemPrompt() {
    return this.systemPrompt;
  }

  // Health check method
  async healthCheck() {
    try {
      const stats = await this.index.describeIndexStats();
      return {
        status: 'healthy',
        pineconeStats: stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default new LangChainService();