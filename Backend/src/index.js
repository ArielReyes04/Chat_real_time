require('dotenv').config();
const app = require('./app');
const db = require('./models');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Configurar Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') || '*',
    credentials: true
  }
});

// Validación
if (!db || !db.sequelize) {
  console.error('❌ Error: db.sequelize no está definido');
  console.error('Verifica src/models/index.js');
  process.exit(1);
}

// Inicialización ÚNICA de base de datos
const initDatabase = async () => {
  try {
    console.log('🔄 Iniciando conexión a base de datos...');
    
    // 1. Autenticar conexión
    await db.sequelize.authenticate();
    console.log('✅ Conexión establecida correctamente');

    // 2. Sincronizar modelos
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const syncOptions = isDevelopment ? { force: false } : { alter: true };

    console.log(`🔄 Sincronizando modelos (${syncOptions.force ? 'FORCE' : syncOptions.alter ? 'ALTER' : 'SAFE'})...`);
    
    await db.sequelize.sync(syncOptions);
    
    console.log('✅ Modelos sincronizados correctamente');
    console.log('📊 Tablas disponibles:', Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize'));
    
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:');
    console.error('Mensaje:', error.message);
    console.error('Detalle:', error.original?.message || error.parent?.message || 'Sin detalles');
    
    if (error.message.includes('pg_class_relname_nsp_index') || 
        error.message.includes('pg_type_typname_nsp_index') ||
        error.message.includes('ya existe')) {
      console.error('\n⚠️  SOLUCIÓN: La base de datos tiene objetos huérfanos.');
      console.error('Ejecuta en PostgreSQL:');
      console.error('  psql -h localhost -U postgres -d postgres -c "DROP DATABASE IF EXISTS chat_real_time;"');
      console.error('  psql -h localhost -U postgres -d postgres -c "CREATE DATABASE chat_real_time;"');
      console.error('Luego reinicia la aplicación.\n');
    }
    
    throw error;
  }
};

// Socket.IO para chat de salas
const connectedUsers = new Map(); // sessionId -> { socket, userId, roomId }

io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado:', socket.id);

  // Usuario se une a una sala
  socket.on('join_room', ({ sessionId, userId, roomId, nickname }) => {
    try {
      // Salir de sala anterior si existe
      const existingUser = connectedUsers.get(sessionId);
      if (existingUser && existingUser.roomId) {
        socket.leave(`room_${existingUser.roomId}`);
        socket.to(`room_${existingUser.roomId}`).emit('user_left', {
          userId: existingUser.userId,
          message: `${existingUser.nickname || 'Usuario'} salió de la sala`
        });
      }

      // Unirse a nueva sala
      socket.join(`room_${roomId}`);
      connectedUsers.set(sessionId, { 
        socket, 
        userId, 
        roomId, 
        nickname,
        socketId: socket.id 
      });

      console.log(`👤 Usuario ${nickname} (${userId}) se unió a sala ${roomId}`);

      // Notificar a otros usuarios de la sala
      socket.to(`room_${roomId}`).emit('user_joined', {
        userId,
        nickname,
        message: `${nickname} se unió a la sala`
      });

      // Confirmar al usuario que se unió
      socket.emit('joined_room', {
        roomId,
        message: `Te uniste a la sala exitosamente`
      });
    } catch (error) {
      console.error('❌ Error al unirse a sala:', error.message);
      socket.emit('error', { message: 'Error al unirse a la sala' });
    }
  });

  // Enviar mensaje a sala
  socket.on('send_message', (messageData) => {
    try {
      const { sessionId, roomId, content, type = 'text' } = messageData;
      const user = connectedUsers.get(sessionId);

      if (!user || user.roomId !== roomId) {
        socket.emit('error', { message: 'No estás en esta sala' });
        return;
      }

      // Broadcast mensaje a todos en la sala
      io.to(`room_${roomId}`).emit('new_message', {
        id: Date.now(), // Temporal, el real viene de la BD
        senderId: user.userId,
        senderNickname: user.nickname,
        content,
        type,
        roomId,
        createdAt: new Date().toISOString()
      });

      console.log(`💬 Mensaje de ${user.nickname} en sala ${roomId}: ${content?.substring(0, 50)}...`);
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error.message);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  // Usuario está escribiendo
  socket.on('typing', ({ sessionId, roomId, isTyping }) => {
    try {
      const user = connectedUsers.get(sessionId);
      if (user && user.roomId === roomId) {
        socket.to(`room_${roomId}`).emit('user_typing', {
          userId: user.userId,
          nickname: user.nickname,
          isTyping
        });
      }
    } catch (error) {
      console.error('❌ Error en typing:', error.message);
    }
  });

  // Desconexión
  socket.on('disconnect', () => {
    try {
      // Encontrar usuario por socketId
      let disconnectedUser = null;
      let sessionIdToRemove = null;

      for (const [sessionId, userData] of connectedUsers.entries()) {
        if (userData.socketId === socket.id) {
          disconnectedUser = userData;
          sessionIdToRemove = sessionId;
          break;
        }
      }

      if (disconnectedUser) {
        // Notificar a la sala que el usuario se desconectó
        if (disconnectedUser.roomId) {
          socket.to(`room_${disconnectedUser.roomId}`).emit('user_left', {
            userId: disconnectedUser.userId,
            nickname: disconnectedUser.nickname,
            message: `${disconnectedUser.nickname} se desconectó`
          });
        }

        // Remover de usuarios conectados
        connectedUsers.delete(sessionIdToRemove);
        
        console.log(`🔌 Usuario ${disconnectedUser.nickname} (${disconnectedUser.userId}) desconectado`);
      } else {
        console.log('🔌 Cliente desconectado:', socket.id);
      }
    } catch (error) {
      console.error('❌ Error al desconectar:', error.message);
    }
  });
});

// Iniciar servidor solo después de inicializar BD
const startServer = async () => {
  try {
    // Inicializar base de datos primero
    await initDatabase();
    
    // Luego iniciar servidor
    server.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`📡 Socket.IO listo en http://localhost:${PORT}`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`👥 Usuarios conectados: ${connectedUsers.size}\n`);
    });
  } catch (error) {
    console.error('❌ Error fatal al iniciar servidor:', error.message);
    process.exit(1);
  }
};

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Iniciar aplicación
startServer();
