const logger = require('../config/logger');
const { Admin, User } = require('../models');

// Middleware to check if the user has the required role
const hasRole = (requiredRole) => {
  return async (req, res, next) => {
    const userRole = req.user?.role; // Extract user role from the authenticated user
    const userId = req.user?.id;     // Extract user ID from the authenticated user
    
    if (!userRole) {
      return res.status(401).json({ message: 'User role is not defined in token' });
    }

    // Determine whether the role is for an admin or a normal user
    let userRecord;

    if (userRole === 'admin') {
      // Check in the admin table if the role is 'admin'
      userRecord = await Admin.findByPk(userId);
    } else if (userRole === 'user') {
      // Check in the user table if the role is 'user'
      userRecord = await User.findByPk(userId);
    }

    if (!userRecord) {
      return res.status(403).json({ message: `User not found with role ${userRole}` });
    }

    // If the user exists, check if their role matches the required role
    if (userRole !== requiredRole) {
      logger.warn(`Access denied: User with role ${userRole} tried to access a ${requiredRole} route`);
      return res.status(403).json({ message: `Access denied. Requires ${requiredRole} role` });
    }

    // If the role matches, proceed to the next middleware or route handler
    next();
  };
};

module.exports = hasRole;
