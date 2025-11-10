import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('testuser@example.com')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await login({ email, password })
      if (data.token) {
        localStorage.setItem('token', data.token)
        navigate('/chat')
      } else {
        setError('No token received')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed')
    }
  }

  return (
    <div className="auth-page">
      <h2>Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit">Login</button>
        <div className="helper">
          <Link to="/register">Create account</Link>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}