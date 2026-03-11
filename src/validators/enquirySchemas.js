const Joi = require('joi');

/**
 * User: Create enquiry validation
 */
const createEnquirySchema = Joi.object({
  productId: Joi.number()
    .integer()
    .positive()
    .optional()
    .allow(null)
    .messages({
      'number.base': 'Product ID must be a number',
      'number.integer': 'Product ID must be an integer',
      'number.positive': 'Product ID must be positive'
    }),
  subject: Joi.string()
    .min(5)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Subject is required',
      'string.min': 'Subject must be at least 5 characters long',
      'string.max': 'Subject cannot exceed 255 characters',
      'any.required': 'Subject is required'
    }),
  message: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.empty': 'Message is required',
      'string.min': 'Message must be at least 10 characters long',
      'any.required': 'Message is required'
    })
});

/**
 * User: Get user enquiries validation
 */
const getUserEnquiriesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  status: Joi.alternatives()
    .try(
      Joi.string().valid('pending', 'in_progress', 'resolved', 'closed'),
      Joi.array().items(Joi.string().valid('pending', 'in_progress', 'resolved', 'closed'))
    )
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, in_progress, resolved, closed'
    }),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status', 'priority')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, updatedAt, status, priority'
    }),
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Order must be ASC or DESC'
    })
});

/**
 * Admin: Get all enquiries validation
 */
const getAllEnquiriesSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  search: Joi.string()
    .allow('')
    .max(255)
    .optional()
    .messages({
      'string.max': 'Search query cannot exceed 255 characters'
    }),
  status: Joi.alternatives()
    .try(
      Joi.string().valid('pending', 'in_progress', 'resolved', 'closed'),
      Joi.array().items(Joi.string().valid('pending', 'in_progress', 'resolved', 'closed'))
    )
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, in_progress, resolved, closed'
    }),
  priority: Joi.alternatives()
    .try(
      Joi.string().valid('low', 'medium', 'high', 'urgent'),
      Joi.array().items(Joi.string().valid('low', 'medium', 'high', 'urgent'))
    )
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  assignedTo: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Assigned to must be a number',
      'number.integer': 'Assigned to must be an integer',
      'number.positive': 'Assigned to must be positive'
    }),
  userId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.positive': 'User ID must be positive'
    }),
  productId: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Product ID must be a number',
      'number.integer': 'Product ID must be an integer',
      'number.positive': 'Product ID must be positive'
    }),
  dateFrom: Joi.date()
    .iso()
    .optional()
    .messages({
      'date.base': 'Date from must be a valid date',
      'date.format': 'Date from must be in ISO format'
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .optional()
    .messages({
      'date.base': 'Date to must be a valid date',
      'date.format': 'Date to must be in ISO format',
      'date.min': 'Date to must be greater than or equal to date from'
    }),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'status', 'priority', 'user_id', 'assigned_to')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, updatedAt, status, priority, user_id, assigned_to'
    }),
  order: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Order must be ASC or DESC'
    })
});

/**
 * Admin: Update enquiry validation
 */
const updateEnquirySchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'in_progress', 'resolved', 'closed')
    .optional()
    .messages({
      'any.only': 'Status must be one of: pending, in_progress, resolved, closed'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .optional()
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  remarks: Joi.string()
    .allow('')
    .allow(null)
    .optional()
    .messages({
      'string.base': 'Remarks must be a string'
    }),
  admin_reply: Joi.string()
    .allow('')
    .allow(null)
    .optional()
    .messages({
      'string.base': 'Admin reply must be a string'
    }),
  assignedTo: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .optional()
    .messages({
      'number.base': 'Assigned to must be a number',
      'number.integer': 'Assigned to must be an integer',
      'number.positive': 'Assigned to must be positive'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

module.exports = {
  createEnquirySchema,
  getUserEnquiriesSchema,
  getAllEnquiriesSchema,
  updateEnquirySchema
};