const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const adminRepository = require('../repositories/admin.repository');

class AuthService {
  /**
   * Registro de administrador
   */
  async register(adminData) {
    try {
      console.log('🔄 Iniciando registro de administrador:', adminData.username);

      // Validaciones
      if (!adminData.username || !adminData.email || !adminData.password) {
        const err = new Error('Username, email y password son requeridos');
        err.status = 400;
        throw err;
      }

      // Verificar si el admin ya existe
      const existingAdminByUsername = await adminRepository.findByUsername(adminData.username);
      if (existingAdminByUsername) {
        const err = new Error('El username ya existe');
        err.status = 409;
        throw err;
      }

      const existingAdminByEmail = await adminRepository.findByEmail(adminData.email);
      if (existingAdminByEmail) {
        const err = new Error('El email ya existe');
        err.status = 409;
        throw err;
      }

      // Validar fortaleza de contraseña
      if (adminData.password.length < 6) {
        const err = new Error('La contraseña debe tener al menos 6 caracteres');
        err.status = 400;
        throw err;
      }

      // Hash de la contraseña
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      console.log('🔐 Hasheando contraseña con', saltRounds, 'rounds');
      
      const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

      // Crear admin
      const adminToCreate = {
        username: adminData.username,
        email: adminData.email,
        password: hashedPassword,
        isActive: true
      };

      console.log('📦 Datos a crear:', { 
        username: adminToCreate.username, 
        email: adminToCreate.email
      });

      const admin = await adminRepository.create(adminToCreate);

      console.log('✅ Administrador creado en BD:', admin.id);

      // Generar token
      const token = this.generateToken(admin);

      // Retornar admin sin password
      const adminResponse = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      };

      return { admin: adminResponse, token };
    } catch (error) {
      console.error('❌ Error en AuthService.register:', error.message);
      throw error;
    }
  }

  /**
   * Login de administrador
   */
  async login(email, password) {
    try {
      console.log('🔄 Iniciando login para administrador:', email);

      // Validaciones
      if (!email || !password) {
        const err = new Error('Email y password son requeridos');
        err.status = 400;
        throw err;
      }

      // Buscar admin
      const admin = await adminRepository.findByEmail(email);
      if (!admin) {
        const err = new Error('Administrador no encontrado');
        err.status = 404;
        throw err;
      }

      // Verificar si está activo
      // if (!admin.isActive) {
      //   const err = new Error('Cuenta de administrador desactivada');
      //   err.status = 403;
      //   throw err;
      // }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        const err = new Error('Contraseña incorrecta');
        err.status = 401;
        throw err;
      }

      // Actualizar último login
      await adminRepository.updateLastLogin(admin.id);

      // Generar token
      const token = this.generateToken(admin);

      // Retornar admin sin password
      const adminResponse = {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: new Date()
      };

      console.log('✅ Login exitoso para administrador:', admin.username);

      return { admin: adminResponse, token };
    } catch (error) {
      console.error('❌ Error en AuthService.login:', error.message);
      throw error;
    }
  }

  /**
   * Obtener administrador por ID
   */
  async getAdminById(adminId) {
    try {
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

      return {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt
      };
    } catch (error) {
      console.error('❌ Error en AuthService.getAdminById:', error.message);
      throw error;
    }
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(adminId, currentPassword, newPassword) {
    try {
      // Buscar admin con password
      const admin = await adminRepository.findByEmail(
        (await adminRepository.findById(adminId)).email
      );
      
      if (!admin) {
        const err = new Error('Administrador no encontrado');
        err.status = 404;
        throw err;
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
      if (!isValidPassword) {
        const err = new Error('Contraseña actual incorrecta');
        err.status = 401;
        throw err;
      }

      // Validar nueva contraseña
      if (newPassword.length < 6) {
        const err = new Error('La nueva contraseña debe tener al menos 6 caracteres');
        err.status = 400;
        throw err;
      }

      // Hash nueva contraseña
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      await adminRepository.update(adminId, { password: hashedNewPassword });

      console.log('✅ Contraseña cambiada para administrador:', adminId);
      return true;
    } catch (error) {
      console.error('❌ Error en AuthService.changePassword:', error.message);
      throw error;
    }
  }

  /**
   * Logout (opcional - principalmente para logging)
   */
  async logout(adminId) {
    try {
      console.log('✅ Administrador desconectado:', adminId);
      return true;
    } catch (error) {
      console.error('❌ Error en AuthService.logout:', error.message);
      throw error;
    }
  }

  /**
   * Generar token JWT
   */
  generateToken(admin) {
    const payload = {
      adminId: admin.id, // Cambio: usar adminId en lugar de userId
      username: admin.username,
      email: admin.email,
      type: 'admin' // Agregar tipo para distinguir de usuarios normales
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  /**
   * Verificar token JWT
   */
  verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      const payload = jwt.verify(token, secret);
      
      // Validar que es un token de admin
      if (payload.type !== 'admin') {
        throw new Error('Token no válido para administrador');
      }
      
      return payload;
    } catch (error) {
      console.error('❌ Error al verificar token:', error.message);
      throw new Error('Token inválido');
    }
  }

  /**
   * Refrescar token
   */
  async refreshToken(oldToken) {
    try {
      const payload = this.verifyToken(oldToken);
      const admin = await this.getAdminById(payload.adminId);
      
      return this.generateToken(admin);
    } catch (error) {
      console.error('❌ Error en AuthService.refreshToken:', error.message);
      throw error;
    }
  }

  async activateAdmin(adminId) {
  try {
    await adminRepository.activate(adminId);
    console.log('✅ Cuenta de administrador activada:', adminId);
    return true;
  } catch (error) {
    console.error('❌ Error en AuthService.activateAdmin:', error.message);
    throw error;
  }
}

/**
 * Desactivar cuenta de administrador (solo para super admin)
 */
async deactivateAdmin(adminId) {
  try {
    // Verificar que no sea el último admin activo
    const activeCount = await adminRepository.countActive();
    if (activeCount <= 1) {
      const err = new Error('No se puede desactivar el último administrador activo');
      err.status = 400;
      throw err;
    }

    await adminRepository.deactivate(adminId);
    console.log('✅ Cuenta de administrador desactivada:', adminId);
    return true;
  } catch (error) {
    console.error('❌ Error en AuthService.deactivateAdmin:', error.message);
    throw error;
  }
}

/**
 * Obtener todos los administradores activos
 */
async getActiveAdmins() {
  try {
    return await adminRepository.findAllActive();
  } catch (error) {
    console.error('❌ Error en AuthService.getActiveAdmins:', error.message);
    throw error;
  }
}

}

module.exports = new AuthService();