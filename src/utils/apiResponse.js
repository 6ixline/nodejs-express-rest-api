/**
 * Standard API Response for Success
 * @param {Object} res - The response object
 * @param {number} statusCode - The HTTP status code
 * @param {string} message - The message to send
 * @param {Object} data - The data to return
 */
const successResponse = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  };
  
  /**
   * Standard API Response for Error
   * @param {Object} res - The response object
   * @param {number} statusCode - The HTTP status code
   * @param {string} message - The error message to send
   * @param {Object} errors - The errors to return
   */
  const errorResponse = (res, statusCode, message, errors = {}) => {
    res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  };
  
  module.exports = {
    successResponse,
    errorResponse,
  };
  