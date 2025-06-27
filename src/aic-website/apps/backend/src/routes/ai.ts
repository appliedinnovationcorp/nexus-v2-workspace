/**
 * AI Routes - Express.js routes that proxy to FastAPI AI services
 * Provides a unified API interface for frontend applications
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AIGatewayService } from '../services/ai-gateway'

const router = Router()

// Validation schemas
const ContentGenerationSchema = z.object({
  type: z.enum(['blog', 'case-study', 'whitepaper', 'email', 'social', 'webpage']),
  topic: z.string().min(1),
  audience: z.enum(['smb', 'enterprise', 'technical', 'executive']),
  tone: z.enum(['professional', 'casual', 'technical', 'persuasive']),
  length: z.enum(['short', 'medium', 'long']),
  keywords: z.array(z.string()).optional(),
  context: z.string().optional(),
  division: z.enum(['smb', 'enterprise', 'general']).optional(),
  language: z.string().default('en'),
  model: z.string().optional(),
  temperature: z.number().min(0).max(1).optional()
})

const LeadScoringSchema = z.object({
  email: z.string().email(),
  company: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(1),
  source: z.string().optional(),
  division: z.enum(['smb', 'enterprise', 'general']).optional(),
  metadata: z.record(z.any()).optional()
})

const PersonalizationSchema = z.object({
  user_id: z.string(),
  division: z.enum(['smb', 'enterprise']).optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  interests: z.array(z.string()).optional(),
  previous_interactions: z.array(z.string()).optional(),
  session_data: z.record(z.any()).optional()
})

// Middleware to get AI Gateway service
function getAIGateway(req: Request): AIGatewayService {
  return req.app.locals.aiGateway
}

/**
 * Generate AI-powered content
 */
router.post('/content/generate', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = ContentGenerationSchema.parse(req.body)
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Generate content
    const result = await aiGateway.generateContent(validatedData)
    
    // Log the generation for analytics
    console.log('Content generated:', {
      type: validatedData.type,
      audience: validatedData.audience,
      word_count: result.word_count,
      generation_time: result.generation_time
    })
    
    res.json({
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('Content generation error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Content Generation Failed',
      message: error.message
    })
  }
})

/**
 * Generate streaming content
 */
router.post('/content/generate/stream', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = ContentGenerationSchema.parse(req.body)
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Set up streaming response
    res.setHeader('Content-Type', 'text/plain')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    
    // Generate streaming content
    const stream = await aiGateway.generateContentStream(validatedData)
    
    // Pipe the stream to response
    stream.pipe(res)
    
  } catch (error: any) {
    console.error('Streaming content generation error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Streaming Generation Failed',
      message: error.message
    })
  }
})

/**
 * Score a lead using AI
 */
router.post('/leads/score', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = LeadScoringSchema.parse(req.body)
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Score the lead
    const result = await aiGateway.scoreLead(validatedData)
    
    // Log the scoring for analytics
    console.log('Lead scored:', {
      email: validatedData.email,
      score: result.score,
      category: result.category,
      confidence: result.confidence
    })
    
    res.json({
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('Lead scoring error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Lead Scoring Failed',
      message: error.message
    })
  }
})

/**
 * Get personalized recommendations
 */
router.post('/personalization/recommend', async (req: Request, res: Response) => {
  try {
    // Validate request
    const validatedData = PersonalizationSchema.parse(req.body)
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Get personalization
    const result = await aiGateway.getPersonalization(validatedData)
    
    // Log the personalization for analytics
    console.log('Personalization generated:', {
      user_id: validatedData.user_id,
      division: validatedData.division,
      recommendations_count: result.recommendations.length
    })
    
    res.json({
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('Personalization error:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Personalization Failed',
      message: error.message
    })
  }
})

/**
 * Enhance search with AI
 */
router.post('/search/enhance', async (req: Request, res: Response) => {
  try {
    const { query, filters } = req.body
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Query is required and must be a string'
      })
    }
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Enhance search
    const result = await aiGateway.enhanceSearch(query, filters)
    
    res.json({
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('Search enhancement error:', error)
    res.status(500).json({
      success: false,
      error: 'Search Enhancement Failed',
      message: error.message
    })
  }
})

/**
 * Get AI analytics insights
 */
router.post('/analytics/insights', async (req: Request, res: Response) => {
  try {
    const data = req.body
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Get insights
    const result = await aiGateway.getAnalyticsInsights(data)
    
    res.json({
      success: true,
      data: result
    })
    
  } catch (error: any) {
    console.error('Analytics insights error:', error)
    res.status(500).json({
      success: false,
      error: 'Analytics Insights Failed',
      message: error.message
    })
  }
})

/**
 * Get available AI models
 */
router.get('/models', async (req: Request, res: Response) => {
  try {
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Get available models
    const models = await aiGateway.getAvailableModels()
    
    res.json({
      success: true,
      data: {
        models,
        default_model: process.env.DEFAULT_LLM_MODEL || 'gpt-4-turbo-preview'
      }
    })
    
  } catch (error: any) {
    console.error('Get models error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to Get Models',
      message: error.message
    })
  }
})

/**
 * Batch process multiple AI requests
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { requests } = req.body
    
    if (!Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Requests must be an array'
      })
    }
    
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Process batch requests
    const results = await aiGateway.batchProcess(requests)
    
    res.json({
      success: true,
      data: {
        results,
        processed_count: results.length
      }
    })
    
  } catch (error: any) {
    console.error('Batch processing error:', error)
    res.status(500).json({
      success: false,
      error: 'Batch Processing Failed',
      message: error.message
    })
  }
})

/**
 * AI services health check
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Get AI Gateway service
    const aiGateway = getAIGateway(req)
    
    // Check health
    const health = await aiGateway.healthCheck()
    
    res.json({
      success: true,
      data: health
    })
    
  } catch (error: any) {
    console.error('AI health check error:', error)
    res.status(503).json({
      success: false,
      error: 'AI Services Unhealthy',
      message: error.message
    })
  }
})

export { router as aiRoutes }
