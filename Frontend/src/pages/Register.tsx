import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/auth'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await register({ name, email, password })
      if (data.token) {
        localStorage.setItem('token', data.token)
        if (data.user) {
          localStorage.setItem('userName', data.user.name ?? data.user.email ?? '')
          localStorage.setItem('userId', String(data.user.id ?? ''))
        }
        navigate('/chat')
      } else {
        navigate('/login')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error en registro')
    }
  }

  return (
    <div className="auth-page card">
      <h2 className="title">Crear cuenta</h2>
      <p className="subtitle">Únete al chat global</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button className="primary" type="submit">Crear cuenta</button>

        <div className="helper">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}