import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getToken, isTokenExpired, removeToken } from '../utils/jwt';

const isAuthPath = (url?: string) =>
  !!url && (url.includes('/auth/login') || url.includes('/auth/register'));

export const requestInterceptor = (config: InternalAxiosRequestConfig) => {
  const url = (config.url || '').toString();

  // No adjuntar token ni bloquear si es endpoint de auth
  if (isAuthPath(url)) return config;

  const token = getToken();
  if (token) {
    if (isTokenExpired(token)) {
      removeToken();
      return config; // no redirigir aquí
    }
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
};

export const requestErrorInterceptor = (error: AxiosError) => Promise.reject(error);

export const responseInterceptor = (response: AxiosResponse) => response;

export const responseErrorInterceptor = (error: AxiosError) => {
  const status = error.response?.status;
  const url = (error.config?.url || '').toString();

  // Normalizar mensaje
  const data: any = error.response?.data;
  let message = error.message;
  if (data) {
    if (typeof data === 'string') message = data;
    else if (data.message) message = data.message;
    else if (Array.isArray(data.errors) && data.errors.length) {
      const first = data.errors[0];
      message = typeof first === 'string' ? first : (first?.msg || message);
    }
  }
  error.message = message || 'Error en la solicitud';

  // No redirigir si es endpoint de auth
  if (!isAuthPath(url) && status === 401) {
    removeToken();
    window.history.replaceState(null, '', '/login');
  }

  return Promise.reject(error);
};