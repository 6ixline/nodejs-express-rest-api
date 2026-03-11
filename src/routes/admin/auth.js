const express = require('express');
const router = express.Router();
const { 
    AuthController,
} = require("../../controllers/admin");
const isAdmin = require('../../middlewares/adminMiddleware');

// Admin login route
router.post('/login', AuthController.loginAdmin);
// Admin logout route
router.post('/logout', AuthController.logoutAdmin);

// Admin Account Details
router.get('/me', isAdmin, AuthController.accessTokenDetails);

// Admin Change password
router.post('/change-password', isAdmin, AuthController.changePassword);


router.post('/refresh-token', AuthController.refreshAdminToken);

// Admin create new user route (Super admin can create admin)
router.post('/create', AuthController.createAdmin);

module.exports = router;