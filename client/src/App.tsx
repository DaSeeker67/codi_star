import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home2'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'



function App() {

  

  return (
    <><SignedOut>
      <LandingPage></LandingPage>
    </SignedOut>
    <SignedIn>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}/>
        </Routes>
      </BrowserRouter>
    </SignedIn>
      
    </>
  )
}

export default App