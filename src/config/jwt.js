const jwt = require('jsonwebtoken');
require('dotenv').config();

//
// ========== ACCESS TOKEN ==========
//

// Generate access token for Admin
const generateAdminAccessToken = (admin) => {
  const payload = {
    id: admin.id,
    name: admin.displayName,
    username: admin.username,
    role: admin.role,
  };

  return jwt.sign(payload, process.env.JWT_ADMIN_SECRET, { expiresIn: '15m' });
};

// Verify admin access token
const verifyAdminAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ADMIN_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired admin access token');
  }
};

// Generate access token for User
const generateUserAccessToken = (user) => {
  const payload = {
    id: user.id,
    role: user.role
  };

  return jwt.sign(payload, process.env.JWT_USER_SECRET, { expiresIn: '15m' });
};

// Verify user access token
const verifyUserAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_USER_SECRET);
  } catch (err) {
    throw new Error('Invalid or expired user access token');
  }
};

//
// ========== REFRESH TOKEN ==========
//

// Generate refresh token for Admin
const generateAdminRefreshToken = (admin, rememberMe = false) => {
  const payload = {
    id: admin.id,
    role: admin.role
  };

  const expiresIn = rememberMe ? '30d' : '1d';

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET_ADMIN, { expiresIn });
};

// Verify refresh token for Admin
const verifyAdminRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET_ADMIN);
  } catch (err) {
    throw new Error('Invalid or expired admin refresh token');
  }
};

// Generate refresh token for User
const generateUserRefreshToken = (user, rememberMe = false) => {
  const payload = {
    id: user.id,
    role: user.role
  };

  const expiresIn = rememberMe ? '30d' : '1d';

  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET_USER, { expiresIn });
};

// Verify refresh token for User
const verifyUserRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET_USER);
  } catch (err) {
    throw new Error('Invalid or expired user refresh token');
  }
};

module.exports = {
  generateAdminAccessToken,
  verifyAdminAccessToken,
  generateUserAccessToken,
  verifyUserAccessToken,
  generateAdminRefreshToken,
  verifyAdminRefreshToken,
  generateUserRefreshToken,
  verifyUserRefreshToken,
};