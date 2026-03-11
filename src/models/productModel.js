const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Product model
const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  make_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sk_make',
      key: 'id'
    }
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'sk_category',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  product_code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: 'Main Product Code / Part Number'
  },
  ref_code: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated reference codes for related products'
  },
  keyword: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comma-separated keywords for product search'
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  std_pkg: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Standard Package'
  },
  mast_pkg: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Master Package'
  },
  lumax_part_no: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  varroc_part_no: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  butter_size: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  pt_bc: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'PT B/C'
  },
  pt_tc: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'PT T/C'
  },
  shell_name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  ic_box_size: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IC Box Size'
  },
  mc_box_size: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'MC Box Size'
  },
  graphic: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Image URL or path'
  },
  varroc_mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  lumax_mrp: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  visor_glass: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'out_of_stock'),
    defaultValue: 'active'
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sk_user',
      key: 'id'
    }
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'sk_user',
      key: 'id'
    }
  }
}, {
  tableName: 'sk_product',
  underscored: true,
  timestamps: true,
  indexes: [
    {
      fields: ['product_code']
    },
    {
      fields: ['make_id']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['ref_code'],
      type: 'FULLTEXT'
    },
    {
      fields: ['keyword'],
      type: 'FULLTEXT'
    }
  ]
});


module.exports = Product;