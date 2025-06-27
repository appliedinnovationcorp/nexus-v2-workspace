const express = require('express');
const router = express.Router();

const {
  detectImageObjects,
  classifyImageContent,
  captionImage,
  detectImageFaces,
  extractImageText,
  analyzeImageContent,
  getImageEmbeddings,
} = require('../controllers/vision-controller');

const {
  authenticateUser,
} = require('../middleware/authentication');

// All routes require authentication
router.use(authenticateUser);

// Vision endpoints
router.post('/objects', detectImageObjects);
router.post('/classify', classifyImageContent);
router.post('/caption', captionImage);
router.post('/faces', detectImageFaces);
router.post('/ocr', extractImageText);
router.post('/safety', analyzeImageContent);
router.post('/embeddings', getImageEmbeddings);

module.exports = router;
