import React, { useEffect, useState } from 'react'
import {FileExplorer} from '@/components/FileExplorer';
import { FileNode } from '@/types/types';
import CodeEditor from '@/components/CodeEditor';

const Home = () => {

    const [selectedPath, setSelectedPath] = useState<string | null>(null);
    const [isCodeEditorVisible,setIsCodeEditorVisible] = useState<boolean>(true);
  
   
  return (
    <div>
            <div className='bg-zinc-900 w-screen h-screen fixed text-white flex flex-col'>
          <div className='flex justify-center border'><h1>Toolbar</h1></div>
          <div className='flex-1 flex w-full'>
          {/* <div className='w-1/5'><FileExplorer onSelectFile={setSelectedPath} /></div> */}
           {isCodeEditorVisible&&<div className='w-4/5 flex justify-center border'><div className='w-full'><CodeEditor filePath={selectedPath}/></div></div>}
            <div className='w-1/5 flex justify-center border'>AI Interface</div>
          </div>
      </div>
    </div>
  )
}

export default Home
