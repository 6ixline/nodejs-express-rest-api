const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug', // Default logging level (can be 'info', 'debug', 'warn', 'error')
  format: winston.format.combine(
    winston.format.timestamp(), // Add timestamp to each log
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}] ${message}`; // Format log output
    })
  ),
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),  // Add color for console logs
        winston.format.simple()     // Log in simple format
      ),
    }),
    // File transport for production logs
    new winston.transports.File({ filename: 'logs/app.log', level: 'debug' }), // Logs will be written to a file
  ],
});

// Handle unhandled promise rejections and uncaught exceptions
process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error.message || error}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message || error}`);
  process.exit(1); // Exit the process if there is an uncaught exception
});

module.exports = logger;
