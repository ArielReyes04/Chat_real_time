import api from './api'

export type Message = {
  id: number
  senderId: number
  content: string
  room?: string
  createdAt?: string
}

export async function fetchMessages(room = 'global', limit = 50) {
  const res = await api.get('/api/messages', { params: { room, limit } })
  return res.data as Message[]
}

export async function postMessage(content: string, room = 'global') {
  const res = await api.post('/api/messages', { content, room })
  return res.data as Message
}