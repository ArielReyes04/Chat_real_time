const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true,
        // Solo letras, números, espacios y algunos caracteres especiales
        is: /^[a-zA-Z0-9\s\-_.]+$/
      }
    },
    sessionId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'session_id'
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: false,
      field: 'ip_address'
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },
    currentRoomId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'current_room_id'
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_online'
    },
    lastActivity: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'last_activity'
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'joined_at'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['session_id'] },
      { fields: ['ip_address'] },
      { fields: ['current_room_id'] },
      { fields: ['is_online'] },
      // Índice compuesto para verificar nickname único por sala
      { unique: true, fields: ['nickname', 'current_room_id'] },
      // Índice para verificar un dispositivo por sala
      { unique: true, fields: ['ip_address', 'current_room_id'] }
    ]
  });

  User.associate = (models) => {
    // Usuario pertenece a una sala actual
    User.belongsTo(models.Room, {
      as: 'currentRoom',
      foreignKey: 'current_room_id'
    });

    // Usuario puede enviar múltiples mensajes
    User.hasMany(models.Message, {
      as: 'sentMessages',
      foreignKey: 'sender_id'
    });
  };

  return User;
};