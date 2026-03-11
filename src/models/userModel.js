const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

// User model definition
const User = sequelize.define('User', {
  // Define the 'username' field
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate:{
      notEmpty: true,
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate:{
      notEmpty: true,
    }
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true, // Ensure password is provided
    }
  },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'normal',
    validate: {
      isIn: [['normal', "internal"]], // Ensure role is one of the allowed types
    }
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive']], // Ensure status is one of the allowed types
    }
  }
}, {
  // Hooks for password encryption before saving to database
  hooks: {
    beforeCreate: async (user) => {
      // Encrypt password before storing it in the database
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    },
    beforeUpdate: async (user) => {
      // Encrypt password before updating it in the database
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  },
  tableName: "sk_registrations"
});

// Compare provided password with the hashed password in the database
User.prototype.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;
