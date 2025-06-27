/**
 * Query Bus Implementation
 * Handles query dispatching in the CQRS architecture (Read Side)
 */

import { v4 as uuidv4 } from 'uuid'

export interface Query {
  id: string
  type: string
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

export interface QueryHandler {
  handle(query: Query): Promise<any>
}

export interface QueryResult {
  success: boolean
  data?: any
  error?: string
  metadata?: Record<string, any>
}

export class QueryBus {
  private handlers: Map<string, QueryHandler>
  private middleware: QueryMiddleware[]

  constructor() {
    this.handlers = new Map()
    this.middleware = []
  }

  /**
   * Register a query handler
   */
  register(queryType: string, handler: QueryHandler): void {
    if (this.handlers.has(queryType)) {
      throw new Error(`Query handler for ${queryType} is already registered`)
    }
    
    this.handlers.set(queryType, handler)
    console.log(`🔍 Query handler registered: ${queryType}`)
  }

  /**
   * Execute a query
   */
  async execute(query: Query): Promise<QueryResult> {
    // Ensure query has required fields
    if (!query.id) {
      query.id = uuidv4()
    }
    
    if (!query.timestamp) {
      query.timestamp = new Date()
    }

    console.log(`🔍 Executing query: ${query.type} (${query.id})`)

    try {
      // Run middleware before execution
      for (const middleware of this.middleware) {
        await middleware.before(query)
      }

      // Find and execute handler
      const handler = this.handlers.get(query.type)
      if (!handler) {
        throw new Error(`No handler registered for query type: ${query.type}`)
      }

      const result = await handler.handle(query)

      // Run middleware after execution
      for (const middleware of this.middleware) {
        await middleware.after(query, result)
      }

      console.log(`✅ Query executed successfully: ${query.type} (${query.id})`)

      return {
        success: true,
        data: result,
        metadata: {
          queryId: query.id,
          executionTime: new Date().toISOString(),
          queryType: query.type
        }
      }
    } catch (error: any) {
      console.error(`❌ Query execution failed: ${query.type} (${query.id})`, error)

      // Run middleware on error
      for (const middleware of this.middleware) {
        if (middleware.onError) {
          await middleware.onError(query, error)
        }
      }

      return {
        success: false,
        error: error.message || 'Query execution failed',
        metadata: {
          queryId: query.id,
          errorTime: new Date().toISOString(),
          queryType: query.type
        }
      }
    }
  }

  /**
   * Add middleware to the query pipeline
   */
  use(middleware: QueryMiddleware): void {
    this.middleware.push(middleware)
  }

  /**
   * Get registered query types
   */
  getRegisteredQueries(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Check if a query handler is registered
   */
  hasHandler(queryType: string): boolean {
    return this.handlers.has(queryType)
  }
}

/**
 * Query middleware interface
 */
export interface QueryMiddleware {
  before?(query: Query): Promise<void>
  after?(query: Query, result: any): Promise<void>
  onError?(query: Query, error: any): Promise<void>
}

/**
 * Query factory for creating queries
 */
export class QueryFactory {
  static createQuery(
    type: string,
    data: any,
    metadata?: Record<string, any>
  ): Query {
    return {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      data,
      metadata: metadata || {}
    }
  }
}

/**
 * Base class for query handlers
 */
export abstract class BaseQueryHandler implements QueryHandler {
  abstract handle(query: Query): Promise<any>

  protected log(message: string, query?: Query): void {
    const queryInfo = query ? ` (${query.type}:${query.id})` : ''
    console.log(`🔍 ${this.constructor.name}: ${message}${queryInfo}`)
  }

  protected logError(message: string, error: any, query?: Query): void {
    const queryInfo = query ? ` (${query.type}:${query.id})` : ''
    console.error(`❌ ${this.constructor.name}: ${message}${queryInfo}`, error)
  }

  protected validateQuery(query: Query, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!query.data[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
  }
}

/**
 * Caching middleware for queries
 */
export class QueryCachingMiddleware implements QueryMiddleware {
  private cache: Map<string, { data: any; timestamp: Date; ttl: number }>
  private defaultTTL: number

  constructor(defaultTTL: number = 300000) { // 5 minutes default
    this.cache = new Map()
    this.defaultTTL = defaultTTL
  }

  async before(query: Query): Promise<void> {
    const cacheKey = this.getCacheKey(query)
    const cached = this.cache.get(cacheKey)
    
    if (cached && this.isValid(cached)) {
      console.log(`📦 Cache hit for query: ${query.type}`)
      // Attach cached result to query for handler to use
      query.metadata = query.metadata || {}
      query.metadata._cachedResult = cached.data
    }
  }

  async after(query: Query, result: any): Promise<void> {
    // Only cache successful results
    if (result && !query.metadata?._cachedResult) {
      const cacheKey = this.getCacheKey(query)
      this.cache.set(cacheKey, {
        data: result,
        timestamp: new Date(),
        ttl: this.defaultTTL
      })
      console.log(`📦 Cached result for query: ${query.type}`)
    }
  }

  private getCacheKey(query: Query): string {
    return `${query.type}:${JSON.stringify(query.data)}`
  }

  private isValid(cached: { timestamp: Date; ttl: number }): boolean {
    return Date.now() - cached.timestamp.getTime() < cached.ttl
  }

  clearCache(): void {
    this.cache.clear()
  }
}

/**
 * Performance monitoring middleware
 */
export class QueryPerformanceMiddleware implements QueryMiddleware {
  private metrics: Map<string, { count: number; totalTime: number; avgTime: number }>

  constructor() {
    this.metrics = new Map()
  }

  async before(query: Query): Promise<void> {
    query.metadata = query.metadata || {}
    query.metadata._startTime = Date.now()
  }

  async after(query: Query, result: any): Promise<void> {
    const startTime = query.metadata?._startTime
    if (startTime) {
      const executionTime = Date.now() - startTime
      this.recordMetric(query.type, executionTime)
      
      console.log(`⏱️ Query ${query.type} executed in ${executionTime}ms`)
    }
  }

  private recordMetric(queryType: string, executionTime: number): void {
    const current = this.metrics.get(queryType) || { count: 0, totalTime: 0, avgTime: 0 }
    
    current.count++
    current.totalTime += executionTime
    current.avgTime = current.totalTime / current.count
    
    this.metrics.set(queryType, current)
  }

  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {}
    
    for (const [queryType, metrics] of this.metrics.entries()) {
      result[queryType] = {
        totalExecutions: metrics.count,
        averageTime: Math.round(metrics.avgTime),
        totalTime: metrics.totalTime
      }
    }
    
    return result
  }
}
