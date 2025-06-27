const express = require('express');
const router = express.Router();

const {
  analyzeSentiment,
  extractEntities,
  extractKeywords,
  summarizeText,
  detectLanguage,
  classifyText,
  getTextEmbeddings,
} = require('../controllers/nlp-controller');

const {
  authenticateUser,
} = require('../middleware/authentication');

// All routes require authentication
router.use(authenticateUser);

// NLP endpoints
router.post('/sentiment', analyzeSentiment);
router.post('/entities', extractEntities);
router.post('/keywords', extractKeywords);
router.post('/summarize', summarizeText);
router.post('/language', detectLanguage);
router.post('/classify', classifyText);
router.post('/embeddings', getTextEmbeddings);

module.exports = router;
