const messageService = require('../services/message.service');
const { validationResult } = require('express-validator');
const roomRepository = require('../repositories/room.repository');
const messageRepository = require('../repositories/message.repository');

// Helper para obtener adminId desde el token
const getAdminIdFromReq = (req) => req?.admin?.id || req?.user?.id || req?.auth?.id;

class MessageController {
  /**
   * Obtener mensajes de una sala
   */
  async getMessages(req, res) {
    try {
      const { roomId, limit = 50, offset = 0 } = req.query;
      const userId = req.user?.id; // Usuario anónimo desde middleware

      // Validaciones
      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      const messages = await messageService.fetchMessages({
        roomId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        userId
      });

      res.json({
        success: true,
        data: messages,
        meta: {
          roomId,
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: messages.length
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener mensajes:', error.message);

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener mensajes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Enviar mensaje a una sala
   */
  async postMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos inválidos',
          errors: errors.array()
        });
      }

      const { content, roomId, type = 'text' } = req.body;
      const senderId = req.user?.id; // Usuario anónimo desde middleware
      const fileData = req.file ? {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimeType: req.file.mimetype
      } : null;

      const message = await messageService.sendMessage({
        senderId,
        content,
        roomId,
        type,
        fileData
      });

      res.status(201).json({
        success: true,
        message: 'Mensaje enviado exitosamente',
        data: message
      });
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error.message);

      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al enviar mensaje',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Eliminar mensaje (soft delete)
   */
  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'ID de mensaje requerido'
        });
      }

      await messageService.deleteMessage(parseInt(id), userId);

      res.json({
        success: true,
        message: 'Mensaje eliminado exitosamente'
      });
    } catch (error) {
      console.error('❌ Error al eliminar mensaje:', error.message);

      if (error.status === 404) {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al eliminar mensaje',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Buscar mensajes en una sala
   */
  async searchMessages(req, res) {
    try {
      const { roomId, q: searchTerm, limit = 20, offset = 0 } = req.query;
      const userId = req.user?.id;

      if (!roomId || !searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala y término de búsqueda requeridos'
        });
      }

      const messages = await messageService.searchMessages({
        roomId,
        searchTerm,
        limit: parseInt(limit),
        offset: parseInt(offset),
        userId
      });

      res.json({
        success: true,
        data: messages,
        meta: {
          roomId,
          searchTerm,
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: messages.length
        }
      });
    } catch (error) {
      console.error('❌ Error al buscar mensajes:', error.message);

      if (error.status === 400) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al buscar mensajes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener archivos de una sala
   */
  async getRoomFiles(req, res) {
    try {
      const { roomId, limit = 20, offset = 0 } = req.query;
      const userId = req.user?.id;

      if (!roomId) {
        return res.status(400).json({
          success: false,
          message: 'ID de sala requerido'
        });
      }

      const files = await messageService.getRoomFiles({
        roomId,
        limit: parseInt(limit),
        offset: parseInt(offset),
        userId
      });

      res.json({
        success: true,
        data: files,
        meta: {
          roomId,
          limit: parseInt(limit),
          offset: parseInt(offset),
          count: files.length
        }
      });
    } catch (error) {
      console.error('❌ Error al obtener archivos:', error.message);

      if (error.status === 403) {
        return res.status(403).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al obtener archivos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtener salas del administrador
   */
  async getRoomsForAdmin(req, res) {
    try {
      const adminId = req.admin?.id;
      
      if (!adminId) {
        return res.status(401).json({ 
          success: false, 
          message: 'No autorizado' 
        });
      }

      const roomRepository = require('../repositories/room.repository');
      const rooms = await roomRepository.findByAdmin(adminId);

      // Agregar conteo de participantes a cada sala
      const roomsWithParticipants = await Promise.all(
        rooms.map(async (room) => {
          const participantCount = await roomRepository.getParticipantCount(room.id);
          return {
            id: room.id,
            name: room.name,
            description: room.description,
            pin: room.pin,
            type: room.type,
            maxParticipants: room.maxParticipants,
            currentParticipants: participantCount,
            isActive: room.isActive,
            createdAt: room.createdAt,
            expiresAt: room.expiresAt
          };
        })
      );

      return res.json({ 
        success: true, 
        data: roomsWithParticipants 
      });
    } catch (error) {
      console.error('❌ Error al obtener salas:', error.message);
      return res.status(500).json({ 
        success: false, 
        message: 'Error al obtener salas',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Crear sala
   */
  async createRoom(req, res) {
    try {
      const { name, room_type } = req.body;
      const admin_id = req.admin.id; // del token JWT

      if (!name || !room_type) {
        return res.status(400).json({
          success: false,
          message: 'name y room_type son requeridos'
        });
      }

      const newRoom = await messageService.createRoom({
        name,
        room_type,
        admin_id
      });

      res.status(201).json({
        success: true,
        data: newRoom
      });
    } catch (error) {
      console.error('Error creando room:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Error al crear la sala'
      });
    }
  }

  /**
   * Obtener mensajes por sala (admin)
   */
  async getMessagesForAdmin(req, res) {
    try {
      const adminId = getAdminIdFromReq(req);
      if (!adminId) return res.status(401).json({ success: false, message: 'No autorizado' });

      const roomId = parseInt(req.params.roomId, 10);
      const messages = await messageRepository.getMessagesByRoomId(roomId);
      return res.json({ success: true, data: messages });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error obteniendo mensajes' });
    }
  }

  /**
   * Enviar mensaje (admin)
   */
  async sendMessageForAdmin(req, res) {
    try {
      const adminId = getAdminIdFromReq(req);
      if (!adminId) return res.status(401).json({ success: false, message: 'No autorizado' });

      const { room_id, content } = req.body;
      const message = await messageRepository.createMessage({
        room_id,
        admin_id: adminId,
        content,
        message_type: 'text'
      });
      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Error enviando mensaje' });
    }
  }

  /**
   * Enviar mensaje
   */
  async sendMessage(req, res) {
    try {
      const { roomId, content } = req.body;
      const senderId = req.user.id; // Asegúrate que req.user existe

      // Agrega logs para debugging
      console.log('📨 Enviando mensaje:', { senderId, roomId, content });

      if (!content || !roomId) {
        return res.status(400).json({ 
          error: 'Content and roomId are required' 
        });
      }

      const message = await messageService.createMessage({
        senderId,
        roomId,
        content
      });

      console.log('✅ Mensaje creado:', message);

      res.status(201).json(message);
    } catch (error) {
      console.error('❌ Error en sendMessage:', error);
      res.status(500).json({ 
        error: 'Failed to send message',
        details: error.message 
      });
    }
  }
}

module.exports = new MessageController();