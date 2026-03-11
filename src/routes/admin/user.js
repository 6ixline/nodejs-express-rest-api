const express = require('express');
const router = express.Router();
const isAdmin = require("../../middlewares/adminMiddleware");
const { 
    UserController
} = require("../../controllers/admin");

// Get all users for the admin panel
router.get('/', isAdmin, UserController.getAllUsers);
// Get all users for the admin panel
router.get('/:id', isAdmin, UserController.getUser);
// bulk Delete User
router.delete('/bulk', isAdmin, UserController.bulkDeleteUser);
// route for an admin to delete a user
router.delete('/:id', isAdmin, UserController.deleteUser);
// route for an admin to update a user
router.put('/:id', isAdmin, UserController.updateUser);
// route for an admin to create a user
router.post('/', isAdmin, UserController.createUser);
// route for bulk user update
router.patch('/', isAdmin, UserController.bulkUserUpdate);


module.exports = router;
