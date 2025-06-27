/**
 * Event Tracker
 * Handles event ingestion, validation, and storage
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { MongoClient, Db, Collection } from 'mongodb';
import { RedisClientType, createClient } from 'redis';
import { 
  AnalyticsEvent, 
  AnalyticsConfig,
  ValidationError,
  AnalyticsError 
} from '../types';
import { validateEvent } from '../utils/validation';
import { RateLimiter } from '../utils/rate-limiter';

export class EventTracker extends EventEmitter {
  private mongodb: MongoClient;
  private db: Db;
  private eventsCollection: Collection<AnalyticsEvent>;
  private redis: RedisClientType;
  private rateLimiter: RateLimiter;
  private isConnected: boolean = false;
  private eventBuffer: AnalyticsEvent[] = [];
  private bufferFlushInterval: NodeJS.Timeout;
  private stats = {
    total: 0,
    rate: 0,
    errors: 0,
    lastFlush: new Date()
  };

  constructor(
    private config: AnalyticsConfig,
    private logger: Logger
  ) {
    super();
    this.rateLimiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      max: 10000 // 10k events per minute
    });
    this.setupBufferFlush();
  }

  /**
   * Initialize connections
   */
  async initialize(): Promise<void> {
    try {
      // Connect to MongoDB
      this.mongodb = new MongoClient(this.config.database.mongodb.uri);
      await this.mongodb.connect();
      this.db = this.mongodb.db(this.config.database.mongodb.database);
      this.eventsCollection = this.db.collection('events');

      // Create indexes for better performance
      await this.createIndexes();

      // Connect to Redis
      this.redis = createClient({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        database: this.config.redis.database || 0
      });
      await this.redis.connect();

      this.isConnected = true;
      this.logger.info('Event Tracker initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Event Tracker', { error: error.message });
      throw new AnalyticsError('Event Tracker initialization failed', 'INIT_ERROR');
    }
  }

  /**
   * Create database indexes
   */
  private async createIndexes(): Promise<void> {
    await Promise.all([
      this.eventsCollection.createIndex({ timestamp: -1 }),
      this.eventsCollection.createIndex({ event: 1, timestamp: -1 }),
      this.eventsCollection.createIndex({ userId: 1, timestamp: -1 }),
      this.eventsCollection.createIndex({ sessionId: 1, timestamp: -1 }),
      this.eventsCollection.createIndex({ source: 1, timestamp: -1 }),
      this.eventsCollection.createIndex({ 'properties.page': 1, timestamp: -1 }),
      this.eventsCollection.createIndex({ 
        timestamp: 1 
      }, { 
        expireAfterSeconds: 60 * 60 * 24 * 90 // 90 days TTL
      })
    ]);
  }

  /**
   * Track a single event
   */
  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.isConnected) {
      throw new AnalyticsError('Event Tracker not connected', 'NOT_CONNECTED');
    }

    try {
      // Rate limiting
      await this.rateLimiter.checkLimit(event.userId || event.sessionId || 'anonymous');

      // Validate event
      const validationResult = validateEvent(event);
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errors.join(', '));
      }

      // Enrich event with additional metadata
      const enrichedEvent = this.enrichEvent(event);

      // Add to buffer for batch processing
      this.eventBuffer.push(enrichedEvent);

      // Update stats
      this.stats.total++;
      this.updateRate();

      // Emit event for real-time processing
      this.emit('event', enrichedEvent);

      // Cache recent events in Redis for fast access
      await this.cacheEvent(enrichedEvent);

      this.logger.debug('Event tracked', { 
        eventId: event.id, 
        event: event.event,
        userId: event.userId 
      });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Failed to track event', { 
        error: error.message,
        event: event.event,
        eventId: event.id 
      });
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackBatch(events: AnalyticsEvent[]): Promise<void> {
    if (!this.isConnected) {
      throw new AnalyticsError('Event Tracker not connected', 'NOT_CONNECTED');
    }

    const results = await Promise.allSettled(
      events.map(event => this.track(event))
    );

    const errors = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason);

    if (errors.length > 0) {
      this.logger.warn('Some events failed to track', { 
        total: events.length,
        failed: errors.length,
        errors: errors.map(e => e.message)
      });
    }

    this.logger.info('Batch tracking completed', {
      total: events.length,
      successful: events.length - errors.length,
      failed: errors.length
    });
  }

  /**
   * Enrich event with additional metadata
   */
  private enrichEvent(event: AnalyticsEvent): AnalyticsEvent {
    return {
      ...event,
      metadata: {
        ...event.metadata,
        trackedAt: new Date(),
        version: '1.0.0',
        ip: this.getClientIP(),
        userAgent: this.getUserAgent(),
        referrer: this.getReferrer()
      }
    };
  }

  /**
   * Cache event in Redis for fast access
   */
  private async cacheEvent(event: AnalyticsEvent): Promise<void> {
    try {
      const key = `event:${event.id}`;
      await this.redis.setEx(key, 3600, JSON.stringify(event)); // 1 hour TTL

      // Add to recent events list
      const recentKey = `recent_events:${event.event}`;
      await this.redis.lPush(recentKey, event.id);
      await this.redis.lTrim(recentKey, 0, 99); // Keep last 100 events
      await this.redis.expire(recentKey, 3600);

      // Add to user events if userId exists
      if (event.userId) {
        const userKey = `user_events:${event.userId}`;
        await this.redis.lPush(userKey, event.id);
        await this.redis.lTrim(userKey, 0, 999); // Keep last 1000 events
        await this.redis.expire(userKey, 86400); // 24 hours
      }
    } catch (error) {
      this.logger.warn('Failed to cache event', { 
        error: error.message,
        eventId: event.id 
      });
    }
  }

  /**
   * Set up buffer flush mechanism
   */
  private setupBufferFlush(): void {
    this.bufferFlushInterval = setInterval(async () => {
      await this.flushBuffer();
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Flush event buffer to database
   */
  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      if (eventsToFlush.length > 0) {
        await this.eventsCollection.insertMany(eventsToFlush, { ordered: false });
        this.stats.lastFlush = new Date();
        
        this.logger.debug('Buffer flushed', { 
          count: eventsToFlush.length,
          timestamp: this.stats.lastFlush 
        });
      }
    } catch (error) {
      // Put events back in buffer if flush fails
      this.eventBuffer.unshift(...eventsToFlush);
      this.logger.error('Failed to flush buffer', { 
        error: error.message,
        count: eventsToFlush.length 
      });
    }
  }

  /**
   * Get events by criteria
   */
  async getEvents(criteria: {
    event?: string;
    userId?: string;
    sessionId?: string;
    timeRange?: { start: Date; end: Date };
    limit?: number;
    offset?: number;
  }): Promise<AnalyticsEvent[]> {
    if (!this.isConnected) {
      throw new AnalyticsError('Event Tracker not connected', 'NOT_CONNECTED');
    }

    const query: any = {};

    if (criteria.event) {
      query.event = criteria.event;
    }

    if (criteria.userId) {
      query.userId = criteria.userId;
    }

    if (criteria.sessionId) {
      query.sessionId = criteria.sessionId;
    }

    if (criteria.timeRange) {
      query.timestamp = {
        $gte: criteria.timeRange.start,
        $lte: criteria.timeRange.end
      };
    }

    const cursor = this.eventsCollection
      .find(query)
      .sort({ timestamp: -1 })
      .limit(criteria.limit || 100)
      .skip(criteria.offset || 0);

    return await cursor.toArray();
  }

  /**
   * Get event by ID
   */
  async getEvent(id: string): Promise<AnalyticsEvent | null> {
    if (!this.isConnected) {
      throw new AnalyticsError('Event Tracker not connected', 'NOT_CONNECTED');
    }

    // Try cache first
    try {
      const cached = await this.redis.get(`event:${id}`);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn('Failed to get event from cache', { error: error.message });
    }

    // Fallback to database
    return await this.eventsCollection.findOne({ id });
  }

  /**
   * Get recent events for a specific event type
   */
  async getRecentEvents(eventType: string, limit: number = 10): Promise<AnalyticsEvent[]> {
    try {
      const eventIds = await this.redis.lRange(`recent_events:${eventType}`, 0, limit - 1);
      const events = await Promise.all(
        eventIds.map(id => this.getEvent(id))
      );
      return events.filter(event => event !== null);
    } catch (error) {
      this.logger.warn('Failed to get recent events from cache', { error: error.message });
      
      // Fallback to database
      return await this.eventsCollection
        .find({ event: eventType })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    }
  }

  /**
   * Get user events
   */
  async getUserEvents(userId: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      const eventIds = await this.redis.lRange(`user_events:${userId}`, 0, limit - 1);
      const events = await Promise.all(
        eventIds.map(id => this.getEvent(id))
      );
      return events.filter(event => event !== null);
    } catch (error) {
      this.logger.warn('Failed to get user events from cache', { error: error.message });
      
      // Fallback to database
      return await this.eventsCollection
        .find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
    }
  }

  /**
   * Update event rate calculation
   */
  private updateRate(): void {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window
    
    // This is a simplified rate calculation
    // In production, you might want to use a more sophisticated approach
    this.stats.rate = this.stats.total / 60; // events per second (approximation)
  }

  /**
   * Get tracker statistics
   */
  async getStats(): Promise<{
    total: number;
    rate: number;
    errors: number;
    bufferSize: number;
    lastFlush: Date;
  }> {
    return {
      ...this.stats,
      bufferSize: this.eventBuffer.length
    };
  }

  /**
   * Check if tracker is healthy
   */
  isHealthy(): boolean {
    return this.isConnected && 
           this.mongodb?.topology?.isConnected() && 
           this.redis?.isReady;
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
    }

    // Flush remaining events
    await this.flushBuffer();

    // Close connections
    if (this.redis?.isReady) {
      await this.redis.quit();
    }

    if (this.mongodb) {
      await this.mongodb.close();
    }

    this.isConnected = false;
    this.logger.info('Event Tracker cleaned up');
  }

  // Helper methods for extracting request metadata
  private getClientIP(): string {
    // This would be implemented based on your server setup
    return 'unknown';
  }

  private getUserAgent(): string {
    // This would be implemented based on your server setup
    return 'unknown';
  }

  private getReferrer(): string {
    // This would be implemented based on your server setup
    return 'unknown';
  }
}
