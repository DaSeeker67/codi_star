import { useRef, useState, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useGlobalContext, FileNode } from './context/Explorer.context';
import { FileExplorer } from './FileExplorer';

const CodeEditor = () => {
  const {
    activeFile,
    setActiveFile,
    isLoading,
    setIsLoading,
    selectGlobalFolder,
    isRepositoryInitialized,
    loadFileContent,
    updateFileContent,
    saveFileContent,
    saveAllModifiedFiles,
    getModifiedFiles
  } = useGlobalContext();

  const [code, setCode] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveDialogMessage, setSaveDialogMessage] = useState("");
  const editorRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;
  };

  // Load file content when active file changes
  useEffect(() => {
    const loadContent = async () => {
      if (activeFile) {
        setIsLoading(true);
        try {
          const content = await loadFileContent(activeFile);
          setCode(content);
        } catch (error) {
          console.error("Error loading file content:", error);
          setCode('');
        } finally {
          setIsLoading(false);
        }
      } else {
        setCode('');
      }
    };

    loadContent();
  }, [activeFile?.id]);

  const handleFileSelect = async (file) => {
    if (file.type === 'file') {
      setActiveFile(file);
    }
  };

  const handleCodeChange = (value) => {
    const newCode = value || "";
    setCode(newCode);
    
    // Update the file content in the global context
    if (activeFile) {
      updateFileContent(activeFile.id, newCode);
    }
  };

  const getLanguageFromFileName = (fileName) => {
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
      case 'xml':
        return 'xml';
      case 'yaml':
      case 'yml':
        return 'yaml';
      case 'scss':
      case 'sass':
        return 'scss';
      case 'less':
        return 'less';
      case 'sql':
        return 'sql';
      case 'sh':
      case 'bash':
        return 'shell';
      case 'dockerfile':
        return 'dockerfile';
      default:
        return 'plaintext';
    }
  };

  const saveCurrentFile = async () => {
    if (!activeFile) return;

    setIsLoading(true);
    try {
      const success = await saveFileContent(activeFile.id);
      if (success) {
        setSaveDialogMessage(`File "${activeFile.name}" saved successfully!`);
        setShowSaveDialog(true);
      } else {
        alert("Failed to save file. Please try again.");
      }
    } catch (error) {
      console.error("Error saving file:", error);
      alert("Failed to save file. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveAllFiles = async () => {
    const modifiedFiles = getModifiedFiles();
    if (modifiedFiles.length === 0) {
      setSaveDialogMessage("No modified files to save.");
      setShowSaveDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      const success = await saveAllModifiedFiles();
      if (success) {
        setSaveDialogMessage(`Successfully saved ${modifiedFiles.length} file(s)!`);
        setShowSaveDialog(true);
      } else {
        alert("Some files failed to save. Please try again.");
      }
    } catch (error) {
      console.error("Error saving files:", error);
      alert("Failed to save files. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          // Ctrl+Shift+S: Save All
          saveAllFiles();
        } else {
          // Ctrl+S: Save Current File
          saveCurrentFile();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

  const modifiedFiles = getModifiedFiles();
  const hasModifiedFiles = modifiedFiles.length > 0;

  return (
    <div className="flex h-screen bg-slate-900">
      {/* File Explorer */}
     
   

      {/* Code Editor */}
      <div className="flex-1 h-full flex flex-col bg-slate-900">
        {/* Header Bar */}
        <div className="px-6 py-4 flex items-center justify-between bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-sm font-medium text-slate-200 flex items-center space-x-3">
              <span className="text-slate-400">📁</span>
              <span>{activeFile ? activeFile.name : "No File Selected"}</span>
              {activeFile?.isModified && (
                <span className="inline-flex items-center px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-500/30">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1.5"></span>
                  Unsaved
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={saveCurrentFile}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg shadow-emerald-500/25"
              disabled={!activeFile || isLoading}
              title="Save Current File (Ctrl+S)"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>Save</span>
                </span>
              )}
            </button>
            <button
              onClick={saveAllFiles}
              className={`px-4 py-2 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg ${
                hasModifiedFiles 
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-500/25" 
                  : "bg-gradient-to-r from-slate-600 to-slate-700 cursor-not-allowed shadow-slate-500/25"
              }`}
              disabled={!hasModifiedFiles || isLoading}
              title={`Save All Modified Files (Ctrl+Shift+S) - ${modifiedFiles.length} file(s) modified`}
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>Save All ({modifiedFiles.length})</span>
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
          {activeFile ? (
            <div className="h-full">
              <Editor
                height="100%"
                language={getLanguageFromFileName(activeFile.name)}
                value={code}
                onChange={handleCodeChange}
                onMount={handleEditorMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  automaticLayout: true,
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
                  tabSize: 2,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  bracketMatching: 'always',
                  autoIndent: 'full',
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  parameterHints: {
                    enabled: true
                  },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  renderLineHighlight: 'gutter',
                  renderWhitespace: 'none',
                  padding: { top: 20, bottom: 20 },
                  lineHeight: 1.6,
                  letterSpacing: 0.5,
                  rulers: [],
                  guides: {
                    indentation: false
                  }
                }}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-slate-900">
              <div className="text-center max-w-md mx-auto">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <span className="text-4xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-200 mb-4">Welcome to Your Code Editor</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {isRepositoryInitialized 
                    ? "Select a file from the explorer to start editing and bring your ideas to life"
                    : "Open a folder from the file explorer to get started on your next project"
                  }
                </p>
                {hasModifiedFiles && (
                  <div className="mt-8 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2 text-amber-400">
                      <span className="text-lg">⚠️</span>
                      <p className="font-medium">
                        {modifiedFiles.length} file(s) have unsaved changes
                      </p>
                    </div>
                  </div>
                )}
                <button
                  onClick={selectGlobalFolder}
                  className="mt-8 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-indigo-500/25"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Loading...</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span>📂</span>
                      <span>Open Folder</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="px-6 py-2 bg-slate-800/50 backdrop-blur-sm border-t border-slate-700/50 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-slate-400">
            {activeFile && (
              <>
                <span className="flex items-center space-x-1">
                  <span>📄</span>
                  <span>{getLanguageFromFileName(activeFile.name)}</span>
                </span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span>Line 1, Column 1</span>
              </>
            )}
          </div>
          <div className="flex items-center space-x-4 text-slate-400">
            <span className="flex items-center space-x-1">
              <span>🎨</span>
              <span>Dark Theme</span>
            </span>
            {hasModifiedFiles && (
              <>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <span className="text-amber-400">{modifiedFiles.length} unsaved</span>
              </>
            )}
          </div>
        </div>

        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent className="bg-slate-800 border-slate-700 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl font-bold">💾 Save Status</AlertDialogTitle>
            </AlertDialogHeader>
            <div className="py-4">
              <p className="text-slate-200">{saveDialogMessage}</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogAction 
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200" 
                onClick={() => setShowSaveDialog(false)}
              >
                Awesome! ✨
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CodeEditor;