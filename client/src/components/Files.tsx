import React, { useState, useEffect } from 'react';
import { FileNode } from '@/types/types';
import FolderIcon from '@heroicons/react/24/solid/FolderIcon';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import DocumentIcon from '@heroicons/react/24/solid/DocumentIcon';
import { getFileTree } from '@/utils/fileSystem';

interface FileProps {
  initialTree: FileNode | null;
  setTree: (tree: FileNode | null) => void;
  onSelectFile: (path: string) => void;
  path: string;
  dirHandle: FileSystemDirectoryHandle;
  rootHandle: FileSystemDirectoryHandle;
}

const Files: React.FC<FileProps> = ({ initialTree, setTree, onSelectFile, path, dirHandle, rootHandle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adding, setAdding] = useState<"file" | "directory" | null>(null);
  const [inputName, setInputName] = useState<string>('');
  const [childrenHandles, setChildrenHandles] = useState<Map<string, FileSystemDirectoryHandle>>(new Map());

  const currentPath = path ? `${path}/${initialTree?.name}` : initialTree?.name || '';

  const handleAddItem = async () => {
    if (!inputName.trim()) return;
    const name = inputName.trim();

    try {
      if (adding === 'directory') {
        await dirHandle.getDirectoryHandle(name, { create: true });
      } else {
        const fileHandle = await dirHandle.getFileHandle(name, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.close();
      }
      const updatedTree = await getFileTree(rootHandle);
      setTree(updatedTree);
    } catch (err) {
      console.error("Failed to add item:", err);
    } finally {
      setAdding(null);
      setInputName('');
    }
  };

  const handleDelete = async () => {
    if (!initialTree || !path) return;
    const parts = path.split('/');
    const nameToDelete = parts.pop();
    if (!nameToDelete) return;

    try {
      let parentHandle = rootHandle;
      for (const part of parts) {
        parentHandle = await parentHandle.getDirectoryHandle(part);
      }
      await parentHandle.removeEntry(nameToDelete, { recursive: true });
      const updatedTree = await getFileTree(rootHandle);
      setTree(updatedTree);
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  };

  const resolveChildHandle = async (name: string) => {
    if (childrenHandles.has(name)) {
      return childrenHandles.get(name)!;
    }
    try {
      const handle = await dirHandle.getDirectoryHandle(name);
      setChildrenHandles(new Map(childrenHandles.set(name, handle)));
      return handle;
    } catch {
      return dirHandle;
    }
  };

  if (initialTree == null) {
    return null;
  }

  if (initialTree.kind === 'file') {
    return (
      <div
        className="ml-4 cursor-pointer hover:bg-zinc-700 px-2 py-1 rounded text-sm flex items-center"
        onClick={() => {
          onSelectFile(currentPath);
          console.log(currentPath);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          handleDelete();
        }}
      >
        <DocumentIcon className="size-4 text-white mr-2" />
        {initialTree.name}
      </div>
    );
  }

  return (
    <div className="ml-2 text-sm">
      <div
        className="flex items-center cursor-pointer hover:bg-zinc-800 px-2 py-1 rounded justify-between"
        onClick={() => setIsOpen(!isOpen)}
        onContextMenu={(e) => {
          e.preventDefault();
          handleDelete();
        }}
      >
        <div className='flex items-center'>
          {isOpen ? (
            <ChevronDownIcon className="size-4 text-gray-400 mr-1" />
          ) : (
            <ChevronRightIcon className="size-4 text-gray-400 mr-1" />
          )}
          <FolderIcon className="size-4 text-sky-400 mr-2" />
          {initialTree.name}
        </div>
        <div>
          <button className='text-xs mr-1' onClick={(e) => { e.stopPropagation(); setAdding('file'); }}>+File</button>
          <button className='text-xs' onClick={(e) => { e.stopPropagation(); setAdding('directory'); }}>+Folder</button>
        </div>
      </div>

      {adding && (
        <div className="ml-6 my-1">
          <input
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
            }}
            className="bg-zinc-900 border border-zinc-700 rounded px-1 py-0.5 text-sm"
            placeholder={`New ${adding}`}
            autoFocus
          />
        </div>
      )}

      {isOpen && initialTree.children?.map((child, index) => (
        <ChildWrapper key={index} child={child} currentPath={currentPath} setTree={setTree} onSelectFile={onSelectFile} resolveChildHandle={resolveChildHandle} rootHandle={rootHandle} />
      ))}
    </div>
  );
};

const ChildWrapper = ({ child, currentPath, setTree, onSelectFile, resolveChildHandle, rootHandle }: any) => {
  const [childHandle, setChildHandle] = useState<FileSystemDirectoryHandle | null>(null);

  useEffect(() => {
    const resolveHandle = async () => {
      const handle = await resolveChildHandle(child.name);
      setChildHandle(handle);
    };
    resolveHandle();
  }, [child.name, resolveChildHandle]);

  if (!childHandle) return null;

  return (
    <Files
      initialTree={child}
      setTree={setTree}
      onSelectFile={onSelectFile}
      path={currentPath}
      dirHandle={childHandle}
      rootHandle={rootHandle}
    />
  );
};

export default Files;


