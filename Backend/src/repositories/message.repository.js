const { Message, User } = require('../models');
const { Op } = require('sequelize');

class MessageRepository {
  /**
   * Crear un nuevo mensaje
   */
  async create(messageData) {
    try {
      return await Message.create(messageData);
    } catch (error) {
      throw new Error(`Error al crear mensaje: ${error.message}`);
    }
  }

  /**
   * Buscar mensaje por ID
   */
  async findById(id) {
    try {
      return await Message.findByPk(id, {
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username', 'email', 'displayName', 'isOnline'] 
          },
          { 
            model: User, 
            as: 'receiver', 
            attributes: ['id', 'username', 'email', 'displayName', 'isOnline'] 
          }
        ]
      });
    } catch (error) {
      throw new Error(`Error al buscar mensaje: ${error.message}`);
    }
  }

  /**
   * Obtener conversación entre dos usuarios
   */
  async findConversation(userId1, userId2, options = {}) {
    try {
      const { limit = 50, offset = 0, order = [['createdAt', 'ASC']] } = options;

      return await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId1, receiverId: userId2 },
            { senderId: userId2, receiverId: userId1 }
          ]
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username', 'displayName', 'isOnline'] 
          },
          { 
            model: User, 
            as: 'receiver', 
            attributes: ['id', 'username', 'displayName', 'isOnline'] 
          }
        ],
        order,
        limit,
        offset
      });
    } catch (error) {
      throw new Error(`Error al obtener conversación: ${error.message}`);
    }
  }

  /**
   * Obtener mensajes no leídos de un usuario
   */
  async findUnreadByUser(userId) {
    try {
      return await Message.findAll({
        where: {
          receiverId: userId,
          read: false
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username', 'displayName', 'isOnline'] 
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      throw new Error(`Error al obtener mensajes no leídos: ${error.message}`);
    }
  }

  /**
   * Contar mensajes no leídos entre dos usuarios
   */
  async countUnreadFrom(receiverId, senderId) {
    try {
      return await Message.count({
        where: {
          receiverId,
          senderId,
          read: false
        }
      });
    } catch (error) {
      throw new Error(`Error al contar mensajes no leídos: ${error.message}`);
    }
  }

  /**
   * Actualizar mensaje (marcar como leído)
   */
  async update(messageId, updateData) {
    try {
      const [updated] = await Message.update(updateData, {
        where: { id: messageId }
      });
      return updated > 0;
    } catch (error) {
      throw new Error(`Error al actualizar mensaje: ${error.message}`);
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(messageId) {
    try {
      const [updated] = await Message.update(
        { read: true },
        { where: { id: messageId, read: false } }
      );
      return updated > 0;
    } catch (error) {
      throw new Error(`Error al marcar mensaje como leído: ${error.message}`);
    }
  }

  /**
   * Marcar todos los mensajes de una conversación como leídos
   */
  async markConversationAsRead(receiverId, senderId) {
    try {
      const [updated] = await Message.update(
        { read: true },
        {
          where: {
            receiverId,
            senderId,
            read: false
          }
        }
      );
      return updated;
    } catch (error) {
      throw new Error(`Error al marcar conversación como leída: ${error.message}`);
    }
  }

  /**
   * Obtener lista de conversaciones de un usuario
   */
  async findUserConversations(userId) {
    try {
      const messages = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username', 'displayName', 'isOnline'] 
          },
          { 
            model: User, 
            as: 'receiver', 
            attributes: ['id', 'username', 'displayName', 'isOnline'] 
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      // Agrupar conversaciones
      const conversationsMap = new Map();
      
      messages.forEach(message => {
        const otherUserId = message.senderId === userId 
          ? message.receiverId 
          : message.senderId;
        
        if (!conversationsMap.has(otherUserId)) {
          conversationsMap.set(otherUserId, {
            user: message.senderId === userId ? message.receiver : message.sender,
            lastMessage: message,
            unreadCount: message.receiverId === userId && !message.read ? 1 : 0
          });
        } else {
          const conv = conversationsMap.get(otherUserId);
          if (message.receiverId === userId && !message.read) {
            conv.unreadCount++;
          }
        }
      });

      return Array.from(conversationsMap.values());
    } catch (error) {
      throw new Error(`Error al obtener conversaciones: ${error.message}`);
    }
  }

  /**
   * Eliminar mensaje
   */
  async delete(messageId, senderId) {
    try {
      const deleted = await Message.destroy({
        where: {
          id: messageId,
          senderId
        }
      });
      return deleted > 0;
    } catch (error) {
      throw new Error(`Error al eliminar mensaje: ${error.message}`);
    }
  }

  /**
   * Buscar mensajes por contenido
   */
  async searchMessages(userId, searchTerm, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;

      return await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId },
            { receiverId: userId }
          ],
          content: {
            [Op.iLike]: `%${searchTerm}%`
          }
        },
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username', 'displayName'] 
          },
          { 
            model: User, 
            as: 'receiver', 
            attributes: ['id', 'username', 'displayName'] 
          }
        ],
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
    } catch (error) {
      throw new Error(`Error al buscar mensajes: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de mensajes
   */
  async getStats(userId) {
    try {
      const [sent, received, unread] = await Promise.all([
        Message.count({ where: { senderId: userId } }),
        Message.count({ where: { receiverId: userId } }),
        Message.count({ where: { receiverId: userId, read: false } })
      ]);

      return {
        sent,
        received,
        unread,
        total: sent + received
      };
    } catch (error) {
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener todos los mensajes (admin)
   */
  async findAll(options = {}) {
    try {
      const { limit = 100, offset = 0, order = [['createdAt', 'DESC']] } = options;

      return await Message.findAll({
        include: [
          { 
            model: User, 
            as: 'sender', 
            attributes: ['id', 'username', 'displayName'] 
          },
          { 
            model: User, 
            as: 'receiver', 
            attributes: ['id', 'username', 'displayName'] 
          }
        ],
        order,
        limit,
        offset
      });
    } catch (error) {
      throw new Error(`Error al obtener mensajes: ${error.message}`);
    }
  }
}

module.exports = new MessageRepository();