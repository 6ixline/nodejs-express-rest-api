const { errorResponse } = require('../utils/apiResponse');
const logger = require('../config/logger');
const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
  
    if (error) {
      let errorMsg = error.details.map((d) => d.message);
      logger.error(`Property req validation failed ${errorMsg}`);
      return errorResponse(res, 400, 'Validation Failed', errorMsg);
    }
  
    req.body = value;
    next();
};

module.exports = validate;
  