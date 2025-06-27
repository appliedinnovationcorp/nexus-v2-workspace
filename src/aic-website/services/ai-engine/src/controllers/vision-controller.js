const { StatusCodes } = require('http-status-codes');
const { BadRequestError } = require('../utils/errors');
const { logger } = require('../utils/logger');
const Analysis = require('../models/analysis');
const { publishAiEvent } = require('../events/ai-events');
const { 
  detectObjects,
  classifyImage,
  generateImageCaption,
  detectFaces,
  extractTextFromImage,
  analyzeImageSafety,
  generateImageEmbeddings
} = require('../services/vision-service');

// Detect objects in an image
const detectImageObjects = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const objectsResult = await detectObjects(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        objects: objectsResult,
        imageUrl: imageUrl || 'base64-image',
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('vision.objects-detected', {
      analysisId: analysis._id.toString(),
      objectCount: objectsResult.length,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      objects: objectsResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in object detection: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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

// Classify an image
const classifyImageContent = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const classificationResult = await classifyImage(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        classification: classificationResult,
        imageUrl: imageUrl || 'base64-image',
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('vision.image-classified', {
      analysisId: analysis._id.toString(),
      topCategory: classificationResult[0]?.class,
      confidence: classificationResult[0]?.score,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      classification: classificationResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in image classification: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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

// Generate caption for an image
const captionImage = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const captionResult = await generateImageCaption(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        caption: captionResult,
        imageUrl: imageUrl || 'base64-image',
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('vision.image-captioned', {
      analysisId: analysis._id.toString(),
      caption: captionResult.caption,
      confidence: captionResult.confidence,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      caption: captionResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in image captioning: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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

// Detect faces in an image
const detectImageFaces = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const facesResult = await detectFaces(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        faces: facesResult,
        imageUrl: imageUrl || 'base64-image',
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('vision.faces-detected', {
      analysisId: analysis._id.toString(),
      faceCount: facesResult.length,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      faces: facesResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in face detection: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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

// Extract text from an image (OCR)
const extractImageText = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const textResult = await extractTextFromImage(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        text: textResult,
        imageUrl: imageUrl || 'base64-image',
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('vision.text-extracted', {
      analysisId: analysis._id.toString(),
      textLength: textResult.text.length,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      text: textResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in text extraction from image: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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

// Analyze image safety/moderation
const analyzeImageContent = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const safetyResult = await analyzeImageSafety(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        safety: safetyResult,
        imageUrl: imageUrl || 'base64-image',
      },
      requestedBy: req.user?.userId,
      processingTime,
      status: 'completed',
    });
    
    // Publish event
    await publishAiEvent('vision.image-safety-analyzed', {
      analysisId: analysis._id.toString(),
      isSafe: safetyResult.isSafe,
      sourceId: analysis.sourceId,
      sourceType: analysis.sourceType,
    });
    
    res.status(StatusCodes.OK).json({
      safety: safetyResult,
      processingTime,
      analysisId: analysis._id,
    });
  } catch (error) {
    logger.error(`Error in image safety analysis: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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

// Generate image embeddings
const getImageEmbeddings = async (req, res) => {
  const { imageUrl, imageBase64 } = req.body;
  
  if (!imageUrl && !imageBase64) {
    throw new BadRequestError('Either imageUrl or imageBase64 is required');
  }
  
  const startTime = Date.now();
  
  try {
    const embeddingsResult = await generateImageEmbeddings(imageUrl || imageBase64, !!imageBase64);
    
    const processingTime = Date.now() - startTime;
    
    // Create analysis record
    const analysis = await Analysis.create({
      type: 'image',
      sourceId: req.body.sourceId || 'manual-request',
      sourceType: req.body.sourceType || 'api',
      results: {
        embeddingDimensions: embeddingsResult.length,
        imageUrl: imageUrl || 'base64-image',
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
    logger.error(`Error in image embedding generation: ${error.message}`, { error });
    
    // Create failed analysis record
    await Analysis.create({
      type: 'image',
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
  detectImageObjects,
  classifyImageContent,
  captionImage,
  detectImageFaces,
  extractImageText,
  analyzeImageContent,
  getImageEmbeddings,
};
