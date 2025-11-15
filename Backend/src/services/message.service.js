const messageRepo = require('../repositories/message.repository');
const userRepo = require('../repositories/user.repository');
const roomRepo = require('../repositories/room.repository');

class MessageService {
  /**
   * Enviar mensaje a una sala
   */
  async sendMessage({ senderId, content, roomId, type = 'text', fileData = null }) {
    try {
      // Validaciones básicas
      if (!senderId) {
        const err = new Error('ID del emisor requerido');
        err.status = 400;
        throw err;
      }

      if (!roomId) {
        const err = new Error('ID de sala requerido');
        err.status = 400;
        throw err;
      }

      // Validar que el usuario existe y está en la sala
      const user = await userRepo.findById(senderId);
      if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
      }

      if (user.currentRoomId !== roomId) {
        const err = new Error('Usuario no está en esta sala');
        err.status = 403;
        throw err;
      }

      // Validar que la sala existe y está activa
      const room = await roomRepo.findById(roomId);
      if (!room || !room.isActive) {
        const err = new Error('Sala no encontrada o inactiva');
        err.status = 404;
        throw err;
      }

      // Validar contenido según el tipo
      if (type === 'text') {
        if (!content || content.trim() === '') {
          const err = new Error('Contenido del mensaje requerido');
          err.status = 400;
          throw err;
        }
      }

      // Si es archivo, validar que la sala permita multimedia
      if (type === 'file') {
        if (room.type !== 'multimedia') {
          const err = new Error('Esta sala no permite archivos multimedia');
          err.status = 403;
          throw err;
        }

        if (!fileData) {
          const err = new Error('Datos del archivo requeridos');
          err.status = 400;
          throw err;
        }

        // Validar tamaño del archivo
        if (fileData.size > room.maxFileSize) {
          const err = new Error(`Archivo demasiado grande. Máximo: ${room.maxFileSize} bytes`);
          err.status = 413;
          throw err;
        }

        // Validar tipo de archivo
        const allowedTypes = room.allowedFileTypes ? room.allowedFileTypes.split(',') : [];
        if (allowedTypes.length > 0 && !allowedTypes.includes(fileData.mimeType)) {
          const err = new Error(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`);
          err.status = 415;
          throw err;
        }
      }

      // Crear datos del mensaje
      const messageData = {
        content: content?.trim() || null,
        type,
        senderId,
        roomId
      };

      // Agregar datos del archivo si es necesario
      if (type === 'file' && fileData) {
        messageData.fileName = fileData.fileName;
        messageData.fileOriginalName = fileData.originalName;
        messageData.filePath = fileData.path;
        messageData.fileSize = fileData.size;
        messageData.mimeType = fileData.mimeType;
        messageData.metadata = fileData.metadata || {};
      }

      // Crear mensaje
      const message = await messageRepo.create(messageData);

      // Actualizar actividad del usuario
      await userRepo.updateActivity(senderId);

      console.log('✅ Mensaje creado:', { id: message.id, type, roomId });
      
      return message;
    } catch (error) {
      console.error('❌ Error en MessageService.sendMessage:', error.message);
      throw error;
    }
  }

  /**
   * Obtener mensajes de una sala
   */
  async fetchMessages({ roomId, limit = 50, offset = 0, userId = null }) {
    try {
      if (!roomId) {
        const err = new Error('ID de sala requerido');
        err.status = 400;
        throw err;
      }

      // Validar que el usuario tiene acceso a la sala (si se proporciona userId)
      if (userId) {
        const user = await userRepo.findById(userId);
        if (!user || user.currentRoomId !== roomId) {
          const err = new Error('No tienes acceso a esta sala');
          err.status = 403;
          throw err;
        }
      }

      // Validar que la sala existe
      const room = await roomRepo.findById(roomId);
      if (!room) {
        const err = new Error('Sala no encontrada');
        err.status = 404;
        throw err;
      }

      const messages = await messageRepo.findByRoom(roomId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'ASC']]
      });

      console.log('📥 Mensajes obtenidos:', { roomId, count: messages.length });
      
      return messages;
    } catch (error) {
      console.error('❌ Error en MessageService.fetchMessages:', error.message);
      throw error;
    }
  }

  /**
   * Obtener mensajes recientes de una sala
   */
  async getRecentMessages(roomId, limit = 50, userId = null) {
    try {
      return await this.fetchMessages({ roomId, limit, userId });
    } catch (error) {
      console.error('❌ Error en MessageService.getRecentMessages:', error.message);
      throw error;
    }
  }

  /**
   * Eliminar mensaje (soft delete)
   */
  async deleteMessage(messageId, userId) {
    try {
      // Verificar que el mensaje existe
      const message = await messageRepo.findById(messageId);
      if (!message) {
        const err = new Error('Mensaje no encontrado');
        err.status = 404;
        throw err;
      }

      // Verificar que el usuario es el propietario del mensaje
      if (message.senderId !== userId) {
        const err = new Error('No tienes permiso para eliminar este mensaje');
        err.status = 403;
        throw err;
      }

      // Soft delete
      const deleted = await messageRepo.softDelete(messageId, userId);
      if (!deleted) {
        const err = new Error('No se pudo eliminar el mensaje');
        err.status = 500;
        throw err;
      }

      console.log('🗑️ Mensaje eliminado:', messageId);
      return true;
    } catch (error) {
      console.error('❌ Error en MessageService.deleteMessage:', error.message);
      throw error;
    }
  }

  /**
   * Buscar mensajes en una sala
   */
  async searchMessages({ roomId, searchTerm, limit = 20, offset = 0, userId = null }) {
    try {
      if (!roomId || !searchTerm) {
        const err = new Error('ID de sala y término de búsqueda requeridos');
        err.status = 400;
        throw err;
      }

      // Validar acceso a la sala
      if (userId) {
        const user = await userRepo.findById(userId);
        if (!user || user.currentRoomId !== roomId) {
          const err = new Error('No tienes acceso a esta sala');
          err.status = 403;
          throw err;
        }
      }

      const messages = await messageRepo.searchInRoom(roomId, searchTerm, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log('🔍 Búsqueda realizada:', { roomId, searchTerm, results: messages.length });
      
      return messages;
    } catch (error) {
      console.error('❌ Error en MessageService.searchMessages:', error.message);
      throw error;
    }
  }

  /**
   * Obtener archivos de una sala
   */
  async getRoomFiles({ roomId, limit = 20, offset = 0, userId = null }) {
    try {
      if (!roomId) {
        const err = new Error('ID de sala requerido');
        err.status = 400;
        throw err;
      }

      // Validar acceso a la sala
      if (userId) {
        const user = await userRepo.findById(userId);
        if (!user || user.currentRoomId !== roomId) {
          const err = new Error('No tienes acceso a esta sala');
          err.status = 403;
          throw err;
        }
      }

      const files = await messageRepo.findFileMessages(roomId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      console.log('📁 Archivos obtenidos:', { roomId, count: files.length });
      
      return files;
    } catch (error) {
      console.error('❌ Error en MessageService.getRoomFiles:', error.message);
      throw error;
    }
  }

  /**
   * Crear mensaje del sistema
   */
  async createSystemMessage(roomId, content, metadata = {}) {
    try {
      const messageData = {
        content,
        type: 'system',
        senderId: null, // Los mensajes del sistema no tienen emisor
        roomId,
        metadata
      };

      const message = await messageRepo.create(messageData);
      
      console.log('📢 Mensaje del sistema creado:', { id: message.id, roomId });
      
      return message;
    } catch (error) {
      console.error('❌ Error en MessageService.createSystemMessage:', error.message);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de mensajes de una sala
   */
  async getRoomMessageStats(roomId) {
    try {
      return await messageRepo.getRoomStats(roomId);
    } catch (error) {
      console.error('❌ Error en MessageService.getRoomMessageStats:', error.message);
      throw error;
    }
  }
}

module.exports = new MessageService();