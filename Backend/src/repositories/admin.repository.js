const { Admin } = require('../models');

class AdminRepository {
  async create(adminData) {
    try {
      return await Admin.create(adminData);
    } catch (error) {
      console.error('❌ Error en AdminRepository.create:', error.message);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Admin.findByPk(id, {
        attributes: { exclude: ['password'] }
      });
    } catch (error) {
      console.error('❌ Error en AdminRepository.findById:', error.message);
      throw error;
    }
  }

  async findByUsername(username) { 
    try {
      return await Admin.findOne({ 
        where: { username } 
      });
    } catch (error) {
      console.error('❌ Error en AdminRepository.findByUsername:', error.message);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await Admin.findOne({ where: { email } });
    } catch (error) {
      console.error('❌ Error en AdminRepository.findByEmail:', error.message);
      throw error;
    }
  }

  async findAll() {
    try {
      return await Admin.findAll({
        attributes: ['id', 'username', 'email', 'isActive', 'lastLogin', 'createdAt']
      });
    } catch (error) {
      console.error('❌ Error en AdminRepository.findAll:', error.message);
      throw error;
    }
  }

  async update(id, adminData) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error('Administrador no encontrado');
      }
      return await admin.update(adminData);
    } catch (error) {
      console.error('❌ Error en AdminRepository.update:', error.message);
      throw error;
    }
  }

  async delete(id) {
    try {
      const admin = await Admin.findByPk(id);
      if (!admin) {
        throw new Error('Administrador no encontrado');
      }
      await admin.destroy();
      return true;
    } catch (error) {
      console.error('❌ Error en AdminRepository.delete:', error.message);
      throw error;
    }
  }

  async updateLastLogin(id) {
    try {
      return await Admin.update(
        { lastLogin: new Date() },
        { where: { id } }
      );
    } catch (error) {
      console.error('❌ Error en AdminRepository.updateLastLogin:', error.message);
      throw error;
    }
  }

  async activate(id) {
    try {
      const [updatedRows] = await Admin.update(
        { isActive: true },
        { where: { id } }
      );
      
      if (updatedRows === 0) {
        throw new Error('Administrador no encontrado');
      }
      
      console.log('✅ Administrador activado:', id);
      return true;
    } catch (error) {
      console.error('❌ Error en AdminRepository.activate:', error.message);
      throw error;
    }
  }

  /**
   * Desactivar cuenta de administrador
   */
  async deactivate(id) {
    try {
      const [updatedRows] = await Admin.update(
        { isActive: false },
        { where: { id } }
      );
      
      if (updatedRows === 0) {
        throw new Error('Administrador no encontrado');
      }
      
      console.log('✅ Administrador desactivado:', id);
      return true;
    } catch (error) {
      console.error('❌ Error en AdminRepository.deactivate:', error.message);
      throw error;
    }
  }

  /**
   * Obtener solo administradores activos
   */
  async findAllActive() {
    try {
      return await Admin.findAll({
        where: { isActive: true },
        attributes: ['id', 'username', 'email', 'isActive', 'lastLogin', 'createdAt'],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      console.error('❌ Error en AdminRepository.findAllActive:', error.message);
      throw error;
    }
  }

  /**
   * Contar administradores activos
   */
  async countActive() {
    try {
      return await Admin.count({
        where: { isActive: true }
      });
    } catch (error) {
      console.error('❌ Error en AdminRepository.countActive:', error.message);
      throw error;
    }
  }

}

module.exports = new AdminRepository();