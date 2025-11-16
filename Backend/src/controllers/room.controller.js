const roomService = require('../services/room.service');
const { validationResult } = require('express-validator');

class RoomController {
  /**
   * POST /api/rooms - Crear nueva sala de chat
   */
  async createRoom(req, res) {
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

      const adminId = req.admin?.id || req.adminId;
      const roomData = req.body;

      console.log('🔄 Creando sala para admin:', adminId, '- Nombre:', roomData.name);

      const room = await roomService.createRoom(adminId, roomData);

      res.status(201).json({
        success: true,
        message: 'Sala creada exitosamente',
        data: room
      });
    } catch (error) {
      console.error('❌ Error al crear sala:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al crear sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/rooms - Obtener salas del administrador
   */
  async getRooms(req, res) {
    try {
      const adminId = req.admin?.id || req.adminId;
      const { 
        includeInactive = false, 
        limit = 20, 
        offset = 0 
      } = req.query;

      const options = {
        includeInactive: includeInactive === 'true',
        limit: parseInt(limit),
        offset: parseInt(offset)
      };

      const rooms = await roomService.getRoomsByAdmin(adminId, options);

      res.json({
        success: true,
        data: rooms,
        meta: {
          count: rooms.length,
          limit: parseInt(limit),
          offset: parseInt(offset),
          adminId
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener salas:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener salas',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/rooms/:id - Obtener sala por ID
   */
  async getRoomById(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || req.adminId;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      const room = await roomService.getRoomById(id, adminId);

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      console.error('❌ Error al obtener sala por ID:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al obtener sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/rooms/pin/:pin - Obtener sala por PIN (para usuarios)
   */
  async getRoomByPin(req, res) {
    try {
      const { pin } = req.params;

      if (!pin) {
        return res.status(400).json({
          success: false,
          message: 'PIN requerido'
        });
      }

      // Validar formato de PIN
      if (!/^\d{6}$/.test(pin)) {
        return res.status(400).json({
          success: false,
          message: 'PIN debe ser un número de 6 dígitos'
        });
      }

      const room = await roomService.getRoomByPin(pin);

      res.json({
        success: true,
        message: 'Sala encontrada',
        data: room
      });
    } catch (error) {
      console.error('❌ Error al obtener sala por PIN:', error.message);

      const statusCode = error.status || 500;
      const errorMessages = {
        404: 'Sala no encontrada con ese PIN',
        410: 'La sala ha expirado o está desactivada',
        429: 'La sala está llena'
      };

      res.status(statusCode).json({
        success: false,
        message: errorMessages[statusCode] || error.message || 'Error al buscar sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * PUT /api/rooms/:id - Actualizar sala
   */
  async updateRoom(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de actualización inválidos',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const adminId = req.admin?.id || req.adminId;
      const updateData = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      const room = await roomService.updateRoom(id, adminId, updateData);

      res.json({
        success: true,
        message: 'Sala actualizada exitosamente',
        data: room
      });
    } catch (error) {
      console.error('❌ Error al actualizar sala:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al actualizar sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * POST /api/rooms/:id/deactivate - Desactivar sala
   */
  async desactivateRoom(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || req.adminId;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      const result = await roomService.deactivateRoom(id, adminId);

      res.json({
        success: true,
        message: 'Sala desactivada exitosamente',
        data: result
      });
    } catch (error) {
      console.error('❌ Error al desactivar sala:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al desactivar sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * DELETE /api/rooms/:id - Eliminar sala permanentemente
   */
  async deleteRoom(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || req.adminId;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      const result = await roomService.deleteRoom(id, adminId);

      res.json({
        success: true,
        message: 'Sala eliminada permanentemente',
        data: result
      });
    } catch (error) {
      console.error('❌ Error al eliminar sala:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al eliminar sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * POST /api/rooms/:id/activate - Reactivar sala desactivada
   */
  async activateRoom(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || req.adminId;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      // Obtener sala y verificar permisos
      const room = await roomService.getRoomById(id, adminId);
      
      if (room.isActive) {
        return res.status(400).json({
          success: false,
          message: 'La sala ya está activa'
        });
      }

      // Reactivar usando el repositorio directamente
      const roomRepository = require('../repositories/room.repository');
      await roomRepository.activate(id);

      res.json({
        success: true,
        message: 'Sala reactivada exitosamente',
        data: {
          id,
          activatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error al reactivar sala:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al reactivar sala',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/rooms/:id/participants - Obtener participantes de una sala
   */
  async getRoomParticipants(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.admin?.id || req.adminId;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      // Verificar que el admin tiene acceso a esta sala
      const room = await roomService.getRoomById(id, adminId);
      
      res.json({
        success: true,
        data: {
          roomId: id,
          roomName: room.name,
          participants: room.participants || [],
          stats: room.stats
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
   * GET /api/rooms/stats - Obtener estadísticas generales
   */
  async getStats(req, res) {
    try {
      const adminId = req.admin?.id || req.adminId;

      const stats = await roomService.getGeneralStats(adminId);

      res.json({
        success: true,
        data: stats,
        meta: {
          adminId,
          generatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * POST /api/rooms/cleanup - Limpiar salas expiradas (tarea de mantenimiento)
   */
  async cleanupExpiredRooms(req, res) {
    try {
      const result = await roomService.cleanupExpiredRooms();

      res.json({
        success: true,
        message: 'Limpieza de salas expiradas completada',
        data: result
      });
    } catch (error) {
      console.error('❌ Error en limpieza de salas:', error.message);

      res.status(500).json({
        success: false,
        message: 'Error al limpiar salas expiradas',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * GET /api/rooms/:id/file-permissions - Verificar permisos de archivo
   */
  async checkFilePermissions(req, res) {
    try {
      const { id } = req.params;
      const { fileSize, mimeType } = req.query;

      if (!id || !fileSize || !mimeType) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala, tamaño de archivo y tipo MIME son requeridos'
        });
      }

      const permissions = await roomService.checkFilePermissions(
        id, 
        parseInt(fileSize), 
        mimeType
      );

      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      console.error('❌ Error al verificar permisos de archivo:', error.message);

      const statusCode = error.status || 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Error al verificar permisos de archivo',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
}

module.exports = new RoomController();