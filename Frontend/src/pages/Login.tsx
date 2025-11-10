import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await login({ email, password })
      if (data.token) {
        localStorage.setItem('token', data.token)
        // store user data if backend returns it
        if (data.user) {
          localStorage.setItem('userName', data.user.name ?? data.user.email ?? '')
          localStorage.setItem('userId', String(data.user.id ?? ''))
        } else if (data.email) {
          localStorage.setItem('userName', data.email)
        }
        navigate('/chat')
      } else {
        setError('No token recibido')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error en login')
    }
  }

  return (
    <div className="auth-page card">
      <h2 className="title">Bienvenido</h2>
      <p className="subtitle">Inicia sesión para entrar al chat</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button className="primary" type="submit">Entrar</button>

        <div className="helper">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}