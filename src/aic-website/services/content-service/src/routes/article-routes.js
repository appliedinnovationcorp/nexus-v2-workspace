const express = require('express');
const router = express.Router();

const {
  createArticle,
  getAllArticles,
  getArticle,
  updateArticle,
  deleteArticle,
  addComment,
  updateCommentStatus,
  likeArticle,
  getRelatedArticles,
} = require('../controllers/article-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Public routes
router.get('/', getAllArticles);
router.get('/:id', getArticle);
router.get('/:id/related', getRelatedArticles);

// Routes that require authentication
router.use(authenticateUser);

// Create article - restricted to admin, editor, and author roles
router.post(
  '/',
  authorizePermissions('admin', 'editor', 'author'),
  createArticle
);

// Update and delete article - handled in controller with specific permissions
router.patch('/:id', updateArticle);
router.delete('/:id', deleteArticle);

// Comment routes
router.post('/:id/comments', addComment);
router.patch(
  '/:id/comments/:commentId',
  authorizePermissions('admin', 'editor'),
  updateCommentStatus
);

// Like article
router.post('/:id/like', likeArticle);

module.exports = router;
