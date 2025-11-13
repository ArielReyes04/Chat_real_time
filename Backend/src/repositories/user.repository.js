const { User } = require('../models');

class UserRepository {
  async create(userData) {
    try {
      const user = await User.create(userData);
      return user;
    } catch (error) {
      console.error('❌ Error en UserRepository.create:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await User.findByPk(id);
    } catch (error) {
      console.error('❌ Error en UserRepository.findById:', error.message);
      throw error;
    }
  }

  async findByUsername(username) {
    try {
      return await User.findOne({ where: { username } });
    } catch (error) {
      console.error('❌ Error en UserRepository.findByUsername:', error.message);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ where: { email } });
    } catch (error) {
      console.error('❌ Error en UserRepository.findByEmail:', error.message);
      throw error;
    }
  }

  async findAll() {
    try {
      return await User.findAll({
        attributes: ['id', 'username', 'email', 'isOnline']
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

  async delete(id) {
    try {
      const user = await User.findByPk(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      await user.destroy();
    } catch (error) {
      console.error('❌ Error en UserRepository.delete:', error.message);
      throw error;
    }
  }
}

module.exports = new UserRepository();