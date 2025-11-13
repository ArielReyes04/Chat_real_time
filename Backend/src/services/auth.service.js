const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

class AuthService {
  async register(userData) {
    try {
      console.log('🔄 Iniciando registro de usuario:', userData.username);

      // Verificar si el usuario ya existe
      const existingUserByUsername = await userRepository.findByUsername(userData.username);
      if (existingUserByUsername) {
        throw new Error('El username ya existe');
      }

      const existingUserByEmail = await userRepository.findByEmail(userData.email);
      if (existingUserByEmail) {
        throw new Error('El email ya existe');
      }

      // Hash de la contraseña
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      console.log('🔐 Hasheando contraseña con', saltRounds, 'rounds');
      
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Crear usuario con los campos correctos
      const userToCreate = {
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        isOnline: false
      };

      console.log('📦 Datos a crear:', { 
        username: userToCreate.username, 
        email: userToCreate.email,
      });

      const user = await userRepository.create(userToCreate);

      console.log('✅ Usuario creado en BD:', user.id);

      // Generar token
      const token = this.generateToken(user);

      // Retornar usuario sin password
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline
      };

      return { user: userResponse, token };
    } catch (error) {
      console.error('❌ Error en AuthService.register:', error.message);
      throw error;
    }
  }

  async login(email, password) {
    try {
      console.log('🔄 Iniciando login para:', email);

      // Buscar usuario
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new Error('Contraseña incorrecta');
      }

      // Actualizar estado online
      await userRepository.update(user.id, { isOnline: true });

      // Generar token
      const token = this.generateToken(user);

      // Retornar usuario sin password
      const userResponse = {
        id: user.id,
        username: user.username,
        email: user.email,
        isOnline: true
      };

      console.log('✅ Login exitoso para:', user.username);

      return { user: userResponse, token };
    } catch (error) {
      console.error('❌ Error en AuthService.login:', error.message);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        isOnline: user.isOnline
      };
    } catch (error) {
      console.error('❌ Error en AuthService.getUserById:', error.message);
      throw error;
    }
  }

  async logout(userId) {
    try {
      await userRepository.update(userId, { isOnline: false });
      console.log('✅ Usuario desconectado:', userId);
    } catch (error) {
      console.error('❌ Error en AuthService.logout:', error.message);
      throw error;
    }
  }

  generateToken(user) {
    const payload = {
      userId: user.id,
      username: user.username,
      email: user.email
    };

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    return jwt.sign(payload, secret, { expiresIn });
  }

  verifyToken(token) {
    try {
      const secret = process.env.JWT_SECRET || 'your-secret-key';
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }
}

module.exports = new AuthService();