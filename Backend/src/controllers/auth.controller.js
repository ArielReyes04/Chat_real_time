const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');

class AuthController {
  /**
   * Registro de administrador
   */
  async register(req, res) {
    try {
      console.log('📝 Intento de registro de administrador:', { 
        username: req.body.username, 
        email: req.body.email 
      });

      // Validar datos de entrada con express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Errores de validación:', errors.array());
        return res.status(400).json({ 
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errors.array().map(err => ({
            field: err.path,
            message: err.msg,
            value: err.value
          }))
        });
      }

      const { username, email, password } = req.body;

      // Validaciones básicas adicionales
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email y password son requeridos'
        });
      }

      // Registrar administrador
      const result = await authService.register({
        username: username.trim(),
        email: email.trim().toLowerCase(),
        password
      });

      console.log('✅ Administrador registrado exitosamente:', result.admin.username);

      res.status(201).json({
        success: true,
        message: 'Administrador registrado exitosamente',
        data: {
          admin: result.admin,
          token: result.token
        }
      });
    } catch (error) {
      console.error('❌ Error en registro de administrador:', error.message);

      // Manejo de errores específicos
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      // Error de BD - duplicado
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        return res.status(409).json({
          success: false,
          message: 'El username o email ya está registrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al registrar administrador',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Login de administrador
   */
  async login(req, res) {
    try {
      console.log('🔐 Intento de login de administrador:', { email: req.body.email });

      const { email, password } = req.body;

      // Validaciones básicas
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y password son requeridos'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      const result = await authService.login(email.trim().toLowerCase(), password);

      console.log('✅ Login exitoso de administrador:', result.admin.username);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          admin: result.admin,
          token: result.token
        }
      });
    } catch (error) {
      console.error('❌ Error en login de administrador:', error.message);

      // Manejo de errores específicos
      if (error.status === 404) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: 'Cuenta de administrador desactivada'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al iniciar sesión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener perfil del administrador
   */
  async getProfile(req, res) {
    try {
      const adminId = req.admin?.id || req.adminId; // Viene del middleware de autenticación

      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Token de administrador requerido'
        });
      }

      const admin = await authService.getAdminById(adminId);

      res.json({
        success: true,
        message: 'Perfil obtenido exitosamente',
        data: { admin }
      });
    } catch (error) {
      console.error('❌ Error al obtener perfil de administrador:', error.message);

      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado'
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: 'Cuenta de administrador desactivada'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cambiar contraseña del administrador
   */
  async changePassword(req, res) {
    try {
      const adminId = req.admin?.id || req.adminId;
      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validaciones
      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña actual, nueva contraseña y confirmación son requeridas'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña y su confirmación no coinciden'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }

      await authService.changePassword(adminId, currentPassword, newPassword);

      console.log('✅ Contraseña cambiada para administrador:', adminId);

      res.json({
        success: true,
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error.message);

      if (error.status === 401) {
        return res.status(401).json({
          success: false,
          message: 'Contraseña actual incorrecta'
        });
      }

      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Logout de administrador
   */
  async logout(req, res) {
    try {
      const adminId = req.admin?.id || req.adminId;
      
      if (adminId) {
        await authService.logout(adminId);
        console.log('✅ Logout exitoso de administrador:', adminId);
      }

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('❌ Error en logout de administrador:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Refrescar token
   */
  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token requerido'
        });
      }

      const newToken = await authService.refreshToken(token);

      res.json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: { token: newToken }
      });
    } catch (error) {
      console.error('❌ Error al refrescar token:', error.message);

      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  }

  /**
   * Verificar token (endpoint para validar si el token es válido)
   */
  async verifyToken(req, res) {
    try {
      const adminId = req.admin?.id || req.adminId;
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }

      const admin = await authService.getAdminById(adminId);

      res.json({
        success: true,
        message: 'Token válido',
        data: { admin }
      });
    } catch (error) {
      console.error('❌ Error al verificar token:', error.message);

      res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
  }

async activateAdmin(req, res) {
  try {
    const { adminId } = req.params;
    
    if (!adminId || isNaN(parseInt(adminId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de administrador inválido'
      });
    }

    await authService.activateAdmin(parseInt(adminId));

    res.json({
      success: true,
      message: 'Administrador activado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al activar administrador:', error.message);

    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al activar administrador'
    });
  }
}

/**
 * Desactivar administrador (solo para super admin)
 */
async deactivateAdmin(req, res) {
  try {
    const { adminId } = req.params;
    
    if (!adminId || isNaN(parseInt(adminId))) {
      return res.status(400).json({
        success: false,
        message: 'ID de administrador inválido'
      });
    }

    await authService.deactivateAdmin(parseInt(adminId));

    res.json({
      success: true,
      message: 'Administrador desactivado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error al desactivar administrador:', error.message);

    const statusCode = error.status || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Error al desactivar administrador'
    });
  }
}

/**
 * Listar administradores activos
 */
async getActiveAdmins(req, res) {
  try {
    const admins = await authService.getActiveAdmins();

    res.json({
      success: true,
      data: admins,
      count: admins.length
    });
  } catch (error) {
    console.error('❌ Error al obtener administradores activos:', error.message);

    res.status(500).json({
      success: false,
      message: 'Error al obtener administradores'
    });
  }
}

}

module.exports = new AuthController();