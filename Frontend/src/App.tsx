import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Chat from './pages/Chat.tsx'
import './App.css'

function App() {
  const [token, setToken] = useState<string | null>(() => {
    try { return localStorage.getItem('token') } catch { return null }
  })

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'token') setToken(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  return (
    <Routes>
      <Route path="/" element={token ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/chat" element={token ? <Chat /> : <Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
