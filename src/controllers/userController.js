const { UserService } = require('../services');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { formatSequelizeErrors } = require('../utils/validation');
const { generateUserAccessToken, generateUserRefreshToken, verifyUserRefreshToken } = require('../config/jwt');
const { RefreshToken } = require('../models');

// User registration - Fixed expiry times
const registerUser = async (req, res) => {
  const { name, email, mobile, password, role = 'normal', status } = req.body;

  try {
    const { user, token, refreshToken } = await UserService.registerUser(name, email, mobile, password, role, status);

    // Set the access token as HttpOnly cookie
    res.cookie('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });

    // Set the refresh token as HttpOnly cookie (30 days)
    res.cookie('user_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (fixed)

    await RefreshToken.create({
      token: refreshToken,
      type: 'user',
      userId: user.id,
      expiresAt,
    });

    logger.info(`User ${email} registered successfully`);

    // Return tokens in response for mobile apps
    return successResponse(res, 200, `User ${name} registered successfully`, { 
      user, 
      token, 
      refreshToken 
    });
  } catch (err) {
    let messages = formatSequelizeErrors(err);
    logger.error(`Error registering user: ${err.message}`);
    return errorResponse(res, 500, err.message, messages);
  }
};

// User login - Fixed expiry times
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, token, refreshToken } = await UserService.loginUser(email, password);

    // Set the access token as HttpOnly cookie
    res.cookie('user_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', 
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });

    // Set refresh token cookie (30 days)
    res.cookie('user_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: '/',
    });

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days (fixed)

    await RefreshToken.create({
      token: refreshToken,
      type: 'user',
      userId: user.id,
      expiresAt,
    });

    // Return tokens in response for mobile apps
    return successResponse(res, 200, `User ${email} logged in successfully`, { 
      user, 
      token, 
      refreshToken 
    });
  } catch (err) {
    logger.error(`Login failed for user ${email}: ${err.message}`);
    return errorResponse(res, 500, err.message);
  }
};

// Refresh token - Support both cookies and request body
const refreshUserToken = async (req, res) => {
  try {
    // Check both cookies and request body for refresh token (Android compatibility)
    const refreshToken = req.cookies?.user_refresh_token || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = verifyUserRefreshToken(refreshToken);

    const tokenRecord = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        userId: decoded.id,
        type: 'user',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // Rotate refresh token
    await tokenRecord.destroy();

    const newAccessToken = generateUserAccessToken({ id: decoded.id, role: decoded.role });
    const newRefreshToken = generateUserRefreshToken({ id: decoded.id }, false);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await RefreshToken.create({
      token: newRefreshToken,
      type: 'user',
      userId: decoded.id,
      expiresAt,
    });

    // Set cookies for web/iOS
    res.cookie('user_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.cookie('user_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    logger.info(`Token refreshed successfully for user ID ${decoded.id}`);

    // Return tokens in response body for mobile apps (Android)
    return successResponse(res, 200, 'Refreshed Token Successfully', { 
      token: newAccessToken,
      refreshToken: newRefreshToken 
    });
  } catch (err) {
    logger.error(`Token refresh failed: ${err.message}`);
    return errorResponse(res, 401, 'Unauthorized', err.message);
  }
};

// Logout - Fixed cookie clearing
const logoutUser = async (req, res) => {
  try {
    // Clear access token cookie
    res.cookie('user_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    });
    
    // Clear refresh token cookie
    res.cookie('user_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    });
    
    // Delete refresh token from database (check both cookie and body)
    const refreshToken = req.cookies?.user_refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
    }

    logger.info(`User logged out successfully`);

    return successResponse(res, 200, 'Logged out successfully');
  } catch (err) {
    logger.error(`Logout failed: ${err.message}`);
    return errorResponse(res, 500, 'Logout failed', err.message);
  }
};

// Get user profile (Only the logged-in user can view their profile)
const getUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await UserService.getUserProfile(userId);
    return successResponse(res, 200, 'User Fetched Successfully', user);
  } catch (err) {
    logger.error(`Error fetching user profile for user ID ${userId}: ${err.message}`);
    return errorResponse(res, 500, `Error fetchig user profile `, err.message);
  }
};

// Update user profile (Only the logged-in user can update their own profile)
const updateUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email, mobile, fileid } = req.body;

  try {
    const updatedUser = await UserService.updateUserProfile(userId, name, email, mobile, fileid);
    return successResponse(res, 200, 'Profile Updated Successfully', updatedUser);
  } catch (err) {
    logger.error(`Error updating user profile for user ID ${userId}: ${err.message}`);
    let message = formatSequelizeErrors(err);
    return errorResponse(res, 500, err.message, message);
  }
};

// Get properties owned by the user
const getUserProperties = async (req, res) => {
  const userId = req.user.id;

  try {
    const properties = await UserService.getUserProperties(userId);
    if (properties.length === 0) {
      return errorResponse(res, 404, 'No properties found for this user');
    }
    return successResponse(res, 200, 'Property Fetched Succesfully!', properties);
  } catch (err) {
    logger.error(`Error fetching properties for user ID ${userId}: ${err.message}`);
    return errorResponse(res, 500, "Error fetching properties!", err.message);
  }
};

// Get a specific property owned by the user (for managing a single property)
const getUserPropertyById = async (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;

  try {
    const property = await UserService.getUserPropertyById(userId, propertyId);
    return successResponse(res, 200, 'Property Fetched Succesfully!', property);
  } catch (err) {
    logger.error(`Error fetching property ${propertyId} for user ID ${userId}: ${err.message}`);
    return errorResponse(res, 500, "Error fetching property!", err.message);
  }
};

// Update a user's property (Only the owner can update their property)
const updateUserProperty = async (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;
  const { title, description, price, location } = req.body;

  try {
    const updatedProperty = await UserService.updateUserProperty(userId, propertyId, title, description, price, location);
    return res.json({ message: 'Property updated successfully', property: updatedProperty });
  } catch (err) {
    logger.error(`Error updating property ${propertyId} for user ID ${userId}: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
};

// Delete a user's property (Only the owner can delete their property)
const deleteUserProperty = async (req, res) => {
  const userId = req.user.id;
  const { propertyId } = req.params;

  try {
    await UserService.deleteUserProperty(userId, propertyId);
    return res.json({ message: 'Property deleted successfully' });
  } catch (err) {
    logger.error(`Error deleting property ${propertyId} for user ID ${userId}: ${err.message}`);
    return res.status(500).json({ message: err.message });
  }
};

// Request password reset OTP
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return errorResponse(res, 400, 'Email is required');
    }

    const result = await UserService.requestPasswordReset(email);
    
    logger.info(`Password reset OTP requested for email: ${email}`);
    
    return successResponse(res, 200, result.message, {
      expiresIn: result.expiresIn
    });
  } catch (err) {
    logger.error(`Error requesting password reset for ${email}: ${err.message}`);
    
    // For security, we don't reveal if the email exists or not
    // But we still need to return an error response, not success
    if (err.message === 'No account found with this email address') {
      // Option 1: Don't reveal the email doesn't exist (more secure)
      return successResponse(res, 200, 'If an account exists with this email, an OTP has been sent');
      
      // Option 2: Reveal the error (less secure but better UX) - UNCOMMENT IF PREFERRED
      // return errorResponse(res, 404, 'No account found with this email address');
    }
    
    // For other errors (rate limiting, server errors), return actual error
    return errorResponse(res, 400, err.message);
  }
};

// Verify OTP
const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and OTP are required');
    }

    const result = await UserService.verifyPasswordResetOTP(email, otp);
    
    logger.info(`OTP verified successfully for email: ${email}`);
    
    return successResponse(res, 200, result.message, {
      resetToken: result.resetToken
    });
  } catch (err) {
    logger.error(`Error verifying OTP for ${email}: ${err.message}`);
    return errorResponse(res, 400, err.message);
  }
};

// Reset password
const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  try {
    if (!email || !resetToken || !newPassword) {
      return errorResponse(res, 400, 'Email, reset token, and new password are required');
    }

    // Password validation
    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long');
    }

    const result = await UserService.resetPassword(email, resetToken, newPassword);
    
    logger.info(`Password reset successfully for email: ${email}`);
    
    return successResponse(res, 200, result.message);
  } catch (err) {
    logger.error(`Error resetting password for ${email}: ${err.message}`);
    return errorResponse(res, 400, err.message);
  }
};

module.exports = {
  loginUser,
  refreshUserToken,
  logoutUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUserProperties,
  getUserPropertyById,
  updateUserProperty,
  deleteUserProperty,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
};
