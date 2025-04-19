import React, { useEffect, useState } from 'react';
import CodeEditor from '@/components/CodeEditor';
import RepoAnalyzer from './RepoAnalyzer';

const Home = () => {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [isCodeEditorVisible, setIsCodeEditorVisible] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [reponame, setReponame] = useState<string>('');
  
  useEffect(() => {
    // Auto-detect repository from URL or local storage if needed
    const storedUsername = localStorage.getItem('repo_username');
    const storedReponame = localStorage.getItem('repo_reponame');
    
    if (storedUsername) setUsername(storedUsername);
    if (storedReponame) setReponame(storedReponame);
  }, []);
  
  const handleRepoInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'username') {
      setUsername(value);
      localStorage.setItem('repo_username', value);
    } else if (name === 'reponame') {
      setReponame(value);
      localStorage.setItem('repo_reponame', value);
    }
  };
  
  const toggleCodeEditor = () => {
    setIsCodeEditorVisible(!isCodeEditorVisible);
  };

  return (
    <div>
      <div className='bg-zinc-900 w-screen h-screen fixed text-white flex flex-col'>
        <div className='flex justify-between items-center p-3 border-b border-zinc-700'>
          <h1 className="text-xl font-bold">Code Explorer</h1>
          <div className="flex items-center space-x-2">
            <input
              name="username"
              placeholder="Username"
              value={username}
              onChange={handleRepoInfoChange}
              className="bg-zinc-800 px-3 py-1 rounded-md border border-zinc-700"
            />
            <input
              name="reponame"
              placeholder="Repository Name"
              value={reponame}
              onChange={handleRepoInfoChange}
              className="bg-zinc-800 px-3 py-1 rounded-md border border-zinc-700"
            />
            <button 
              onClick={toggleCodeEditor}
              className="bg-zinc-700 px-3 py-1 rounded-md hover:bg-zinc-600"
            >
              {isCodeEditorVisible ? 'Hide Editor' : 'Show Editor'}
            </button>
          </div>
        </div>
        
        <div className='flex-1 flex w-full'>
          {/* The FileExplorer is handled elsewhere in your application */}
          
          {isCodeEditorVisible && (
            <div className='w-4/5 flex justify-center border'>
              <div className='w-full'>
                <CodeEditor filePath={selectedPath} />
              </div>
            </div>
          )}
          
          <div className='w-1/5 border'>
            <RepoAnalyzer 
              filePath={selectedPath}
              username={username} 
              reponame={reponame}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;