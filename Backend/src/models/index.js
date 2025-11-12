const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {};
const basename = path.basename(__filename);

try {
  // Cargar todos los modelos
  fs.readdirSync(__dirname)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js'
      );
    })
    .forEach(file => {
      const modelDefiner = require(path.join(__dirname, file));
      const model = modelDefiner(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    });

  // Ejecutar asociaciones
  Object.keys(db).forEach(modelName => {
    if (db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  // Exportar instancias
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  console.log('✅ Modelos cargados:', Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize'));
  
} catch (error) {
  console.error('❌ Error al cargar modelos:', error.message);
  throw error;
}

module.exports = db;