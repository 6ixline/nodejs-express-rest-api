const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

// Admin model definition
const Admin = sequelize.define('Admin', {
  // Define the 'username' field
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true, // Ensure that username is not empty
    }
  },
  displayName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure that username is not empty
    }
  },
  // Define the 'password' field
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure password is provided
    }
  },
  // Define the 'role' field (in this case, always 'admin')
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'admin', // Admins will have 'admin' role by default
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']], // Ensure role is one of the allowed types
    }
  }
}, {
  // Hooks for password encryption before saving to database
  hooks: {
    beforeCreate: async (admin) => {
      // Encrypt password before storing it in the database
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(admin.password, salt);
    },
    beforeUpdate: async (admin) => {
      // Encrypt password before updating it in the database
      if (admin.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(admin.password, salt);
      }
    }
  },
  tableName: "sk_user"
});

// Compare provided password with the hashed password in the database
Admin.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = Admin;
