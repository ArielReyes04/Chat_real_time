import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../services/auth'

export default function Register() {
  const [username, setUsername] = useState('')
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
      // Llamar a register con parámetros individuales, no objeto
      const response = await register(username, email, password)
      
      if (response.success && response.data) {
        console.log('✅ Registro exitoso:', response.data.user)
        // El token ya se guarda en auth.ts
        navigate('/chat')
      } else {
        setError(response.message || 'Error al registrar usuario')
      }
    } catch (err: any) {
      console.error('❌ Error en registro:', err)
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page card">
      <h2 className="title">Crear cuenta</h2>
      <p className="subtitle">Únete al chat global</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Nombre de usuario *
          <input 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            placeholder="usuario123"
            autoComplete="username"
          />
        </label>

        <label>
          Email *
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
          Contraseña *
          <input 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            type="password" 
            required 
            minLength={6}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
        </label>

        <button className="primary" type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </button>

        <div className="helper">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </div>

        {error && <p className="error">{error}</p>}
      </form>
    </div>
  )
}