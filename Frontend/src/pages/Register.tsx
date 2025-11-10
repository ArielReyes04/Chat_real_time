import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/auth'

export default function Register() {
  const [name, setName] = useState('Test User')
  const [email, setEmail] = useState('testuser@example.com')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const data = await register({ name, email, password })
      if (data.token) {
        localStorage.setItem('token', data.token)
        navigate('/chat')
      } else {
        navigate('/login')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Register failed')
    }
  }

  return (
    <div className="auth-page">
      <h2>Register</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Name
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
        <button type="submit">Create account</button>
        <div className="helper">
          <Link to="/login">Already have an account?</Link>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}