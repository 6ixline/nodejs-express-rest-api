const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const FavoriteProduct = sequelize.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sk_registrations',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sk_product',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'sk_favorite_product',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'product_id'],
      name: 'unique_user_product_favorite'
    },
    {
      fields: ['user_id'],
      name: 'idx_favorite_user_id'
    },
    {
      fields: ['product_id'],
      name: 'idx_favorite_product_id'
    }
  ]
});

module.exports = FavoriteProduct;