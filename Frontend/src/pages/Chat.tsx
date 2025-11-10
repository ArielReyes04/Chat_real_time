import { useEffect, useState, useRef } from 'react'
import { fetchMessages, postMessage } from '../services/message'
import type { Message } from '../services/message'
import { useNavigate } from 'react-router-dom'

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const pollRef = useRef<number | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  function logout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  async function load() {
    try {
      const data = await fetchMessages('global', 100)
      setMessages(data)
      // scroll to bottom
      setTimeout(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }), 50)
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load messages')
    }
  }

  useEffect(() => {
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
      setError(err?.response?.data?.message || err.message || 'Failed to send')
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <h3>Chat - Global</h3>
        <div>
          <button onClick={load}>Refresh</button>
          <button onClick={logout}>Logout</button>
        </div>
      </header>

      <div className="messages" ref={listRef}>
        {messages.map((m) => (
          <div key={m.id} className="message">
            <div className="meta">
              <strong>{m.senderId}</strong> <small>{new Date(m.createdAt || '').toLocaleString()}</small>
            </div>
            <div className="content">{m.content}</div>
          </div>
        ))}
        {messages.length === 0 && <div className="empty">No messages yet</div>}
      </div>

      <form className="composer" onSubmit={handleSend}>
        <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type a message..." />
        <button type="submit">Send</button>
      </form>

      {error && <p className="error">{error}</p>}
    </div>
  )
}