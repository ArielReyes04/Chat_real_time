const userService = require('../services/user.service');
const { validationResult } = require('express-validator');

class UserController {
  /**
   * POST /api/users/join - Unirse a una sala con PIN
   */
  async joinRoom(req, res) {
    try {
      // Validar datos de entrada
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
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

      const { pin, nickname } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';
      const userAgent = req.get('User-Agent') || 'Unknown';

      // Validaciones básicas adicionales
      if (!pin || !nickname) {
        return res.status(400).json({
          success: false,
          message: 'PIN y nickname son requeridos'
        });
      }

      const result = await userService.joinRoom({
        pin: pin.toString().trim(),
        nickname: nickname.trim(),
        ipAddress,
        userAgent
      });

      console.log('✅ Usuario unido a sala:', { 
        userId: result.user.id, 
        nickname: result.user.nickname,
        roomName: result.room.name 
      });

      res.status(201).json({
        success: true,
        message: 'Te uniste a la sala exitosamente',
        data: {
          user: result.user,
          room: result.room,
          sessionId: result.user.sessionId // Para usar en headers posteriores
        }
      });
    } catch (error) {
      console.error('❌ Error al unirse a sala:', error.message);

      // Manejo de errores específicos
      const statusCode = error.status || 500;
      const errorMessages = {
        404: 'Sala no encontrada con ese PIN',
        409: 'Nickname ya en uso o ya tienes una conexión activa',
        410: 'La sala ha expirado',
        429: 'La sala está llena'
      };

      res.status(statusCode).json({
        success: false,
        message: errorMessages[statusCode] || error.message || 'Error al unirse a la sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * POST /api/users/leave - Salir de la sala actual
   */
  async leaveRoom(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      const result = await userService.leaveRoom(userId);

      console.log('✅ Usuario salió de sala:', { userId, roomId: result.roomId });

      res.json({
        success: true,
        message: 'Saliste de la sala exitosamente',
        data: result
      });
    } catch (error) {
      console.error('❌ Error al salir de sala:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al salir de la sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/users/profile - Obtener perfil del usuario actual
   */
  async getProfile(req, res) {
    try {
      const sessionId = req.user?.sessionId || req.headers['x-session-id'];

      if (!sessionId) {
        return res.status(401).json({
          success: false,
          message: 'Session ID requerido'
        });
      }

      const user = await userService.getUserBySessionId(sessionId);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('❌ Error al obtener perfil:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener perfil de usuario',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * PUT /api/users/activity - Actualizar actividad del usuario (heartbeat)
   */
  async updateActivity(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      await userService.updateActivity(userId);

      res.json({
        success: true,
        message: 'Actividad actualizada',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error al actualizar actividad:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error al actualizar actividad',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/users/room/:roomId/participants - Obtener participantes de una sala
   */
  async getRoomParticipants(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.id;

      // Validar que el usuario tiene acceso a esta sala
      if (userId) {
        const hasAccess = await userService.hasRoomAccess(userId, roomId);
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'No tienes acceso a esta sala'
          });
        }
      }

      const participants = await userService.getRoomParticipants(roomId);

      res.json({
        success: true,
        data: participants,
        meta: {
          roomId,
          count: participants.length,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener participantes:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener participantes',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/users/session/validate - Validar sesión actual
   */
  async validateSession(req, res) {
    try {
      const sessionId = req.headers['x-session-id'];

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          message: 'Session ID requerido en header x-session-id'
        });
      }

      const user = await userService.getUserBySessionId(sessionId);

      // Actualizar actividad
      await userService.updateActivity(user.id);

      res.json({
        success: true,
        message: 'Sesión válida',
        data: { user },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Error al validar sesión:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Sesión inválida',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * POST /api/users/disconnect - Desconectar usuario (logout)
   */
  async disconnect(req, res) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado'
        });
      }

      // Salir de la sala y desconectar
      await userService.leaveRoom(userId);

      console.log('✅ Usuario desconectado:', userId);

      res.json({
        success: true,
        message: 'Desconectado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error al desconectar:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error al desconectar',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/users/rooms/available - Verificar si un PIN es válido (sin unirse)
   */
  async checkPin(req, res) {
    try {
      const { pin } = req.query;

      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN requerido'
        });
      }

      // Nota: Necesitarías agregar este método en roomService o userService
      // Por ahora retornamos estructura básica
      
      res.json({
        success: true,
        message: 'PIN válido',
        data: {
          pinExists: true,
          roomName: 'Sala encontrada' // Placeholder
        }
      });
    } catch (error) {
      console.error('❌ Error al verificar PIN:', error.message);

      res.status(404).json({
        success: false,
        message: 'PIN no válido o sala no encontrada'
      });
    }
  }
}

module.exports = new UserController();