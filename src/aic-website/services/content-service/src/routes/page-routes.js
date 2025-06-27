const express = require('express');
const router = express.Router();

const {
  createPage,
  getAllPages,
  getPage,
  updatePage,
  deletePage,
  getNavigation,
} = require('../controllers/page-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Public routes
router.get('/', getAllPages);
router.get('/navigation', getNavigation);
router.get('/:id', getPage);

// Routes that require authentication
router.use(authenticateUser);

// Create page - restricted to admin and editor roles
router.post(
  '/',
  authorizePermissions('admin', 'editor'),
  createPage
);

// Update and delete page - handled in controller with specific permissions
router.patch('/:id', updatePage);
router.delete('/:id', deletePage);

module.exports = router;
