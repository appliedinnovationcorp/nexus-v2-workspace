const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const Analysis = require('../models/analysis');
const { publishAiEvent } = require('../events/ai-events');
const { 
  performSentimentAnalysis,
  performEntityExtraction,
  performKeywordExtraction,
  performTextSummarization,
  performLanguageDetection,
  performTextClassification,
  generateEmbeddings
} = require('../services/nlp-service');

// Perform sentiment analysis on text
const analyzeSentiment = async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const sentimentResult = await performSentimentAnalysis(text);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        sentiment: sentimentResult,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('nlp.sentiment-analyzed', {
      analysisId: analysis._id.toString(),
      sentiment: sentimentResult.sentiment,
      score: sentimentResult.score,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      sentiment: sentimentResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in sentiment analysis: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Extract entities from text
const extractEntities = async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const entitiesResult = await performEntityExtraction(text);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        entities: entitiesResult,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('nlp.entities-extracted', {
      analysisId: analysis._id.toString(),
      entityCount: entitiesResult.length,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      entities: entitiesResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in entity extraction: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Extract keywords from text
const extractKeywords = async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const keywordsResult = await performKeywordExtraction(text);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        keywords: keywordsResult,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('nlp.keywords-extracted', {
      analysisId: analysis._id.toString(),
      keywordCount: keywordsResult.length,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      keywords: keywordsResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in keyword extraction: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Summarize text
const summarizeText = async (req, res) => {
  const { text, maxLength } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const summaryResult = await performTextSummarization(text, maxLength);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        summary: summaryResult,
        originalLength: text.length,
        summaryLength: summaryResult.length,
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('nlp.text-summarized', {
      analysisId: analysis._id.toString(),
      originalLength: text.length,
      summaryLength: summaryResult.length,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      summary: summaryResult,
      originalLength: text.length,
      summaryLength: summaryResult.length,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in text summarization: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Detect language
const detectLanguage = async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const languageResult = await performLanguageDetection(text);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        language: languageResult,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    res.status(StatusCodes.OK).json({
      language: languageResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in language detection: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Classify text
const classifyText = async (req, res) => {
  const { text, categories } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const classificationResult = await performTextClassification(text, categories);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        classification: classificationResult,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('nlp.text-classified', {
      analysisId: analysis._id.toString(),
      classification: classificationResult.category,
      confidence: classificationResult.confidence,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      classification: classificationResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in text classification: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Generate text embeddings
const getTextEmbeddings = async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    throw new BadRequestError('Text is required');
  }
  
  const startTime = Date.now();
  
  try {
    const embeddingsResult = await generateEmbeddings(text);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        embeddingDimensions: embeddingsResult.length,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    res.status(StatusCodes.OK).json({
      embedding: embeddingsResult,
      dimensions: embeddingsResult.length,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in text embedding generation: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'text',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

module.exports = {
  analyzeSentiment,
  extractEntities,
  extractKeywords,
  summarizeText,
  detectLanguage,
  classifyText,
  getTextEmbeddings,
};
