import { Link } from 'react-router-dom';
import './NotFound.css';

export const NotFound = () => {
  return (
    <div className="notfound-container">
      <div className="notfound-content">
        <h1 className="notfound-title">404</h1>
        <h2 className="notfound-subtitle">Página no encontrada</h2>
        <p className="notfound-text">
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Link to="/chat" className="btn-back-home">
          Volver al Chat
        </Link>
      </div>
    </div>
  );
};