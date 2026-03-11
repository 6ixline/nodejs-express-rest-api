const { Op } = require('sequelize');
const crypto = require('crypto');
const { User, Files, OTP } = require('../models');
const { generateUserAccessToken, generateUserRefreshToken } = require('../config/jwt');
const FileService = require('./fileService');
const logger = require('../config/logger');
const { sendOTPEmail } = require('./emailService');

/**
 * User Registration
 */
const registerUser = async (name, email, mobile, password, role, status) => {
  try {
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role,
      status
    });

    const token = generateUserAccessToken(user);
    const refreshToken = generateUserRefreshToken(user, false);

    logger.info(`User ${email} registered successfully`);

    return { token, user, refreshToken };
  } catch (err) {
    logger.error(`Error registering user: ${err.message}`);
    throw err;
  }
};

/**
 * User Login (mobile only - role: normal)
 */
const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email, status: 'active', role: 'normal' } });
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateUserAccessToken(user);
    const refreshToken = generateUserRefreshToken(user, false);

    logger.info(`User ${email} logged in successfully`);

    return { token, refreshToken, user };
  } catch (err) {
    logger.error(`Login failed for user ${email}: ${err.message}`);
    throw err;
  }
};

/**
 * Internal User Login (web platform only - role: internal)
 */
const loginInternalUser = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email, status: 'active', role: 'internal' } });
    if (!user) {
      throw new Error('User not found');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    const token = generateUserAccessToken(user);
    const refreshToken = generateUserRefreshToken(user, false);

    logger.info(`Internal user ${email} logged in successfully`);

    return { token, refreshToken, user };
  } catch (err) {
    logger.error(`Login failed for internal user ${email}: ${err.message}`);
    throw err;
  }
};

/**
 * Get user profile
 */
const getUserProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'mobile', 'role', 'createdAt']
    });

    if (!user) {
      throw new Error('User not found');
    }

    const file = await Files.findOne({
      where: {
        owner_id: userId,
        owner_type: 'user',
        type: 'profile_pic',
        status: 'active',
      },
      attributes: ["id", "name", "url"]
    });

    const userWithFiles = user.toJSON();
    userWithFiles.profileImage = file;

    return userWithFiles;
  } catch (err) {
    logger.error(`Error fetching user profile for user ID ${userId}: ${err.message}`);
    throw err;
  }
};

/**
 * Update user profile
 */
const updateUserProfile = async (userId, name, email, mobile, fileid) => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;

    await user.save();

    if (fileid) {
      const oldFiles = await Files.findAll({
        where: {
          owner_id: user.id,
          type: "profile_pic",
          owner_type: "user",
          id: { [Op.ne]: fileid }
        },
        attributes: ['id']
      });

      if (oldFiles.length > 0) {
        const oldFileIds = oldFiles.map(f => f.id);
        await FileService.deleteMultipleFiles(oldFileIds);
      }

      await FileService.activateTempFiles([fileid], user.id, 'user');
    } else {
      const allFiles = await Files.findAll({
        where: {
          owner_id: user.id,
          type: "profile_pic",
          owner_type: "user"
        },
        attributes: ['id']
      });

      if (allFiles.length > 0) {
        const allFileIds = allFiles.map(f => f.id);
        await FileService.deleteMultipleFiles(allFileIds);
      }
    }

    logger.info(`User profile updated: ${userId}`);
    return user;
  } catch (err) {
    logger.error(`Error updating user profile for user ID ${userId}: ${err.message}`);
    throw err;
  }
};

/**
 * Admin fetching all users
 * role param is optional:
 *   undefined  → fetch all users regardless of role (original behaviour preserved)
 *   'normal'   → dealers (mobile app users) only
 *   'internal' → web platform users only
 */
const getAllUsers = async ({ page, limit, search, sortBy, order, role }) => {
  try {
    const offset = (page - 1) * limit;

    // Original search clause — completely unchanged
    let whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { mobile: { [Op.like]: `%${search}%` } }
      ]
    } : undefined;

    // Only when role is provided: wrap with Op.and so the role filter
    // sits alongside the search Op.or without swallowing it
    if (role) {
      whereClause = {
        [Op.and]: [
          { role },
          ...(whereClause ? [whereClause] : []),
        ]
      };
    }

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      order: [[sortBy, order]],
      attributes: { exclude: ['password'] },
      offset,
      limit,
    });

    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(count / limit),
        totalItems: count,
      }
    };
  } catch (err) {
    logger.error(`Error fetching all users: ${err.message}`);
    throw err;
  }
};

/**
 * Admin fetching user
 */
const getUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    const files = await Files.findAll({
      where: {
        owner_id: id,
        owner_type: 'user',
        status: 'active'
      }
    });

    const fileData = files.map(file => ({
      fileid: file.id,
      name: file.name,
      preview: file.url
    }));

    const userWithFiles = user.toJSON();
    userWithFiles.fileData = fileData;

    return userWithFiles;
  } catch (err) {
    logger.error(`Error fetching user ${id}: ${err.message}`);
    throw err;
  }
};

/**
 * Admin fetching Dashboard Stats
 */
const getDashboardStats = async () => {
  try {
    const userCount = await User.count();
    return { userCount };
  } catch (err) {
    logger.error(`Error fetching dashboard stats: ${err.message}`);
    throw err;
  }
};

/**
 * Admin update user
 * role is intentionally NOT updatable to prevent accidental
 * promotion/demotion between dealer and internal user
 */
const updateUser = async (id, name, password, email, mobile, status, fileid, filesToDelete) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.name = name || user.name;
    user.password = password || user.password;
    user.email = email || user.email;
    user.mobile = mobile || user.mobile;
    user.status = status || user.status;

    await user.save();

    if (fileid) {
      const oldFiles = await Files.findAll({
        where: {
          owner_id: user.id,
          owner_type: 'user',
          type: 'profile_pic'
        },
        attributes: ['id']
      });

      if (oldFiles.length > 0) {
        const oldFileIds = oldFiles.map(f => f.id);
        await FileService.deleteMultipleFiles(oldFileIds);
      }

      await FileService.activateTempFiles([fileid], user.id, 'user');
    }

    if (filesToDelete && filesToDelete.length > 0) {
      await FileService.deleteMultipleFiles(filesToDelete);
    }

    logger.info(`User updated: ${id}`);
    return user;
  } catch (err) {
    logger.error(`Error updating user ${id}: ${err.message}`);
    throw err;
  }
};

/**
 * Admin create user
 * role param added as last argument — 'normal' creates a dealer, 'internal' creates a web user
 * Kept as last param with default 'normal' so existing callers without role don't break
 */
const createUser = async (name, password, email, mobile, status, fileid, filesToDelete, role = 'normal') => {
  try {
    const existingUser = await User.findOne({ where: { mobile } });
    if (existingUser) {
      throw new Error('Mobile already exists');
    }

    const user = await User.create({
      name,
      email,
      mobile,
      password,
      status,
      role,
    });

    if (fileid) {
      await FileService.activateTempFiles([fileid], user.id, 'user');
    }

    if (filesToDelete && filesToDelete.length > 0) {
      await FileService.deleteMultipleFiles(filesToDelete);
    }

    logger.info(`User ${name} created successfully with role: ${role}`);
    return user;
  } catch (err) {
    logger.error(`Error creating user: ${err.message}`);
    throw err;
  }
};

/**
 * Admin delete user
 */
const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('User not found');
    }

    const userFiles = await Files.findAll({
      where: { owner_id: id, owner_type: 'user' }
    });

    if (userFiles.length > 0) {
      const fileIds = userFiles.map(f => f.id);
      await FileService.deleteMultipleFiles(fileIds);
    }

    await user.destroy();

    logger.info(`User deleted: ${id}`);
    return user;
  } catch (err) {
    logger.error(`Error deleting user ${id}: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk delete users
 */
const bulkDeleteUser = async (ids) => {
  try {
    const userFiles = await Files.findAll({
      where: { owner_id: ids, owner_type: 'user' }
    });

    if (userFiles.length > 0) {
      const fileIds = userFiles.map(f => f.id);
      await FileService.deleteMultipleFiles(fileIds);
    }

    const deletedCount = await User.destroy({
      where: { id: { [Op.in]: ids } }
    });

    logger.info(`${deletedCount} users deleted`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error bulk deleting users: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk update user status
 */
const bulkUserUpdate = async (ids, status) => {
  try {
    const [updatedCount] = await User.update(
      { status },
      { where: { id: ids } }
    );

    logger.info(`${updatedCount} users status updated to ${status}`);
    return updatedCount;
  } catch (err) {
    logger.error(`Error bulk updating users: ${err.message}`);
    throw err;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Request password reset OTP
 */
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('No account found with this email address');
  }

  const recentOTP = await OTP.findOne({
    where: {
      email,
      createdAt: { [Op.gte]: new Date(Date.now() - 60 * 1000) }
    },
    order: [['createdAt', 'DESC']]
  });

  if (recentOTP) {
    throw new Error('Please wait a minute before requesting a new OTP');
  }

  await OTP.update(
    { verified: true },
    { where: { email, verified: false } }
  );

  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await OTP.create({
    email,
    otp,
    expiresAt,
    verified: false,
    attempts: 0,
  });

  await sendOTPEmail(email, otp);

  return {
    message: 'OTP sent successfully to your email',
    expiresIn: '10 minutes',
  };
};

/**
 * Verify OTP 
 */
const verifyPasswordResetOTP = async (email, otp) => {
  const blockedOTP = await OTP.findOne({
    where: {
      email,
      verified: false,
      attempts: { [Op.gte]: 5 },
      expiresAt: { [Op.gt]: new Date() }
    },
    order: [['createdAt', 'DESC']]
  });

  if (blockedOTP) {
    throw new Error('Too many incorrect attempts. Please request a new OTP');
  }

  const otpRecord = await OTP.findOne({
    where: {
      email,
      otp,
      verified: false,
      expiresAt: { [Op.gt]: new Date() }
    },
    order: [['createdAt', 'DESC']]
  });

  if (!otpRecord) {
    const latestOTP = await OTP.findOne({
      where: {
        email,
        verified: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });

    if (latestOTP) {
      await latestOTP.increment('attempts');
      await latestOTP.reload();

      const remainingAttempts = 5 - latestOTP.attempts;

      if (remainingAttempts <= 0) {
        throw new Error('Too many incorrect attempts. Please request a new OTP');
      }

      throw new Error(`Invalid OTP. ${remainingAttempts} attempt${remainingAttempts === 1 ? '' : 's'} remaining`);
    }

    throw new Error('Invalid or expired OTP');
  }

  if (otpRecord.attempts >= 5) {
    throw new Error('Too many incorrect attempts. Please request a new OTP');
  }

  await otpRecord.update({ verified: true });

  return {
    message: 'OTP verified successfully',
    resetToken: otpRecord.id,
  };
};

/**
 * Reset password
 */
const resetPassword = async (email, resetToken, newPassword) => {
  const otpRecord = await OTP.findOne({
    where: {
      id: resetToken,
      email,
      verified: true,
      expiresAt: { [Op.gt]: new Date() }
    }
  });

  if (!otpRecord) {
    throw new Error('Invalid or expired reset token');
  }

  if (otpRecord.used === true) {
    throw new Error('This reset token has already been used');
  }

  const user = await User.findOne({ where: { email } });

  if (!user) {
    throw new Error('User not found');
  }

  await user.update({ password: newPassword });
  await otpRecord.update({ used: true });
  await OTP.destroy({ where: { email } });

  return {
    message: 'Password reset successfully',
  };
};

module.exports = {
  registerUser,
  loginUser,
  loginInternalUser,
  getUserProfile,
  updateUserProfile,
  getUser,
  getAllUsers,
  deleteUser,
  bulkDeleteUser,
  updateUser,
  createUser,
  bulkUserUpdate,
  getDashboardStats,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
};