const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Admin = sequelize.define('Admin', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // Por defecto, los admins están activos
      comment: 'Indica si la cuenta del administrador está activa'
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha y hora del último login'
    }
  }, {
    tableName: 'admins',
    timestamps: true,
    underscored: true
  });

  Admin.associate = (models) => {
    Admin.hasMany(models.Room, {
      as: 'createdRooms',
      foreignKey: 'created_by'
    });
    
  };

  return Admin;
};