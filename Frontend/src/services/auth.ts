import api from './api'

type RegisterPayload = { name: string; email: string; password: string }
type LoginPayload = { email: string; password: string }

export async function register(payload: RegisterPayload) {
  const res = await api.post('/api/auth/register', payload)
  return res.data
}

export async function login(payload: LoginPayload) {
  const res = await api.post('/api/auth/login', payload)
  return res.data
}