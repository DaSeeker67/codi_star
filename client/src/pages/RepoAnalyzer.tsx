import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import axios from 'axios';
import { useGlobalContext, FileNode } from '../components/context/Explorer.context';
import { Send, FileText, Code, CheckCircle, Circle } from 'lucide-react';

interface Source {
  content: string;
  metadata: {
    filename: string;
    path: string;
    language: string;
  };
}

interface ProcessResponse {
  success: boolean;
  docCount: number;
}

interface QueryResponse {
  answer: string;
  sources: Source[];
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  edits?: EditInfo[];
}

interface EditInfo {
  filename: string;
  content: string;
  applied: boolean;
}

interface FileData {
  name: string;
  path: string;
  content: string;
  language: string;
}

const BouncingDots: React.FC = () => {
  return (
    <div className="flex items-center space-x-1">
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
};


const RepoAnalyzer: React.FC = () => {
  const {
    fileSystem,
    setFileSystem,
    activeFile,
    setActiveFile,
    username,
    reponame,
    isRepositoryInitialized,
    selectGlobalFolder,
    isLoading
  } = useGlobalContext();

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalyzerInitialized, setIsAnalyzerInitialized] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! Select your repository to get started with code analysis.',
      timestamp: new Date()
    }
  ]);





    // Message container ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]); 

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);



  // File input ref for manual file selection
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to read file content from File object
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          resolve('');
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  };

  // Helper function to get file language from extension
  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      php: 'php',
      rb: 'ruby',
      go: 'go',
      rs: 'rust',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      json: 'json',
      xml: 'xml',
      yml: 'yaml',
      yaml: 'yaml',
      md: 'markdown',
      txt: 'text',
      sh: 'bash',
      sql: 'sql',
      vue: 'vue',
      svelte: 'svelte'
    };
    return languageMap[ext] || 'text';
  };

  // Debug function to inspect file system structure
  const debugFileSystem = (nodes: FileNode[], depth: number = 0): string => {
    let debug = '';
    const indent = '  '.repeat(depth);
    
    nodes.forEach(node => {
      debug += `${indent}${node.type}: ${node.name}\n`;
      debug += `${indent}  - ID: ${node.id}\n`;
      debug += `${indent}  - Path: ${node.path || 'undefined'}\n`;
      debug += `${indent}  - Content: ${node.content ? `${node.content.length} chars` : 'undefined'}\n`;
      debug += `${indent}  - File Object: ${node.file ? 'present' : 'undefined'}\n`;
      
      if (node.children) {
        debug += debugFileSystem(node.children, depth + 1);
      }
    });
    
    return debug;
  };

  // Alternative method: Load files directly using File API
  const loadFilesDirectly = async (): Promise<FileData[]> => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.multiple = true;
      
      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        
        if (!files) {
          resolve([]);
          return;
        }
        
        const fileData: FileData[] = [];
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Skip binary files and large files
          if (file.size > 1024 * 1024) continue; // Skip files larger than 1MB
          
          try {
            const content = await readFileContent(file);
            const language = getFileLanguage(file.name);
            
            fileData.push({
              name: file.name,
              path: file.webkitRelativePath || file.name,
              content: content,
              language: language
            });
          } catch (error) {
            console.warn(`Could not read file ${file.name}:`, error);
          }
        }
        
        resolve(fileData);
      };
      
      input.click();
    });
  };

  // Enhanced function to convert FileNode tree to flat FileData array
  const convertFileSystemToFileData = async (nodes: FileNode[]): Promise<FileData[]> => {
    const files: FileData[] = [];
    let debugOutput = 'FileSystem Debug:\n';
    debugOutput += debugFileSystem(nodes);
    
    const processNode = async (node: FileNode, parentPath: string = ''): Promise<void> => {
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
      
      if (node.type === 'file') {
        let content = '';
        
        // Method 1: Check if content is already loaded
        if (node.content && typeof node.content === 'string') {
          content = node.content;
          debugOutput += `✓ Content loaded from node.content for ${node.name}\n`;
        } 
        // Method 2: Check if File object is available
        else if (node.file && node.file instanceof File) {
          try {
            content = await readFileContent(node.file);
            debugOutput += `✓ Content loaded from node.file for ${node.name}\n`;
          } catch (error) {
            debugOutput += `✗ Failed to read from node.file for ${node.name}: ${error}\n`;
          }
        }
        // Method 3: Try to access any other file reference
        else if ((node as any).fileHandle) {
          try {
            const fileHandle = (node as any).fileHandle;
            const file = await fileHandle.getFile();
            content = await readFileContent(file);
            debugOutput += `✓ Content loaded from fileHandle for ${node.name}\n`;
          } catch (error) {
            debugOutput += `✗ Failed to read from fileHandle for ${node.name}: ${error}\n`;
          }
        }
        else {
          debugOutput += `✗ No content source found for ${node.name}\n`;
        }
        
        // Add file regardless of content for debugging
        files.push({
          name: node.name,
          path: currentPath,
          content: content,
          language: getFileLanguage(node.name)
        });
      }
      
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          await processNode(child, currentPath);
        }
      }
    };

    for (const node of nodes) {
      await processNode(node);
    }
    
    setDebugInfo(debugOutput);
    console.log(debugOutput);
    
    return files;
  };

  // Parse AI response to extract edits
  const parseEditResponse = (response: string): { cleanResponse: string; edits: EditInfo[] } => {
    const edits: EditInfo[] = [];
    let cleanResponse = response;

    const editRegex = /###edit:([^\n]+)\n([\s\S]*?)###edit/g;
    let match;

    while ((match = editRegex.exec(response)) !== null) {
      const filename = match[1].trim();
      const content = match[2].trim();
      
      edits.push({
        filename,
        content,
        applied: false
      });
    }

    cleanResponse = cleanResponse.replace(editRegex, '').trim();
    return { cleanResponse, edits };
  };

  // Apply edit to file system
  const applyEditToFileSystem = (filename: string, newContent: string): boolean => {
    const updateFileInNodes = (nodes: FileNode[]): boolean => {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        
        if (node.type === 'file' && (node.name === filename || node.path === filename)) {
          node.content = newContent;
          
          if (activeFile && activeFile.id === node.id) {
            setActiveFile({ ...node });
          }
          
          return true;
        }
        
        if (node.type === 'folder' && node.children) {
          if (updateFileInNodes(node.children)) {
            return true;
          }
        }
      }
      return false;
    };

    const updatedFileSystem = [...fileSystem];
    const success = updateFileInNodes(updatedFileSystem);
    
    if (success) {
      setFileSystem(updatedFileSystem);
    }
    
    return success;
  };

  // Handle applying a specific edit
  const handleApplyEdit = (messageId: string, editIndex: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.edits) {
        const updatedEdits = [...msg.edits];
        const edit = updatedEdits[editIndex];
        
        if (edit && !edit.applied) {
          const success = applyEditToFileSystem(edit.filename, edit.content);
          if (success) {
            updatedEdits[editIndex] = { ...edit, applied: true };
            return { ...msg, edits: updatedEdits };
          }
        }
      }
      return msg;
    }));
  };

  // Handle applying all edits in a message
  const handleApplyAllEdits = (messageId: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.edits) {
        const updatedEdits = msg.edits.map(edit => {
          if (!edit.applied) {
            const success = applyEditToFileSystem(edit.filename, edit.content);
            return { ...edit, applied: success };
          }
          return edit;
        });
        return { ...msg, edits: updatedEdits };
      }
      return msg;
    }));
  };

  // Process repository when fileSystem changes and repository is initialized
  useEffect(() => {
    if (isRepositoryInitialized && fileSystem.length > 0 && !isAnalyzerInitialized) {
      handleProcessRepository();
    }
  }, [isRepositoryInitialized, fileSystem, isAnalyzerInitialized]);

  // Listen for changes to activeFile
  useEffect(() => {
    if (activeFile && isAnalyzerInitialized) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Now viewing: ${activeFile.path || activeFile.name}. Feel free to ask me about this file.`,
        timestamp: new Date()
      }]);
    }
  }, [activeFile, isAnalyzerInitialized]);

  // Handle direct file loading (bypass file system)
  const handleDirectFileLoad = async () => {
    try {
      setIsProcessing(true);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Loading files directly...',
        timestamp: new Date()
      }]);
      
      const files = await loadFilesDirectly();
      
      if (files.length === 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'No files selected or could not read files.',
          timestamp: new Date()
        }]);
        return;
      }
      
      console.log('Direct file load result:', files);
      
      const filesWithContent = files.filter(f => f.content.length > 0);
      
      if (filesWithContent.length === 0) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'No files with content found.',
          timestamp: new Date()
        }]);
        return;
      }
      
      // Send directly to backend
      const result = await axios.post<ProcessResponse>('https://codi-star-1-8r3x.onrender.com/api/repo/process', {
        files: filesWithContent,
        username: username || 'direct-user',
        repoName: reponame || 'direct-repo'
      });

      if (result.data.success) {
        setIsAnalyzerInitialized(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Files loaded successfully! ${result.data.docCount} files indexed from ${filesWithContent.length} files processed.`,
          timestamp: new Date()
        }]);
      }
      
    } catch (error) {
      console.error('Error in direct file load:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Error loading files directly.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced repository processing with detailed debugging
  const handleProcessRepository = async (): Promise<void> => {
    if (!username || !reponame || fileSystem.length === 0) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Missing repository information or file system is empty.',
        timestamp: new Date()
      }]);
      return;
    }

    try {
      setIsProcessing(true);
      
     
      
      const files = await convertFileSystemToFileData(fileSystem);
      
      const filesWithContent = files.filter(f => f.content.length > 0);
      
    
      
      if (filesWithContent.length === 0) {
        
        return;
      }
      
      const result = await axios.post<ProcessResponse>('https://codi-star-1-8r3x.onrender.com/api/repo/process', {
        files: filesWithContent,
        username,
        repoName: reponame 
      });

      if (result.data.success) {
        setIsAnalyzerInitialized(true);
       
      }
      
    } catch (error) {
      console.error('Error processing repository:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Error processing repository. Check console for details.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced query submission
  const handleSubmitQuery = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    const userQuery = query;
    const newThinkingMsgId = Date.now().toString();
    setQuery('');
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: userQuery,
      timestamp: new Date()
    }]);

    try {
      setMessages(prev => [...prev, {
        id: newThinkingMsgId,
        type: 'assistant',
        content: 'thinking...',
        timestamp: new Date()
      }]);

      const result = await axios.post<QueryResponse>('https://codi-star-1-8r3x.onrender.com/api/repo/query', {
        query: userQuery,
        username: username || 'direct-user',
        repoName: reponame || 'direct-repo',
        currentFilename: activeFile?.name || null
      });

      const { cleanResponse, edits } = parseEditResponse(result.data.answer);

      setMessages(prev => 
        prev.filter(msg => msg.id !== newThinkingMsgId).concat({
          id: Date.now().toString(),
          type: 'assistant',
          content: cleanResponse || result.data.answer,
          timestamp: new Date(),
          sources: result.data.sources,
          edits: edits.length > 0 ? edits : undefined
        })
      );
    } catch (error) {
      console.error('Error submitting query:', error);
      setMessages(prev => prev.filter(msg => msg.id !== newThinkingMsgId).concat({
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Error analyzing query. Check console for details.',
        timestamp: new Date()
      }));
    }
  };

  return (
    <div className="flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl border h-[90vh] border-slate-700/50 backdrop-blur-sm" >
      {/* Header */}
      <div className="p-3 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-slate-700/50 backdrop-blur-sm rounded-t-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
  <Code className="w-5 h-5 text-white" />
              
            </div>
            
          </div>
          
          <div className="flex items-center gap-4">
           
            
            {isAnalyzerInitialized && (
              <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1.5 rounded-full border border-green-500/30">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300 font-medium">Ready</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50" 
        style={{ height: "calc(100% - 140px)" }}
      >
        {/* Debug Info */}
        {debugInfo && (
          <div className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 text-xs text-green-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
            {debugInfo}
          </div>
        )}
        
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-4xl rounded-2xl p-4 ${
                message.type === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                  : 'bg-slate-800/50 backdrop-blur-sm text-white border border-slate-700/50 shadow-lg'
              }`}
            >
              {message.content === 'thinking...' ? (
                <div className="flex items-center gap-3 py-2">
                  <BouncingDots />
                  <span className="text-slate-300">Analyzing your code...</span>
                </div>
              ) : (
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
              )}
              
              {/* Render edits if available */}
              {message.edits && message.edits.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-300">
                        Code Edits ({message.edits.length})
                      </span>
                    </div>
                    <button
                      onClick={() => handleApplyAllEdits(message.id)}
                      className="text-sm bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    >
                      Apply All
                    </button>
                  </div>
                  {message.edits.map((edit, index) => (
                    <div key={index} className="bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 shadow-inner">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-400" />
                          <span className="font-semibold text-blue-300">{edit.filename}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {edit.applied ? (
                            <div className="flex items-center gap-1 text-emerald-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              <span>Applied</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleApplyEdit(message.id, index)}
                              className="text-sm bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-3 py-1.5 rounded-lg transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                            >
                              Apply
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/30">
                        <pre className="whitespace-pre-wrap text-slate-300 text-sm max-h-48 overflow-y-auto font-mono">
                          {edit.content.length > 500 
                            ? `${edit.content.substring(0, 500)}...` 
                            : edit.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Render sources if available */}
              {message.sources && message.sources.length > 0 && (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-semibold text-amber-300">Sources</span>
                  </div>
                  {message.sources.map((source, index) => (
                    <div key={index} className="bg-slate-900/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 shadow-inner">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <span className="font-semibold text-amber-300">{source.metadata.filename}</span>
                        <span className="text-slate-400 text-sm">({source.metadata.path})</span>
                      </div>
                      <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/30">
                        <pre className="whitespace-pre-wrap text-slate-300 text-sm max-h-32 overflow-y-auto font-mono">
                          {source.content.length > 300 
                            ? `${source.content.substring(0, 300)}...` 
                            : source.content}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form 
        onSubmit={handleSubmitQuery} 
        className="p-6 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm rounded-b-2xl"
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={
                !isAnalyzerInitialized 
                  ? "Initialize analyzer first..." 
                  : "Ask me anything about your code..."
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={!isAnalyzerInitialized}
              className="w-full bg-slate-800/50 backdrop-blur-sm border border-slate-600/50 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 disabled:opacity-50 transition-all duration-200 shadow-lg"
            />
          </div>
          <button 
            type="submit"
            disabled={!isAnalyzerInitialized || !query.trim()}
            className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-500 hover:to-blue-600 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl group"
          >
            <Send className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default RepoAnalyzer;