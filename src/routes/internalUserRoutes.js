const express = require('express');
const router = express.Router();
const {
  loginInternalUser,
  refreshInternalToken,
  logoutInternalUser,
  getInternalUserProfile,
  updateInternalUserProfile,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
} = require('../controllers/internalUserController');
const isInternalUser = require('../middlewares/internalAuthMiddleware');

// Internal User Login
router.post('/login', loginInternalUser);

// Refresh token
router.post('/refresh-token', refreshInternalToken);

// Logout
router.post('/logout', logoutInternalUser);

// ========== FORGOT PASSWORD ROUTES ==========
// Step 1: Request OTP
router.post('/forgot-password', requestPasswordReset);

// Step 2: Verify OTP
router.post('/verify-otp', verifyPasswordResetOTP);

// Step 3: Reset password
router.post('/reset-password', resetPassword);

// ========== AUTHENTICATED ROUTES ==========
router.get('/profile', isInternalUser, getInternalUserProfile);

router.put('/profile', isInternalUser, updateInternalUserProfile);

module.exports = router;