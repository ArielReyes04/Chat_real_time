import { TOKEN_KEY } from './constants';

export const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
  try {
    const preview = token.slice(0, 12) + '...' + token.slice(-6);
    console.info('[Auth] Token recibido y almacenado:', { preview, length: token.length });
  } catch {
    console.info('[Auth] Token recibido y almacenado.');
  }
};

export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

export const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;
    
    // exp está en segundos, Date.now() está en milisegundos
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    
    return currentTime >= expirationTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const getTokenPayload = (token: string): any => {
  return decodeToken(token);
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const decoded = decodeToken(token);
    if (!decoded) return false;
    
    return !isTokenExpired(token);
  } catch (error) {
    return false;
  }
};