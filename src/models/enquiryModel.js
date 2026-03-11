const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Enquiry = sequelize.define('Enquiry', {
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
    allowNull: true,
    references: {
      model: 'sk_product',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  },
  subject: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'pending',
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
    allowNull: false
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin remarks/notes'
  },
  admin_reply: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Admin response to the enquiry'
  },
  assigned_to: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sk_admins',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    comment: 'Admin assigned to handle this enquiry'
  },
  resolved_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  resolved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sk_admins',
      key: 'id'
    },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'sk_enquiries',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['user_id'],
      name: 'idx_enquiry_user_id'
    },
    {
      fields: ['product_id'],
      name: 'idx_enquiry_product_id'
    },
    {
      fields: ['status'],
      name: 'idx_enquiry_status'
    },
    {
      fields: ['priority'],
      name: 'idx_enquiry_priority'
    },
    {
      fields: ['assigned_to'],
      name: 'idx_enquiry_assigned_to'
    },
    {
      fields: ['created_at'],
      name: 'idx_enquiry_created_at'
    }
  ]
});

module.exports = Enquiry;