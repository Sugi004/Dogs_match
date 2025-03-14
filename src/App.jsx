

import {Routes, Route, BrowserRouter, Navigate} from 'react-router-dom'
import Login from './componenets/LoginComponent/Login'
import DogsLayout from './componenets/DogComponents/DogLayout'
import { UserProvider } from './Context/UserContext'
import AnimatedBackground from './componenets/AnimatedBAckground'


function App() {

  return (
    <>
      <UserProvider>
        <BrowserRouter>
            <AnimatedBackground />
            <Routes>
              <Route path="/login" element={<Login/>} />
            
              <Route path="/dogs" element={<DogsLayout />}/>
              <Route path="/*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
      </UserProvider>
    </>
  )
}

export default App
