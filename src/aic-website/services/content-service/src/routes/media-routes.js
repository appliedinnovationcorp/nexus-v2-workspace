const express = require('express');
const router = express.Router();

const {
  uploadMiddleware,
  uploadMedia,
  getAllMedia,
  getMedia,
  updateMedia,
  deleteMedia,
} = require('../controllers/media-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// All media routes require authentication
router.use(authenticateUser);

// Get all media
router.get('/', getAllMedia);

// Get single media
router.get('/:id', getMedia);

// Upload media
router.post('/', uploadMiddleware, uploadMedia);

// Update media metadata
router.patch('/:id', updateMedia);

// Delete media
router.delete('/:id', deleteMedia);

module.exports = router;
