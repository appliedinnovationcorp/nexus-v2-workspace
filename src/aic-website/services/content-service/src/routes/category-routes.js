const express = require('express');
const router = express.Router();

const {
  createCategory,
  getAllCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getArticlesByCategory,
} = require('../controllers/category-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Public routes
router.get('/', getAllCategories);
router.get('/tree', getCategoryTree);
router.get('/:id', getCategory);
router.get('/:id/articles', getArticlesByCategory);

// Routes that require authentication
router.use(authenticateUser);

// Create, update, delete category - restricted to admin and editor roles
router.post(
  '/',
  authorizePermissions('admin', 'editor'),
  createCategory
);

router.patch(
  '/:id',
  authorizePermissions('admin', 'editor'),
  updateCategory
);

router.delete(
  '/:id',
  authorizePermissions('admin', 'editor'),
  deleteCategory
);

module.exports = router;
