const express = require('express');
const router = express.Router();
const { 
    DashboardController
} = require("../../controllers/admin");
const isAdmin = require('../../middlewares/adminMiddleware');

// Get all users for the admin panel
router.get('/', isAdmin, DashboardController.getDashboardStats);

module.exports = router;