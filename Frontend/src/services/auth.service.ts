import { apiClient } from '../api/client';
import { AuthResponse, LoginCredentials, RegisterData } from '../types';
import { setToken, removeToken } from '../utils/jwt';

const extractErrorMessage = (error: any): string => {
  const data = error?.response?.data;
  if (!data) return error?.message || 'Error de red';
  if (typeof data === 'string') return data;
  if (data.message) return data.message;
  if (Array.isArray(data.errors) && data.errors.length) {
    const first = data.errors[0];
    return typeof first === 'string' ? first : (first?.msg || 'Solicitud inválida');
  }
  return 'Error en la solicitud';
};

const extractToken = (res: any): string | null => {
  const data = res?.data;
  if (data?.data?.token) {
    console.info('[AuthService] Token from data.data.token');
    return data.data.token;
  }
  if (data?.token) {
    console.info('[AuthService] Token from body.token');
    return data.token;
  }
  if (data?.access_token) {
    console.info('[AuthService] Token from body.access_token');
    return data.access_token;
  }
  if (data?.accessToken) {
    console.info('[AuthService] Token from body.accessToken');
    return data.accessToken;
  }
  if (data?.jwt) {
    console.info('[AuthService] Token from body.jwt');
    return data.jwt;
  }
  const authHeader = res?.headers?.['authorization'] || res?.headers?.['Authorization'];
  if (typeof authHeader === 'string' && authHeader.toLowerCase().startsWith('bearer ')) {
    console.info('[AuthService] Token from Authorization header');
    return authHeader.slice(7).trim();
  }
  console.warn('[AuthService] No token found in response. Keys:', Object.keys(data || {}));
  return null;
};

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const res = await apiClient.post('/api/auth/login', credentials);
      const token = extractToken(res);
      const admin = res.data?.data?.admin;
      
      console.info('[AuthService] Login response:', {
        hasToken: !!token,
        hasAdmin: !!admin,
        adminId: admin?.id
      });
      
      if (token) {
        setToken(token);
        localStorage.setItem('token', token);
      }
      
      if (admin) {
        localStorage.setItem('user', JSON.stringify(admin));
        console.info('[AuthService] Admin guardado:', admin);
      }
      
      return {
        success: true,
        token: token || '',
        user: admin,
        data: res.data?.data
      } as AuthResponse;
    } catch (error: any) {
      console.error('[AuthService] Login error:', error);
      throw new Error(extractErrorMessage(error));
    }
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const res = await apiClient.post('/api/auth/register', data);
      const token = extractToken(res);
      const admin = res.data?.data?.admin;
      
      console.info('[AuthService] Register response:', {
        hasToken: !!token,
        hasAdmin: !!admin,
        adminId: admin?.id
      });
      
      if (token) {
        setToken(token);
        localStorage.setItem('token', token);
      }
      
      if (admin) {
        localStorage.setItem('user', JSON.stringify(admin));
        console.info('[AuthService] Admin guardado:', admin);
      }
      
      return {
        success: true,
        token: token || '',
        user: admin,
        data: res.data?.data
      } as AuthResponse;
    } catch (error: any) {
      console.error('[AuthService] Register error:', error);
      throw new Error(extractErrorMessage(error));
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {}
    finally {
      removeToken();
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  },
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', {
      email,
      password
    })
    
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token)
      // ✅ CORRECCIÓN: Cambiar "user" por "admin"
      localStorage.setItem('user', JSON.stringify(response.data.data.admin))
      console.log('✅ Token y usuario guardados en localStorage')
    }
    console.log('📦 Respuesta de login:', response.data)
    
    return response.data
  } catch (error: any) {
    console.error('Error en login:', error)
    throw error.response?.data || { success: false, message: 'Error al iniciar sesión' }
  }
}

export const register = async (
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> => {
  try {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', {
      username,
      email,
      password,
    })
    
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token)
      // ✅ CORRECCIÓN: Cambiar "user" por "admin"
      localStorage.setItem('user', JSON.stringify(response.data.data.admin))
    }
    
    return response.data
  } catch (error: any) {
    console.error('Error en registro:', error)
    throw error.response?.data || { success: false, message: 'Error al registrar usuario' }
  }
}