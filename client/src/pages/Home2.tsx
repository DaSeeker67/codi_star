import React, { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Plus } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import RepoAnalyzer from './RepoAnalyzer';

const Home = () => {
  const [selectedPath, setSelectedPath] = useState(null);
  const [isRepoSelected, setIsRepoSelected] = useState(false);
  const [username, setUsername] = useState('');
  const [reponame, setReponame] = useState('');
  const { isSignedIn, user, isLoaded } = useUser();

  useEffect(() => {
    // Check if a repository was previously selected
    const storedUsername = localStorage.getItem('repo_username');
    const storedReponame = localStorage.getItem('repo_reponame');
    
    if (storedUsername && storedReponame) {
      setUsername(storedUsername);
      setReponame(storedReponame);
      setIsRepoSelected(true);
    } else if (user?.username) {
      // If no repo selected but we have the user's name
      setUsername(user.username);
    }
  }, [user]);

  if (!isLoaded) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-900 text-white">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-900 text-white flex-col gap-4">
        <User size={48} />
        <div>Sign in to view this page</div>
      </div>
    );
  }

  const handleRepoSubmit = () => {
    if (username && reponame) {
      localStorage.setItem('repo_username', username);
      localStorage.setItem('repo_reponame', reponame);
      setIsRepoSelected(true);
    }

     
  };

  const resetRepo = () => {
    setIsRepoSelected(false);
    setSelectedPath(null);
  };

  // Show user profile when no repo is selected
  if (!isRepoSelected) {
    return (
      <div className="bg-zinc-900 w-screen h-screen fixed text-white flex flex-col">
        <div className="flex justify-between items-center p-3 border-b border-zinc-700">
          <h1 className="text-xl font-bold">Code Explorer</h1>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-md p-6 bg-zinc-800 rounded-lg shadow-lg">
            <div className="flex flex-col items-center mb-6">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full mb-4"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/api/placeholder/80/80";
                  }}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center mb-4">
                  <User size={48} />
                </div>
              )}
              <h2 className="text-xl font-semibold">{user.fullName || user.username}</h2>
              <p className="text-zinc-400">{user.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">GitHub Username</label>
                <input
                  id="username"
                  name="username"
                  placeholder="GitHub Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-700 px-3 py-2 rounded-md border border-zinc-600"
                />
              </div>
              
              <div>
                <label htmlFor="reponame" className="block text-sm font-medium mb-1">Repository Name</label>
                <input
                  id="reponame"
                  name="reponame"
                  placeholder="Repository Name"
                  value={reponame}
                  onChange={(e) => setReponame(e.target.value)}
                  className="w-full bg-zinc-700 px-3 py-2 rounded-md border border-zinc-600"
                />
              </div>
              
              <button
                onClick={handleRepoSubmit}
                className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md transition-colors"
              >
                <Plus className="mr-2" size={18} />
                Choose Repository
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the code explorer once a repo is selected
  return (
    <div className="bg-zinc-900 w-screen h-screen fixed text-white flex flex-col">
      <div className="flex justify-between items-center p-3 border-b border-zinc-700">
        <h1 className="text-xl font-bold">Code Explorer</h1>
        <div className="flex items-center space-x-3">
          <div className="bg-zinc-800 px-4 py-1 rounded-md border border-zinc-700">
            <span className="font-medium">{username}/{reponame}</span>
          </div>
          <button
            onClick={resetRepo}
            className="bg-zinc-700 hover:bg-zinc-600 px-3 py-1 rounded-md transition-colors"
          >
            Change Repo
          </button>
        </div>
      </div>
      
      <div className="flex-1 flex w-full">
        <div className="w-4/5 flex justify-center">
          <div className="w-full">
            <CodeEditor filePath={selectedPath} />
          </div>
        </div>
        <div className="w-1/5 border-l border-zinc-700">
          <RepoAnalyzer 
            filePath={selectedPath} 
            username={username} 
            reponame={reponame}
          />
        </div>
      </div>
    </div>
  );
};

export default Home;