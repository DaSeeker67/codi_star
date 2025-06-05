import { SignedIn, SignedOut } from '@clerk/clerk-react';
import CodeEditor from '@/components/CodeEditor';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen">
      <SignedIn>
        <div className="flex-1 container mx-auto p-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-zinc-900 rounded-lg p-4">
              <div className='bg-zinc-900 w-screen h-screen fixed text-white flex flex-col'>
                <div className='flex justify-between items-center p-3 border-b border-zinc-700'>
                  <h1 className="text-xl font-bold">Code Explorer</h1>
                </div>
                
                <div className='flex-1 flex w-full'>
                  <div className='w-4/5 flex justify-center border'>
                    <div className='w-full'>
                      <CodeEditor />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex-1 flex items-center justify-center">
          <Button onClick={() => navigate('/sign-in')}>Sign In</Button>
        </div>
      </SignedOut>
    </div>
  );
};

export default Home;