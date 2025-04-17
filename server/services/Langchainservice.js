// server/services/LangChainService.js
import { ChatGroq } from "@langchain/groq";
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from "@langchain/pinecone";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/huggingface_transformers";
import { RetrievalQAChain } from 'langchain/chains';
import { Pinecone } from "@pinecone-database/pinecone";

class LangChainService {
  constructor() {
    this.groq = new ChatGroq({
      apiKey: process.env.GROQ_API_KEY || "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",
      temperature: 0.3,
      model: 'llama-3.3-70b-versatile'
    });

    this.embeddings = new HuggingFaceTransformersEmbeddings({
      model: "sentence-transformers/all-mpnet-base-v2"
    });

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "pcsk_42utWY_9tEBgNq553bstgFkX4qZibgpDdf4PUcoZ8n9Kkzdx4gXXY8QkfWofrUJcnB7Z1V"
    });
    
    this.index = null;
  }

  async initialize() {
    const indexName = process.env.PINECONE_INDEX || "codi";
    this.index = this.pinecone.Index(indexName);
    
    // No need to call init() as the client is already initialized in constructor
    return this.index;
  }

  async processRepository(files, username, repoName) {
    try {
      // Combine all files with metadata
      const docs = files.map(file => ({
        pageContent: file.content,
        metadata: {
          filename: file.name,
          path: file.path,
          language: file.language,
          username,
          repoName
        }
      }));

      console.log('Documents to be processed:', docs);
      // Check if documents are empty or not
      if (docs.length === 0) {
        throw new Error('No documents to process');
      }

      // Split text into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200
      });
      console.log('Splitting documents...');
      // Split documents into smaller chunks  

      const splitDocs = await textSplitter.splitDocuments(docs);
       console.log('Documents split into chunks:', splitDocs.length);
      // Create vector store
      const vectorStore = await PineconeStore.fromDocuments(
        splitDocs,
        this.embeddings,
        {
          pineconeIndex: this.index,
          namespace: `${username}-${repoName}`
        }
      );
      console.log('Vector store created successfully.');

      return { success: true, docCount: splitDocs.length };
    } catch (error) {
      console.error('Error processing repository:', error);
      throw error;
    }
  }

  async queryRepository(query, username, repoName) {
    try {
      // Create vector store
      const vectorStore = await PineconeStore.fromExistingIndex(
        this.embeddings,
        {
          pineconeIndex: this.index,
          namespace: `${username}-${repoName}`
        }
      );
      console.log(vectorStore,"vectorStore created successfully.");



      // Create chain
      const chain = RetrievalQAChain.fromLLM(
        this.groq,
        vectorStore.asRetriever(),
        {
          returnSourceDocuments: true
        }
      );
      console.log(chain, 'Chain created successfully.');

      // Execute query
      const response = await chain.call({
        query: query
      });

      console.log('Query response:', response);

      return {
        answer: response.text || response.content,
        sources: response.sourceDocuments.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata
        }))
      };
    } catch (error) {
      console.error('Error querying repository:', error);
      throw error;
    }
  }
}

export default new LangChainService();