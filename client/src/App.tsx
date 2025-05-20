import { useState } from 'react'
import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
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