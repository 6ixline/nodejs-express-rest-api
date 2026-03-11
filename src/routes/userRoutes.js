const express = require('express');
const router = express.Router();
const { 
  getUserProfile, 
  updateUserProfile, 
  loginUser, 
  registerUser, 
  logoutUser, 
  refreshUserToken, 
  getUserProperties,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword
} = require('../controllers/userController');
const isAuthenticated = require('../middlewares/authMiddleware');

// User Login Route
router.post('/login', loginUser);

// User registration route
router.post('/register', registerUser);

// Refresh token
router.post('/refresh-token', refreshUserToken);

// User Logout Route
router.post('/logout', logoutUser);

// ========== FORGOT PASSWORD ROUTES ==========
// Step 1: Request OTP
router.post('/forgot-password', requestPasswordReset);

// Step 2: Verify OTP
router.post('/verify-otp', verifyPasswordResetOTP);

// Step 3: Reset password
router.post('/reset-password', resetPassword);

// ========== AUTHENTICATED ROUTES ==========
// Route to get user profile (requires authentication)
router.get('/profile', isAuthenticated, getUserProfile);

// Route to update user profile (requires authentication)
router.put('/profile', isAuthenticated, updateUserProfile);

// Get user properties
router.get('/property', isAuthenticated, getUserProperties);

module.exports = router;