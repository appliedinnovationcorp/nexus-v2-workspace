const express = require('express');
const router = express.Router();

const {
  createTag,
  getAllTags,
  getTag,
  updateTag,
  deleteTag,
  getArticlesByTag,
  getPopularTags,
} = require('../controllers/tag-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Public routes
router.get('/', getAllTags);
router.get('/popular', getPopularTags);
router.get('/:id', getTag);
router.get('/:id/articles', getArticlesByTag);

// Routes that require authentication
router.use(authenticateUser);

// Create, update, delete tag - restricted to admin and editor roles
router.post(
  '/',
  authorizePermissions('admin', 'editor'),
  createTag
);

router.patch(
  '/:id',
  authorizePermissions('admin', 'editor'),
  updateTag
);

router.delete(
  '/:id',
  authorizePermissions('admin', 'editor'),
  deleteTag
);

module.exports = router;
