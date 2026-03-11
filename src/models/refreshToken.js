const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Admin = require('./adminModel');
const User = require('./userModel');

// RefreshToken model definition
const RefreshToken = sequelize.define('RefreshToken', {
  token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('user', 'admin', 'internal'),
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'sk_refresh_tokens', // Optional: custom table name
});

RefreshToken.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });


module.exports = RefreshToken;
