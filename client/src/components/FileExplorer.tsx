// FileExplorer.tsx
import React, { useState } from 'react';
import { 
  Folder, 
  File, 
  Trash2, 
  FolderPlus, 
  Upload, 
  FolderOpen,
  FilePlus,
} from 'lucide-react';
import { useGlobalContext, FileNode } from './context/Explorer.context';

declare global {
  interface Window {
    showOpenFilePicker?: (options: { multiple: boolean }) => Promise<FileSystemFileHandle[]>;
  }
}

export const FileExplorer: React.FC = () => {
  const { 
    fileSystem, 
    setFileSystem, 
    activeFile, 
    setActiveFile,
    setFileContent,
    selectGlobalFolder,
    isLoading: globalLoading,
    isRepositoryInitialized
  } = useGlobalContext();

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
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleFolder = (folderId: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    newExpandedFolders.has(folderId) ? newExpandedFolders.delete(folderId) : newExpandedFolders.add(folderId);
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

  const hideContextMenu = () => setContextMenu(null);

  const generateUniqueId = () => Math.random().toString(36).substring(2, 9);

  const handleShowNewItemInput = (parentId: string, itemType: 'file' | 'folder') => {
    setNewItemData({ parentId, isVisible: true, itemType });
    setNewItemName('');
    hideContextMenu();
    if (!expandedFolders.has(parentId)) toggleFolder(parentId);
  };

  const addItemToFileSystem = (items: FileNode[], parentId: string, newItem: FileNode): boolean => {
    for (let item of items) {
      if (item.id === parentId && item.type === 'folder') {
        item.children = item.children || [];
        item.children.push(newItem);
        return true;
      }
      if (item.type === 'folder' && item.children && addItemToFileSystem(item.children, parentId, newItem)) {
        return true;
      }
    }
    return false;
  };

  const handleCreateNewItem = () => {
    if (newItemData && newItemName.trim()) {
      const updatedFileSystem = [...fileSystem];
      const newItem: FileNode = {
        id: generateUniqueId(),
        name: newItemName.trim(),
        type: newItemData.itemType,
        content: newItemData.itemType === 'file' ? '' : undefined,
        children: newItemData.itemType === 'folder' ? [] : undefined,
        path: newItemName.trim()
      };

      newItemData.parentId === 'root'
        ? updatedFileSystem.push(newItem)
        : addItemToFileSystem(updatedFileSystem, newItemData.parentId, newItem);

      setFileSystem(updatedFileSystem);
      setNewItemData(null);

      if (newItemData.itemType === 'file') {
        setActiveFile(newItem);
        setFileContent(newItem.content || '');
      }
    }
  };

  const removeItemFromFileSystem = (items: FileNode[], itemId: string): FileNode[] => {
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items.splice(index, 1);
      return items;
    }
    for (let item of items) {
      if (item.type === 'folder' && item.children) {
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

  const handleDeleteItem = (itemId: string) => {
    const updated = removeItemFromFileSystem([...fileSystem], itemId);
    setFileSystem(updated);
    if (activeFile?.id === itemId) {
      setActiveFile(null);
      setFileContent('');
    }
    setSelectedItem(null);
    hideContextMenu();
  };

  const handleFileSelect = (file: FileNode) => {
    if (file.type === 'file') {
      setActiveFile(file);
      setFileContent(file.content || '');
    }
    setSelectedItem(file.id);
  };

  const handleAddNewFile = () => {
    const parentId = selectedItem && isFolder(selectedItem, fileSystem) ? selectedItem : 'root';
    handleShowNewItemInput(parentId, 'file');
  };

  const handleAddNewFolder = () => {
    const parentId = selectedItem && isFolder(selectedItem, fileSystem) ? selectedItem : 'root';
    handleShowNewItemInput(parentId, 'folder');
  };

  const handleDeleteSelected = () => {
    if (selectedItem) handleDeleteItem(selectedItem);
  };

  const isFolder = (id: string, items: FileNode[]): boolean => {
    for (let item of items) {
      if (item.id === id) return item.type === 'folder';
      if (item.type === 'folder' && item.children && isFolder(id, item.children)) return true;
    }
    return false;
  };

  const handleOpenLocalFile = async () => {
    try {
      if (!window.showOpenFilePicker) throw new Error('Not supported');
      const [fileHandle] = await window.showOpenFilePicker({ multiple: false });
      const file = await fileHandle.getFile();
      const content = await file.text();
      const newFile: FileNode = {
        id: generateUniqueId(),
        name: file.name,
        type: 'file',
        content,
        handle: fileHandle,
        path: file.name
      };
      const updated = [...fileSystem, newFile];
      setFileSystem(updated);
      setActiveFile(newFile);
      setFileContent(content);
      hideContextMenu();
    } catch (e) {
      console.log('File open canceled or failed', e);
    }
  };

  const renderItem = (item: FileNode, depth = 0) => {
    const isExpanded = expandedFolders.has(item.id);
    const isActive = item.id === activeFile?.id;
    const isItemSelected = item.id === selectedItem;

    return (
      <div key={item.id}>
        <div 
          className={`flex items-center py-1.5 px-2 text-sm cursor-pointer rounded-md transition-colors duration-150
            ${isActive ? 'bg-gray-700/30 border-l-2 border-blue-400' : ''}
            ${isItemSelected ? 'bg-gray-700/20' : 'hover:bg-gray-700/30'}`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => item.type === 'folder' ? toggleFolder(item.id) : handleFileSelect(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
        >
          {item.type === 'folder' ? (
            isExpanded ? <FolderOpen size={16} className="mr-2 text-yellow-400 drop-shadow-sm" /> 
                       : <Folder size={16} className="mr-2 text-yellow-400 drop-shadow-sm" />
          ) : (
            <File size={16} className="mr-2 text-blue-400 drop-shadow-sm" />
          )}
          <span className="text-white truncate">{item.name}</span>
        </div>

        {item.type === 'folder' && isExpanded && (
          <div>
            {item.children?.length ? 
              item.children.map(child => renderItem(child, depth + 1)) : (
                <div className="italic text-gray-500 px-3 py-1 text-xs"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}>
                  Empty folder
                </div>
              )}

            {newItemData?.parentId === item.id && newItemData.isVisible && (
              <div 
                className="flex items-center px-2 py-1.5 bg-gray-800 rounded-md"
                style={{ paddingLeft: `${(depth + 1) * 16 + 12}px` }}
              >
                {newItemData.itemType === 'folder' ? (
                  <Folder size={16} className="mr-2 text-yellow-400" />
                ) : (
                  <File size={16} className="mr-2 text-blue-400" />
                )}
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNewItem();
                    if (e.key === 'Escape') setNewItemData(null);
                  }}
                  autoFocus
                  className="bg-gray-900 border border-gray-700 text-white text-sm p-1 rounded-md w-full outline-none focus:ring-2 ring-blue-500"
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
      className="w-full h-full bg-gradient-to-b from-gray-900 via-gray-850 to-gray-900 text-white overflow-y-auto flex flex-col backdrop-blur-md border-r border-gray-700 shadow-lg"
      onClick={hideContextMenu}
    >
      <div className="p-3 bg-gray-900 backdrop-blur border-b border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold tracking-wide text-gray-200">📁 File Explorer</h3>
        <div className="flex">
          <button className="p-1.5 rounded hover:bg-gray-700 transition" onClick={selectGlobalFolder} disabled={globalLoading}>
            <FolderOpen size={16} className={globalLoading ? 'text-gray-500' : ''} />
          </button>
          <button className="p-1.5 rounded hover:bg-gray-700 transition" onClick={handleOpenLocalFile} disabled={globalLoading}>
            <Upload size={16} className={globalLoading ? 'text-gray-500' : ''} />
          </button>
        </div>
      </div>

   

      <div className="flex-1 overflow-y-auto">
        {globalLoading ? (
          <div className="p-4 text-center text-gray-400">
            Loading folder contents...
          </div>
        ) : (
          fileSystem.length ? fileSystem.map(item => renderItem(item)) : (
            <div className="p-4 text-center text-gray-500">
              <p>No files or folders to display.</p>
              <p className="text-xs mt-2">Click 📁 to select a folder!</p>
            </div>
          )
        )}
      </div>

      {contextMenu?.visible && (
        <div 
          className="fixed z-50 rounded-md bg-gray-900 border border-gray-700 shadow-xl backdrop-blur-md w-48"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          {contextMenu.isFolder && (
            <>
              <div className="px-4 py-2 hover:bg-gray-700/40 cursor-pointer flex items-center gap-2"
                onClick={() => handleShowNewItemInput(contextMenu.itemId, 'file')}>
                <File size={14} />
                <span className="text-sm">New File</span>
              </div>
              <div className="px-4 py-2 hover:bg-gray-700/40 cursor-pointer flex items-center gap-2"
                onClick={() => handleShowNewItemInput(contextMenu.itemId, 'folder')}>
                <Folder size={14} />
                <span className="text-sm">New Folder</span>
              </div>
            </>
          )}
          <div className="px-4 py-2 hover:bg-gray-700/40 cursor-pointer flex items-center text-red-400 gap-2"
            onClick={() => handleDeleteItem(contextMenu.itemId)}>
            <Trash2 size={14} />
            <span className="text-sm">Delete</span>
          </div>
        </div>
      )}
    </div>
  );
};
