const { Op } = require('sequelize');
const { Enquiry, Product, User, Admin, Make, Category } = require('../models');
const logger = require('../config/logger');

/**
 * User creates a new enquiry
 */
const createEnquiry = async (userId, enquiryData) => {
  try {
    const { productId, subject, message } = enquiryData;

    // Validate product if provided
    if (productId) {
      const product = await Product.findByPk(productId);
      if (!product) {
        throw new Error('Product not found');
      }
    }

    const enquiry = await Enquiry.create({
      user_id: userId,
      product_id: productId || null,
      subject,
      message,
      status: 'pending',
      priority: 'medium'
    });

    logger.info(`Enquiry ${enquiry.id} created by user ${userId}`);
    return enquiry;
  } catch (err) {
    logger.error(`Error creating enquiry: ${err.message}`);
    throw err;
  }
};

/**
 * Get all enquiries for a user with pagination
 */
const getUserEnquiries = async (userId, { page = 1, limit = 10, status, sortBy = 'createdAt', order = 'DESC' }) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = { user_id: userId };

    if (status) {
      let statusValues;
      if (Array.isArray(status)) {
        statusValues = status;
      } else if (typeof status === 'string' && status.includes(',')) {
        statusValues = status.split(',').map(s => s.trim());
      } else {
        statusValues = [status];
      }
      whereClause.status = { [Op.in]: statusValues };
    }

    const { count, rows } = await Enquiry.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'product_code', 'ref_code'],
          required: false,
          include: [
            {
              model: Make,
              as: 'make',
              attributes: ['id', 'title', 'slug']
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'title', 'slug']
            }
          ]
        },
        {
          model: Admin,
          as: 'assignedAdmin',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [[sortBy, order]],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    };
  } catch (err) {
    logger.error(`Error fetching user enquiries: ${err.message}`);
    throw err;
  }
};

/**
 * Get single enquiry details for user
 */
const getUserEnquiryById = async (userId, enquiryId) => {
  try {
    const enquiry = await Enquiry.findOne({
      where: {
        id: enquiryId,
        user_id: userId
      },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'product_code', 'ref_code'],
          required: false,
          include: [
            {
              model: Make,
              as: 'make',
              attributes: ['id', 'title', 'slug']
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'title', 'slug']
            }
          ]
        },
        {
          model: Admin,
          as: 'assignedAdmin',
          attributes: ['id', 'username'],
          required: false
        },
        {
          model: Admin,
          as: 'resolvedByAdmin',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    return enquiry;
  } catch (err) {
    logger.error(`Error fetching enquiry: ${err.message}`);
    throw err;
  }
};

/**
 * Admin: Get all enquiries with advanced filters
 */
const getAllEnquiries = async ({ 
  page = 1, 
  limit = 10, 
  search = '', 
  status, 
  priority,
  assignedTo,
  userId,
  productId,
  dateFrom,
  dateTo,
  sortBy = 'createdAt', 
  order = 'DESC' 
}) => {
  try {
    const offset = (page - 1) * limit;
    const whereClause = {};

    // Search in subject and message
    if (search) {
      whereClause[Op.or] = [
        { subject: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    // Status filter
    if (status) {
      let statusValues;
      if (Array.isArray(status)) {
        statusValues = status;
      } else if (typeof status === 'string' && status.includes(',')) {
        statusValues = status.split(',').map(s => s.trim());
      } else {
        statusValues = [status];
      }
      whereClause.status = { [Op.in]: statusValues };
    }

    // Priority filter
    if (priority) {
      let priorityValues;
      if (Array.isArray(priority)) {
        priorityValues = priority;
      } else if (typeof priority === 'string' && priority.includes(',')) {
        priorityValues = priority.split(',').map(p => p.trim());
      } else {
        priorityValues = [priority];
      }
      whereClause.priority = { [Op.in]: priorityValues };
    }

    // Assigned to filter
    if (assignedTo) {
      whereClause.assigned_to = assignedTo;
    }

    // User filter
    if (userId) {
      whereClause.user_id = userId;
    }

    // Product filter
    if (productId) {
      whereClause.product_id = productId;
    }

    // Date range filter
    if (dateFrom || dateTo) {
      whereClause.created_at = {};
      if (dateFrom) {
        whereClause.created_at[Op.gte] = new Date(dateFrom);
      }
      if (dateTo) {
        const endDate = new Date(dateTo);
        endDate.setHours(23, 59, 59, 999);
        whereClause.created_at[Op.lte] = endDate;
      }
    }

    const { count, rows } = await Enquiry.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'product_code', 'ref_code'],
          required: false,
          include: [
            {
              model: Make,
              as: 'make',
              attributes: ['id', 'title', 'slug']
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'title', 'slug']
            }
          ]
        },
        {
          model: Admin,
          as: 'assignedAdmin',
          attributes: ['id', 'username'],
          required: false
        },
        {
          model: Admin,
          as: 'resolvedByAdmin',
          attributes: ['id', 'username'],
          required: false
        }
      ],
      order: [[sortBy, order]],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    };
  } catch (err) {
    logger.error(`Error fetching all enquiries: ${err.message}`);
    throw err;
  }
};

/**
 * Admin: Get single enquiry by ID
 */
const getEnquiryById = async (enquiryId) => {
  try {
    const enquiry = await Enquiry.findByPk(enquiryId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'mobile']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'product_code', 'ref_code'],
          required: false,
          include: [
            {
              model: Make,
              as: 'make',
              attributes: ['id', 'title', 'slug']
            },
            {
              model: Category,
              as: 'category',
              attributes: ['id', 'title', 'slug']
            }
          ]
        },
        {
          model: Admin,
          as: 'assignedAdmin',
          attributes: ['id', 'username'],
          required: false
        },
        {
          model: Admin,
          as: 'resolvedByAdmin',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    return enquiry;
  } catch (err) {
    logger.error(`Error fetching enquiry: ${err.message}`);
    throw err;
  }
};

/**
 * Admin: Update enquiry (status, priority, remarks, admin_reply, etc.)
 */
const updateEnquiry = async (enquiryId, adminId, updateData) => {
  try {
    const enquiry = await Enquiry.findByPk(enquiryId);

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    const updateFields = {};

    // Status update
    if (updateData.status) {
      updateFields.status = updateData.status;
      
      // If status is resolved or closed, set resolved_at and resolved_by
      if (updateData.status === 'resolved' || updateData.status === 'closed') {
        if (!enquiry.resolved_at) {
          updateFields.resolved_at = new Date();
          updateFields.resolved_by = adminId;
        }
      }
    }

    // Priority update
    if (updateData.priority) {
      updateFields.priority = updateData.priority;
    }

    // Remarks update
    if (updateData.remarks !== undefined) {
      updateFields.remarks = updateData.remarks;
    }

    // Admin reply update
    if (updateData.admin_reply !== undefined) {
      updateFields.admin_reply = updateData.admin_reply;
    }

    // Assign to admin
    if (updateData.assignedTo !== undefined) {
      if (updateData.assignedTo) {
        const admin = await Admin.findByPk(updateData.assignedTo);
        if (!admin) {
          throw new Error('Admin not found');
        }
      }
      updateFields.assigned_to = updateData.assignedTo;
    }

    await enquiry.update(updateFields);

    logger.info(`Enquiry ${enquiryId} updated by admin ${adminId}`);
    
    // Fetch updated enquiry with associations
    return await getEnquiryById(enquiryId);
  } catch (err) {
    logger.error(`Error updating enquiry: ${err.message}`);
    throw err;
  }
};

/**
 * Admin: Delete enquiry
 */
const deleteEnquiry = async (enquiryId) => {
  try {
    const enquiry = await Enquiry.findByPk(enquiryId);

    if (!enquiry) {
      throw new Error('Enquiry not found');
    }

    await enquiry.destroy();

    logger.info(`Enquiry ${enquiryId} deleted`);
    return enquiry;
  } catch (err) {
    logger.error(`Error deleting enquiry: ${err.message}`);
    throw err;
  }
};

/**
 * Get enquiry statistics (for admin dashboard)
 */
const getEnquiryStats = async () => {
  try {
    const totalEnquiries = await Enquiry.count();
    const pendingEnquiries = await Enquiry.count({ where: { status: 'pending' } });
    const inProgressEnquiries = await Enquiry.count({ where: { status: 'in_progress' } });
    const resolvedEnquiries = await Enquiry.count({ where: { status: 'resolved' } });
    const closedEnquiries = await Enquiry.count({ where: { status: 'closed' } });

    const urgentEnquiries = await Enquiry.count({ 
      where: { 
        priority: 'urgent',
        status: { [Op.notIn]: ['resolved', 'closed'] }
      } 
    });

    const highPriorityEnquiries = await Enquiry.count({ 
      where: { 
        priority: 'high',
        status: { [Op.notIn]: ['resolved', 'closed'] }
      } 
    });

    return {
      total: totalEnquiries,
      byStatus: {
        pending: pendingEnquiries,
        inProgress: inProgressEnquiries,
        resolved: resolvedEnquiries,
        closed: closedEnquiries
      },
      byPriority: {
        urgent: urgentEnquiries,
        high: highPriorityEnquiries
      }
    };
  } catch (err) {
    logger.error(`Error fetching enquiry stats: ${err.message}`);
    throw err;
  }
};


/**
 * Bulk delete Enquiry
 */
const bulkDeleteEnquiry = async (ids) => {
  try {
    const deletedCount = await Enquiry.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    logger.info(`${deletedCount} enquires deleted`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error bulk deleting enquiry: ${err.message}`);
    throw err;
  }
};

module.exports = {
  // User methods
  createEnquiry,
  getUserEnquiries,
  getUserEnquiryById,
  
  // Admin methods
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
  bulkDeleteEnquiry
};