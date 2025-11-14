const { Room, Admin, User, Message } = require('../models');
const { Op } = require('sequelize');

class RoomRepository {
  async create(roomData) {
    try {
      return await Room.create(roomData);
    } catch (error) {
      console.error('❌ Error en RoomRepository.create:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Room.findByPk(id, {
        include: [
          {
            model: Admin,
            as: 'creator',
            attributes: ['id', 'username', 'email']
          },
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'nickname', 'isOnline', 'joinedAt']
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.findById:', error.message);
      throw error;
    }
  }

  async findByPin(pin) {
    try {
      return await Room.findOne({
        where: { 
          pin, 
          isActive: true 
        },
        include: [
          {
            model: Admin,
            as: 'creator',
            attributes: ['id', 'username']
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.findByPin:', error.message);
      throw error;
    }
  }

  async findByCreator(adminId, options = {}) {
    try {
      const { includeInactive = false, limit = 50, offset = 0 } = options;
      
      const whereCondition = { createdBy: adminId };
      if (!includeInactive) {
        whereCondition.isActive = true;
      }

      return await Room.findAll({
        where: whereCondition,
        include: [
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'nickname', 'isOnline']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.findByCreator:', error.message);
      throw error;
    }
  }

  async findAll(options = {}) {
    try {
      const { 
        isActive = true, 
        limit = 50, 
        offset = 0,
        includeExpired = false 
      } = options;
      
      const whereCondition = { isActive };
      
      if (!includeExpired) {
        whereCondition.expiresAt = {
          [Op.or]: [
            { [Op.is]: null },
            { [Op.gt]: new Date() }
          ]
        };
      }

      return await Room.findAll({
        where: whereCondition,
        include: [
          {
            model: Admin,
            as: 'creator',
            attributes: ['id', 'username']
          },
          {
            model: User,
            as: 'participants',
            attributes: ['id', 'nickname', 'isOnline']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.findAll:', error.message);
      throw error;
    }
  }

  async update(id, roomData) {
    try {
      const room = await Room.findByPk(id);
      if (!room) {
        throw new Error('Sala no encontrada');
      }
      return await room.update(roomData);
    } catch (error) {
      console.error('❌ Error en RoomRepository.update:', error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      const room = await Room.findByPk(id);
      if (!room) {
        throw new Error('Sala no encontrada');
      }
      await room.destroy();
      return true;
    } catch (error) {
      console.error('❌ Error en RoomRepository.delete:', error.message);
      throw error;
    }
  }

  async deactivate(id) {
    try {
      return await Room.update(
        { isActive: false },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en RoomRepository.deactivate:', error.message);
      throw error;
    }
  }

  async activate(id) {
    try {
      return await Room.update(
        { isActive: true },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en RoomRepository.activate:', error.message);
      throw error;
    }
  }

  async getParticipantCount(roomId) {
    try {
      return await User.count({
        where: { 
          currentRoomId: roomId,
          isOnline: true 
        }
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.getParticipantCount:', error.message);
      throw error;
    }
  }

  async getRoomStats(roomId) {
    try {
      const [participantCount, messageCount, room] = await Promise.all([
        User.count({
          where: { currentRoomId: roomId }
        }),
        Message.count({
          where: { roomId }
        }),
        Room.findByPk(roomId)
      ]);

      return {
        participantCount,
        messageCount,
        onlineCount: await User.count({
          where: { 
            currentRoomId: roomId,
            isOnline: true 
          }
        }),
        createdAt: room?.createdAt,
        isActive: room?.isActive
      };
    } catch (error) {
      console.error('❌ Error en RoomRepository.getRoomStats:', error.message);
      throw error;
    }
  }

  async checkPinExists(pin, excludeId = null) {
    try {
      const whereCondition = { 
        pin, 
        isActive: true 
      };
      
      if (excludeId) {
        whereCondition.id = { [Op.ne]: excludeId };
      }

      const room = await Room.findOne({ where: whereCondition });
      return !!room;
    } catch (error) {
      console.error('❌ Error en RoomRepository.checkPinExists:', error.message);
      throw error;
    }
  }

  async findExpiredRooms() {
    try {
      return await Room.findAll({
        where: {
          expiresAt: {
            [Op.lt]: new Date()
          },
          isActive: true
        }
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.findExpiredRooms:', error.message);
      throw error;
    }
  }
}

module.exports = new RoomRepository();