import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const api = axios.create({
  baseURL
})

// Interceptor para adjuntar el token automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  console.log('🔑 Token en request:', token ? 'Presente' : 'Ausente')
  
  config.headers = config.headers || {}
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
    console.log('✅ Authorization header agregado:', config.headers['Authorization'].slice(0, 30) + '...')
  } else {
    console.log('⚠️ No se agregó Authorization header porque no hay token')
  }
  return config
}, (error) => {
  console.error('❌ Error en request interceptor:', error)
  return Promise.reject(error)
})

// Interceptor para manejar respuestas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Error en response:', error.response?.status, error.response?.data)
    
    if (error.response?.status === 401) {
      console.log('❌ Token inválido o expirado')
      // localStorage.removeItem('token')
      // localStorage.removeItem('user')
      // window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default api