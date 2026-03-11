const Joi = require('joi');

/**
 * Joi Schema for User Registration
 */
const userRegistrationSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .required()
    .messages({
      'string.min': 'Username must be at least 3 characters long.',
      'any.required': 'Username is required.',
    }),
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long.',
      'any.required': 'Password is required.',
    }),
  role: Joi.string()
    .valid('owner', 'broker', 'builder', 'user')
    .required()
    .messages({
      'any.required': 'Role is required.',
      'string.valid': 'Invalid role value.',
    }),
});

/**
 * Joi Schema for User Login
 */
const userLoginSchema = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      'any.required': 'Username is required.',
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required.',
    }),
});

/**
 * Joi Schema for Property Creation
 */
const propertyCreationSchema = Joi.object({
  title: Joi.string()
    .required()
    .messages({
      'any.required': 'Title is required.',
    }),
  description: Joi.string()
    .required()
    .messages({
      'any.required': 'Description is required.',
    }),
  price: Joi.number()
    .required()
    .messages({
      'any.required': 'Price is required.',
      'number.base': 'Price must be a number.',
    }),
  location: Joi.string()
    .required()
    .messages({
      'any.required': 'Location is required.',
    }),
});

/**
 * Joi Schema for Property Update
 */
const propertyUpdateSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  price: Joi.number().optional().messages({
    'number.base': 'Price must be a number.',
  }),
  location: Joi.string().optional(),
});

/**
 * Validate the request using Joi
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }
    next();
  };
};

function formatSequelizeErrors(err) {
  if (!Array.isArray(err.errors)) return null;

  return err.errors.map((e) => {
    let message = e.message || 'Validation failed';

    // Customize specific constraint errors
    if (e.type === 'unique violation') {
      if (e.path === 'email') {
        message = 'Email already in use';
      } else if (e.path === 'mobile') {
        message = 'Mobile number already in use';
      }
    }

    return {
      field: e.path || 'unknown',
      message,
    };
  });
}

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  propertyCreationSchema,
  propertyUpdateSchema,
  validate,
  formatSequelizeErrors,
};
