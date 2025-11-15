const userRepo = require('../repositories/user.repository');

async function requireUserAuth(req, res, next) {
  try {
    const sessionId = req.headers['x-session-id'];
    
    if (!sessionId) {
      return res.status(401).json({
        success: false,
        message: 'Session ID requerido'
      });
    }

    // Buscar usuario por sessionId
    const user = await userRepo.findBySessionId(sessionId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Sesión no válida'
      });
    }

    if (!user.isOnline) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desconectado'
      });
    }

    // Actualizar actividad del usuario
    await userRepo.updateActivity(user.id);

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Error en user middleware:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Error de autenticación de usuario'
    });
  }
}

module.exports = { requireUserAuth };