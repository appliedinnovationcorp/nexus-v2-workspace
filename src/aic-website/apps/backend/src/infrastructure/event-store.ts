/**
 * Event Store Implementation
 * Handles event persistence and retrieval for Event Sourcing
 */

import { Pool, PoolClient } from 'pg'
import { MongoClient, Db, Collection } from 'mongodb'
import { DomainEvent } from './event-bus'

export interface EventStoreConfig {
  provider: 'postgresql' | 'mongodb' | 'memory'
  connectionString?: string
  tableName?: string
  collectionName?: string
}

export interface EventStream {
  aggregateId: string
  aggregateType: string
  events: DomainEvent[]
  version: number
}

export interface EventQuery {
  aggregateId?: string
  aggregateType?: string
  fromVersion?: number
  toVersion?: number
  fromTimestamp?: Date
  toTimestamp?: Date
  eventTypes?: string[]
  limit?: number
  offset?: number
}

export class EventStore {
  private config: EventStoreConfig
  private pgPool?: Pool
  private mongoClient?: MongoClient
  private mongoDb?: Db
  private memoryStore: Map<string, DomainEvent[]>

  constructor(config?: EventStoreConfig) {
    this.config = config || {
      provider: 'memory'
    }
    this.memoryStore = new Map()
    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'postgresql':
          await this.initializePostgreSQL()
          break
        case 'mongodb':
          await this.initializeMongoDB()
          break
        case 'memory':
          console.log('📦 Event Store initialized with in-memory storage')
          break
      }
    } catch (error) {
      console.error('❌ Event Store initialization failed:', error)
      // Fallback to memory storage
      this.config.provider = 'memory'
      console.log('📦 Falling back to in-memory event storage')
    }
  }

  private async initializePostgreSQL(): Promise<void> {
    const connectionString = this.config.connectionString || process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('PostgreSQL connection string is required')
    }

    this.pgPool = new Pool({ connectionString })
    
    // Test connection
    const client = await this.pgPool.connect()
    
    // Create events table if it doesn't exist
    await this.createPostgreSQLSchema(client)
    
    client.release()
    console.log('📦 Event Store initialized with PostgreSQL')
  }

  private async createPostgreSQLSchema(client: PoolClient): Promise<void> {
    const tableName = this.config.tableName || 'events'
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY,
        aggregate_id VARCHAR(255) NOT NULL,
        aggregate_type VARCHAR(255) NOT NULL,
        event_type VARCHAR(255) NOT NULL,
        version INTEGER NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
        data JSONB NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(aggregate_id, version)
      );
      
      CREATE INDEX IF NOT EXISTS idx_events_aggregate ON ${tableName}(aggregate_id);
      CREATE INDEX IF NOT EXISTS idx_events_type ON ${tableName}(aggregate_type);
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON ${tableName}(timestamp);
    `
    
    await client.query(createTableQuery)
  }

  private async initializeMongoDB(): Promise<void> {
    const connectionString = this.config.connectionString || process.env.MONGODB_URL
    if (!connectionString) {
      throw new Error('MongoDB connection string is required')
    }

    this.mongoClient = new MongoClient(connectionString)
    await this.mongoClient.connect()
    
    this.mongoDb = this.mongoClient.db()
    
    // Create indexes
    const collectionName = this.config.collectionName || 'events'
    const collection = this.mongoDb.collection(collectionName)
    
    await collection.createIndex({ aggregateId: 1, version: 1 }, { unique: true })
    await collection.createIndex({ aggregateId: 1 })
    await collection.createIndex({ aggregateType: 1 })
    await collection.createIndex({ timestamp: 1 })
    
    console.log('📦 Event Store initialized with MongoDB')
  }

  /**
   * Save a single event
   */
  async saveEvent(event: DomainEvent): Promise<void> {
    try {
      switch (this.config.provider) {
        case 'postgresql':
          await this.saveEventPostgreSQL(event)
          break
        case 'mongodb':
          await this.saveEventMongoDB(event)
          break
        case 'memory':
          await this.saveEventMemory(event)
          break
      }
      
      console.log(`📝 Event saved: ${event.type} (${event.id})`)
    } catch (error) {
      console.error(`❌ Failed to save event: ${event.type} (${event.id})`, error)
      throw error
    }
  }

  /**
   * Save multiple events atomically
   */
  async saveEvents(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) return

    try {
      switch (this.config.provider) {
        case 'postgresql':
          await this.saveEventsPostgreSQL(events)
          break
        case 'mongodb':
          await this.saveEventsMongoDB(events)
          break
        case 'memory':
          await this.saveEventsMemory(events)
          break
      }
      
      console.log(`📝 Saved ${events.length} events`)
    } catch (error) {
      console.error(`❌ Failed to save ${events.length} events`, error)
      throw error
    }
  }

  /**
   * Get events for a specific aggregate
   */
  async getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    try {
      let events: DomainEvent[]

      switch (this.config.provider) {
        case 'postgresql':
          events = await this.getEventsPostgreSQL(aggregateId, fromVersion)
          break
        case 'mongodb':
          events = await this.getEventsMongoDB(aggregateId, fromVersion)
          break
        case 'memory':
          events = await this.getEventsMemory(aggregateId, fromVersion)
          break
        default:
          events = []
      }

      console.log(`📖 Retrieved ${events.length} events for aggregate: ${aggregateId}`)
      return events
    } catch (error) {
      console.error(`❌ Failed to get events for aggregate: ${aggregateId}`, error)
      throw error
    }
  }

  /**
   * Query events with flexible criteria
   */
  async queryEvents(query: EventQuery): Promise<DomainEvent[]> {
    try {
      let events: DomainEvent[]

      switch (this.config.provider) {
        case 'postgresql':
          events = await this.queryEventsPostgreSQL(query)
          break
        case 'mongodb':
          events = await this.queryEventsMongoDB(query)
          break
        case 'memory':
          events = await this.queryEventsMemory(query)
          break
        default:
          events = []
      }

      console.log(`🔍 Query returned ${events.length} events`)
      return events
    } catch (error) {
      console.error('❌ Failed to query events', error)
      throw error
    }
  }

  /**
   * Get event stream for an aggregate
   */
  async getEventStream(aggregateId: string, aggregateType: string): Promise<EventStream> {
    const events = await this.getEvents(aggregateId)
    const version = events.length > 0 ? Math.max(...events.map(e => e.version)) : 0

    return {
      aggregateId,
      aggregateType,
      events,
      version
    }
  }

  // PostgreSQL implementations
  private async saveEventPostgreSQL(event: DomainEvent): Promise<void> {
    if (!this.pgPool) throw new Error('PostgreSQL not initialized')

    const tableName = this.config.tableName || 'events'
    const query = `
      INSERT INTO ${tableName} (id, aggregate_id, aggregate_type, event_type, version, timestamp, data, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `
    
    const values = [
      event.id,
      event.aggregateId,
      event.aggregateType,
      event.type,
      event.version,
      event.timestamp,
      JSON.stringify(event.data),
      JSON.stringify(event.metadata || {})
    ]

    await this.pgPool.query(query, values)
  }

  private async saveEventsPostgreSQL(events: DomainEvent[]): Promise<void> {
    if (!this.pgPool) throw new Error('PostgreSQL not initialized')

    const client = await this.pgPool.connect()
    
    try {
      await client.query('BEGIN')
      
      const tableName = this.config.tableName || 'events'
      const query = `
        INSERT INTO ${tableName} (id, aggregate_id, aggregate_type, event_type, version, timestamp, data, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `
      
      for (const event of events) {
        const values = [
          event.id,
          event.aggregateId,
          event.aggregateType,
          event.type,
          event.version,
          event.timestamp,
          JSON.stringify(event.data),
          JSON.stringify(event.metadata || {})
        ]
        
        await client.query(query, values)
      }
      
      await client.query('COMMIT')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  private async getEventsPostgreSQL(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    if (!this.pgPool) throw new Error('PostgreSQL not initialized')

    const tableName = this.config.tableName || 'events'
    let query = `
      SELECT id, aggregate_id, aggregate_type, event_type, version, timestamp, data, metadata
      FROM ${tableName}
      WHERE aggregate_id = $1
    `
    
    const params: any[] = [aggregateId]
    
    if (fromVersion !== undefined) {
      query += ' AND version >= $2'
      params.push(fromVersion)
    }
    
    query += ' ORDER BY version ASC'

    const result = await this.pgPool.query(query, params)
    
    return result.rows.map(row => ({
      id: row.id,
      type: row.event_type,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      version: row.version,
      timestamp: row.timestamp,
      data: row.data,
      metadata: row.metadata
    }))
  }

  private async queryEventsPostgreSQL(query: EventQuery): Promise<DomainEvent[]> {
    if (!this.pgPool) throw new Error('PostgreSQL not initialized')

    const tableName = this.config.tableName || 'events'
    let sql = `
      SELECT id, aggregate_id, aggregate_type, event_type, version, timestamp, data, metadata
      FROM ${tableName}
      WHERE 1=1
    `
    
    const params: any[] = []
    let paramIndex = 1

    if (query.aggregateId) {
      sql += ` AND aggregate_id = $${paramIndex++}`
      params.push(query.aggregateId)
    }

    if (query.aggregateType) {
      sql += ` AND aggregate_type = $${paramIndex++}`
      params.push(query.aggregateType)
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      sql += ` AND event_type = ANY($${paramIndex++})`
      params.push(query.eventTypes)
    }

    if (query.fromTimestamp) {
      sql += ` AND timestamp >= $${paramIndex++}`
      params.push(query.fromTimestamp)
    }

    if (query.toTimestamp) {
      sql += ` AND timestamp <= $${paramIndex++}`
      params.push(query.toTimestamp)
    }

    sql += ' ORDER BY timestamp ASC'

    if (query.limit) {
      sql += ` LIMIT $${paramIndex++}`
      params.push(query.limit)
    }

    if (query.offset) {
      sql += ` OFFSET $${paramIndex++}`
      params.push(query.offset)
    }

    const result = await this.pgPool.query(sql, params)
    
    return result.rows.map(row => ({
      id: row.id,
      type: row.event_type,
      aggregateId: row.aggregate_id,
      aggregateType: row.aggregate_type,
      version: row.version,
      timestamp: row.timestamp,
      data: row.data,
      metadata: row.metadata
    }))
  }

  // MongoDB implementations
  private async saveEventMongoDB(event: DomainEvent): Promise<void> {
    if (!this.mongoDb) throw new Error('MongoDB not initialized')

    const collectionName = this.config.collectionName || 'events'
    const collection = this.mongoDb.collection(collectionName)

    await collection.insertOne({
      _id: event.id,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.type,
      version: event.version,
      timestamp: event.timestamp,
      data: event.data,
      metadata: event.metadata || {}
    })
  }

  private async saveEventsMongoDB(events: DomainEvent[]): Promise<void> {
    if (!this.mongoDb) throw new Error('MongoDB not initialized')

    const collectionName = this.config.collectionName || 'events'
    const collection = this.mongoDb.collection(collectionName)

    const documents = events.map(event => ({
      _id: event.id,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      eventType: event.type,
      version: event.version,
      timestamp: event.timestamp,
      data: event.data,
      metadata: event.metadata || {}
    }))

    await collection.insertMany(documents)
  }

  private async getEventsMongoDB(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    if (!this.mongoDb) throw new Error('MongoDB not initialized')

    const collectionName = this.config.collectionName || 'events'
    const collection = this.mongoDb.collection(collectionName)

    const filter: any = { aggregateId }
    if (fromVersion !== undefined) {
      filter.version = { $gte: fromVersion }
    }

    const cursor = collection.find(filter).sort({ version: 1 })
    const documents = await cursor.toArray()

    return documents.map(doc => ({
      id: doc._id,
      type: doc.eventType,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType,
      version: doc.version,
      timestamp: doc.timestamp,
      data: doc.data,
      metadata: doc.metadata
    }))
  }

  private async queryEventsMongoDB(query: EventQuery): Promise<DomainEvent[]> {
    if (!this.mongoDb) throw new Error('MongoDB not initialized')

    const collectionName = this.config.collectionName || 'events'
    const collection = this.mongoDb.collection(collectionName)

    const filter: any = {}

    if (query.aggregateId) filter.aggregateId = query.aggregateId
    if (query.aggregateType) filter.aggregateType = query.aggregateType
    if (query.eventTypes && query.eventTypes.length > 0) {
      filter.eventType = { $in: query.eventTypes }
    }
    if (query.fromTimestamp || query.toTimestamp) {
      filter.timestamp = {}
      if (query.fromTimestamp) filter.timestamp.$gte = query.fromTimestamp
      if (query.toTimestamp) filter.timestamp.$lte = query.toTimestamp
    }

    let cursor = collection.find(filter).sort({ timestamp: 1 })

    if (query.offset) cursor = cursor.skip(query.offset)
    if (query.limit) cursor = cursor.limit(query.limit)

    const documents = await cursor.toArray()

    return documents.map(doc => ({
      id: doc._id,
      type: doc.eventType,
      aggregateId: doc.aggregateId,
      aggregateType: doc.aggregateType,
      version: doc.version,
      timestamp: doc.timestamp,
      data: doc.data,
      metadata: doc.metadata
    }))
  }

  // Memory implementations
  private async saveEventMemory(event: DomainEvent): Promise<void> {
    const key = event.aggregateId
    if (!this.memoryStore.has(key)) {
      this.memoryStore.set(key, [])
    }
    
    const events = this.memoryStore.get(key)!
    events.push(event)
    events.sort((a, b) => a.version - b.version)
  }

  private async saveEventsMemory(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.saveEventMemory(event)
    }
  }

  private async getEventsMemory(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]> {
    const events = this.memoryStore.get(aggregateId) || []
    
    if (fromVersion !== undefined) {
      return events.filter(event => event.version >= fromVersion)
    }
    
    return [...events]
  }

  private async queryEventsMemory(query: EventQuery): Promise<DomainEvent[]> {
    let allEvents: DomainEvent[] = []
    
    // Collect all events from memory store
    for (const events of this.memoryStore.values()) {
      allEvents.push(...events)
    }

    // Apply filters
    let filteredEvents = allEvents

    if (query.aggregateId) {
      filteredEvents = filteredEvents.filter(e => e.aggregateId === query.aggregateId)
    }

    if (query.aggregateType) {
      filteredEvents = filteredEvents.filter(e => e.aggregateType === query.aggregateType)
    }

    if (query.eventTypes && query.eventTypes.length > 0) {
      filteredEvents = filteredEvents.filter(e => query.eventTypes!.includes(e.type))
    }

    if (query.fromTimestamp) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.fromTimestamp!)
    }

    if (query.toTimestamp) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.toTimestamp!)
    }

    // Sort by timestamp
    filteredEvents.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Apply pagination
    if (query.offset) {
      filteredEvents = filteredEvents.slice(query.offset)
    }

    if (query.limit) {
      filteredEvents = filteredEvents.slice(0, query.limit)
    }

    return filteredEvents
  }

  /**
   * Get event store statistics
   */
  async getStats(): Promise<any> {
    try {
      switch (this.config.provider) {
        case 'postgresql':
          return await this.getStatsPostgreSQL()
        case 'mongodb':
          return await this.getStatsMongoDB()
        case 'memory':
          return await this.getStatsMemory()
        default:
          return { provider: this.config.provider, error: 'Unknown provider' }
      }
    } catch (error) {
      console.error('❌ Failed to get event store stats', error)
      return { error: error.message }
    }
  }

  private async getStatsPostgreSQL(): Promise<any> {
    if (!this.pgPool) throw new Error('PostgreSQL not initialized')

    const tableName = this.config.tableName || 'events'
    const query = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT aggregate_id) as unique_aggregates,
        COUNT(DISTINCT aggregate_type) as aggregate_types,
        MIN(timestamp) as oldest_event,
        MAX(timestamp) as newest_event
      FROM ${tableName}
    `

    const result = await this.pgPool.query(query)
    const stats = result.rows[0]

    return {
      provider: 'postgresql',
      totalEvents: parseInt(stats.total_events),
      uniqueAggregates: parseInt(stats.unique_aggregates),
      aggregateTypes: parseInt(stats.aggregate_types),
      oldestEvent: stats.oldest_event,
      newestEvent: stats.newest_event
    }
  }

  private async getStatsMongoDB(): Promise<any> {
    if (!this.mongoDb) throw new Error('MongoDB not initialized')

    const collectionName = this.config.collectionName || 'events'
    const collection = this.mongoDb.collection(collectionName)

    const [totalEvents, uniqueAggregates, aggregateTypes] = await Promise.all([
      collection.countDocuments(),
      collection.distinct('aggregateId').then(ids => ids.length),
      collection.distinct('aggregateType').then(types => types.length)
    ])

    const oldestEvent = await collection.findOne({}, { sort: { timestamp: 1 } })
    const newestEvent = await collection.findOne({}, { sort: { timestamp: -1 } })

    return {
      provider: 'mongodb',
      totalEvents,
      uniqueAggregates,
      aggregateTypes,
      oldestEvent: oldestEvent?.timestamp,
      newestEvent: newestEvent?.timestamp
    }
  }

  private async getStatsMemory(): Promise<any> {
    let totalEvents = 0
    const aggregateTypes = new Set<string>()

    for (const events of this.memoryStore.values()) {
      totalEvents += events.length
      events.forEach(event => aggregateTypes.add(event.aggregateType))
    }

    return {
      provider: 'memory',
      totalEvents,
      uniqueAggregates: this.memoryStore.size,
      aggregateTypes: aggregateTypes.size,
      memoryUsage: `${this.memoryStore.size} aggregates in memory`
    }
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    try {
      if (this.pgPool) {
        await this.pgPool.end()
        console.log('📦 PostgreSQL connection pool closed')
      }

      if (this.mongoClient) {
        await this.mongoClient.close()
        console.log('📦 MongoDB connection closed')
      }

      if (this.config.provider === 'memory') {
        this.memoryStore.clear()
        console.log('📦 Memory store cleared')
      }
    } catch (error) {
      console.error('❌ Error closing event store connections', error)
    }
  }
}
