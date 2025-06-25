import { z } from 'zod'

// Base AI Configuration
export const AIConfigSchema = z.object({
  provider: z.enum(['openai', 'ollama', 'anthropic', 'mistral']),
  model: z.string(),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(1000),
})

export type AIConfig = z.infer<typeof AIConfigSchema>

// Search Configuration
export const SearchConfigSchema = z.object({
  host: z.string(),
  apiKey: z.string(),
  indexName: z.string(),
  vectorDimensions: z.number().default(1536),
})

export type SearchConfig = z.infer<typeof SearchConfigSchema>

// User Context for Personalization
export const UserContextSchema = z.object({
  userId: z.string(),
  division: z.enum(['smb', 'enterprise']).optional(),
  industry: z.string().optional(),
  companySize: z.enum(['startup', 'small', 'medium', 'large', 'enterprise']).optional(),
  interests: z.array(z.string()).default([]),
  previousInteractions: z.array(z.string()).default([]),
  sessionData: z.record(z.any()).default({}),
})

export type UserContext = z.infer<typeof UserContextSchema>

// Content Generation Request
export const ContentGenerationRequestSchema = z.object({
  type: z.enum(['blog', 'case-study', 'whitepaper', 'email', 'social', 'webpage']),
  topic: z.string(),
  audience: z.enum(['smb', 'enterprise', 'technical', 'executive']),
  tone: z.enum(['professional', 'casual', 'technical', 'persuasive']),
  length: z.enum(['short', 'medium', 'long']),
  keywords: z.array(z.string()).default([]),
  context: z.string().optional(),
})

export type ContentGenerationRequest = z.infer<typeof ContentGenerationRequestSchema>

// Lead Scoring Data
export const LeadDataSchema = z.object({
  email: z.string().email(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  companySize: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  painPoints: z.array(z.string()).default([]),
  source: z.string().optional(),
  interactions: z.array(z.object({
    type: z.string(),
    timestamp: z.date(),
    data: z.record(z.any()),
  })).default([]),
})

export type LeadData = z.infer<typeof LeadDataSchema>

// Lead Score Result
export const LeadScoreSchema = z.object({
  score: z.number().min(0).max(100),
  category: z.enum(['hot', 'warm', 'cold']),
  reasoning: z.string(),
  nextActions: z.array(z.string()),
  confidence: z.number().min(0).max(1),
})

export type LeadScore = z.infer<typeof LeadScoreSchema>

// RAG Query
export const RAGQuerySchema = z.object({
  query: z.string(),
  context: z.string().optional(),
  maxResults: z.number().default(5),
  threshold: z.number().min(0).max(1).default(0.7),
  filters: z.record(z.any()).default({}),
})

export type RAGQuery = z.infer<typeof RAGQuerySchema>

// Search Result
export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string().optional(),
  score: z.number(),
  metadata: z.record(z.any()).default({}),
})

export type SearchResult = z.infer<typeof SearchResultSchema>

// AI Response
export const AIResponseSchema = z.object({
  content: z.string(),
  metadata: z.object({
    model: z.string(),
    tokens: z.number().optional(),
    latency: z.number().optional(),
    confidence: z.number().optional(),
  }),
  sources: z.array(SearchResultSchema).optional(),
})

export type AIResponse = z.infer<typeof AIResponseSchema>

// Personalization Recommendation
export const RecommendationSchema = z.object({
  type: z.enum(['content', 'product', 'service', 'action']),
  title: z.string(),
  description: z.string(),
  url: z.string().optional(),
  score: z.number().min(0).max(1),
  reasoning: z.string(),
  metadata: z.record(z.any()).default({}),
})

export type Recommendation = z.infer<typeof RecommendationSchema>

// Error Types
export class AISDKError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'AISDKError'
  }
}

export class ConfigurationError extends AISDKError {
  constructor(message: string, details?: any) {
    super(message, 'CONFIGURATION_ERROR', details)
  }
}

export class APIError extends AISDKError {
  constructor(message: string, details?: any) {
    super(message, 'API_ERROR', details)
  }
}

export class ValidationError extends AISDKError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
  }
}
