const jwt = require('jsonwebtoken');
const adminRepo = require('../repositories/admin.repository');

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization;
    console.log('🔐 Authorization header:', header);
    
    if (!header || !header.startsWith('Bearer ')) {
      console.log('❌ No Bearer token found');
      return res.status(401).json({ 
        success: false, 
        message: 'Token de autenticación requerido' 
      });
    }
    
    const token = header.split(' ')[1];
    console.log('🔑 Token extraído:', token.substring(0, 20) + '...');
    
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const payload = jwt.verify(token, secret);
    console.log('✅ Token verificado, payload:', payload);
    
    // Verificar que es un token de administrador
    if (!payload || payload.type !== 'admin' || !payload.adminId) {
      console.log('❌ Payload inválido o sin adminId:', payload);
      return res.status(401).json({ 
        success: false, 
        message: 'Token de administrador inválido' 
      });
    }
    
    // Buscar administrador en la base de datos
    const admin = await adminRepo.findById(payload.adminId);
    console.log('👤 Administrador encontrado:', admin ? admin.username : 'NO');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Administrador no encontrado' 
      });
    }

    // if (!admin.isActive) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     message: 'Cuenta de administrador desactivada' 
    //   });
    // }
    
    // Agregar admin al request
    req.admin = admin;
    req.adminId = admin.id;
    
    next();
  } catch (err) {
    console.error('❌ Error en auth middleware:', err.message);
    
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado',
        expired: true
      });
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido'
      });
    }
    
    return res.status(401).json({ 
      success: false, 
      message: 'Error de autenticación',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

module.exports = { requireAuth };