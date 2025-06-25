import { AIConfig, AIResponse, AISDKError, APIError } from '../types'

interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

interface OllamaRequest {
  model: string
  prompt: string
  system?: string
  template?: string
  context?: number[]
  stream?: boolean
  raw?: boolean
  format?: string
  options?: {
    temperature?: number
    top_k?: number
    top_p?: number
    num_predict?: number
  }
}

export class OllamaClient {
  private config: AIConfig
  private baseUrl: string

  constructor(config: AIConfig) {
    this.config = config
    this.baseUrl = config.baseUrl || 'http://localhost:11434'
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const startTime = Date.now()

      const request: OllamaRequest = {
        model: this.config.model,
        prompt,
        system: systemPrompt,
        stream: false,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        }
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new APIError(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data: OllamaResponse = await response.json()
      const latency = Date.now() - startTime

      return {
        content: data.response,
        metadata: {
          model: this.config.model,
          tokens: data.eval_count || 0,
          latency,
        }
      }
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }
      throw new APIError(`Ollama client error: ${error}`, error)
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'nomic-embed-text', // Specialized embedding model
          prompt: text,
        }),
      })

      if (!response.ok) {
        throw new APIError(`Ollama embedding error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.embedding || []
    } catch (error) {
      throw new APIError(`Ollama embedding error: ${error}`, error)
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`)
      
      if (!response.ok) {
        throw new APIError(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.models?.map((model: any) => model.name) || []
    } catch (error) {
      throw new APIError(`Ollama list models error: ${error}`, error)
    }
  }

  async pullModel(modelName: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: modelName,
        }),
      })

      if (!response.ok) {
        throw new APIError(`Ollama pull model error: ${response.status} ${response.statusText}`)
      }

      // Handle streaming response for model download progress
      const reader = response.body?.getReader()
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const progress = JSON.parse(line)
              if (progress.status) {
                console.log(`Model download: ${progress.status}`)
              }
            } catch (e) {
              // Ignore JSON parse errors for progress updates
            }
          }
        }
      }
    } catch (error) {
      throw new APIError(`Ollama pull model error: ${error}`, error)
    }
  }

  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels()
      return models.includes(modelName)
    } catch (error) {
      console.warn(`Could not check model availability: ${error}`)
      return false
    }
  }

  async ensureModelAvailable(modelName: string): Promise<void> {
    const isAvailable = await this.isModelAvailable(modelName)
    if (!isAvailable) {
      console.log(`Model ${modelName} not found, pulling...`)
      await this.pullModel(modelName)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  // Streaming text generation for real-time responses
  async *generateTextStream(prompt: string, systemPrompt?: string): AsyncGenerator<string, void, unknown> {
    try {
      const request: OllamaRequest = {
        model: this.config.model,
        prompt,
        system: systemPrompt,
        stream: true,
        options: {
          temperature: this.config.temperature,
          num_predict: this.config.maxTokens,
        }
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new APIError(`Ollama API error: ${response.status} ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new APIError('No response body available')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          try {
            const data: OllamaResponse = JSON.parse(line)
            if (data.response) {
              yield data.response
            }
            if (data.done) {
              return
            }
          } catch (e) {
            // Ignore JSON parse errors for streaming chunks
          }
        }
      }
    } catch (error) {
      throw new APIError(`Ollama streaming error: ${error}`, error)
    }
  }
}
