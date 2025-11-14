const userRepo = require('../repositories/user.repository');
const roomRepo = require('../repositories/room.repository');
const crypto = require('crypto');

class UserService {
  /**
   * Unirse a una sala con PIN
   */
  async joinRoom({ pin, nickname, ipAddress, userAgent }) {
    try {
      // Validaciones
      if (!pin || !nickname || !ipAddress) {
        const err = new Error('PIN, nickname e IP son requeridos');
        err.status = 400;
        throw err;
      }

      // Validar formato de nickname
      if (nickname.length < 2 || nickname.length > 50) {
        const err = new Error('El nickname debe tener entre 2 y 50 caracteres');
        err.status = 400;
        throw err;
      }

      if (!/^[a-zA-Z0-9\s\-_.]+$/.test(nickname)) {
        const err = new Error('El nickname contiene caracteres no válidos');
        err.status = 400;
        throw err;
      }

      // Buscar sala por PIN
      const room = await roomRepo.findByPin(pin);
      if (!room || !room.isActive) {
        const err = new Error('Sala no encontrada o inactiva');
        err.status = 404;
        throw err;
      }

      // Verificar si la sala ha expirado
      if (room.expiresAt && new Date() > room.expiresAt) {
        const err = new Error('La sala ha expirado');
        err.status = 410;
        throw err;
      }

      // Verificar límite de participantes
      const currentParticipants = await roomRepo.getParticipantCount(room.id);
      if (currentParticipants >= room.maxParticipants) {
        const err = new Error('La sala está llena');
        err.status = 429;
        throw err;
      }

      // Verificar que la IP no esté ya en esta sala (una conexión por IP por sala)
      const existingUserByIp = await userRepo.findByIpAndRoom(ipAddress, room.id);
      if (existingUserByIp) {
        const err = new Error('Ya tienes una conexión activa en esta sala');
        err.status = 409;
        throw err;
      }

      // Verificar que el nickname no esté en uso en esta sala
      const existingUserByNickname = await userRepo.findByNicknameAndRoom(nickname, room.id);
      if (existingUserByNickname) {
        const err = new Error('Este nickname ya está en uso en la sala');
        err.status = 409;
        throw err;
      }

      // Generar sessionId único
      const sessionId = crypto.randomUUID();

      // Crear usuario
      const userData = {
        nickname,
        sessionId,
        ipAddress,
        userAgent,
        currentRoomId: room.id,
        isOnline: true,
        joinedAt: new Date(),
        lastActivity: new Date()
      };

      const user = await userRepo.create(userData);

      console.log('✅ Usuario unido a sala:', { 
        userId: user.id, 
        nickname, 
        roomId: room.id, 
        roomName: room.name 
      });

      return {
        user: {
          id: user.id,
          nickname: user.nickname,
          sessionId: user.sessionId,
          joinedAt: user.joinedAt,
          isOnline: user.isOnline
        },
        room: {
          id: room.id,
          name: room.name,
          type: room.type,
          maxParticipants: room.maxParticipants,
          currentParticipants: currentParticipants + 1
        }
      };
    } catch (error) {
      console.error('❌ Error en UserService.joinRoom:', error.message);
      throw error;
    }
  }

  /**
   * Salir de una sala
   */
  async leaveRoom(userId) {
    try {
      const user = await userRepo.findById(userId);
      if (!user) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
      }

      const roomId = user.currentRoomId;
      
      // Actualizar usuario
      await userRepo.leaveRoom(userId);

      console.log('✅ Usuario salió de sala:', { userId, roomId });
      
      return { success: true, roomId };
    } catch (error) {
      console.error('❌ Error en UserService.leaveRoom:', error.message);
      throw error;
    }
  }

  /**
   * Obtener información de usuario por sessionId
   */
  async getUserBySessionId(sessionId) {
    try {
      const user = await userRepo.findBySessionId(sessionId);
      if (!user) {
        const err = new Error('Sesión no encontrada');
        err.status = 404;
        throw err;
      }

      return {
        id: user.id,
        nickname: user.nickname,
        sessionId: user.sessionId,
        isOnline: user.isOnline,
        joinedAt: user.joinedAt,
        lastActivity: user.lastActivity,
        currentRoom: user.currentRoom ? {
          id: user.currentRoom.id,
          name: user.currentRoom.name,
          type: user.currentRoom.type
        } : null
      };
    } catch (error) {
      console.error('❌ Error en UserService.getUserBySessionId:', error.message);
      throw error;
    }
  }

  /**
   * Actualizar actividad del usuario
   */
  async updateActivity(userId) {
    try {
      await userRepo.updateActivity(userId);
      return true;
    } catch (error) {
      console.error('❌ Error en UserService.updateActivity:', error.message);
      throw error;
    }
  }

  /**
   * Obtener participantes de una sala
   */
  async getRoomParticipants(roomId) {
    try {
      const participants = await userRepo.getRoomParticipants(roomId);
      
      return participants.map(user => ({
        id: user.id,
        nickname: user.nickname,
        isOnline: user.isOnline,
        joinedAt: user.joinedAt,
        lastActivity: user.lastActivity
      }));
    } catch (error) {
      console.error('❌ Error en UserService.getRoomParticipants:', error.message);
      throw error;
    }
  }

  /**
   * Limpiar usuarios inactivos
   */
  async cleanupInactiveUsers() {
    try {
      const inactiveUsers = await userRepo.findInactiveUsers(30); // 30 minutos
      
      for (const user of inactiveUsers) {
        await userRepo.setOnline(user.id, false);
      }

      console.log(`🧹 ${inactiveUsers.length} usuarios marcados como offline`);
      
      return inactiveUsers.length;
    } catch (error) {
      console.error('❌ Error en UserService.cleanupInactiveUsers:', error.message);
      throw error;
    }
  }

  /**
   * Verificar si un usuario tiene acceso a una sala
   */
  async hasRoomAccess(userId, roomId) {
    try {
      const user = await userRepo.findById(userId);
      return user && user.currentRoomId === roomId && user.isOnline;
    } catch (error) {
      console.error('❌ Error en UserService.hasRoomAccess:', error.message);
      return false;
    }
  }
}

module.exports = new UserService();