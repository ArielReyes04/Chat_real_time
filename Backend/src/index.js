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

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 Usuario ${userId} se unió a su sala`);
  });

  socket.on('send_message', (data) => {
    io.to(`user_${data.receiverId}`).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
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
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health\n`);
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