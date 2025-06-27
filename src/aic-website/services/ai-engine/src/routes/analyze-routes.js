const express = require('express');
const router = express.Router();

const {
  analyzeLead,
  analyzeContent,
  analyzeUser,
  suggestContent,
  detectDataAnomalies,
  getAnalysisById,
} = require('../controllers/analyze-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// All routes require authentication
router.use(authenticateUser);

// Analysis endpoints
router.post('/lead', analyzeLead);
router.post('/content', analyzeContent);
router.post('/user', analyzeUser);
router.post('/suggest', suggestContent);
router.post('/anomalies', detectDataAnomalies);
router.get('/:id', getAnalysisById);

module.exports = router;
