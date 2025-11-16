import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuthContext();

  console.debug('[ProtectedRoute] Render', { isAuthenticated, isLoading });

  if (isLoading) {
    console.debug('[ProtectedRoute] Loading gate');
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.warn('[ProtectedRoute] Blocked: not authenticated');
    return <Navigate to="/login" replace />;
  }

  console.debug('[ProtectedRoute] Allowed');
  return <>{children}</>;
};