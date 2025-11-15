import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../services/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // ✅ CORRECTO: Pasar parámetros individuales, no objeto
      const response = await login(email, password)
      
      if (response.success && response.data) {
        console.log('✅ Login exitoso:', response.data.user)
        // El token ya se guarda en auth.ts
        navigate('/chat')
        console.log('✅ Navigate ejecutado')
      } else {
        setError(response.message || 'Error al iniciar sesión')
      }
    } catch (err: any) {
      console.error('❌ Error en login:', err)
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page card">
      <h2 className="title">Bienvenido</h2>
      <p className="subtitle">Inicia sesión para entrar al chat</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            type="email" 
            required 
            placeholder="correo@ejemplo.com"
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            required 
            placeholder="Tu contraseña"
            autoComplete="current-password"
          />
        </label>
        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Iniciando sesión...' : 'Entrar'}
        </button>

        <div className="helper">
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}