const { User, Room } = require('../models');
const { Op } = require('sequelize');

class UserRepository {
  async create(userData) {
    try {
      return await User.create(userData);
    } catch (error) {
      console.error('❌ Error en UserRepository.create:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await User.findByPk(id, {
        include: [
          {
            model: Room,
            as: 'currentRoom',
            attributes: ['id', 'name', 'type', 'pin']
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findById:', error.message);
      throw error;
    }
  }

  async findBySessionId(sessionId) {
    try {
      return await User.findOne({
        where: { sessionId },
        include: [
          {
            model: Room,
            as: 'currentRoom',
            attributes: ['id', 'name', 'type']
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findBySessionId:', error.message);
      throw error;
    }
  }

  async findByIpAndRoom(ipAddress, roomId) {
    try {
      return await User.findOne({
        where: { 
          ipAddress,
          currentRoomId: roomId
        }
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findByIpAndRoom:', error.message);
      throw error;
    }
  }

  async findByNicknameAndRoom(nickname, roomId) {
    try {
      return await User.findOne({
        where: { 
          nickname,
          currentRoomId: roomId
        }
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findByNicknameAndRoom:', error.message);
      throw error;
    }
  }

  async findByRoom(roomId, options = {}) {
    try {
      const { onlineOnly = false, limit = 100 } = options;
      
      const whereCondition = { currentRoomId: roomId };
      if (onlineOnly) {
        whereCondition.isOnline = true;
      }

      return await User.findAll({
        where: whereCondition,
        order: [['joinedAt', 'ASC']],
        limit
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findByRoom:', error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const { 
        onlineOnly = false, 
        limit = 100, 
        offset = 0 
      } = options;
      
      const whereCondition = {};
      if (onlineOnly) {
        whereCondition.isOnline = true;
      }

      return await User.findAll({
        where: whereCondition,
        include: [
          {
            model: Room,
            as: 'currentRoom',
            attributes: ['id', 'name', 'type']
          }
        ],
        order: [['lastActivity', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findAll:', error.message);
      throw error;
    }
  }

  async update(id, userData) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return await user.update(userData);
    } catch (error) {
      console.error('❌ Error en UserRepository.update:', error.message);
      throw error;
    }
  }

  async updateActivity(id) {
    try {
      return await User.update(
        { 
          lastActivity: new Date(),
          isOnline: true 
        },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en UserRepository.updateActivity:', error.message);
      throw error;
    }
  }

  async setOnline(id, isOnline = true) {
    try {
      return await User.update(
        { 
          isOnline,
          lastActivity: new Date() 
        },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en UserRepository.setOnline:', error.message);
      throw error;
    }
  }

  async leaveRoom(id) {
    try {
      return await User.update(
        { 
          currentRoomId: null,
          isOnline: false 
        },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en UserRepository.leaveRoom:', error.message);
      throw error;
    }
  }

  async joinRoom(id, roomId) {
    try {
      return await User.update(
        { 
          currentRoomId: roomId,
          isOnline: true,
          joinedAt: new Date(),
          lastActivity: new Date()
        },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en UserRepository.joinRoom:', error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      await user.destroy();
      return true;
    } catch (error) {
      console.error('❌ Error en UserRepository.delete:', error.message);
      throw error;
    }
  }

  async deleteBySessionId(sessionId) {
    try {
      const deleted = await User.destroy({
        where: { sessionId }
      });
      return deleted > 0;
    } catch (error) {
      console.error('❌ Error en UserRepository.deleteBySessionId:', error.message);
      throw error;
    }
  }

  async findInactiveUsers(inactiveMinutes = 30) {
    try {
      const cutoffTime = new Date(Date.now() - (inactiveMinutes * 60 * 1000));
      
      return await User.findAll({
        where: {
          lastActivity: {
            [Op.lt]: cutoffTime
          },
          isOnline: true
        }
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.findInactiveUsers:', error.message);
      throw error;
    }
  }

  async cleanup() {
    try {
      // Eliminar usuarios inactivos por más de 24 horas
      const cutoffTime = new Date(Date.now() - (24 * 60 * 60 * 1000));
      
      const deleted = await User.destroy({
        where: {
          lastActivity: {
            [Op.lt]: cutoffTime
          }
        }
      });

      console.log(`🧹 Limpieza: ${deleted} usuarios eliminados`);
      return deleted;
    } catch (error) {
      console.error('❌ Error en UserRepository.cleanup:', error.message);
      throw error;
    }
  }

  async getRoomParticipants(roomId) {
    try {
      return await User.findAll({
        where: { 
          currentRoomId: roomId,
          isOnline: true 
        },
        attributes: ['id', 'nickname', 'joinedAt', 'lastActivity'],
        order: [['joinedAt', 'ASC']]
      });
    } catch (error) {
      console.error('❌ Error en UserRepository.getRoomParticipants:', error.message);
      throw error;
    }
  }
}

module.exports = new UserRepository();