import { MeiliSearch, Index } from 'meilisearch'
import { SearchConfig, SearchResult, RAGQuery, AISDKError, APIError } from '../types'

export interface MeilisearchDocument {
  id: string
  title: string
  content: string
  url?: string
  category?: string
  tags?: string[]
  division?: 'smb' | 'enterprise' | 'general'
  createdAt?: string
  updatedAt?: string
  embedding?: number[]
  metadata?: Record<string, any>
}

export class MeilisearchClient {
  private client: MeiliSearch
  private config: SearchConfig
  private index: Index

  constructor(config: SearchConfig) {
    this.config = config
    this.client = new MeiliSearch({
      host: config.host,
      apiKey: config.apiKey,
    })
    this.index = this.client.index(config.indexName)
  }

  async initialize(): Promise<void> {
    try {
      // Create index if it doesn't exist
      await this.client.createIndex(this.config.indexName, { primaryKey: 'id' })
    } catch (error: any) {
      // Index might already exist, which is fine
      if (!error.message?.includes('already exists')) {
        throw new APIError(`Failed to initialize Meilisearch index: ${error}`)
      }
    }

    // Configure index settings
    await this.configureIndex()
  }

  private async configureIndex(): Promise<void> {
    try {
      // Set searchable attributes
      await this.index.updateSearchableAttributes([
        'title',
        'content',
        'tags',
        'category'
      ])

      // Set filterable attributes
      await this.index.updateFilterableAttributes([
        'category',
        'division',
        'tags',
        'createdAt'
      ])

      // Set sortable attributes
      await this.index.updateSortableAttributes([
        'createdAt',
        'updatedAt'
      ])

      // Set ranking rules for better relevance
      await this.index.updateRankingRules([
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness'
      ])

      // Configure synonyms for AI-related terms
      await this.index.updateSynonyms({
        'ai': ['artificial intelligence', 'machine learning', 'ml'],
        'llm': ['large language model', 'language model'],
        'automation': ['automate', 'automated'],
        'transformation': ['transform', 'digital transformation']
      })

      console.log('Meilisearch index configured successfully')
    } catch (error) {
      throw new APIError(`Failed to configure Meilisearch index: ${error}`)
    }
  }

  async addDocuments(documents: MeilisearchDocument[]): Promise<void> {
    try {
      const task = await this.index.addDocuments(documents)
      await this.waitForTask(task.taskUid)
    } catch (error) {
      throw new APIError(`Failed to add documents to Meilisearch: ${error}`)
    }
  }

  async updateDocument(document: MeilisearchDocument): Promise<void> {
    try {
      const task = await this.index.updateDocuments([document])
      await this.waitForTask(task.taskUid)
    } catch (error) {
      throw new APIError(`Failed to update document in Meilisearch: ${error}`)
    }
  }

  async deleteDocument(id: string): Promise<void> {
    try {
      const task = await this.index.deleteDocument(id)
      await this.waitForTask(task.taskUid)
    } catch (error) {
      throw new APIError(`Failed to delete document from Meilisearch: ${error}`)
    }
  }

  async search(query: RAGQuery): Promise<SearchResult[]> {
    try {
      const searchParams: any = {
        q: query.query,
        limit: query.maxResults,
        attributesToHighlight: ['title', 'content'],
        highlightPreTag: '<mark>',
        highlightPostTag: '</mark>',
      }

      // Add filters if provided
      if (Object.keys(query.filters).length > 0) {
        const filterStrings = Object.entries(query.filters).map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key} IN [${value.map(v => `"${v}"`).join(', ')}]`
          }
          return `${key} = "${value}"`
        })
        searchParams.filter = filterStrings.join(' AND ')
      }

      const searchResults = await this.index.search(query.query, searchParams)

      return searchResults.hits.map((hit: any) => ({
        id: hit.id,
        title: hit.title,
        content: hit.content,
        url: hit.url,
        score: hit._rankingScore || 0,
        metadata: {
          category: hit.category,
          division: hit.division,
          tags: hit.tags,
          highlights: hit._formatted,
          ...hit.metadata
        }
      }))
    } catch (error) {
      throw new APIError(`Meilisearch search error: ${error}`)
    }
  }

  async semanticSearch(
    query: string, 
    embedding: number[], 
    options: {
      limit?: number
      filters?: Record<string, any>
      threshold?: number
    } = {}
  ): Promise<SearchResult[]> {
    try {
      // For semantic search, we'll use a hybrid approach:
      // 1. Traditional text search for exact matches
      // 2. Vector similarity for semantic matches (if embeddings are available)
      
      const textResults = await this.search({
        query,
        maxResults: options.limit || 10,
        filters: options.filters || {},
        threshold: options.threshold || 0.7
      })

      // TODO: Implement vector similarity search when Meilisearch supports it natively
      // For now, we'll enhance text search results with semantic scoring
      
      return textResults.map(result => ({
        ...result,
        score: this.calculateSemanticScore(result, query)
      })).sort((a, b) => b.score - a.score)
    } catch (error) {
      throw new APIError(`Semantic search error: ${error}`)
    }
  }

  private calculateSemanticScore(result: SearchResult, query: string): number {
    // Simple semantic scoring based on keyword overlap and content relevance
    const queryWords = query.toLowerCase().split(/\s+/)
    const contentWords = (result.title + ' ' + result.content).toLowerCase().split(/\s+/)
    
    const overlap = queryWords.filter(word => 
      contentWords.some(contentWord => contentWord.includes(word))
    ).length
    
    return (overlap / queryWords.length) * result.score
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      // Use Meilisearch's search to get suggestions based on existing content
      const results = await this.index.search(query, {
        limit,
        attributesToRetrieve: ['title'],
        attributesToHighlight: []
      })

      return results.hits.map((hit: any) => hit.title).filter(Boolean)
    } catch (error) {
      throw new APIError(`Failed to get suggestions: ${error}`)
    }
  }

  async getStats(): Promise<any> {
    try {
      const stats = await this.index.getStats()
      return {
        numberOfDocuments: stats.numberOfDocuments,
        isIndexing: stats.isIndexing,
        fieldDistribution: stats.fieldDistribution
      }
    } catch (error) {
      throw new APIError(`Failed to get index stats: ${error}`)
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.health()
      return true
    } catch (error) {
      return false
    }
  }

  private async waitForTask(taskUid: number): Promise<void> {
    try {
      await this.client.waitForTask(taskUid)
    } catch (error) {
      throw new APIError(`Task failed: ${error}`)
    }
  }

  // Bulk operations for better performance
  async bulkAddDocuments(documents: MeilisearchDocument[], batchSize: number = 100): Promise<void> {
    try {
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize)
        await this.addDocuments(batch)
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`)
      }
    } catch (error) {
      throw new APIError(`Bulk add documents failed: ${error}`)
    }
  }

  async clearIndex(): Promise<void> {
    try {
      const task = await this.index.deleteAllDocuments()
      await this.waitForTask(task.taskUid)
    } catch (error) {
      throw new APIError(`Failed to clear index: ${error}`)
    }
  }

  // Content indexing helpers
  async indexWebsiteContent(content: {
    pages: Array<{
      url: string
      title: string
      content: string
      category?: string
      division?: 'smb' | 'enterprise' | 'general'
    }>
  }): Promise<void> {
    const documents: MeilisearchDocument[] = content.pages.map((page, index) => ({
      id: `page-${index}`,
      title: page.title,
      content: page.content,
      url: page.url,
      category: page.category || 'general',
      division: page.division || 'general',
      createdAt: new Date().toISOString(),
      metadata: {
        type: 'webpage',
        indexed: true
      }
    }))

    await this.bulkAddDocuments(documents)
  }

  async indexBlogPosts(posts: Array<{
    id: string
    title: string
    content: string
    excerpt?: string
    tags?: string[]
    publishedAt: string
  }>): Promise<void> {
    const documents: MeilisearchDocument[] = posts.map(post => ({
      id: `blog-${post.id}`,
      title: post.title,
      content: post.content,
      url: `/blog/${post.id}`,
      category: 'blog',
      tags: post.tags || [],
      createdAt: post.publishedAt,
      metadata: {
        type: 'blog-post',
        excerpt: post.excerpt
      }
    }))

    await this.bulkAddDocuments(documents)
  }
}
