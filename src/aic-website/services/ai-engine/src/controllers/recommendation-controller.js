const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const Recommendation = require('../models/recommendation');
const UserEmbedding = require('../models/user-embedding');
const ContentEmbedding = require('../models/content-embedding');
const { publishAiEvent } = require('../events/ai-events');
const { 
  getContentRecommendations,
  getPersonalizedRecommendations,
  getSimilarItems,
  getUserSegments,
  updateUserEmbedding,
  updateContentEmbedding
} = require('../services/recommendation-service');

// Get content recommendations for a user
const getRecommendationsForUser = async (req, res) => {
  const { userId } = req.params;
  const { type, count = 5, context } = req.query;
  
  // Validate type
  if (!type || !['content', 'product', 'service', 'lead'].includes(type)) {
    throw new BadRequestError('Valid recommendation type is required');
  }
  
  try {
    // Check if we have recent recommendations for this user and type
    const existingRecommendation = await Recommendation.findOne({
      userId,
      type,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
    
    if (existingRecommendation) {
      // Return existing recommendations
      return res.status(StatusCodes.OK).json({
        recommendations: existingRecommendation.items.slice(0, Number(count)),
        fromCache: true,
        algorithm: existingRecommendation.algorithm,
        isPersonalized: existingRecommendation.isPersonalized,
      });
    }
    
    // Get user embedding
    const userEmbedding = await UserEmbedding.findOne({ userId });
    
    let recommendations;
    let algorithm;
    let isPersonalized = false;
    
    if (userEmbedding) {
      // Generate personalized recommendations
      recommendations = await getPersonalizedRecommendations(
        userEmbedding,
        type,
        Number(count),
        context ? JSON.parse(context) : undefined
      );
      algorithm = 'collaborative-filtering';
      isPersonalized = true;
    } else {
      // Generate non-personalized recommendations
      recommendations = await getContentRecommendations(
        type,
        Number(count),
        context ? JSON.parse(context) : undefined
      );
      algorithm = 'content-based';
    }
    
    // Store recommendations
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24); // Expire in 24 hours
    
    const recommendationRecord = await Recommendation.create({
      userId,
      type,
      items: recommendations,
      context: context ? JSON.parse(context) : {},
      algorithm,
      expiresAt: expirationDate,
      isPersonalized,
    });
    
    // Publish event
    await publishAiEvent('recommendation.generated', {
      recommendationId: recommendationRecord._id.toString(),
      userId,
      type,
      algorithm,
      isPersonalized,
      itemCount: recommendations.length,
    });
    
    res.status(StatusCodes.OK).json({
      recommendations,
      fromCache: false,
      algorithm,
      isPersonalized,
    });
  } catch (error) {
    logger.error(`Error generating recommendations: ${error.message}`, { error });
    throw error;
  }
};

// Get similar items
const getSimilarItemsById = async (req, res) => {
  const { itemId } = req.params;
  const { type, count = 5 } = req.query;
  
  // Validate type
  if (!type || !['article', 'page', 'product', 'service'].includes(type)) {
    throw new BadRequestError('Valid item type is required');
  }
  
  try {
    // Find content embedding
    const contentEmbedding = await ContentEmbedding.findOne({
      contentId: itemId,
      contentType: type,
    });
    
    if (!contentEmbedding) {
      throw new NotFoundError(`No embedding found for ${type} with id ${itemId}`);
    }
    
    // Get similar items
    const similarItems = await getSimilarItems(
      contentEmbedding,
      Number(count)
    );
    
    res.status(StatusCodes.OK).json({
      similarItems,
    });
  } catch (error) {
    logger.error(`Error finding similar items: ${error.message}`, { error });
    throw error;
  }
};

// Track user interaction for recommendation improvement
const trackUserInteraction = async (req, res) => {
  const { userId } = req.params;
  const { itemId, itemType, interactionType } = req.body;
  
  if (!itemId || !itemType || !interactionType) {
    throw new BadRequestError('itemId, itemType, and interactionType are required');
  }
  
  // Validate interaction type
  if (!['view', 'like', 'comment', 'share', 'purchase', 'click'].includes(interactionType)) {
    throw new BadRequestError('Invalid interaction type');
  }
  
  try {
    // Find or create user embedding
    let userEmbedding = await UserEmbedding.findOne({ userId });
    
    if (!userEmbedding) {
      userEmbedding = await UserEmbedding.create({
        userId,
        embedding: Array(128).fill(0), // Initial embedding
        interactionHistory: [],
        preferences: {},
        segments: [],
      });
    }
    
    // Add interaction to history
    userEmbedding.interactionHistory.push({
      itemId,
      itemType,
      interactionType,
      timestamp: new Date(),
    });
    
    // Update last updated timestamp
    userEmbedding.lastUpdated = new Date();
    
    // Save user embedding
    await userEmbedding.save();
    
    // Update user embedding asynchronously
    updateUserEmbedding(userId).catch(err => {
      logger.error(`Error updating user embedding: ${err.message}`, { err });
    });
    
    // Publish event
    await publishAiEvent('recommendation.interaction-tracked', {
      userId,
      itemId,
      itemType,
      interactionType,
    });
    
    res.status(StatusCodes.OK).json({
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    logger.error(`Error tracking user interaction: ${error.message}`, { error });
    throw error;
  }
};

// Get user segments
const getUserSegmentsById = async (req, res) => {
  const { userId } = req.params;
  
  try {
    // Find user embedding
    const userEmbedding = await UserEmbedding.findOne({ userId });
    
    if (!userEmbedding) {
      // Generate segments for new user
      const segments = await getUserSegments(userId);
      
      return res.status(StatusCodes.OK).json({
        segments,
        isNew: true,
      });
    }
    
    // Return existing segments or generate new ones if empty
    if (!userEmbedding.segments || userEmbedding.segments.length === 0) {
      const segments = await getUserSegments(userId);
      
      // Update user embedding with segments
      userEmbedding.segments = segments;
      await userEmbedding.save();
      
      return res.status(StatusCodes.OK).json({
        segments,
        isNew: true,
      });
    }
    
    res.status(StatusCodes.OK).json({
      segments: userEmbedding.segments,
      isNew: false,
    });
  } catch (error) {
    logger.error(`Error getting user segments: ${error.message}`, { error });
    throw error;
  }
};

// Update content embedding
const updateContentEmbeddingById = async (req, res) => {
  const { contentId } = req.params;
  const { contentType, content, metadata } = req.body;
  
  if (!contentType || !content) {
    throw new BadRequestError('contentType and content are required');
  }
  
  // Validate content type
  if (!['article', 'page', 'product', 'service'].includes(contentType)) {
    throw new BadRequestError('Invalid content type');
  }
  
  try {
    // Update content embedding
    const result = await updateContentEmbedding(contentId, contentType, content, metadata);
    
    // Publish event
    await publishAiEvent('recommendation.content-embedding-updated', {
      contentId,
      contentType,
    });
    
    res.status(StatusCodes.OK).json({
      message: 'Content embedding updated successfully',
      contentId,
      contentType,
      dimensions: result.embedding.length,
    });
  } catch (error) {
    logger.error(`Error updating content embedding: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  getRecommendationsForUser,
  getSimilarItemsById,
  trackUserInteraction,
  getUserSegmentsById,
  updateContentEmbeddingById,
};
