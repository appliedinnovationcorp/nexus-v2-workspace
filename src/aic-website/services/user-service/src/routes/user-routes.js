const express = require('express');
const router = express.Router();

const {
  getAllUsers,
  getUser,
  updateUser,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getCurrentUser,
  updatePassword,
} = require('../controllers/user-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Routes that require authentication
router.use(authenticateUser);

// Current user routes
router.route('/me').get(getCurrentUser);
router.route('/update-password').patch(updatePassword);

// Admin only routes
router.route('/').get(authorizePermissions('admin'), getAllUsers);
router.route('/:id/role').patch(authorizePermissions('admin'), updateUserRole);
router.route('/:id/status').patch(authorizePermissions('admin'), updateUserStatus);

// User specific routes
router.route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
