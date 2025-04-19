import  { useState } from 'react';
import { FileNode } from "@/types/types";
import Files from './Files';
import { getFileTree } from '@/utils/fileSystem';

type FileExplorerProps = {
  onSelectFile: (path: string) => void;
};

function FileExplorer({ onSelectFile }: FileExplorerProps) {
  const [tree, setTree] = useState<FileNode | null>(null);
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const handleChooseFolder = async () => {
    try {
      const handle = await (window as any).showDirectoryPicker();
      const fileTree = await getFileTree(handle);
      setTree(fileTree);
      setDirHandle(handle);
    } catch (error) {
      console.error("Folder selection cancelled or failed", error);
    }
  };

  if (!tree || !dirHandle) {
    return (
      <div className='w-full h-full flex justify-center items-center'>
        <button
          className='bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded'
          onClick={handleChooseFolder}
        >
          Choose Folder
        </button>
      </div>
    );
  }

  return (
    <Files
      initialTree={tree}
      setTree={setTree}
      onSelectFile={onSelectFile}
      path=""
      dirHandle={dirHandle}
      rootHandle={dirHandle} 
    />
  );
}

export default FileExplorer;