import React, { useState,  useEffect } from 'react';
import { 
  FolderIcon, 
  FileIcon, 
  TrashIcon, 
  FolderPlusIcon, 
  UploadIcon, 
  FolderOpenIcon,
  FilePlusIcon,
} from 'lucide-react';
import { FileNode } from '@/types/types';

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    showOpenFilePicker?: (options: { multiple: boolean }) => Promise<FileSystemFileHandle[]>;
  }
}

interface FileExplorerProps {
  fileSystem: FileNode[];
  onFileSelect: (file: FileNode) => void;
  activeFileId?: string;
  onCreateItem: (parentId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteItem: (id: string) => void;
  onImportFolder?: () => void;
  onFileSystemUpdate?: (newFileSystem: FileNode[]) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  fileSystem = [],
  onFileSelect,
  activeFileId,
  onCreateItem,
  onDeleteItem,
  onFileSystemUpdate
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    itemId: string;
    isFolder: boolean;
  } | null>(null);
  const [newItemData, setNewItemData] = useState<{
    parentId: string;
    isVisible: boolean;
    itemType: 'file' | 'folder';
  } | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [localFileSystem, setLocalFileSystem] = useState<FileNode[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    if (Array.isArray(fileSystem) && fileSystem.length >= 0) {
      setLocalFileSystem(fileSystem);
    }
  }, [fileSystem]);

  const toggleFolder = (folderId: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (newExpandedFolders.has(folderId)) {
      newExpandedFolders.delete(folderId);
    } else {
      newExpandedFolders.add(folderId);
    }
    setExpandedFolders(newExpandedFolders);
  };

  const handleContextMenu = (e: React.MouseEvent, item: FileNode) => {
    e.preventDefault();
    setSelectedItem(item.id);
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      itemId: item.id,
      isFolder: item.type === 'folder'
    });
  };

  const hideContextMenu = () => {
    setContextMenu(null);
  };

  const handleShowNewItemInput = (parentId: string, itemType: 'file' | 'folder') => {
    setNewItemData({
      parentId,
      isVisible: true,
      itemType
    });
    setNewItemName('');
    hideContextMenu();
    

    if (!expandedFolders.has(parentId)) {
      toggleFolder(parentId);
    }
  };

  const handleCreateNewItem = () => {
    if (newItemData && newItemName.trim()) {
      onCreateItem(newItemData.parentId, newItemName.trim(), newItemData.itemType);
      
      const updatedFileSystem = [...localFileSystem];
      const newItem: FileNode = {
        id: generateUniqueId(),
        name: newItemName.trim(),
        type: newItemData.itemType,
        content: newItemData.itemType === 'file' ? '' : undefined,
        children: newItemData.itemType === 'folder' ? [] : undefined
      };
      
      if (newItemData.parentId === 'root') {
        updatedFileSystem.push(newItem);
      } else {
        addItemToFileSystem(updatedFileSystem, newItemData.parentId, newItem);
      }
      
      setLocalFileSystem(updatedFileSystem);
      setNewItemData(null);
    }
  };

  const handleAddNewFile = () => {
    const parentId = (selectedItem && isFolder(selectedItem, localFileSystem)) ? 
      selectedItem : 'root';
    handleShowNewItemInput(parentId, 'file');
  };

  const handleAddNewFolder = () => {
    const parentId = (selectedItem && isFolder(selectedItem, localFileSystem)) ? 
      selectedItem : 'root';
    handleShowNewItemInput(parentId, 'folder');
  };

  const handleDeleteSelected = () => {
    if (selectedItem) {
      onDeleteItem(selectedItem);
      
      const updatedFileSystem = removeItemFromFileSystem([...localFileSystem], selectedItem);
      setLocalFileSystem(updatedFileSystem);
      setSelectedItem(null);
    }
  };

  const removeItemFromFileSystem = (items: FileNode[], itemId: string): FileNode[] => {
  
    const rootIndex = items.findIndex(item => item.id === itemId);
    if (rootIndex !== -1) {
      items.splice(rootIndex, 1);
      return items;
    }
    
    for (const item of items) {
      if (item.type === 'folder' && Array.isArray(item.children)) {
        // First check direct children
        const childIndex = item.children.findIndex(child => child.id === itemId);
        if (childIndex !== -1) {
          item.children.splice(childIndex, 1);
          return items;
        }
        
        item.children = removeItemFromFileSystem(item.children, itemId);
      }
    }
    
    return items;
  };

  const isFolder = (id: string, items: FileNode[]): boolean => {
    for (const item of items) {
      if (item.id === id) {
        return item.type === 'folder';
      }
      if (item.type === 'folder' && item.children) {
        if (isFolder(id, item.children)) {
          return true;
        }
      }
    }
    return false;
  };

  const generateUniqueId = () => {
    return Math.random().toString(36).substring(2, 9);
  };

  const handleOpenLocalFolder = async () => {
    try {
      setIsLoading(true);
      
      if (!window.showDirectoryPicker) {
        throw new Error('File System Access API is not supported in this browser');
      }
      
      const dirHandle = await window.showDirectoryPicker();
      
      const newFileSystem = await processDirectoryHandle(dirHandle);
      console.log("Processed file system:", newFileSystem);
      
      setLocalFileSystem(newFileSystem);
      
      if (onFileSystemUpdate) {
        onFileSystemUpdate(newFileSystem);
      }
      setExpandedFolders(new Set(['root']));
    } catch (error) {
      console.error('Error opening folder:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const processDirectoryHandle = async (
    dirHandle: FileSystemDirectoryHandle
  ): Promise<FileNode[]> => {
    const items: FileNode[] = [];
    
    try {
      for await (const entry of dirHandle.values()) {
        const id = generateUniqueId();
        
        if (entry.kind === 'directory') {
          try {
            const directoryHandle = entry as FileSystemDirectoryHandle;
            const children = await processDirectoryHandle(directoryHandle);
            const folderItem: FileNode = {
              id,
              name: entry.name,
              type: 'folder',
              children,
              handle: directoryHandle
            };
            items.push(folderItem);
          } catch (e) {
            console.error(`Error processing folder ${entry.name}:`, e);
          }
        } else if (entry.kind === 'file') {
          try {
            const fileHandle = entry as FileSystemFileHandle;
            const file = await fileHandle.getFile();
            const fileItem: FileNode = {
              id,
              name: entry.name,
              type: 'file',
              content: '', 
              handle: fileHandle
            };
            
            try {
              if (file.size < 5 * 1024 * 1024) { 
                fileItem.content = await file.text();
              }
            } catch (e) {
              console.log(`Could not read content for ${entry.name}:`, e);
            }
            
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

  const handleOpenLocalFile = async () => {
    try {
      if (!window.showOpenFilePicker) {
        throw new Error('File System Access API is not supported in this browser');
      }

      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false
      });
      
      const file = await fileHandle.getFile();
      const content = await file.text();
      
      const newFile: FileNode = {
        id: generateUniqueId(),
        name: file.name,
        type: 'file',
        content,
        handle: fileHandle
      };
      
      const targetParentId = contextMenu?.isFolder ? contextMenu.itemId : 'root';
      
      const updatedFileSystem = [...localFileSystem];
      const result = addItemToFileSystem(updatedFileSystem, targetParentId, newFile);
      
      if (result) {
        setLocalFileSystem(updatedFileSystem);
        
        if (onFileSystemUpdate) {
          onFileSystemUpdate(updatedFileSystem);
        }
      } else {
        const rootFileSystem = [...localFileSystem, newFile];
        setLocalFileSystem(rootFileSystem);
        
        if (onFileSystemUpdate) {
          onFileSystemUpdate(rootFileSystem);
        }
      }
      
      hideContextMenu();
    } catch (error) {
      console.log('File selection was canceled or failed', error);
    }
  };

  const addItemToFileSystem = (items: FileNode[], parentId: string, newItem: FileNode): boolean => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.id === parentId && item.type === 'folder') {
        if (!item.children) {
          item.children = [];
        }
        item.children.push(newItem);
        return true;
      }
      
      if (item.type === 'folder' && item.children) {
        if (addItemToFileSystem(item.children, parentId, newItem)) {
          return true;
        }
      }
    }
    return false;
  };

  const renderItem = (item: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isActive = item.id === activeFileId;
    const isItemSelected = item.id === selectedItem;
    
    return (
      <div key={item.id}>
        <div 
          className={`flex items-center p-1 cursor-pointer hover:bg-gray-700 ${isActive ? 'bg-gray-600' : ''} ${isItemSelected ? 'border-l-2 border-blue-400' : ''}`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => {
            setSelectedItem(item.id);
            if (item.type === 'folder') {
              toggleFolder(item.id);
            } else {
              onFileSelect(item);
            }
          }}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {item.type === 'folder' ? (
            isExpanded ? 
            <FolderOpenIcon size={16} className="mr-2 text-yellow-400" /> :
            <FolderIcon size={16} className="mr-2 text-yellow-400" />
          ) : (
            <FileIcon size={16} className="mr-2 text-blue-400" />
          )}
          <span className="text-sm text-white truncate">{item.name}</span>
        </div>
        
        {item.type === 'folder' && isExpanded && (
          <div>
            {Array.isArray(item.children) && item.children.length > 0 ? (
              item.children.map(child => renderItem(child, depth + 1))
            ) : (
              <div 
                className="text-gray-400 text-xs italic pl-8"
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                Empty folder
              </div>
            )}
            
            {newItemData?.parentId === item.id && newItemData.isVisible && (
              <div 
                className="flex items-center p-1 bg-gray-700"
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                {newItemData.itemType === 'folder' ? (
                  <FolderIcon size={16} className="mr-2 text-yellow-400" />
                ) : (
                  <FileIcon size={16} className="mr-2 text-blue-400" />
                )}
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateNewItem();
                    } else if (e.key === 'Escape') {
                      setNewItemData(null);
                    }
                  }}
                  autoFocus
                  className="bg-gray-800 text-white text-sm p-1 rounded outline-none w-full"
                  placeholder={`New ${newItemData.itemType}...`}
                />
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="w-64 h-full bg-gray-800 text-white overflow-y-auto flex flex-col"
      onClick={hideContextMenu}
    >
      <div className="p-2 bg-gray-900 flex justify-between items-center border-b border-gray-700">
        <h3 className="font-medium">File Explorer</h3>
        <div className="flex">
          <button 
            className="p-1 hover:bg-gray-700 rounded mr-1" 
            onClick={handleOpenLocalFolder}
            title="Open Local Folder"
            disabled={isLoading}
          >
            <FolderOpenIcon size={16} className={isLoading ? "text-gray-500" : ""} />
          </button>
          <button 
            className="p-1 hover:bg-gray-700 rounded mr-1" 
            onClick={handleOpenLocalFile}
            title="Open Local File"
            disabled={isLoading}
          >
            <UploadIcon size={16} className={isLoading ? "text-gray-500" : ""} />
          </button>
        </div>
      </div>
      
      <div className="p-2 bg-gray-900 flex justify-between items-center border-b border-gray-700">
        <div className="flex space-x-2">
          <button 
            className="p-1 hover:bg-gray-700 rounded flex items-center" 
            onClick={handleAddNewFile}
            title="Add New File"
          >
            <FilePlusIcon size={16} className="mr-1 text-blue-400" />
            <span className="text-xs">File</span>
          </button>
          <button 
            className="p-1 hover:bg-gray-700 rounded flex items-center" 
            onClick={handleAddNewFolder}
            title="Add New Folder"
          >
            <FolderPlusIcon size={16} className="mr-1 text-yellow-400" />
            <span className="text-xs">Folder</span>
          </button>
        </div>
        <button 
          className={`p-1 rounded flex items-center ${selectedItem ? 'hover:bg-gray-700 text-red-400' : 'text-gray-500 cursor-not-allowed'}`}
          onClick={handleDeleteSelected}
          disabled={!selectedItem}
          title="Delete Selected"
        >
          <TrashIcon size={16} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-400">
            Loading folder contents...
          </div>
        ) : (
          Array.isArray(localFileSystem) && localFileSystem.length > 0 ? (
            localFileSystem.map(item => renderItem(item))
          ) : (
            <div className="p-4 text-center text-gray-400">
              <p>No files or folders to display.</p>
              <p className="text-xs mt-2">Use the buttons above to add files or folders.</p>
            </div>
          )
        )}
      </div>
      
      {contextMenu?.visible && (
        <div 
          className="fixed bg-gray-800 shadow-lg border border-gray-700 rounded z-10"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
        >
          {contextMenu.isFolder && (
            <div 
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
              onClick={() => handleShowNewItemInput(contextMenu.itemId, 'file')}
            >
              <FileIcon size={14} className="mr-2" />
              <span className="text-sm">New File</span>
            </div>
          )}
          
          {contextMenu.isFolder && (
            <div 
              className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center"
              onClick={() => handleShowNewItemInput(contextMenu.itemId, 'folder')}
            >
              <FolderIcon size={14} className="mr-2" />
              <span className="text-sm">New Folder</span>
            </div>
          )}
          
          <div 
            className="px-4 py-2 hover:bg-gray-700 cursor-pointer flex items-center text-red-400"
            onClick={() => {
              // Call the parent handler
              onDeleteItem(contextMenu.itemId);
              
              // Update local state
              const updatedFileSystem = removeItemFromFileSystem([...localFileSystem], contextMenu.itemId);
              setLocalFileSystem(updatedFileSystem);
              
              hideContextMenu();
              setSelectedItem(null);
            }}
          >
            <TrashIcon size={14} className="mr-2" />
            <span className="text-sm">Delete</span>
          </div>
        </div>
      )}
    </div>
  );
};