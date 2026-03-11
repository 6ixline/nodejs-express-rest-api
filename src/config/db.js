const { Sequelize } = require('sequelize');
require('dotenv').config();

// Fetch environment variables for the database configuration
const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT = '3306', // Default MySQL port
} = process.env;

// Set up Sequelize with MySQL connection
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,  // Add DB port for flexibility
  dialect: 'mysql',
  logging: false, // Disable logging for production environments
  pool: {
    max: 5,  // Max connections in the pool
    min: 0,  // Min connections in the pool
    acquire: 30000,  // Time in ms to get a connection before throwing error
    idle: 10000, // Time in ms before an unused connection is released
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
  },
});

// Function to test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1); // Exit process if DB connection fails
  }
};

testConnection();

module.exports = sequelize;
