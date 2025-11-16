export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  CHAT: '/chat',
  CHAT_ROOM: '/chat/:roomId',
} as const;

export const TOKEN_KEY = 'auth_token';
export const USER_KEY = 'user_data';

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
} as const;

export const ROOM_TYPES = {
  PRIVATE: 'private',
  GROUP: 'group',
} as const;