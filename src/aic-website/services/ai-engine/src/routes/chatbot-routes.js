const express = require('express');
const router = express.Router();

const {
  chatWithBot,
  getConversationHistory,
  endConversation,
  getUserConversations,
} = require('../controllers/chatbot-controller');

const {
  authenticateUser,
  authorizePermissions,
} = require('../middleware/authentication');

// Chat endpoint - no authentication required for public chatbot
router.post('/chat', chatWithBot);

// All other routes require authentication
router.use(authenticateUser);

// Conversation management endpoints
router.get('/conversation/:sessionId', getConversationHistory);
router.post('/conversation/:sessionId/end', endConversation);

// User conversations - admin can see all, users can only see their own
router.get(
  '/user/:userId/conversations',
  authorizePermissions('admin'),
  getUserConversations
);

// Current user conversations
router.get('/conversations', (req, res, next) => {
  req.params.userId = req.user.userId;
  next();
}, getUserConversations);

module.exports = router;
