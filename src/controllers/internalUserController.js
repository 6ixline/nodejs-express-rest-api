const { UserService } = require('../services');
const logger = require('../config/logger');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { formatSequelizeErrors } = require('../utils/validation');
const { generateUserAccessToken, generateUserRefreshToken, verifyUserRefreshToken } = require('../config/jwt');
const { RefreshToken } = require('../models');

/**
 * Internal User Login
 * Web platform only - strictly enforced to role: internal via the service layer
 */
const loginInternalUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { user, token, refreshToken } = await UserService.loginInternalUser(email, password);

    // Set access token cookie (shorter lived - 8 hours for in-factory web sessions)
    res.cookie('internal_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours (factory shift duration)
      path: '/',
    });

    // Set refresh token cookie (7 days - web sessions don't need 30 days)
    res.cookie('internal_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: refreshToken,
      type: 'internal',
      userId: user.id,
      expiresAt,
    });

    logger.info(`Internal user ${email} logged in successfully`);

    return successResponse(res, 200, `Logged in successfully`, { user, token, refreshToken });
  } catch (err) {
    logger.error(`Internal login failed for ${email}: ${err.message}`);
    return errorResponse(res, 500, err.message);
  }
};

/**
 * Refresh token for internal users
 */
const refreshInternalToken = async (req, res) => {
  try {
    const refreshToken = req.cookies?.internal_refresh_token || req.body?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    const decoded = verifyUserRefreshToken(refreshToken);

    // Ensure the token belongs to an internal user (double safety check)
    if (decoded.role !== 'internal') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tokenRecord = await RefreshToken.findOne({
      where: {
        token: refreshToken,
        userId: decoded.id,
        type: 'internal',
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!tokenRecord) {
      return res.status(403).json({ message: 'Invalid or expired refresh token' });
    }

    // Rotate refresh token
    await tokenRecord.destroy();

    const newAccessToken = generateUserAccessToken({ id: decoded.id, role: decoded.role });
    const newRefreshToken = generateUserRefreshToken({ id: decoded.id, role: decoded.role  }, false);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: newRefreshToken,
      type: 'internal',
      userId: decoded.id,
      expiresAt,
    });

    res.cookie('internal_token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 8 * 60 * 60 * 1000,
    });

    res.cookie('internal_refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`Token refreshed successfully for internal user ID ${decoded.id}`);

    return successResponse(res, 200, 'Refreshed Token Successfully', {
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    logger.error(`Token refresh failed for internal user: ${err.message}`);
    return errorResponse(res, 401, 'Unauthorized', err.message);
  }
};

/**
 * Logout internal user
 */
const logoutInternalUser = async (req, res) => {
  try {
    res.cookie('internal_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    });

    res.cookie('internal_refresh_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    });

    const refreshToken = req.cookies?.internal_refresh_token || req.body?.refreshToken;
    if (refreshToken) {
      await RefreshToken.destroy({ where: { token: refreshToken } });
    }

    logger.info(`Internal user logged out successfully`);

    return successResponse(res, 200, 'Logged out successfully');
  } catch (err) {
    logger.error(`Logout failed for internal user: ${err.message}`);
    return errorResponse(res, 500, 'Logout failed', err.message);
  }
};

/**
 * Get internal user profile
 */
const getInternalUserProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await UserService.getUserProfile(userId);
    return successResponse(res, 200, 'Profile Fetched Successfully', user);
  } catch (err) {
    logger.error(`Error fetching internal user profile for ID ${userId}: ${err.message}`);
    return errorResponse(res, 500, 'Error fetching profile', err.message);
  }
};

/**
 * Update internal user profile
 */
const updateInternalUserProfile = async (req, res) => {
  const userId = req.user.id;
  const { name, email, mobile, fileid } = req.body;

  try {
    const updatedUser = await UserService.updateUserProfile(userId, name, email, mobile, fileid);
    return successResponse(res, 200, 'Profile Updated Successfully', updatedUser);
  } catch (err) {
    logger.error(`Error updating internal user profile for ID ${userId}: ${err.message}`);
    let message = formatSequelizeErrors(err);
    return errorResponse(res, 500, err.message, message);
  }
};

/**
 * Request password reset OTP (internal users)
 */
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return errorResponse(res, 400, 'Email is required');
    }

    const result = await UserService.requestPasswordReset(email);

    logger.info(`Password reset OTP requested for internal user: ${email}`);

    return successResponse(res, 200, result.message, {
      expiresIn: result.expiresIn
    });
  } catch (err) {
    logger.error(`Error requesting password reset for internal user ${email}: ${err.message}`);

    if (err.message === 'No account found with this email address') {
      return successResponse(res, 200, 'If an account exists with this email, an OTP has been sent');
    }

    return errorResponse(res, 400, err.message);
  }
};

/**
 * Verify OTP (internal users)
 */
const verifyPasswordResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and OTP are required');
    }

    const result = await UserService.verifyPasswordResetOTP(email, otp);

    logger.info(`OTP verified successfully for internal user: ${email}`);

    return successResponse(res, 200, result.message, {
      resetToken: result.resetToken
    });
  } catch (err) {
    logger.error(`Error verifying OTP for internal user ${email}: ${err.message}`);
    return errorResponse(res, 400, err.message);
  }
};

/**
 * Reset password (internal users)
 */
const resetPassword = async (req, res) => {
  const { email, resetToken, newPassword } = req.body;

  try {
    if (!email || !resetToken || !newPassword) {
      return errorResponse(res, 400, 'Email, reset token, and new password are required');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'Password must be at least 6 characters long');
    }

    const result = await UserService.resetPassword(email, resetToken, newPassword);

    logger.info(`Password reset successfully for internal user: ${email}`);

    return successResponse(res, 200, result.message);
  } catch (err) {
    logger.error(`Error resetting password for internal user ${email}: ${err.message}`);
    return errorResponse(res, 400, err.message);
  }
};

module.exports = {
  loginInternalUser,
  refreshInternalToken,
  logoutInternalUser,
  getInternalUserProfile,
  updateInternalUserProfile,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
};