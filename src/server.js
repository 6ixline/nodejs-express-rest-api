const dotenv = require('dotenv');

const app = require('./app');
const sequelize = require('./config/db');
const logger = require('./config/logger');
require("./models");

dotenv.config();

const PORT = process.env.PORT || 5000;

// Only sync if in development and NOT during hot reload
const syncDatabase = async () => {
  if (process.env.NODE_ENV === 'development' && process.env.SHOULD_SYNC === 'true') {
    try {
      await sequelize.sync({ alter: true }); // only do this when you explicitly allow it
      console.log('Models synced with DB');
    } catch (err) {
      console.error('DB sync failed:', err);
      process.exit(1);
    }
  }
};

const startServer = () => {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

syncDatabase().then(startServer);