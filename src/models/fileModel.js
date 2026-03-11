const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Files model definition
const Files = sequelize.define('Files', {
  url: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  owner_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  owner_type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true // user, admin or maybe table name
    }
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true // Example: profile_pic, property_img
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'deleted', 'temp']]
    }
  }
}, {
  tableName: 'sk_files',
  underscored: true,
  timestamps: true
});

module.exports = Files;