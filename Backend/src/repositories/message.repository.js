const { Message, User, Room } = require('../models');
const { Op } = require('sequelize');

class MessageRepository {
  async create(messageData) {
    try {
      return await Message.create(messageData);
    } catch (error) {
      console.error('❌ Error en MessageRepository.create:', error.message);
      throw new Error(`Error al crear mensaje: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      return await Message.findByPk(id, {
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname', 'isOnline'] 
          },
          { 
            model: Room, 
            as: 'room', 
            attributes: ['id', 'name', 'type'] 
          }
        ]
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.findById:', error.message);
      throw new Error(`Error al buscar mensaje: ${error.message}`);
    }
  }

  async findByRoom(roomId, options = {}) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        order = [['createdAt', 'ASC']],
        includeDeleted = false 
      } = options;

      const whereCondition = { roomId };
      if (!includeDeleted) {
        whereCondition.isDeleted = false;
      }

      return await Message.findAll({
        where: whereCondition,
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname', 'isOnline'] 
          }
        ],
        order,
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.findByRoom:', error.message);
      throw new Error(`Error al obtener mensajes de sala: ${error.message}`);
    }
  }

  async findRecentByRoom(roomId, limit = 50) {
    try {
      return await Message.findAll({
        where: { 
          roomId,
          isDeleted: false 
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname', 'isOnline'] 
          }
        ],
        order: [['createdAt', 'DESC']],
        limit
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.findRecentByRoom:', error.message);
      throw new Error(`Error al obtener mensajes recientes: ${error.message}`);
    }
  }

  async findByType(roomId, type, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      return await Message.findAll({
        where: { 
          roomId,
          type,
          isDeleted: false 
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname'] 
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.findByType:', error.message);
      throw new Error(`Error al buscar mensajes por tipo: ${error.message}`);
    }
  }

  async searchInRoom(roomId, searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      return await Message.findAll({
        where: {
          roomId,
          content: {
            [Op.iLike]: `%${searchTerm}%`
          },
          isDeleted: false
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname'] 
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.searchInRoom:', error.message);
      throw new Error(`Error al buscar mensajes: ${error.message}`);
    }
  }

  async update(id, updateData) {
    try {
      const [updated] = await Message.update(updateData, {
        where: { id }
      });
      return updated > 0;
    } catch (error) {
      console.error('❌ Error en MessageRepository.update:', error.message);
      throw new Error(`Error al actualizar mensaje: ${error.message}`);
    }
  }

  async softDelete(id, senderId) {
    try {
      const [updated] = await Message.update(
        { 
          isDeleted: true,
          deletedAt: new Date()
        },
        { 
          where: { 
            id,
            senderId,
            isDeleted: false 
          } 
        }
      );
      return updated > 0;
    } catch (error) {
      console.error('❌ Error en MessageRepository.softDelete:', error.message);
      throw new Error(`Error al eliminar mensaje: ${error.message}`);
    }
  }

  async hardDelete(id, senderId) {
    try {
      const deleted = await Message.destroy({
        where: {
          id,
          senderId
        }
      });
      return deleted > 0;
    } catch (error) {
      console.error('❌ Error en MessageRepository.hardDelete:', error.message);
      throw new Error(`Error al eliminar mensaje permanentemente: ${error.message}`);
    }
  }

  async getRoomStats(roomId) {
    try {
      const [totalMessages, textMessages, fileMessages, systemMessages] = await Promise.all([
        Message.count({ 
          where: { roomId, isDeleted: false } 
        }),
        Message.count({ 
          where: { roomId, type: 'text', isDeleted: false } 
        }),
        Message.count({ 
          where: { roomId, type: 'file', isDeleted: false } 
        }),
        Message.count({ 
          where: { roomId, type: 'system', isDeleted: false } 
        })
      ]);

      return {
        totalMessages,
        textMessages,
        fileMessages,
        systemMessages
      };
    } catch (error) {
      console.error('❌ Error en MessageRepository.getRoomStats:', error.message);
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  async findFileMessages(roomId, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      return await Message.findAll({
        where: { 
          roomId,
          type: 'file',
          isDeleted: false 
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname'] 
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.findFileMessages:', error.message);
      throw new Error(`Error al obtener archivos: ${error.message}`);
    }
  }

  async cleanup(daysOld = 30) {
    try {
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      
      const deleted = await Message.destroy({
        where: {
          isDeleted: true,
          deletedAt: {
            [Op.lt]: cutoffDate
          }
        }
      });

      console.log(`🧹 Limpieza: ${deleted} mensajes eliminados permanentemente`);
      return deleted;
    } catch (error) {
      console.error('❌ Error en MessageRepository.cleanup:', error.message);
      throw new Error(`Error en limpieza: ${error.message}`);
    }
  }

  async findAll(options = {}) {
    try {
      const { 
        limit = 100, 
        offset = 0, 
        order = [['createdAt', 'DESC']],
        includeDeleted = false 
      } = options;

      const whereCondition = {};
      if (!includeDeleted) {
        whereCondition.isDeleted = false;
      }

      return await Message.findAll({
        where: whereCondition,
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'nickname'] 
          },
          { 
            model: Room, 
            as: 'room', 
            attributes: ['id', 'name', 'type'] 
          }
        ],
        order,
        limit,
        offset
      });
    } catch (error) {
      console.error('❌ Error en MessageRepository.findAll:', error.message);
      throw new Error(`Error al obtener mensajes: ${error.message}`);
    }
  }
}

module.exports = new MessageRepository();