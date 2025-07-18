import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { User, Plus, Settings, GitBranch } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import CodeEditor from '@/components/CodeEditor';
import RepoAnalyzer from './RepoAnalyzer';
import { FileExplorer } from '@/components/FileExplorer';

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
      <div className="w-screen h-screen flex items-center justify-center bg-[#0d1117] text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-gray-300">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[#0d1117] text-white flex-col gap-6">
        <div className="bg-[#21262d] p-8 rounded-xl border border-[#30363d] shadow-2xl">
          <div className="flex flex-col items-center gap-4">
            <User size={48} className="text-blue-400" />
            <div className="text-xl font-medium">Sign in to continue</div>
            <div className="text-gray-400 text-center">
              Access your repositories and start exploring code
            </div>
          </div>
        </div>
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
    localStorage.removeItem('repo_username');
    localStorage.removeItem('repo_reponame');
  };

  // Show user profile when no repo is selected
  if (!isRepoSelected) {
    return (
      <div className="bg-[#0d1117] w-screen h-screen fixed text-white flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-[#30363d] bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
              <GitBranch size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Codi
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="h-8 w-8 rounded-full border-2 border-blue-500"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-sm text-white font-medium">
                  {user.firstName?.[0] || user.username?.[0] || '?'}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-[#21262d] rounded-xl border border-[#30363d] shadow-2xl overflow-hidden">
              {/* Card Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  {user.imageUrl ? (
                    <img
                      src={user.imageUrl}
                      alt="Profile"
                      className="h-16 w-16 rounded-full border-4 border-white/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-2xl text-white font-bold">
                        {user.firstName?.[0] || user.username?.[0] || '?'}
                      </span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {user.fullName || user.username}
                    </h2>
                    <p className="text-blue-100 text-sm opacity-90">
                      {user.emailAddresses?.[0]?.emailAddress}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-6 space-y-5">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Choose Repository
                  </h3>
                  <p className="text-gray-400 text-sm">
                    Enter GitHub repository details to start exploring
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                      GitHub Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      placeholder="e.g., octocat"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#0d1117] px-4 py-3 rounded-lg border border-[#30363d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="reponame" className="block text-sm font-medium text-gray-300 mb-2">
                      Repository Name
                    </label>
                    <input
                      id="reponame"
                      name="reponame"
                      placeholder="e.g., hello-world"
                      value={reponame}
                      onChange={(e) => setReponame(e.target.value)}
                      className="w-full bg-[#0d1117] px-4 py-3 rounded-lg border border-[#30363d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-white placeholder-gray-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleRepoSubmit}
                    disabled={!username || !reponame}
                    className="w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg transition-all font-medium text-white shadow-lg"
                  >
                    <Plus className="mr-2" size={18} />
                    Explore Repository
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show the code explorer once a repo is selected
  return (
    <div className="bg-[#0d1117] w-screen h-screen fixed text-white flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-[#30363d] bg-[#161b22] z-10">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg">
            <GitBranch size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Codi
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-[#21262d] px-4 py-2 rounded-lg border border-[#30363d] flex items-center gap-2">
            <GitBranch size={16} className="text-blue-400" />
            <span className="font-medium text-white">{username}/{reponame}</span>
          </div>
          <button
            onClick={resetRepo}
            className="bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#40464d] px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-gray-300 hover:text-white"
          >
            <Settings size={16} />
            Change Repo
          </button>
        </div>
      </div>
      
      {/* Main Content with Resizable Panes */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup
          direction="horizontal"
          autoSaveId="Codi-layout"
          className="w-full h-full"
        >
          {/* Left Panel - File Explorer */}
          <Panel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            className="bg-[#161b22] border-r border-[#30363d]"
          >
            <div className="h-full overflow-hidden">
              <FileExplorer />
            </div>
          </Panel>
          
          {/* Left Resize Handle */}
          <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-500 transition-colors duration-200 relative group">
            <div className="absolute inset-0 w-3 -translate-x-1 group-hover:bg-blue-500/20 transition-colors duration-200"></div>
          </PanelResizeHandle>
          
          {/* Middle Panel - Code Editor */}
          <Panel
            defaultSize={50}
            minSize={30}
            className="bg-[#0d1117]"
          >
            <div className="h-full overflow-hidden">
              <CodeEditor />
            </div>
          </Panel>
          
          {/* Right Resize Handle */}
          <PanelResizeHandle className="w-1 bg-[#30363d] hover:bg-blue-500 transition-colors duration-200 relative group">
            <div className="absolute inset-0 w-3 -translate-x-1 group-hover:bg-blue-500/20 transition-colors duration-200"></div>
          </PanelResizeHandle>
          
          {/* Right Panel - Repo Analyzer */}
          <Panel
            defaultSize={25}
            minSize={15}
            maxSize={40}
            className="bg-[#161b22] border-l border-[#30363d]"
          >
            <div className="h-full overflow-hidden">
              <RepoAnalyzer />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
};

export default Home;
