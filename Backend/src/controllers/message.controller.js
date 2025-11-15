const messageService = require('../services/message.service');
const { validationResult } = require('express-validator');

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
}

module.exports = new MessageController();