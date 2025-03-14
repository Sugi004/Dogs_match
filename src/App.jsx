

import {Routes, Route, BrowserRouter, Navigate} from 'react-router-dom'
import Login from './componenets/LoginComponent/Login'
import DogsLayout from './componenets/DogComponents/DogLayout'

import AnimatedBackground from './componenets/AnimatedBAckground'


function App() {

  return (
    <>
    <BrowserRouter>
        <AnimatedBackground />
        <Routes>
          <Route path="/login" element={<Login/>} />
        
          <Route path="/dogs" element={<DogsLayout />}/>
          <Route path="/*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
