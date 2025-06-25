import { AIConfig, SearchConfig } from '../types'

// AI Configuration Factory
export class AIConfigFactory {
  static createOpenAIConfig(): AIConfig {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    return {
      provider: 'openai',
      model: 'gpt-4-turbo-preview',
      apiKey,
      temperature: 0.7,
      maxTokens: 2000,
    }
  }

  static createOllamaConfig(): AIConfig {
    return {
      provider: 'ollama',
      model: 'llama2',
      baseUrl: process.env.OLLAMA_HOST || 'http://localhost:11434',
      temperature: 0.7,
      maxTokens: 2000,
    }
  }

  static createAnthropicConfig(): AIConfig {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }

    return {
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      apiKey,
      temperature: 0.7,
      maxTokens: 2000,
    }
  }

  static createMistralConfig(): AIConfig {
    const apiKey = process.env.MISTRAL_API_KEY
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY environment variable is required')
    }

    return {
      provider: 'mistral',
      model: 'mistral-large-latest',
      apiKey,
      temperature: 0.7,
      maxTokens: 2000,
    }
  }
}

// Search Configuration Factory
export class SearchConfigFactory {
  static createMeilisearchConfig(): SearchConfig {
    const host = process.env.MEILISEARCH_HOST
    const apiKey = process.env.MEILISEARCH_API_KEY

    if (!host || !apiKey) {
      throw new Error('MEILISEARCH_HOST and MEILISEARCH_API_KEY environment variables are required')
    }

    return {
      host,
      apiKey,
      indexName: 'aic-content',
      vectorDimensions: 1536, // OpenAI embedding dimensions
    }
  }
}

// AI Service Registry
export class AIServiceRegistry {
  private static instance: AIServiceRegistry
  private configs: Map<string, AIConfig> = new Map()

  private constructor() {
    this.initializeConfigs()
  }

  static getInstance(): AIServiceRegistry {
    if (!AIServiceRegistry.instance) {
      AIServiceRegistry.instance = new AIServiceRegistry()
    }
    return AIServiceRegistry.instance
  }

  private initializeConfigs() {
    try {
      // Primary AI service (OpenAI)
      if (process.env.OPENAI_API_KEY) {
        this.configs.set('primary', AIConfigFactory.createOpenAIConfig())
      }

      // Fallback AI service (Ollama for local)
      this.configs.set('fallback', AIConfigFactory.createOllamaConfig())

      // Additional services
      if (process.env.ANTHROPIC_API_KEY) {
        this.configs.set('anthropic', AIConfigFactory.createAnthropicConfig())
      }

      if (process.env.MISTRAL_API_KEY) {
        this.configs.set('mistral', AIConfigFactory.createMistralConfig())
      }
    } catch (error) {
      console.warn('Some AI services could not be initialized:', error)
    }
  }

  getConfig(service: string = 'primary'): AIConfig {
    const config = this.configs.get(service)
    if (!config) {
      // Fallback to local Ollama if primary service is not available
      const fallback = this.configs.get('fallback')
      if (!fallback) {
        throw new Error(`No AI configuration available for service: ${service}`)
      }
      return fallback
    }
    return config
  }

  hasService(service: string): boolean {
    return this.configs.has(service)
  }

  listAvailableServices(): string[] {
    return Array.from(this.configs.keys())
  }
}

// Environment-specific configurations
export const AI_ENVIRONMENTS = {
  development: {
    enableLocalLLM: true,
    enableCloudLLM: true,
    defaultService: 'fallback', // Use Ollama for development
    logLevel: 'debug',
  },
  staging: {
    enableLocalLLM: false,
    enableCloudLLM: true,
    defaultService: 'primary',
    logLevel: 'info',
  },
  production: {
    enableLocalLLM: false,
    enableCloudLLM: true,
    defaultService: 'primary',
    logLevel: 'error',
  },
}

// Get current environment configuration
export function getCurrentAIEnvironment() {
  const env = process.env.NODE_ENV || 'development'
  return AI_ENVIRONMENTS[env as keyof typeof AI_ENVIRONMENTS] || AI_ENVIRONMENTS.development
}

// AI Model Configurations for different use cases
export const AI_MODEL_CONFIGS = {
  contentGeneration: {
    temperature: 0.8,
    maxTokens: 3000,
    systemPrompt: `You are an expert content writer for Applied Innovation Corporation (AIC), 
    a leading AI consulting company. Create engaging, informative content that demonstrates 
    deep AI expertise while being accessible to business audiences.`,
  },
  leadScoring: {
    temperature: 0.3,
    maxTokens: 500,
    systemPrompt: `You are an AI lead scoring specialist. Analyze lead data and provide 
    accurate scoring based on business potential, urgency, and fit for AIC's services.`,
  },
  personalization: {
    temperature: 0.5,
    maxTokens: 1000,
    systemPrompt: `You are a personalization engine for AIC's website. Adapt content 
    and recommendations based on user context while maintaining professional tone.`,
  },
  chatAssistant: {
    temperature: 0.7,
    maxTokens: 1500,
    systemPrompt: `You are AIC's AI assistant, helping visitors understand our AI consulting 
    services, Nexus platform, and how we can help transform their business with AI.`,
  },
}
