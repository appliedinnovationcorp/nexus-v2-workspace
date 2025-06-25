import OpenAI from 'openai'
import { AIConfig, AIResponse, AISDKError, APIError } from '../types'

export class OpenAIClient {
  private client: OpenAI
  private config: AIConfig

  constructor(config: AIConfig) {
    this.config = config
    
    if (!config.apiKey) {
      throw new AISDKError('OpenAI API key is required', 'MISSING_API_KEY')
    }

    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    })
  }

  async generateText(prompt: string, systemPrompt?: string): Promise<AIResponse> {
    try {
      const startTime = Date.now()
      
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt })
      }
      
      messages.push({ role: 'user', content: prompt })

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages,
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      })

      const latency = Date.now() - startTime
      const content = completion.choices[0]?.message?.content || ''
      const tokens = completion.usage?.total_tokens || 0

      return {
        content,
        metadata: {
          model: this.config.model,
          tokens,
          latency,
        }
      }
    } catch (error) {
      throw new APIError(`OpenAI API error: ${error}`, error)
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })

      return response.data[0]?.embedding || []
    } catch (error) {
      throw new APIError(`OpenAI embedding error: ${error}`, error)
    }
  }

  async generateContentSuggestions(
    topic: string,
    audience: 'smb' | 'enterprise',
    type: 'blog' | 'case-study' | 'whitepaper'
  ): Promise<string[]> {
    const systemPrompt = `You are an AI content strategist for Applied Innovation Corporation (AIC), 
    a leading AI consulting company. Generate content suggestions that are relevant, engaging, and 
    aligned with AIC's expertise in AI transformation, consulting, and the Nexus PaaS platform.`

    const prompt = `Generate 5 compelling ${type} title suggestions for the topic "${topic}" 
    targeting ${audience === 'smb' ? 'small and medium businesses' : 'large enterprises'}. 
    Focus on practical AI applications, business value, and transformation outcomes.`

    const response = await this.generateText(prompt, systemPrompt)
    
    // Parse the response to extract individual suggestions
    return response.content
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .slice(0, 5)
  }

  async generatePersonalizedContent(
    baseContent: string,
    userContext: {
      division?: 'smb' | 'enterprise'
      industry?: string
      interests?: string[]
    }
  ): Promise<string> {
    const systemPrompt = `You are an AI personalization engine for AIC's website. 
    Adapt content to be more relevant and engaging for the specific user context while 
    maintaining AIC's professional tone and expertise.`

    const contextInfo = [
      userContext.division && `Target division: ${userContext.division}`,
      userContext.industry && `Industry: ${userContext.industry}`,
      userContext.interests?.length && `Interests: ${userContext.interests.join(', ')}`
    ].filter(Boolean).join(', ')

    const prompt = `Personalize this content for a user with the following context: ${contextInfo}

Original content:
${baseContent}

Personalized content:`

    const response = await this.generateText(prompt, systemPrompt)
    return response.content
  }
}
