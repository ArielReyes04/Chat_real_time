import { useEffect, useState, useRef } from 'react'
import { fetchMessages, postMessage } from '../services/message'
import type { Message } from '../services/message'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, logout as authLogout } from '../services/auth'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const pollRef = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  // ✅ OBTENER USUARIO CORRECTAMENTE
  const currentUser = getCurrentUser()
  
  // ✅ Redirigir si no hay usuario autenticado
  useEffect(() => {
    if (!currentUser) {
      console.log('❌ No hay usuario autenticado, redirigiendo a login')
      //navigate('/login')
    }
  }, [currentUser, navigate])

  if (!currentUser) return null

  const userName =  currentUser.username
  const userId = currentUser.id

  function logout() {
    authLogout()
    navigate('/login')
  }

  async function load() {
    try {
      const data = await fetchMessages('global', 100)
      setMessages(data)
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50)
    } catch (err: any) {
      console.error('❌ Error al cargar mensajes:', err)
      if (err.response?.status === 401) {
        console.log('❌ Token inválido, redirigiendo a login')
        //logout()
        return
      }
      setError(err?.response?.data?.message || err.message || 'No se pudieron cargar mensajes')
    }
  }

  useEffect(() => {
    console.log('🔄 Iniciando carga de mensajes...')
    console.log('👤 Usuario actual:', currentUser)
    console.log('🔑 Token:', localStorage.getItem('token'))
    
    load()
    pollRef.current = window.setInterval(load, 3000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!content.trim()) return
    try {
      const m = await postMessage(content.trim(), 'global')
      setContent('')
      setMessages((s) => [...s, m])
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50)
    } catch (err: any) {
      console.error('❌ Error al enviar mensaje:', err)
      if (err.response?.status === 401) {
        logout()
        return
      }
      setError(err?.response?.data?.message || err.message || 'Error al enviar')
    }
  }

  function formatTime(t?: string) {
    if (!t) return ''
    const d = new Date(t)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="chat-page card">
      <header className="chat-header">
        <div className="user-info">
          <div className="avatar">{userName.charAt(0).toUpperCase()}</div>
          <div>
            <div className="username">{userName}</div>
            <div className="status">Conectado · Global</div>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={load}>Actualizar</button>
          <button onClick={logout} className="danger">Cerrar sesión</button>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {messages.length === 0 && <div className="empty">Aún no hay mensajes — sé el primero</div>}
        {messages.map((m) => {
          const mine = m.senderId === userId
          return (
            <div key={m.id} className={`message ${mine ? 'mine' : ''}`}>
              <div className="bubble">
                <div className="meta">
                  <strong>{`User ${m.senderId}`}</strong>
                  <small>{formatTime(m.createdAt)}</small>
                </div>
                <div className="content">{m.content}</div>
              </div>
            </div>
          )
        })}
      </div>

      <form className="composer" onSubmit={handleSend}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribe un mensaje y presiona Enter"
        />
        <button type="submit" className="primary">Enviar</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  )
}