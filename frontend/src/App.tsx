import { Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import GetStarted from './pages/GetStarted'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/Admin'


export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/commencer" element={<GetStarted />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/admin" element={<Admin/>} />

    </Routes>
  )
}