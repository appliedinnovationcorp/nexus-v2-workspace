const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const ChatbotConversation = require('../models/chatbot-conversation');
const { publishAiEvent } = require('../events/ai-events');
const { 
  generateChatbotResponse,
  analyzeUserIntent,
  getContextualInformation,
  generateFollowupQuestions
} = require('../services/chatbot-service');
const { v4: uuidv4 } = require('uuid');

// Start or continue a chatbot conversation
const chatWithBot = async (req, res) => {
  const { sessionId, message, context } = req.body;
  
  if (!message) {
    throw new BadRequestError('Message is required');
  }
  
  try {
    let conversation;
    let isNewSession = false;
    
    // Find or create conversation
    if (sessionId) {
      conversation = await ChatbotConversation.findOne({ sessionId });
      
      if (!conversation) {
        throw new NotFoundError(`No conversation found with sessionId: ${sessionId}`);
      }
    } else {
      // Create new conversation
      const newSessionId = uuidv4();
      conversation = await ChatbotConversation.create({
        userId: req.user?.userId,
        sessionId: newSessionId,
        messages: [],
        context: context || {},
        status: 'active',
        source: req.body.source || 'website',
      });
      isNewSession = true;
    }
    
    // Analyze user intent
    const intentAnalysis = await analyzeUserIntent(message, conversation.messages);
    
    // Get contextual information based on intent
    const contextualInfo = await getContextualInformation(intentAnalysis, conversation.context);
    
    // Add user message to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
      metadata: {
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
      },
    });
    
    // Generate response
    const startTime = Date.now();
    const response = await generateChatbotResponse(
      message,
      conversation.messages,
      {
        ...conversation.context,
        ...contextualInfo,
      }
    );
    const processingTime = Date.now() - startTime;
    
    // Generate follow-up questions
    const followupQuestions = await generateFollowupQuestions(
      message,
      response,
      intentAnalysis
    );
    
    // Add bot response to conversation
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      metadata: {
        processingTime,
        followupQuestions,
      },
    });
    
    // Update conversation
    conversation.lastActivity = new Date();
    await conversation.save();
    
    // Publish event
    await publishAiEvent('chatbot.message-processed', {
      sessionId: conversation.sessionId,
      userId: conversation.userId,
      intent: intentAnalysis.intent,
      messageCount: conversation.messages.length,
    });
    
    res.status(StatusCodes.OK).json({
      sessionId: conversation.sessionId,
      response,
      followupQuestions,
      isNewSession,
      processingTime,
    });
  } catch (error) {
    logger.error(`Error in chatbot conversation: ${error.message}`, { error });
    throw error;
  }
};

// Get conversation history
const getConversationHistory = async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const conversation = await ChatbotConversation.findOne({ sessionId });
    
    if (!conversation) {
      throw new NotFoundError(`No conversation found with sessionId: ${sessionId}`);
    }
    
    // Check if user is authorized to access this conversation
    if (conversation.userId && 
        req.user.role !== 'admin' && 
        conversation.userId.toString() !== req.user.userId) {
      throw new ForbiddenError('Not authorized to access this conversation');
    }
    
    res.status(StatusCodes.OK).json({
      conversation,
    });
  } catch (error) {
    logger.error(`Error getting conversation history: ${error.message}`, { error });
    throw error;
  }
};

// End a conversation
const endConversation = async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const conversation = await ChatbotConversation.findOne({ sessionId });
    
    if (!conversation) {
      throw new NotFoundError(`No conversation found with sessionId: ${sessionId}`);
    }
    
    // Check if user is authorized to modify this conversation
    if (conversation.userId && 
        req.user.role !== 'admin' && 
        conversation.userId.toString() !== req.user.userId) {
      throw new ForbiddenError('Not authorized to modify this conversation');
    }
    
    // Update conversation status
    conversation.status = 'completed';
    await conversation.save();
    
    // Publish event
    await publishAiEvent('chatbot.conversation-ended', {
      sessionId,
      userId: conversation.userId,
      messageCount: conversation.messages.length,
    });
    
    res.status(StatusCodes.OK).json({
      message: 'Conversation ended successfully',
      sessionId,
    });
  } catch (error) {
    logger.error(`Error ending conversation: ${error.message}`, { error });
    throw error;
  }
};

// Get user conversations
const getUserConversations = async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  
  try {
    // Build query
    const query = { userId };
    
    if (status) {
      query.status = status;
    }
    
    // Pagination
    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const skip = (pageNumber - 1) * pageSize;
    
    // Get conversations
    const conversations = await ChatbotConversation.find(query)
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(pageSize)
      .select('sessionId status lastActivity createdAt messages');
    
    // Get total count
    const totalConversations = await ChatbotConversation.countDocuments(query);
    const numOfPages = Math.ceil(totalConversations / pageSize);
    
    // Format conversations for response
    const formattedConversations = conversations.map(conv => ({
      sessionId: conv.sessionId,
      status: conv.status,
      lastActivity: conv.lastActivity,
      createdAt: conv.createdAt,
      messageCount: conv.messages.length,
      preview: conv.messages.length > 0 ? 
        conv.messages[conv.messages.length - 1].content.substring(0, 100) : '',
    }));
    
    res.status(StatusCodes.OK).json({
      conversations: formattedConversations,
      count: conversations.length,
      totalConversations,
      numOfPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    logger.error(`Error getting user conversations: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  chatWithBot,
  getConversationHistory,
  endConversation,
  getUserConversations,
};
