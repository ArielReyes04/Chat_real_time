import api from './api'

export interface User {
  id: number
  username: string
  email: string
  isOnline?: boolean
}

export interface AuthResponse {
  success: boolean
  message?: string
  data?: {
    user: User
    token: string
  }
  error?: string
}

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/register', {
      username,
      email,
      password,
    })
    
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
    }
    
    return response.data
  } catch (error: any) {
    console.error('Error en registro:', error)
    throw error.response?.data || { success: false, message: 'Error al registrar usuario' }
  }
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      email,
      password
    })
    
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.data.user))
      console.log('✅ Token y usuario guardados en localStorage')
    }
     console.log('📦 Respuesta de login:', response.data)
    
    return response.data
  } catch (error: any) {
    console.error('Error en login:', error)
    throw error.response?.data || { success: false, message: 'Error al iniciar sesión' }
  }
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export const getCurrentUser = (): User | null => {
  const userStr = localStorage.getItem('user')
  return userStr ? JSON.parse(userStr) : null
}