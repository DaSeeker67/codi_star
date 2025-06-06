import React, { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>;
  }
}

interface FileData {
  name: string;
  path: string;
  content: string;
  language: string;
}

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
}

interface RepoAnalyzerProps {
  filePath: string | null;
  username: string;
  reponame: string;
}

const RepoAnalyzer: React.FC<RepoAnalyzerProps> = ({ filePath, username, reponame }) => {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [query, setQuery] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! Select your repository to get started with code analysis.',
      timestamp: new Date()
    }
  ]);

  // Use the username and reponame from props
  useEffect(() => {
    if (username && reponame) {
      // Could potentially check if this repo is already initialized
      console.log(`Repository set to ${username}/${reponame}`);
    }
  }, [username, reponame]);

  // Listen for changes to filePath
  useEffect(() => {
    if (filePath && isInitialized) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: `Now viewing: ${filePath}. Feel free to ask me about this file.`,
        timestamp: new Date()
      }]);
    }
  }, [filePath, isInitialized]);

  // Debug: log messages when they change
  useEffect(() => {
    console.log('Messages updated:', messages);
  }, [messages]);

  const handleDirectorySelect = async (): Promise<void> => {
    if (!window.showDirectoryPicker) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Your browser does not support the File System Access API.',
        timestamp: new Date()
      }]);
      return;
    }

    try {
      setIsProcessing(true);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'Loading repository files...',
        timestamp: new Date()
      }]);
      
      const dirHandle = await window.showDirectoryPicker();
      const files = await loadFilesFromDirectory(dirHandle);

      const result = await axios.post<ProcessResponse>('http://localhost:3005/api/repo/process', {
        files,
        username,
        repoName: reponame
      });

      if (result.data.success) {
        setIsInitialized(true);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: `Repository loaded successfully! ${result.data.docCount} files indexed. Ask me anything about the code.`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'assistant',
        content: 'An error occurred while processing the repository. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmitQuery = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    const userQuery = query;
    const newThinkingMsgId = Date.now().toString();
    setQuery('');
    
    // Add user message to chat
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: userQuery,
      timestamp: new Date()
    }]);

    try {
      // Add thinking message
      setMessages(prev => [...prev, {
        id: newThinkingMsgId,
        type: 'assistant',
        content: 'Thinking...',
        timestamp: new Date()
      }]);

      const result = await axios.post<QueryResponse>('https://codi-star-2.onrender.com/api/repo/query', {
        query: userQuery,
        username,
        repoName: reponame
      });

      // Remove thinking message and add response
      setMessages(prev => 
        prev.filter(msg => msg.id !== newThinkingMsgId).concat({
          id: Date.now().toString(),
          type: 'assistant',
          content: result.data.answer,
          timestamp: new Date(),
          sources: result.data.sources
        })
      );
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== newThinkingMsgId).concat({
        id: Date.now().toString(),
        type: 'assistant',
        content: 'An error occurred while analyzing your query. Please try again.',
        timestamp: new Date()
      }));
    }
  };

  return (
    <div className="flex flex-col bg-zinc-800 rounded-md overflow-hidden" style={{ height: "600px" }}>
      <div className="p-3 border-b border-zinc-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Code Assistant</h2>
        {!isInitialized && (
          <button 
            onClick={handleDirectorySelect}
            disabled={!username || !reponame || isProcessing}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {isProcessing ? 'Loading...' : 'Load Repository'}
          </button>
        )}
      </div>

      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-800" 
        style={{ height: "calc(100% - 120px)" }}
      >
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-3/4 rounded-lg p-3 ${
                message.type === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-zinc-700 text-white'
              }`}
            >
              <div className="text-sm">{message.content}</div>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold text-blue-300">Sources:</div>
                  {message.sources.map((source, index) => (
                    <div key={index} className="mt-1 text-xs bg-zinc-800 p-2 rounded">
                      <div className="font-semibold text-blue-300">
                        {source.metadata.filename} ({source.metadata.path})
                      </div>
                      <pre className="mt-1 whitespace-pre-wrap text-gray-300 text-xs">
                        {source.content.length > 200 
                          ? `${source.content.substring(0, 200)}...` 
                          : source.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form 
        onSubmit={handleSubmitQuery} 
        className="p-3 border-t border-zinc-700 flex gap-2"
      >
        <input
          type="text"
          placeholder="Ask about your code..."
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          disabled={!isInitialized}
          className="flex-1 bg-zinc-700 border border-zinc-600 rounded-md px-3 py-2 text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button 
          type="submit"
          disabled={!isInitialized || !query.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
};

const loadFilesFromDirectory = async (dirHandle: FileSystemDirectoryHandle): Promise<FileData[]> => {
  const files: FileData[] = [];
  
  const processEntry = async (entry: FileSystemHandle, path: string = ''): Promise<void> => {
    if (entry.kind === 'file') {
      const file = await (entry as FileSystemFileHandle).getFile();
      const content = await file.text();
      files.push({
        name: entry.name,
        path: path + entry.name,
        content,
        language: getFileLanguage(entry.name)
      });
    } else if (entry.kind === 'directory') {
      const dirEntry = entry as FileSystemDirectoryHandle;
      for await (const handle of dirEntry.values()) {
        await processEntry(handle, path + entry.name + '/');
      }
    }
  };

  for await (const entry of dirHandle.values()) {
    await processEntry(entry);
  }

  return files;
};

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
    html: 'html',
    css: 'css',
    json: 'json',
    md: 'markdown'
  };
  return languageMap[ext] || 'unknown';
};

export default RepoAnalyzer;
