const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Room = sequelize.define('Room', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [3, 100],
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pin: {
      type: DataTypes.STRING(10),
      unique: true,
      allowNull: false,
      validate: {
        len: [4, 10],
        isNumeric: true
      }
    },
    type: {
      type: DataTypes.ENUM('text', 'multimedia'),
      allowNull: false,
      defaultValue: 'text'
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 50,
      field: 'max_participants',
      validate: {
        min: 1,
        max: 1000
      }
    },
    maxFileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10485760, // 10MB en bytes
      field: 'max_file_size'
    },
    allowedFileTypes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: 'image/jpeg,image/png,image/gif,application/pdf,text/plain',
      field: 'allowed_file_types'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'created_by'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at'
    }
  }, {
    tableName: 'rooms',
    timestamps: true,
    underscored: true
  });

  Room.associate = (models) => {
    // Sala pertenece a un admin
    Room.belongsTo(models.Admin, {
      as: 'creator',
      foreignKey: 'created_by'
    });

    // Sala tiene múltiples mensajes
    Room.hasMany(models.Message, {
      as: 'messages',
      foreignKey: 'room_id'
    });

    // Sala tiene múltiples participantes
    Room.hasMany(models.User, {
      as: 'participants',
      foreignKey: 'current_room_id'
    });
  };

  return Room;
};