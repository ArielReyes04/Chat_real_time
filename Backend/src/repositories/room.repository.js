const { Room, Message, Admin } = require('../models');

class RoomRepository {
  async create(data) {
    let pin;
    let isUnique = false;
    
    while (!isUnique) {
      pin = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Room.findOne({ where: { pin } });
      if (!existing) isUnique = true;
    }
    
    return await Room.create({
      name: data.name,
      type: data.room_type,
      pin: pin,
      createdBy: data.admin_id,
      isActive: true
    });
  }

  async findAll() {
    return await Room.findAll({
      where: { isActive: true },
      include: [
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  async findById(id) {
    return await Room.findByPk(id, {
      include: [
        {
          model: Message,
          as: 'messages',
          order: [['createdAt', 'ASC']]
        }
      ]
    });
  }

  async findByAdmin(adminId) {
    try {
      return await Room.findAll({
        where: { 
          createdBy: adminId,
          isActive: true 
        },
        include: [
          {
            model: Admin,
            as: 'creator',
            attributes: ['id', 'username', 'email']
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('❌ Error en RoomRepository.findByAdmin:', error.message);
      throw error;
    }
  }

  async getParticipantCount(roomId) {
    try {
      const { User } = require('../models');
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
}

module.exports = new RoomRepository();