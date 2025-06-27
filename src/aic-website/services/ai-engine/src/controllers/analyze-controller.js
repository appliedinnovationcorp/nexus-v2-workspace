const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const Analysis = require('../models/analysis');
const { publishAiEvent } = require('../events/ai-events');
const { 
  analyzeLeadPotential,
  analyzeContentPerformance,
  analyzeUserBehavior,
  generateContentSuggestions,
  detectAnomalies
} = require('../services/analyze-service');

// Analyze lead potential
const analyzeLead = async (req, res) => {
  const { leadId, leadData } = req.body;
  
  if (!leadId || !leadData) {
    throw new BadRequestError('leadId and leadData are required');
  }
  
  const startTime = Date.now();
  
  try {
    const analysisResult = await analyzeLeadPotential(leadData);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'lead',
      sourceId: leadId,
      sourceType: 'lead',
      results: analysisResult,
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('analyze.lead-analyzed', {
      analysisId: analysis._id.toString(),
      leadId,
      score: analysisResult.score,
      potentialValue: analysisResult.potentialValue,
    });
    
    res.status(StatusCodes.OK).json({
      analysis: analysisResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error analyzing lead: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'lead',
      sourceId: leadId,
      sourceType: 'lead',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Analyze content performance
const analyzeContent = async (req, res) => {
  const { contentId, contentType, metrics } = req.body;
  
  if (!contentId || !contentType || !metrics) {
    throw new BadRequestError('contentId, contentType, and metrics are required');
  }
  
  const startTime = Date.now();
  
  try {
    const analysisResult = await analyzeContentPerformance(contentId, contentType, metrics);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'content',
      sourceId: contentId,
      sourceType: contentType,
      results: analysisResult,
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('analyze.content-analyzed', {
      analysisId: analysis._id.toString(),
      contentId,
      contentType,
      performanceScore: analysisResult.performanceScore,
    });
    
    res.status(StatusCodes.OK).json({
      analysis: analysisResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error analyzing content: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'content',
      sourceId: contentId,
      sourceType: contentType,
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Analyze user behavior
const analyzeUser = async (req, res) => {
  const { userId, behaviorData } = req.body;
  
  if (!userId || !behaviorData) {
    throw new BadRequestError('userId and behaviorData are required');
  }
  
  const startTime = Date.now();
  
  try {
    const analysisResult = await analyzeUserBehavior(userId, behaviorData);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'user',
      sourceId: userId,
      sourceType: 'user',
      results: analysisResult,
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('analyze.user-analyzed', {
      analysisId: analysis._id.toString(),
      userId,
      segments: analysisResult.segments,
    });
    
    res.status(StatusCodes.OK).json({
      analysis: analysisResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error analyzing user behavior: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'user',
      sourceId: userId,
      sourceType: 'user',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Generate content suggestions
const suggestContent = async (req, res) => {
  const { topic, audience, format, keywords } = req.body;
  
  if (!topic) {
    throw new BadRequestError('Topic is required');
  }
  
  const startTime = Date.now();
  
  try {
    const suggestionsResult = await generateContentSuggestions(
      topic,
      audience,
      format,
      keywords
    );
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'content',
      sourceId: 'content-suggestion',
      sourceType: 'suggestion',
      results: {
        suggestions: suggestionsResult,
        topic,
        audience,
        format,
        keywords,
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    res.status(StatusCodes.OK).json({
      suggestions: suggestionsResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error generating content suggestions: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'content',
      sourceId: 'content-suggestion',
      sourceType: 'suggestion',
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Detect anomalies in data
const detectDataAnomalies = async (req, res) => {
  const { data, dataType, parameters } = req.body;
  
  if (!data || !dataType) {
    throw new BadRequestError('data and dataType are required');
  }
  
  const startTime = Date.now();
  
  try {
    const anomaliesResult = await detectAnomalies(data, dataType, parameters);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: dataType,
      sourceId: 'anomaly-detection',
      sourceType: dataType,
      results: {
        anomalies: anomaliesResult,
        dataPoints: data.length,
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('analyze.anomalies-detected', {
      analysisId: analysis._id.toString(),
      dataType,
      anomalyCount: anomaliesResult.length,
    });
    
    res.status(StatusCodes.OK).json({
      anomalies: anomaliesResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error detecting anomalies: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: dataType,
      sourceId: 'anomaly-detection',
      sourceType: dataType,
      results: {},
      requestedBy: req.user?.userId,
      processingTime: Date.now() - startTime,
      status: 'failed',
      error: error.message,
    });
    
    throw error;
  }
};

// Get analysis by ID
const getAnalysisById = async (req, res) => {
  const { id } = req.params;
  
  try {
    const analysis = await Analysis.findById(id);
    
    if (!analysis) {
      throw new NotFoundError(`No analysis found with id: ${id}`);
    }
    
    res.status(StatusCodes.OK).json({
      analysis,
    });
  } catch (error) {
    logger.error(`Error getting analysis: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  analyzeLead,
  analyzeContent,
  analyzeUser,
  suggestContent,
  detectDataAnomalies,
  getAnalysisById,
};
