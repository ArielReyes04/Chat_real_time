const authService = require('../services/auth.service');
const { validationResult } = require('express-validator');

class AuthController {
  async register(req, res) {
    try {
      console.log('📝 Intento de registro:', { 
        username: req.body.username, 
        email: req.body.email 
      });

      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Errores de validación:', errors.array());
        return res.status(400).json({ 
          success: false,
          errors: errors.array() 
        });
      }

      const { username, email, password} = req.body;

      // Validaciones básicas
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email y password son requeridos'
        });
      }

      // Registrar usuario
      const result = await authService.register({
        username,
        email,
        password
      });

      console.log('✅ Usuario registrado exitosamente:', result.user.username);

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      console.error('❌ Error en registro:', error);

      // Errores específicos
      if (error.message.includes('ya existe') || error.message.includes('unique')) {
        return res.status(409).json({
          success: false,
          message: 'El username o email ya está registrado'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async login(req, res) {
    try {
      console.log('🔐 Intento de login:', { email: req.body.email });

      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y password son requeridos'
        });
      }

      const result = await authService.login(email, password);

      console.log('✅ Login exitoso:', result.user.username);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      console.error('❌ Error en login:', error);

      if (error.message === 'Usuario no encontrado' || error.message === 'Contraseña incorrecta') {
        return res.status(401).json({
          success: false,
          message: 'Credenciales incorrectas'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async getProfile(req, res) {
    try {
      const userId = req.userId; // Viene del middleware de autenticación

      const user = await authService.getUserById(userId);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error);

      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  async logout(req, res) {
    try {
      const userId = req.userId;
      
      await authService.logout(userId);

      res.json({
        success: true,
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('❌ Error en logout:', error);

      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
  }
}

module.exports = new AuthController();