const logger = require('../config/logger');
const { errorResponse } = require('../utils/apiResponse');

// General error handling middleware
const errorHandler = (err, req, res, next) => {
  // Set default status code to 500 (internal server error)
  const statusCode = err.statusCode || 500;
  
  // Log the error details
  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode
  });

  // If the error is a validation error (like missing required fields or bad input), send a 400 error
  if (err.name === 'ValidationError') {
    return errorResponse(res, 400, err.message, err.erros);
  }

  // Handle JWT errors (e.g., invalid token)
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 401, 'Invalid token');
  }

  // Handle expired token errors
  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 401, 'Token expired');
  }

  // Generic error response
  return errorResponse(res, statusCode, err.message || 'Something went wrong');
};

module.exports = errorHandler;
