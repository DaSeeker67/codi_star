import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './pages/Home2'
import { SignedIn, SignedOut } from '@clerk/clerk-react'
import LandingPage from './pages/LandingPage'
import { GlobalProvider } from './components/context/Explorer.context'



function App() {

  

  return (

    <><SignedOut>
      <LandingPage></LandingPage>
    </SignedOut>
    <SignedIn>
      <GlobalProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home/>}/>
        </Routes>
      </BrowserRouter>
      </GlobalProvider>
    </SignedIn>
      
    </>
  )
}

export default App