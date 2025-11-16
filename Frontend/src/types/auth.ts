import { User } from './user';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthResponse {
  success?: boolean  // ✅ Hacer opcional
  message?: string
  token?: string     // ✅ Agregar token directo
  user?: User        // ✅ Mantener user opcional
  data?: {
    admin: User      // ✅ Agregar admin en data
    token: string
  }
  error?: string
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

