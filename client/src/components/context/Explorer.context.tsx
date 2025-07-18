import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  parentId?: string;
  handle?: any;
  path?: string;
  isContentLoaded?: boolean;
  isModified?: boolean;
  file?: File; // Add File object for easier access
}

interface FileData {
  name: string;
  path: string;
  content: string;
  language: string;
}

interface ProcessResponse {
  success: boolean;
  docCount: number;
}

interface GlobalContextType {
  // File system state
  fileSystem: FileNode[];
  setFileSystem: (files: FileNode[]) => void;
  
  // Current active file
  activeFile: FileNode | null;
  setActiveFile: (file: FileNode | null) => void;
  
  // Repository info
  username: string;
  reponame: string;
  setRepoInfo: (username: string, reponame: string) => void;
  
  // Initialization state
  isRepositoryInitialized: boolean;
  setIsRepositoryInitialized: (initialized: boolean) => void;
  
  // Analysis state
  isAnalyzerInitialized: boolean;
  setIsAnalyzerInitialized: (initialized: boolean) => void;
  
  // Global folder selection
  selectGlobalFolder: () => Promise<void>;
  
  // Loading state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Processing state
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  
  // Message system for communication with RepoAnalyzer
  processingMessage: string;
  setProcessingMessage: (message: string) => void;
  
  // File content operations
  loadFileContent: (file: FileNode) => Promise<string>;
  updateFileContent: (fileId: string, content: string) => void;
  saveFileContent: (fileId: string) => Promise<boolean>;
  saveAllModifiedFiles: () => Promise<boolean>;
  
  // File management operations
  createFile: (parentId: string, fileName: string, content?: string) => Promise<FileNode | null>;
  createFolder: (parentId: string, folderName: string) => Promise<FileNode | null>;
  deleteFile: (fileId: string) => Promise<boolean>;
  renameFile: (fileId: string, newName: string) => Promise<boolean>;
  
  // Utility functions
  findFileById: (fileId: string) => FileNode | null;
  findFileByPath: (path: string) => FileNode | null;
  getModifiedFiles: () => FileNode[];
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fileSystem, setFileSystem] = useState<FileNode[]>([]);
  const [activeFile, setActiveFile] = useState<FileNode | null>(null);
  const [username, setUsername] = useState<string>('');
  const [reponame, setReponame] = useState<string>('');
  const [isRepositoryInitialized, setIsRepositoryInitialized] = useState<boolean>(false);
  const [isAnalyzerInitialized, setIsAnalyzerInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');

  // Folders to exclude during directory traversal
  const excludedFolders = [
    'node_modules',
    'venv', 
    'env',
    '.env',
    '__pycache__',
    '.git',
    '.vscode',
    '.idea',
    'dist',
    'build',
    'out',
    'target',
    'bin',
    'obj',
    '.next',
    '.nuxt',
    'vendor',
    'packages',
    'bower_components',
    '.gradle',
    '.maven',
    '.pytest_cache',
    '.coverage',
    '.nyc_output',
    'coverage',
    '.sass-cache',
    '.cache',
    '.tmp',
    'tmp',
    'temp',
    '.DS_Store',
    'Thumbs.db'
  ];

  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const shouldExcludeFolder = (folderName: string): boolean => {
    const lowerName = folderName.toLowerCase();
    return excludedFolders.some(excluded => 
      lowerName === excluded.toLowerCase() || 
      lowerName.startsWith('.') && excluded.startsWith('.') && lowerName.includes(excluded.substring(1))
    );
  };

  const isTextFile = (fileName: string): boolean => {
    const textExtensions = [
      'txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'xml', 'yaml', 'yml',
      'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'rb', 'go', 'rs', 'swift',
      'kt', 'scala', 'r', 'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd',
      'dockerfile', 'makefile', 'gitignore', 'gitattributes', 'editorconfig',
      'eslintrc', 'prettierrc', 'babelrc', 'tsconfig', 'package', 'lock', 'config',
      'env', 'ini', 'toml', 'cfg', 'conf', 'properties', 'log', 'vue', 'svelte',
      'scss', 'sass', 'less', 'styl', 'stylus', 'jsx', 'tsx', 'mjs', 'cjs'
    ];
    
    const extension = fileName.split('.').pop()?.toLowerCase();
    return textExtensions.includes(extension || '') || 
           fileName.toLowerCase().includes('readme') ||
           fileName.toLowerCase().includes('license') ||
           fileName.toLowerCase().includes('changelog');
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

  // Convert FileNode tree to flat FileData array with content loading
  const convertFileSystemToFileData = async (nodes: FileNode[]): Promise<FileData[]> => {
    const files: FileData[] = [];
    
    const processNode = async (node: FileNode): Promise<void> => {
      if (node.type === 'file' && isTextFile(node.name)) {
        let content = '';
        
        try {
          // Try to get file content from handle
          if (node.handle) {
            const fileObj = await node.handle.getFile();
            
            // Check file size (limit to 1MB for performance)
            if (fileObj.size <= 1024 * 1024) {
              content = await fileObj.text();
            } else {
              content = `// File too large to process (${Math.round(fileObj.size / 1024 / 1024)}MB)`;
            }
          } else if (node.content) {
            content = node.content;
          }
          
          if (content.trim()) {
            files.push({
              name: node.name,
              path: node.path || node.name,
              content: content,
              language: getFileLanguage(node.name)
            });
          }
        } catch (error) {
          console.warn(`Could not read file ${node.name}:`, error);
        }
      }
      
      // Process children
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          await processNode(child);
        }
      }
    };

    for (const node of nodes) {
      await processNode(node);
    }
    
    return files;
  };

  // Process files and send to backend
  const processFilesForAnalysis = async (files: FileData[]): Promise<boolean> => {
    try {
      setIsProcessing(true);
      setProcessingMessage('Processing repository files for analysis...');
      
      if (files.length === 0) {
        setProcessingMessage('No files found to process.');
        return false;
      }
      
      const filesWithContent = files.filter(f => f.content.length > 0);
      
      if (filesWithContent.length === 0) {
        setProcessingMessage('No files with content found.');
        return false;
      }
      
      setProcessingMessage(`Found ${filesWithContent.length} files to process. Sending to backend...`);
      
      const result = await axios.post<ProcessResponse>('https://codi-star-1-8r3x.onrender.com/api/repo/process', {
        files: filesWithContent,
        username: username || 'local',
        repoName: reponame || 'repository'
      });

      if (result.data.success) {
        setIsAnalyzerInitialized(true);
        setProcessingMessage(`Repository loaded successfully! ${result.data.docCount} files indexed.`);
        return true;
      } else {
        setProcessingMessage('Failed to process repository.');
        return false;
      }
      
    } catch (error) {
      console.error('Error processing files for analysis:', error);
      setProcessingMessage('Error processing repository. Check console for details.');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const findFileById = (fileId: string): FileNode | null => {
    const searchInNodes = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.id === fileId) {
          return node;
        }
        if (node.children) {
          const found = searchInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return searchInNodes(fileSystem);
  };

  const findFileByPath = (path: string): FileNode | null => {
    const searchInNodes = (nodes: FileNode[]): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path) {
          return node;
        }
        if (node.children) {
          const found = searchInNodes(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return searchInNodes(fileSystem);
  };

  const getModifiedFiles = (): FileNode[] => {
    const modified: FileNode[] = [];
    const searchInNodes = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.isModified && node.type === 'file') {
          modified.push(node);
        }
        if (node.children) {
          searchInNodes(node.children);
        }
      }
    };
    searchInNodes(fileSystem);
    return modified;
  };

  const updateFileInSystem = (fileId: string, updates: Partial<FileNode>): void => {
    const updateInNodes = (nodes: FileNode[]): FileNode[] => {
      return nodes.map(node => {
        if (node.id === fileId) {
          return { ...node, ...updates };
        }
        if (node.children) {
          return { ...node, children: updateInNodes(node.children) };
        }
        return node;
      });
    };
    setFileSystem(prev => updateInNodes(prev));
  };

  const loadFileContent = async (file: FileNode): Promise<string> => {
    if (file.type !== 'file') {
      return '';
    }

    try {
      if (file.handle) {
        const fileObj = await file.handle.getFile();
        
        // Check file size (limit to 10MB for performance)
        if (fileObj.size > 10 * 1024 * 1024) {
          return `// File too large to display (${Math.round(fileObj.size / 1024 / 1024)}MB)`;
        }

        // Check if it's a text file
        if (!isTextFile(file.name)) {
          return `// Binary file: ${file.name}`;
        }

        const content = await fileObj.text();
        
        // Update the file system with loaded content
        updateFileInSystem(file.id, { content, isContentLoaded: true });
        return content;
      }
      
      return file.content || '';
    } catch (error) {
      console.error(`Error loading file content for ${file.name}:`, error);
      return `// Error loading file: ${error.message}`;
    }
  };

  const updateFileContent = (fileId: string, content: string): void => {
    updateFileInSystem(fileId, { content, isModified: true, isContentLoaded: true });
    
    // Update active file if it's the same
    if (activeFile && activeFile.id === fileId) {
      setActiveFile(prev => prev ? { ...prev, content, isModified: true } : null);
    }
  };

  const saveFileContent = async (fileId: string): Promise<boolean> => {
    const file = findFileById(fileId);
    if (!file || file.type !== 'file' || !file.handle) {
      return false;
    }

    try {
      const writable = await file.handle.createWritable();
      await writable.write(file.content || '');
      await writable.close();
      
      // Mark as saved
      updateFileInSystem(fileId, { isModified: false });
      
      // Update active file if it's the same
      if (activeFile && activeFile.id === fileId) {
        setActiveFile(prev => prev ? { ...prev, isModified: false } : null);
      }
      
      return true;
    } catch (error) {
      console.error(`Error saving file ${file.name}:`, error);
      return false;
    }
  };

  const saveAllModifiedFiles = async (): Promise<boolean> => {
    const modifiedFiles = getModifiedFiles();
    let allSaved = true;
    
    for (const file of modifiedFiles) {
      const saved = await saveFileContent(file.id);
      if (!saved) {
        allSaved = false;
      }
    }
    
    return allSaved;
  };

  const createFile = async (parentId: string, fileName: string, content: string = ''): Promise<FileNode | null> => {
    const parentNode = findFileById(parentId);
    if (!parentNode || parentNode.type !== 'folder' || !parentNode.handle) {
      return null;
    }

    try {
      const fileHandle = await parentNode.handle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();

      const newFile: FileNode = {
        id: generateUniqueId(),
        name: fileName,
        type: 'file',
        content,
        handle: fileHandle,
        path: parentNode.path ? `${parentNode.path}/${fileName}` : fileName,
        isContentLoaded: true,
        isModified: false,
        parentId
      };

      // Add to file system
      const addToNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newFile]
            };
          }
          if (node.children) {
            return { ...node, children: addToNodes(node.children) };
          }
          return node;
        });
      };

      setFileSystem(prev => addToNodes(prev));
      return newFile;
    } catch (error) {
      console.error(`Error creating file ${fileName}:`, error);
      return null;
    }
  };

  const createFolder = async (parentId: string, folderName: string): Promise<FileNode | null> => {
    const parentNode = findFileById(parentId);
    if (!parentNode || parentNode.type !== 'folder' || !parentNode.handle) {
      return null;
    }

    try {
      const dirHandle = await parentNode.handle.getDirectoryHandle(folderName, { create: true });

      const newFolder: FileNode = {
        id: generateUniqueId(),
        name: folderName,
        type: 'folder',
        children: [],
        handle: dirHandle,
        path: parentNode.path ? `${parentNode.path}/${folderName}` : folderName,
        parentId
      };

      // Add to file system
      const addToNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newFolder]
            };
          }
          if (node.children) {
            return { ...node, children: addToNodes(node.children) };
          }
          return node;
        });
      };

      setFileSystem(prev => addToNodes(prev));
      return newFolder;
    } catch (error) {
      console.error(`Error creating folder ${folderName}:`, error);
      return null;
    }
  };

  const deleteFile = async (fileId: string): Promise<boolean> => {
    const file = findFileById(fileId);
    if (!file || !file.handle) {
      return false;
    }

    try {
      // Find parent to remove from
      const parentNode = file.parentId ? findFileById(file.parentId) : null;
      if (parentNode && parentNode.handle) {
        await parentNode.handle.removeEntry(file.name, { recursive: file.type === 'folder' });
      }

      // Remove from file system
      const removeFromNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.filter(node => node.id !== fileId).map(node => {
          if (node.children) {
            return { ...node, children: removeFromNodes(node.children) };
          }
          return node;
        });
      };

      setFileSystem(prev => removeFromNodes(prev));
      
      // Clear active file if it was deleted
      if (activeFile && activeFile.id === fileId) {
        setActiveFile(null);
      }
      
      return true;
    } catch (error) {
      console.error(`Error deleting ${file.name}:`, error);
      return false;
    }
  };

  const renameFile = async (fileId: string, newName: string): Promise<boolean> => {
    const file = findFileById(fileId);
    if (!file || !file.handle) {
      return false;
    }

    try {
      // For now, we'll update the name in our system
      // Note: File System Access API doesn't have a direct rename method
      // This would require creating a new file with the new name and deleting the old one
      updateFileInSystem(fileId, { name: newName });
      
      // Update active file if it's the same
      if (activeFile && activeFile.id === fileId) {
        setActiveFile(prev => prev ? { ...prev, name: newName } : null);
      }
      
      return true;
    } catch (error) {
      console.error(`Error renaming ${file.name}:`, error);
      return false;
    }
  };

  const processDirectoryHandle = async (
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string = ''
  ): Promise<FileNode[]> => {
    const items: FileNode[] = [];
    
    try {
      for await (const entry of dirHandle.values()) {
        const id = generateUniqueId();
        const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
        
        if (entry.kind === 'directory') {
          // Skip excluded folders
          if (shouldExcludeFolder(entry.name)) {
            console.log(`Skipping excluded folder: ${entry.name}`);
            continue;
          }
          
          try {
            const directoryHandle = entry as FileSystemDirectoryHandle;
            const children = await processDirectoryHandle(directoryHandle, currentPath);
            const folderItem: FileNode = {
              id,
              name: entry.name,
              type: 'folder',
              children,
              handle: directoryHandle,
              path: currentPath
            };
            items.push(folderItem);
          } catch (e) {
            console.error(`Error processing folder ${entry.name}:`, e);
          }
        } else if (entry.kind === 'file') {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const fileItem: FileNode = {
              id,
              name: entry.name,
              type: 'file',
              content: '',
              handle: fileHandle,
              path: currentPath,
              isContentLoaded: false,
              isModified: false
            };
            
            items.push(fileItem);
          } catch (e) {
            console.error(`Error processing file ${entry.name}:`, e);
          }
        }
      }
    } catch (error) {
      console.error("Error iterating directory entries:", error);
    }
    
    return items;
  };

  const selectGlobalFolder = async () => {
    try {
      setIsLoading(true);
      setProcessingMessage('Selecting folder...');
      
      if (!window.showDirectoryPicker) {
        throw new Error('File System Access API is not supported in this browser');
      }
      
      const dirHandle = await window.showDirectoryPicker();
      setProcessingMessage('Processing directory structure...');
      
      const newFileSystem = await processDirectoryHandle(dirHandle);
      setFileSystem(newFileSystem);
      
      // Set repository info based on folder name
      const folderName = dirHandle.name;
      const parts = folderName.split('-');
      if (parts.length >= 2) {
        setUsername(parts[0]);
        setReponame(parts.slice(1).join('-'));
      } else {
        setUsername('local');
        setReponame(folderName);
      }
      
      setIsRepositoryInitialized(true);
      
      // Automatically process files for analysis
      setProcessingMessage('Converting files for analysis...');
      const files = await convertFileSystemToFileData(newFileSystem);
      
      // Process files and send to backend
      await processFilesForAnalysis(files);
      
    } catch (error) {
      console.error('Error selecting folder:', error);
      setProcessingMessage('Error selecting folder. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setRepoInfo = (newUsername: string, newReponame: string) => {
    setUsername(newUsername);
    setReponame(newReponame);
  };

  const value: GlobalContextType = {
    fileSystem,
    setFileSystem,
    activeFile,
    setActiveFile,
    username,
    reponame,
    setRepoInfo,
    isRepositoryInitialized,
    setIsRepositoryInitialized,
    isAnalyzerInitialized,
    setIsAnalyzerInitialized,
    selectGlobalFolder,
    isLoading,
    setIsLoading,
    isProcessing,
    setIsProcessing,
    processingMessage,
    setProcessingMessage,
    loadFileContent,
    updateFileContent,
    saveFileContent,
    saveAllModifiedFiles,
    createFile,
    createFolder,
    deleteFile,
    renameFile,
    findFileById,
    findFileByPath,
    getModifiedFiles
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};