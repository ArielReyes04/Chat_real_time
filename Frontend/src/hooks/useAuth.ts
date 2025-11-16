import { useEffect } from 'react';
import { useAuthStore } from '../store';
import { authService } from '../services/auth.service';
import { LoginCredentials, RegisterData } from '../types';
import { decodeToken, getToken } from '../utils/jwt';

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, setUser, setToken, setLoading, logout } = useAuthStore();

  const setUserFromToken = (tk?: string | null) => {
    const t = tk ?? getToken();
    if (!t) {
      console.warn('[Auth] No token found to decode');
      return;
    }
    const payload: any = decodeToken(t);
    if (!payload) {
      console.warn('[Auth] Token could not be decoded');
      return;
    }
    const u = {
      id: payload.id || payload.sub || 0,
      username:
        payload.username ||
        payload.name ||
        (payload.email ? String(payload.email).split('@')[0] : 'usuario'),
      email: payload.email || '',
      first_name: payload.first_name || '',
      last_name: payload.last_name || '',
      avatar_url: payload.avatar_url || '',
    } as any;
    console.info('[Auth] User built from token payload:', { payload, user: u });
    setUser(u);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token && !user) {
        console.info('[Auth] Init: token present, user missing. Decoding token...', { token });
        try {
          setLoading(true);
          setUserFromToken(token);
          console.info('[Auth] Init: user should be set from token');
        } catch (e) {
          console.error('[Auth] Init error:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    initAuth();
  }, [token, user, setUser, setLoading, logout]);

  const login = async (credentials: LoginCredentials) => {
    try {
      setLoading(true);
      console.info('[Auth] Login request for:', credentials.email);
      const response = await authService.login(credentials);
      console.info('[Auth] Login response:', response);
      setToken(response.token || null);

      if (response.user) {
        console.info('[Auth] Setting user from response:', response.user);
        setUser(response.user);
      } else {
        console.info('[Auth] No user in response. Decoding token to build user.');
        setUserFromToken(response.token);
      }
      return response;
    } catch (error: any) {
      console.error('[Auth] Login error:', error?.message, error);
      throw new Error(error?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      console.info('[Auth] Register request for:', data.email);
      const response = await authService.register(data);
      console.info('[Auth] Register response:', response);
      setToken(response.token || null);

      if (response.user) {
        console.info('[Auth] Setting user from response (register):', response.user);
        setUser(response.user);
      } else {
        console.info('[Auth] No user in register response. Decoding token to build user.');
        setUserFromToken(response.token);
      }
      return response;
    } catch (error: any) {
      console.error('[Auth] Register error:', error?.message, error);
      throw new Error(error?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.info('[Auth] Logout triggered');
    try {
      await authService.logout();
      logout();
    } catch {
      logout();
    }
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: handleLogout,
  };
};