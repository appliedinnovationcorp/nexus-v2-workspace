/**
 * Real-time Event Processor
 * Handles real-time event processing, streaming, and aggregations
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { Server as SocketIOServer } from 'socket.io';
import { RedisClientType, createClient } from 'redis';
import { 
  AnalyticsEvent, 
  MetricValue,
  AnalyticsConfig,
  AnalyticsError 
} from '../types';
import { StreamProcessor } from './stream-processor';
import { AggregationEngine } from './aggregation-engine';
import { EventBuffer } from '../utils/event-buffer';

export class RealtimeProcessor extends EventEmitter {
  private redis: RedisClientType;
  private streamProcessor: StreamProcessor;
  private aggregationEngine: AggregationEngine;
  private eventBuffer: EventBuffer;
  private socketServer?: SocketIOServer;
  private isRunning: boolean = false;
  private processingStats = {
    processed: 0,
    errors: 0,
    rate: 0,
    latency: 0
  };
  private activeStreams = new Map<string, EventEmitter>();
  private processingQueue: AnalyticsEvent[] = [];
  private processingInterval: NodeJS.Timeout;

  constructor(
    private config: AnalyticsConfig,
    private logger: Logger
  ) {
    super();
    this.initializeComponents();
  }

  /**
   * Initialize processor components
   */
  private initializeComponents(): void {
    this.streamProcessor = new StreamProcessor(this.config, this.logger);
    this.aggregationEngine = new AggregationEngine(this.config, this.logger);
    this.eventBuffer = new EventBuffer({
      maxSize: 10000,
      flushInterval: 1000,
      onFlush: (events) => this.processEventBatch(events)
    });
  }

  /**
   * Start the real-time processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Real-time processor is already running');
      return;
    }

    try {
      this.logger.info('Starting real-time processor...');

      // Connect to Redis for pub/sub
      this.redis = createClient({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        database: this.config.redis.database || 0
      });
      await this.redis.connect();

      // Start components
      await this.streamProcessor.start();
      await this.aggregationEngine.start();
      this.eventBuffer.start();

      // Set up processing interval
      this.processingInterval = setInterval(() => {
        this.processQueuedEvents();
      }, 100); // Process every 100ms

      // Set up event listeners
      this.setupEventListeners();

      this.isRunning = true;
      this.logger.info('Real-time processor started successfully');
    } catch (error) {
      this.logger.error('Failed to start real-time processor', { error: error.message });
      throw new AnalyticsError('Real-time processor start failed', 'START_ERROR');
    }
  }

  /**
   * Stop the real-time processor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Real-time processor is not running');
      return;
    }

    try {
      this.logger.info('Stopping real-time processor...');

      // Clear processing interval
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
      }

      // Process remaining events
      await this.processQueuedEvents();

      // Stop components
      this.eventBuffer.stop();
      await this.aggregationEngine.stop();
      await this.streamProcessor.stop();

      // Close Redis connection
      if (this.redis?.isReady) {
        await this.redis.quit();
      }

      // Close socket connections
      if (this.socketServer) {
        this.socketServer.close();
      }

      this.isRunning = false;
      this.logger.info('Real-time processor stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop real-time processor', { error: error.message });
      throw new AnalyticsError('Real-time processor stop failed', 'STOP_ERROR');
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Stream processor events
    this.streamProcessor.on('processed', (event: AnalyticsEvent) => {
      this.emit('processed', event);
    });

    this.streamProcessor.on('error', (error) => {
      this.processingStats.errors++;
      this.emit('error', error);
    });

    // Aggregation engine events
    this.aggregationEngine.on('metric', (metric: MetricValue) => {
      this.broadcastMetric(metric);
      this.emit('metric', metric);
    });

    this.aggregationEngine.on('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Process a single event
   */
  async processEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.isRunning) {
      throw new AnalyticsError('Real-time processor is not running', 'NOT_RUNNING');
    }

    const startTime = Date.now();

    try {
      // Add to processing queue
      this.processingQueue.push(event);

      // Add to buffer for batch processing
      this.eventBuffer.add(event);

      // Update stats
      this.processingStats.processed++;
      this.processingStats.latency = Date.now() - startTime;
      this.updateProcessingRate();

      // Broadcast event to real-time streams
      this.broadcastEvent(event);

      this.logger.debug('Event processed', { 
        eventId: event.id,
        event: event.event,
        latency: this.processingStats.latency
      });
    } catch (error) {
      this.processingStats.errors++;
      this.logger.error('Failed to process event', { 
        error: error.message,
        eventId: event.id 
      });
      throw error;
    }
  }

  /**
   * Process queued events
   */
  private async processQueuedEvents(): Promise<void> {
    if (this.processingQueue.length === 0) {
      return;
    }

    const eventsToProcess = [...this.processingQueue];
    this.processingQueue = [];

    try {
      // Process events through stream processor
      await Promise.all(
        eventsToProcess.map(event => this.streamProcessor.process(event))
      );

      // Update aggregations
      await this.aggregationEngine.processEvents(eventsToProcess);

    } catch (error) {
      this.logger.error('Failed to process queued events', { 
        error: error.message,
        count: eventsToProcess.length 
      });
    }
  }

  /**
   * Process event batch
   */
  private async processEventBatch(events: AnalyticsEvent[]): Promise<void> {
    try {
      // Process through aggregation engine
      await this.aggregationEngine.processEvents(events);

      // Publish batch metrics
      const batchMetrics = await this.calculateBatchMetrics(events);
      batchMetrics.forEach(metric => this.broadcastMetric(metric));

      this.logger.debug('Event batch processed', { count: events.length });
    } catch (error) {
      this.logger.error('Failed to process event batch', { 
        error: error.message,
        count: events.length 
      });
    }
  }

  /**
   * Calculate metrics for event batch
   */
  private async calculateBatchMetrics(events: AnalyticsEvent[]): Promise<MetricValue[]> {
    const metrics: MetricValue[] = [];
    const now = new Date();

    // Event count by type
    const eventCounts = new Map<string, number>();
    events.forEach(event => {
      eventCounts.set(event.event, (eventCounts.get(event.event) || 0) + 1);
    });

    eventCounts.forEach((count, eventType) => {
      metrics.push({
        metric: `event_count_${eventType}`,
        value: count,
        timestamp: now,
        dimensions: { event_type: eventType },
        tags: { batch: 'true' }
      });
    });

    // User activity
    const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
    if (uniqueUsers > 0) {
      metrics.push({
        metric: 'active_users',
        value: uniqueUsers,
        timestamp: now,
        tags: { batch: 'true' }
      });
    }

    // Session activity
    const uniqueSessions = new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size;
    if (uniqueSessions > 0) {
      metrics.push({
        metric: 'active_sessions',
        value: uniqueSessions,
        timestamp: now,
        tags: { batch: 'true' }
      });
    }

    return metrics;
  }

  /**
   * Broadcast event to real-time streams
   */
  private broadcastEvent(event: AnalyticsEvent): void {
    try {
      // Broadcast to WebSocket clients
      if (this.socketServer) {
        this.socketServer.emit('event', {
          id: event.id,
          event: event.event,
          timestamp: event.timestamp,
          properties: event.properties
        });
      }

      // Publish to Redis for other services
      this.redis.publish('analytics:events', JSON.stringify(event));

      // Notify active streams
      this.activeStreams.forEach((stream, streamId) => {
        stream.emit('event', event);
      });
    } catch (error) {
      this.logger.warn('Failed to broadcast event', { 
        error: error.message,
        eventId: event.id 
      });
    }
  }

  /**
   * Broadcast metric to real-time streams
   */
  private broadcastMetric(metric: MetricValue): void {
    try {
      // Broadcast to WebSocket clients
      if (this.socketServer) {
        this.socketServer.emit('metric', metric);
      }

      // Publish to Redis
      this.redis.publish('analytics:metrics', JSON.stringify(metric));

      // Notify metric-specific streams
      const metricStream = this.activeStreams.get(`metric:${metric.metric}`);
      if (metricStream) {
        metricStream.emit('metric', metric);
      }
    } catch (error) {
      this.logger.warn('Failed to broadcast metric', { 
        error: error.message,
        metric: metric.metric 
      });
    }
  }

  /**
   * Create a real-time data stream
   */
  createStream(metrics: string[]): EventEmitter {
    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const stream = new EventEmitter();

    // Store stream reference
    this.activeStreams.set(streamId, stream);

    // Set up metric-specific streams
    metrics.forEach(metric => {
      const metricStreamId = `metric:${metric}`;
      if (!this.activeStreams.has(metricStreamId)) {
        this.activeStreams.set(metricStreamId, new EventEmitter());
      }
    });

    // Clean up stream when it's closed
    stream.on('close', () => {
      this.activeStreams.delete(streamId);
    });

    this.logger.info('Real-time stream created', { 
      streamId,
      metrics: metrics.length 
    });

    return stream;
  }

  /**
   * Set up WebSocket server
   */
  setupWebSocket(socketServer: SocketIOServer): void {
    this.socketServer = socketServer;

    this.socketServer.on('connection', (socket) => {
      this.logger.info('WebSocket client connected', { socketId: socket.id });

      socket.on('subscribe', (data: { metrics?: string[]; events?: string[] }) => {
        if (data.metrics) {
          data.metrics.forEach(metric => {
            socket.join(`metric:${metric}`);
          });
        }

        if (data.events) {
          data.events.forEach(event => {
            socket.join(`event:${event}`);
          });
        }

        this.logger.debug('Client subscribed', { 
          socketId: socket.id,
          metrics: data.metrics?.length || 0,
          events: data.events?.length || 0
        });
      });

      socket.on('unsubscribe', (data: { metrics?: string[]; events?: string[] }) => {
        if (data.metrics) {
          data.metrics.forEach(metric => {
            socket.leave(`metric:${metric}`);
          });
        }

        if (data.events) {
          data.events.forEach(event => {
            socket.leave(`event:${event}`);
          });
        }
      });

      socket.on('disconnect', () => {
        this.logger.info('WebSocket client disconnected', { socketId: socket.id });
      });
    });
  }

  /**
   * Update processing rate calculation
   */
  private updateProcessingRate(): void {
    // Simple rate calculation - in production, use a sliding window
    const now = Date.now();
    this.processingStats.rate = this.processingStats.processed / (now / 1000);
  }

  /**
   * Get processor statistics
   */
  getStats(): {
    processed: number;
    errors: number;
    rate: number;
    latency: number;
    queueSize: number;
    activeStreams: number;
  } {
    return {
      ...this.processingStats,
      queueSize: this.processingQueue.length,
      activeStreams: this.activeStreams.size
    };
  }

  /**
   * Check if processor is healthy
   */
  isHealthy(): boolean {
    return this.isRunning && 
           this.redis?.isReady &&
           this.streamProcessor?.isHealthy() &&
           this.aggregationEngine?.isHealthy();
  }

  /**
   * Get real-time metrics for dashboard
   */
  async getRealtimeMetrics(): Promise<{
    eventsPerSecond: number;
    activeUsers: number;
    activeSessions: number;
    errorRate: number;
    avgLatency: number;
  }> {
    try {
      // Get metrics from Redis cache
      const [eventsPerSecond, activeUsers, activeSessions] = await Promise.all([
        this.redis.get('rt:events_per_second'),
        this.redis.get('rt:active_users'),
        this.redis.get('rt:active_sessions')
      ]);

      return {
        eventsPerSecond: parseFloat(eventsPerSecond || '0'),
        activeUsers: parseInt(activeUsers || '0'),
        activeSessions: parseInt(activeSessions || '0'),
        errorRate: this.processingStats.errors / Math.max(this.processingStats.processed, 1),
        avgLatency: this.processingStats.latency
      };
    } catch (error) {
      this.logger.error('Failed to get real-time metrics', { error: error.message });
      return {
        eventsPerSecond: 0,
        activeUsers: 0,
        activeSessions: 0,
        errorRate: 0,
        avgLatency: 0
      };
    }
  }
}
