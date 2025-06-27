const express = require('express');
const router = express.Router();

const {
  getRecommendationsForUser,
  getSimilarItemsById,
  trackUserInteraction,
  getUserSegmentsById,
  updateContentEmbeddingById,
} = require('../controllers/recommendation-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// All routes require authentication
router.use(authenticateUser);

// Recommendation endpoints
router.get('/user/:userId', getRecommendationsForUser);
router.get('/similar/:itemId', getSimilarItemsById);
router.post('/track/:userId', trackUserInteraction);
router.get('/segments/:userId', getUserSegmentsById);

// Content embedding update requires admin or editor role
router.post(
  '/content/:contentId',
  authorizePermissions('admin', 'editor'),
  updateContentEmbeddingById
);

module.exports = router;
