import React, { useRef, useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import  FileExplorer  from './FileExplorer';

export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileSystemItem[];
  parentId?: string;
  handle?: any;
}

const CodeEditorWithExplorer = () => {
  const [activeFile, setActiveFile] = useState<FileSystemItem | null>(null);
  const [code, setCode] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [fileSystem, setFileSystem] = useState<FileSystemItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const editorRef = useRef(null);

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  const updateFileContent = (items: FileSystemItem[], id: string, newContent: string): FileSystemItem[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, content: newContent };
      }
      if (item.children) {
        return {
          ...item,
          children: updateFileContent(item.children, id, newContent)
        };
      }
      return item;
    });
  };

  const handleFileSelect = (file: FileSystemItem) => {
    if (file.type === 'file') {
      setActiveFile(file);
      setCode(file.content || '');
    }
  };

  const getLanguageFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'c':
        return 'c';
      case 'cpp':
        return 'cpp';
      case 'cs':
        return 'csharp';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      default:
        return 'plaintext';
    }
  };

  const saveFile = async () => {
    if (activeFile && activeFile.handle) {
      try {
        setIsLoading(true);
        
        const writable = await activeFile.handle.createWritable();
        await writable.write(code);
        await writable.close();
        
        const updatedFileSystem = updateFileContent(fileSystem, activeFile.id, code);
        setFileSystem(updatedFileSystem);
        
        setShowSaveDialog(true);
      } catch (error) {
        console.error("Error saving file:", error);
        alert("Failed to save file. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else if (activeFile) {
      const updatedFileSystem = updateFileContent(fileSystem, activeFile.id, code);
      setFileSystem(updatedFileSystem);
      setShowSaveDialog(true);
    }
  };

  const createNewItem = (parentId: string, name: string, type: 'file' | 'folder') => {
    const newId = `${type}-${Date.now()}`;
    const newItem: FileSystemItem = {
      id: newId,
      name,
      type,
      parentId,
      ...(type === 'file' ? { content: '' } : { children: [] })
    };

    const addItemToParent = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [...(item.children || []), newItem]
          };
        }
        if (item.children) {
          return {
            ...item,
            children: addItemToParent(item.children)
          };
        }
        return item;
      });
    };

    const updatedFileSystem = addItemToParent(fileSystem);
    setFileSystem(updatedFileSystem);
    
    if (type === 'file') {
      const createdFile = findFileById(updatedFileSystem, newId);
      if (createdFile) {
        setActiveFile(createdFile);
        setCode('');
      }
    }
  };

  const deleteItem = (id: string) => {
    const removeItem = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.filter(item => {
        if (item.id === id) {
          return false;
        }
        if (item.children) {
          item.children = removeItem(item.children);
        }
        return true;
      });
    };

    const updatedFileSystem = removeItem(fileSystem);
    setFileSystem(updatedFileSystem);
    
    if (activeFile && activeFile.id === id) {
      setActiveFile(null);
      setCode('');
    }
  };

  const findFileById = (items: FileSystemItem[], id: string): FileSystemItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleFileSystemUpdate = (newFileSystem: FileSystemItem[]) => {
    setFileSystem(newFileSystem);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile, code]);

  return (
    <div className="flex h-screen">
      <FileExplorer 
        fileSystem={fileSystem} 
        onFileSelect={handleFileSelect}
        activeFileId={activeFile?.id}
        onCreateItem={createNewItem}
        onDeleteItem={deleteItem}
        onImportFolder={() => {}}
        onFileSystemUpdate={handleFileSystemUpdate}
      />
      
      <div className="flex-1 h-full flex flex-col bg-gray-700">
        <div className="p-2 flex items-center justify-between bg-gray-600 border-b">
          <div className="text-sm font-medium text-white">
            {activeFile ? activeFile.name : "No File Selected"}
          </div>
          <div className="space-x-2">
            <button
              onClick={saveFile}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!activeFile || isLoading}
            >
              {isLoading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguageFromFileName(activeFile.name)}
            value={code}
            onChange={(value) => setCode(value || "")}
            onMount={handleEditorMount}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              fontSize: 14,
              tabSize: 2
            }}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white bg-gray-800">
            <div className="text-center">
              <p className="text-xl mb-4">No file selected</p>
              <p className="text-gray-400">Open a folder from the file explorer to get started</p>
            </div>
          </div>
        )}

        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent className="bg-gray-800 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>File Saved Successfully</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowSaveDialog(false)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CodeEditorWithExplorer;