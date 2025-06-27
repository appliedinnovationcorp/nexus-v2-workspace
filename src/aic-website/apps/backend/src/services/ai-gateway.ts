/**
 * AI Gateway Service
 * Bridges Express.js backend with FastAPI AI services
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { EventEmitter } from 'events'

export interface AIServiceConfig {
  baseUrl: string
  timeout: number
  retries: number
  apiKey?: string
}

export interface ContentGenerationRequest {
  type: string
  topic: string
  audience: string
  tone: string
  length: string
  keywords?: string[]
  context?: string
  division?: string
  language?: string
  model?: string
  temperature?: number
}

export interface ContentGenerationResponse {
  content: string
  metadata: {
    model: string
    provider: string
    tokens: number
    type: string
    audience: string
    tone: string
    length: string
    keywords: string[]
  }
  generation_time: number
  word_count: number
  timestamp: string
}

export interface LeadScoringRequest {
  email: string
  company?: string
  name?: string
  phone?: string
  message: string
  source?: string
  division?: string
  metadata?: Record<string, any>
}

export interface LeadScoringResponse {
  score: number
  category: 'hot' | 'warm' | 'cold'
  reasoning: string
  next_actions: string[]
  confidence: number
  factors: {
    email_quality: number
    company_size: number
    message_intent: number
    division_fit: number
  }
}

export interface PersonalizationRequest {
  user_id: string
  division?: 'smb' | 'enterprise'
  industry?: string
  company_size?: string
  interests?: string[]
  previous_interactions?: string[]
  session_data?: Record<string, any>
}

export interface PersonalizationResponse {
  recommendations: Array<{
    type: string
    title: string
    description: string
    url?: string
    score: number
    reasoning: string
  }>
  personalized_content: {
    hero_message?: string
    cta_text?: string
    featured_services?: string[]
  }
  user_profile: {
    segment: string
    interests: string[]
    predicted_needs: string[]
  }
}

export class AIGatewayService extends EventEmitter {
  private client: AxiosInstance
  private config: AIServiceConfig
  private healthCheckInterval?: NodeJS.Timeout

  constructor(config: AIServiceConfig) {
    super()
    this.config = config
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey })
      }
    })

    this.setupInterceptors()
    this.startHealthCheck()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🤖 AI Service Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('AI Service Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ AI Service Response: ${response.status} ${response.config.url}`)
        return response
      },
      async (error) => {
        console.error('AI Service Response Error:', error.response?.status, error.response?.data)
        
        // Retry logic for specific errors
        if (this.shouldRetry(error) && error.config && !error.config._retry) {
          error.config._retry = true
          console.log('🔄 Retrying AI service request...')
          return this.client.request(error.config)
        }
        
        return Promise.reject(error)
      }
    )
  }

  private shouldRetry(error: any): boolean {
    return (
      error.response?.status >= 500 ||
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT'
    )
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.healthCheck()
        this.emit('health', { status: 'healthy' })
      } catch (error) {
        this.emit('health', { status: 'unhealthy', error })
      }
    }, 30000) // Check every 30 seconds
  }

  /**
   * Generate AI-powered content
   */
  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    try {
      const response: AxiosResponse<ContentGenerationResponse> = await this.client.post(
        '/api/v1/content/generate',
        request
      )
      
      this.emit('contentGenerated', { request, response: response.data })
      return response.data
    } catch (error: any) {
      console.error('Content generation failed:', error.response?.data || error.message)
      throw new Error(`Content generation failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Generate streaming content
   */
  async generateContentStream(request: ContentGenerationRequest): Promise<ReadableStream> {
    try {
      const response = await this.client.post(
        '/api/v1/content/generate/stream',
        request,
        {
          responseType: 'stream'
        }
      )
      
      return response.data
    } catch (error: any) {
      console.error('Streaming content generation failed:', error.response?.data || error.message)
      throw new Error(`Streaming generation failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Score a lead using AI
   */
  async scoreLead(request: LeadScoringRequest): Promise<LeadScoringResponse> {
    try {
      const response: AxiosResponse<LeadScoringResponse> = await this.client.post(
        '/api/v1/leads/score',
        request
      )
      
      this.emit('leadScored', { request, response: response.data })
      return response.data
    } catch (error: any) {
      console.error('Lead scoring failed:', error.response?.data || error.message)
      throw new Error(`Lead scoring failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Get personalized recommendations
   */
  async getPersonalization(request: PersonalizationRequest): Promise<PersonalizationResponse> {
    try {
      const response: AxiosResponse<PersonalizationResponse> = await this.client.post(
        '/api/v1/personalization/recommend',
        request
      )
      
      this.emit('personalizationGenerated', { request, response: response.data })
      return response.data
    } catch (error: any) {
      console.error('Personalization failed:', error.response?.data || error.message)
      throw new Error(`Personalization failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Enhance search with AI
   */
  async enhanceSearch(query: string, filters?: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/search/enhance', {
        query,
        filters: filters || {}
      })
      
      return response.data
    } catch (error: any) {
      console.error('Search enhancement failed:', error.response?.data || error.message)
      throw new Error(`Search enhancement failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Get AI analytics insights
   */
  async getAnalyticsInsights(data: Record<string, any>): Promise<any> {
    try {
      const response = await this.client.post('/api/v1/analytics/insights', data)
      return response.data
    } catch (error: any) {
      console.error('Analytics insights failed:', error.response?.data || error.message)
      throw new Error(`Analytics insights failed: ${error.response?.data?.detail || error.message}`)
    }
  }

  /**
   * Health check for AI services
   */
  async healthCheck(): Promise<{ status: string; services: Record<string, any> }> {
    try {
      const response = await this.client.get('/health/detailed')
      return response.data
    } catch (error: any) {
      throw new Error(`AI services health check failed: ${error.message}`)
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/api/v1/inference/models')
      return response.data.models
    } catch (error: any) {
      console.error('Failed to get available models:', error.response?.data || error.message)
      return []
    }
  }

  /**
   * Batch process multiple AI requests
   */
  async batchProcess(requests: Array<{
    type: 'content' | 'scoring' | 'personalization'
    data: any
  }>): Promise<any[]> {
    try {
      const promises = requests.map(async (req) => {
        switch (req.type) {
          case 'content':
            return await this.generateContent(req.data)
          case 'scoring':
            return await this.scoreLead(req.data)
          case 'personalization':
            return await this.getPersonalization(req.data)
          default:
            throw new Error(`Unknown request type: ${req.type}`)
        }
      })

      return await Promise.all(promises)
    } catch (error: any) {
      console.error('Batch processing failed:', error.message)
      throw error
    }
  }

  /**
   * Close the service and cleanup
   */
  close(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }
    this.removeAllListeners()
  }
}

/**
 * Factory function to create AI Gateway service
 */
export function createAIGateway(config?: Partial<AIServiceConfig>): AIGatewayService {
  const defaultConfig: AIServiceConfig = {
    baseUrl: process.env.AI_SERVICES_URL || 'http://localhost:8000',
    timeout: 30000, // 30 seconds
    retries: 3,
    apiKey: process.env.AI_SERVICES_API_KEY
  }

  return new AIGatewayService({ ...defaultConfig, ...config })
}
