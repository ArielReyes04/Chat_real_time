const roomRepository = require('../repositories/room.repository');
const userRepository = require('../repositories/user.repository');
const adminRepository = require('../repositories/admin.repository');
const { v4: uuidv4 } = require('uuid');

class RoomService {
  /**
   * Crear nueva sala de chat
   */
  async createRoom(adminId, roomData) {
    try {
      console.log('🔄 Creando sala:', { adminId, roomName: roomData.name });

      // Validar que el admin existe y está activo
      const admin = await adminRepository.findById(adminId);
      if (!admin) {
        const err = new Error('Administrador no encontrado');
        err.status = 404;
        throw err;
      }

      if (!admin.isActive) {
        const err = new Error('Cuenta de administrador desactivada');
        err.status = 403;
        throw err;
      }

      // Generar PIN único
      let pin;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        pin = this.generatePin();
        attempts++;
        
        if (attempts > maxAttempts) {
          const err = new Error('No se pudo generar un PIN único');
          err.status = 500;
          throw err;
        }
      } while (await roomRepository.checkPinExists(pin));

      // Preparar datos de la sala
      const newRoomData = {
        id: uuidv4(),
        name: roomData.name?.trim(),
        description: roomData.description?.trim() || null,
        pin,
        type: roomData.type || 'text',
        maxParticipants: parseInt(roomData.maxParticipants) || 50,
        maxFileSize: parseInt(roomData.maxFileSize) || 10485760, // 10MB
        allowedFileTypes: roomData.allowedFileTypes || 'image/jpeg,image/png,image/gif,application/pdf,text/plain',
        isActive: true,
        createdBy: adminId,
        expiresAt: roomData.expiresAt ? new Date(roomData.expiresAt) : null
      };

      // Validaciones
      if (!newRoomData.name || newRoomData.name.length < 3) {
        const err = new Error('Nombre de sala debe tener al menos 3 caracteres');
        err.status = 400;
        throw err;
      }

      if (newRoomData.maxParticipants < 1 || newRoomData.maxParticipants > 1000) {
        const err = new Error('Máximo de participantes debe estar entre 1 y 1000');
        err.status = 400;
        throw err;
      }

      // Crear la sala
      const room = await roomRepository.create(newRoomData);

      console.log('✅ Sala creada exitosamente:', { 
        id: room.id, 
        name: room.name, 
        pin: room.pin 
      });

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        pin: room.pin,
        type: room.type,
        maxParticipants: room.maxParticipants,
        maxFileSize: room.maxFileSize,
        allowedFileTypes: room.allowedFileTypes,
        isActive: room.isActive,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        createdBy: adminId
      };
    } catch (error) {
      console.error('❌ Error en RoomService.createRoom:', error.message);
      throw error;
    }
  }

  /**
   * Obtener sala por ID
   */
  async getRoomById(roomId, adminId = null) {
    try {
      const room = await roomRepository.findById(roomId);
      
      if (!room) {
        const err = new Error('Sala no encontrada');
        err.status = 404;
        throw err;
      }

      // Si se proporciona adminId, verificar que sea el creador
      if (adminId && room.createdBy !== adminId) {
        const err = new Error('No tienes permisos para acceder a esta sala');
        err.status = 403;
        throw err;
      }

      // if (!room.isActive) {
      //   const err = new Error('La sala está desactivada');
      //   err.status = 410;
      //   throw err;
      // }

      // Verificar si ha expirado
      if (room.expiresAt && new Date() > room.expiresAt) {
        const err = new Error('La sala ha expirado');
        err.status = 410;
        throw err;
      }

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        pin: room.pin,
        type: room.type,
        maxParticipants: room.maxParticipants,
        maxFileSize: room.maxFileSize,
        allowedFileTypes: room.allowedFileTypes?.split(',') || [],
        isActive: room.isActive,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        creator: room.creator ? {
          id: room.creator.id,
          username: room.creator.username,
          email: room.creator.email
        } : null,
        participants: room.participants?.map(user => ({
          id: user.id,
          nickname: user.nickname,
          isOnline: user.isOnline,
          joinedAt: user.joinedAt
        })) || [],
        stats: await roomRepository.getRoomStats(roomId)
      };
    } catch (error) {
      console.error('❌ Error en RoomService.getRoomById:', error.message);
      throw error;
    }
  }

  /**
   * Obtener sala por PIN
   */
  async getRoomByPin(pin) {
    try {
      const room = await roomRepository.findByPin(pin);
      
      if (!room) {
        const err = new Error('Sala no encontrada con ese PIN');
        err.status = 404;
        throw err;
      }

      if (!room.isActive) {
        const err = new Error('La sala está desactivada');
        err.status = 410;
        throw err;
      }

      // Verificar si ha expirado
      if (room.expiresAt && new Date() > room.expiresAt) {
        // Desactivar sala expirada automáticamente
        await roomRepository.deactivate(room.id);
        const err = new Error('La sala ha expirado');
        err.status = 410;
        throw err;
      }

      // Obtener estadísticas
      const stats = await roomRepository.getRoomStats(room.id);

      // Verificar si está llena
      if (stats.onlineCount >= room.maxParticipants) {
        const err = new Error('La sala está llena');
        err.status = 429;
        throw err;
      }

      return {
        id: room.id,
        name: room.name,
        description: room.description,
        pin: room.pin,
        type: room.type,
        maxParticipants: room.maxParticipants,
        maxFileSize: room.maxFileSize,
        allowedFileTypes: room.allowedFileTypes?.split(',') || [],
        isActive: room.isActive,
        expiresAt: room.expiresAt,
        createdAt: room.createdAt,
        creator: room.creator ? {
          id: room.creator.id,
          username: room.creator.username
        } : null,
        stats
      };
    } catch (error) {
      console.error('❌ Error en RoomService.getRoomByPin:', error.message);
      throw error;
    }
  }

  /**
   * Obtener salas creadas por un administrador
   */
  async getRoomsByAdmin(adminId, options = {}) {
    try {
      const rooms = await roomRepository.findByCreator(adminId, options);
      
      // Enriquecer con estadísticas
      const enrichedRooms = await Promise.all(
        rooms.map(async (room) => {
          const stats = await roomRepository.getRoomStats(room.id);
          
          return {
            id: room.id,
            name: room.name,
            description: room.description,
            pin: room.pin,
            type: room.type,
            maxParticipants: room.maxParticipants,
            isActive: room.isActive,
            expiresAt: room.expiresAt,
            createdAt: room.createdAt,
            participants: room.participants?.map(user => ({
              id: user.id,
              nickname: user.nickname,
              isOnline: user.isOnline
            })) || [],
            stats
          };
        })
      );

      return enrichedRooms;
    } catch (error) {
      console.error('❌ Error en RoomService.getRoomsByAdmin:', error.message);
      throw error;
    }
  }

  /**
   * Actualizar sala
   */
  async updateRoom(roomId, adminId, updateData) {
    try {
      const room = await roomRepository.findById(roomId);
      
      if (!room) {
        const err = new Error('Sala no encontrada');
        err.status = 404;
        throw err;
      }

      if (room.createdBy !== adminId) {
        const err = new Error('No tienes permisos para modificar esta sala');
        err.status = 403;
        throw err;
      }

      // Validar datos de actualización
      const allowedUpdates = [
        'name', 'description', 'type', 'maxParticipants', 
        'maxFileSize', 'allowedFileTypes', 'expiresAt'
      ];
      
      const updates = {};
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key) && updateData[key] !== undefined) {
          updates[key] = updateData[key];
        }
      });

      // Validaciones específicas
      if (updates.name && updates.name.trim().length < 3) {
        const err = new Error('Nombre de sala debe tener al menos 3 caracteres');
        err.status = 400;
        throw err;
      }

      if (updates.maxParticipants && (updates.maxParticipants < 1 || updates.maxParticipants > 50)) {
        const err = new Error('Máximo de participantes debe estar entre 1 y 50');
        err.status = 400;
        throw err;
      }

      // Si se reduce el máximo de participantes, verificar que no haya más usuarios conectados
      if (updates.maxParticipants && updates.maxParticipants < room.maxParticipants) {
        const stats = await roomRepository.getRoomStats(roomId);
        if (stats.onlineCount > updates.maxParticipants) {
          const err = new Error(`No se puede reducir el límite a ${updates.maxParticipants}. Hay ${stats.onlineCount} usuarios conectados`);
          err.status = 400;
          throw err;
        }
      }

      const updatedRoom = await roomRepository.update(roomId, updates);

      console.log('✅ Sala actualizada:', { id: roomId, updates: Object.keys(updates) });

      return {
        id: updatedRoom.id,
        name: updatedRoom.name,
        description: updatedRoom.description,
        type: updatedRoom.type,
        maxParticipants: updatedRoom.maxParticipants,
        maxFileSize: updatedRoom.maxFileSize,
        allowedFileTypes: updatedRoom.allowedFileTypes,
        isActive: updatedRoom.isActive,
        expiresAt: updatedRoom.expiresAt,
        updatedAt: updatedRoom.updatedAt
      };
    } catch (error) {
      console.error('❌ Error en RoomService.updateRoom:', error.message);
      throw error;
    }
  }

  /**
   * Desactivar sala
   */
  async deactivateRoom(roomId, adminId) {
    try {
      const room = await roomRepository.findById(roomId);
      
      if (!room) {
        const err = new Error('Sala no encontrada');
        err.status = 404;
        throw err;
      }

      if (room.createdBy !== adminId) {
        const err = new Error('No tienes permisos para desactivar esta sala');
        err.status = 403;
        throw err;
      }

      // Desconectar todos los usuarios de la sala
      const participants = await userRepository.findByRoom(roomId, { onlineOnly: true });
      for (const user of participants) {
        await userRepository.leaveRoom(user.id);
      }

      await roomRepository.deactivate(roomId);

      console.log('✅ Sala desactivada:', { id: roomId, participantsDisconnected: participants.length });

      return {
        id: roomId,
        deactivatedAt: new Date(),
        participantsDisconnected: participants.length
      };
    } catch (error) {
      console.error('❌ Error en RoomService.deactivateRoom:', error.message);
      throw error;
    }
  }

  /**
   * Eliminar sala permanentemente
   */
  async deleteRoom(roomId, adminId) {
    try {
      const room = await roomRepository.findById(roomId);
      
      if (!room) {
        const err = new Error('Sala no encontrada');
        err.status = 404;
        throw err;
      }

      if (room.createdBy !== adminId) {
        const err = new Error('No tienes permisos para eliminar esta sala');
        err.status = 403;
        throw err;
      }

      // Primero desactivar y desconectar usuarios
      await this.deactivateRoom(roomId, adminId);

      // Luego eliminar
      await roomRepository.delete(roomId);

      console.log('✅ Sala eliminada permanentemente:', roomId);

      return {
        id: roomId,
        deletedAt: new Date(),
        message: 'Sala eliminada permanentemente'
      };
    } catch (error) {
      console.error('❌ Error en RoomService.deleteRoom:', error.message);
      throw error;
    }
  }

  /**
   * Verificar permisos de archivo para una sala
   */
  async checkFilePermissions(roomId, fileSize, mimeType) {
    try {
      const room = await roomRepository.findById(roomId);
      
      if (!room) {
        const err = new Error('Sala no encontrada');
        err.status = 404;
        throw err;
      }

      if (room.type === 'text') {
        const err = new Error('Esta sala no permite archivos');
        err.status = 403;
        throw err;
      }

      if (fileSize > room.maxFileSize) {
        const err = new Error(`Archivo demasiado grande. Máximo permitido: ${this.formatFileSize(room.maxFileSize)}`);
        err.status = 413;
        throw err;
      }

      const allowedTypes = room.allowedFileTypes?.split(',') || [];
      if (allowedTypes.length > 0 && !allowedTypes.includes(mimeType)) {
        const err = new Error(`Tipo de archivo no permitido. Permitidos: ${allowedTypes.join(', ')}`);
        err.status = 415;
        throw err;
      }

      return {
        allowed: true,
        maxFileSize: room.maxFileSize,
        allowedTypes: allowedTypes
      };
    } catch (error) {
      console.error('❌ Error en RoomService.checkFilePermissions:', error.message);
      throw error;
    }
  }

  /**
   * Limpiar salas expiradas (tarea de mantenimiento)
   */
  async cleanupExpiredRooms() {
    try {
      const expiredRooms = await roomRepository.findExpiredRooms();
      
      console.log(`🔄 Limpiando ${expiredRooms.length} salas expiradas...`);

      for (const room of expiredRooms) {
        // Desconectar usuarios
        const participants = await userRepository.findByRoom(room.id, { onlineOnly: true });
        for (const user of participants) {
          await userRepository.leaveRoom(user.id);
        }

        // Desactivar sala
        await roomRepository.deactivate(room.id);
        
        console.log(`✅ Sala expirada desactivada: ${room.name} (${room.pin})`);
      }

      return {
        cleanedRooms: expiredRooms.length,
        cleanedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error en RoomService.cleanupExpiredRooms:', error.message);
      throw error;
    }
  }

  /**
   * Generar PIN único de 6 dígitos
   */
  generatePin() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Formatear tamaño de archivo
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtener estadísticas generales de salas
   */
  async getGeneralStats(adminId = null) {
    try {
      const options = { includeInactive: true };
      
      let rooms;
      if (adminId) {
        rooms = await roomRepository.findByCreator(adminId, options);
      } else {
        rooms = await roomRepository.findAll(options);
      }

      const stats = {
        totalRooms: rooms.length,
        activeRooms: rooms.filter(r => r.isActive).length,
        inactiveRooms: rooms.filter(r => !r.isActive).length,
        totalParticipants: 0,
        totalMessages: 0,
        roomsByType: {
          text: 0,
          multimedia: 0
        }
      };

      // Enriquecer estadísticas
      for (const room of rooms) {
        const roomStats = await roomRepository.getRoomStats(room.id);
        stats.totalParticipants += roomStats.participantCount;
        stats.totalMessages += roomStats.messageCount;
        stats.roomsByType[room.type]++;
      }

      return stats;
    } catch (error) {
      console.error('❌ Error en RoomService.getGeneralStats:', error.message);
      throw error;
    }
  }
}

module.exports = new RoomService();