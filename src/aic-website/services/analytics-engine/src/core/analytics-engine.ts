/**
 * Core Analytics Engine
 * Main orchestrator for the real-time analytics platform
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { 
  AnalyticsEvent, 
  MetricDefinition, 
  MetricValue, 
  QueryOptions, 
  InsightItem,
  Dashboard,
  AlertRule,
  AnalyticsConfig,
  AnalyticsError
} from '../types';
import { EventTracker } from '../tracking/event-tracker';
import { MetricsCalculator } from '../metrics/metrics-calculator';
import { InsightsGenerator } from '../ai/insights-generator';
import { DashboardManager } from '../dashboard/dashboard-manager';
import { AlertManager } from '../alerts/alert-manager';
import { RealtimeProcessor } from '../processing/realtime-processor';
import { DataConnector } from '../connectors/data-connector';
import { SecurityManager } from '../security/security-manager';
import { createLogger } from '../utils/logger';
import { validateConfig } from '../utils/validation';

export class AnalyticsEngine extends EventEmitter {
  private logger: Logger;
  private eventTracker: EventTracker;
  private metricsCalculator: MetricsCalculator;
  private insightsGenerator: InsightsGenerator;
  private dashboardManager: DashboardManager;
  private alertManager: AlertManager;
  private realtimeProcessor: RealtimeProcessor;
  private dataConnector: DataConnector;
  private securityManager: SecurityManager;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  constructor(private config: AnalyticsConfig) {
    super();
    
    // Validate configuration
    validateConfig(config);
    
    // Initialize logger
    this.logger = createLogger(config.monitoring.logging);
    
    // Initialize components
    this.initializeComponents();
    
    this.logger.info('Analytics Engine initialized', { 
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  /**
   * Initialize all engine components
   */
  private initializeComponents(): void {
    try {
      // Core components
      this.eventTracker = new EventTracker(this.config, this.logger);
      this.metricsCalculator = new MetricsCalculator(this.config, this.logger);
      this.insightsGenerator = new InsightsGenerator(this.config, this.logger);
      this.dashboardManager = new DashboardManager(this.config, this.logger);
      this.alertManager = new AlertManager(this.config, this.logger);
      this.realtimeProcessor = new RealtimeProcessor(this.config, this.logger);
      this.dataConnector = new DataConnector(this.config, this.logger);
      this.securityManager = new SecurityManager(this.config, this.logger);

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.logger.info('All components initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize components', { error: error.message });
      throw new AnalyticsError('Component initialization failed', 'INIT_ERROR');
    }
  }

  /**
   * Set up event listeners between components
   */
  private setupEventListeners(): void {
    // Event tracking to real-time processing
    this.eventTracker.on('event', (event: AnalyticsEvent) => {
      this.realtimeProcessor.processEvent(event);
    });

    // Real-time processing to metrics calculation
    this.realtimeProcessor.on('processed', (event: AnalyticsEvent) => {
      this.metricsCalculator.updateMetrics(event);
    });

    // Metrics updates to alert checking
    this.metricsCalculator.on('metric', (metric: MetricValue) => {
      this.alertManager.checkAlerts(metric);
    });

    // Alert triggers
    this.alertManager.on('alert', (alert) => {
      this.emit('alert', alert);
      this.logger.warn('Alert triggered', { alert });
    });

    // Insights generation
    this.insightsGenerator.on('insight', (insight: InsightItem) => {
      this.emit('insight', insight);
      this.logger.info('New insight generated', { insight: insight.title });
    });

    // Error handling
    [
      this.eventTracker,
      this.metricsCalculator,
      this.insightsGenerator,
      this.dashboardManager,
      this.alertManager,
      this.realtimeProcessor,
      this.dataConnector
    ].forEach(component => {
      component.on('error', (error) => {
        this.logger.error('Component error', { 
          component: component.constructor.name,
          error: error.message 
        });
        this.emit('error', error);
      });
    });
  }

  /**
   * Start the analytics engine
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      throw new AnalyticsError('Engine not initialized', 'NOT_INITIALIZED');
    }

    if (this.isRunning) {
      this.logger.warn('Engine is already running');
      return;
    }

    try {
      this.logger.info('Starting Analytics Engine...');

      // Start components in order
      await this.dataConnector.connect();
      await this.realtimeProcessor.start();
      await this.metricsCalculator.start();
      await this.alertManager.start();
      await this.insightsGenerator.start();

      this.isRunning = true;
      this.emit('started');
      this.logger.info('Analytics Engine started successfully');
    } catch (error) {
      this.logger.error('Failed to start Analytics Engine', { error: error.message });
      throw new AnalyticsError('Engine start failed', 'START_ERROR');
    }
  }

  /**
   * Stop the analytics engine
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Engine is not running');
      return;
    }

    try {
      this.logger.info('Stopping Analytics Engine...');

      // Stop components in reverse order
      await this.insightsGenerator.stop();
      await this.alertManager.stop();
      await this.metricsCalculator.stop();
      await this.realtimeProcessor.stop();
      await this.dataConnector.disconnect();

      this.isRunning = false;
      this.emit('stopped');
      this.logger.info('Analytics Engine stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop Analytics Engine', { error: error.message });
      throw new AnalyticsError('Engine stop failed', 'STOP_ERROR');
    }
  }

  /**
   * Track an analytics event
   */
  async track(event: string, properties: Record<string, any>, options?: {
    userId?: string;
    sessionId?: string;
    timestamp?: Date;
    source?: string;
  }): Promise<void> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    const analyticsEvent: AnalyticsEvent = {
      id: this.generateEventId(),
      event,
      properties,
      userId: options?.userId,
      sessionId: options?.sessionId,
      timestamp: options?.timestamp || new Date(),
      source: options?.source || 'api',
      metadata: {
        engineVersion: '1.0.0',
        processingTime: Date.now()
      }
    };

    await this.eventTracker.track(analyticsEvent);
  }

  /**
   * Track multiple events in batch
   */
  async trackBatch(events: Array<{
    event: string;
    properties: Record<string, any>;
    userId?: string;
    sessionId?: string;
    timestamp?: Date;
    source?: string;
  }>): Promise<void> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    const analyticsEvents: AnalyticsEvent[] = events.map(e => ({
      id: this.generateEventId(),
      event: e.event,
      properties: e.properties,
      userId: e.userId,
      sessionId: e.sessionId,
      timestamp: e.timestamp || new Date(),
      source: e.source || 'api',
      metadata: {
        engineVersion: '1.0.0',
        processingTime: Date.now()
      }
    }));

    await this.eventTracker.trackBatch(analyticsEvents);
  }

  /**
   * Get metrics data
   */
  async getMetrics(
    metrics: string | string[],
    options: QueryOptions
  ): Promise<MetricValue[]> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    const metricNames = Array.isArray(metrics) ? metrics : [metrics];
    return await this.metricsCalculator.getMetrics(metricNames, options);
  }

  /**
   * Define a new metric
   */
  async defineMetric(definition: MetricDefinition): Promise<void> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    await this.metricsCalculator.defineMetric(definition);
    this.logger.info('Metric defined', { metric: definition.name });
  }

  /**
   * Generate AI insights
   */
  async generateInsights(
    dataSource: string,
    options: {
      timeRange: string;
      metrics?: string[];
      includeRecommendations?: boolean;
      analysisType?: 'summary' | 'trend' | 'prediction' | 'anomaly';
    }
  ): Promise<InsightItem[]> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return await this.insightsGenerator.generateInsights(dataSource, options);
  }

  /**
   * Create a dashboard
   */
  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return await this.dashboardManager.createDashboard(dashboard);
  }

  /**
   * Get dashboard by ID
   */
  async getDashboard(id: string): Promise<Dashboard | null> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return await this.dashboardManager.getDashboard(id);
  }

  /**
   * List all dashboards
   */
  async listDashboards(userId?: string): Promise<Dashboard[]> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return await this.dashboardManager.listDashboards(userId);
  }

  /**
   * Create an alert rule
   */
  async createAlert(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return await this.alertManager.createRule(rule);
  }

  /**
   * Get real-time data stream
   */
  getRealtimeStream(metrics: string[]): EventEmitter {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return this.realtimeProcessor.createStream(metrics);
  }

  /**
   * Execute custom query
   */
  async query(query: string, parameters?: Record<string, any>): Promise<any[]> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return await this.dataConnector.query(query, parameters);
  }

  /**
   * Get engine health status
   */
  getHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    uptime: number;
    version: string;
  } {
    const components = {
      eventTracker: this.eventTracker?.isHealthy() || false,
      metricsCalculator: this.metricsCalculator?.isHealthy() || false,
      insightsGenerator: this.insightsGenerator?.isHealthy() || false,
      dashboardManager: this.dashboardManager?.isHealthy() || false,
      alertManager: this.alertManager?.isHealthy() || false,
      realtimeProcessor: this.realtimeProcessor?.isHealthy() || false,
      dataConnector: this.dataConnector?.isHealthy() || false
    };

    const healthyComponents = Object.values(components).filter(Boolean).length;
    const totalComponents = Object.keys(components).length;
    
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyComponents === totalComponents) {
      status = 'healthy';
    } else if (healthyComponents > totalComponents / 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      components,
      uptime: process.uptime(),
      version: '1.0.0'
    };
  }

  /**
   * Get engine statistics
   */
  async getStats(): Promise<{
    events: {
      total: number;
      rate: number;
      errors: number;
    };
    metrics: {
      total: number;
      active: number;
    };
    insights: {
      total: number;
      generated: number;
    };
    dashboards: {
      total: number;
      active: number;
    };
    alerts: {
      total: number;
      active: number;
      triggered: number;
    };
  }> {
    if (!this.isRunning) {
      throw new AnalyticsError('Engine is not running', 'NOT_RUNNING');
    }

    return {
      events: await this.eventTracker.getStats(),
      metrics: await this.metricsCalculator.getStats(),
      insights: await this.insightsGenerator.getStats(),
      dashboards: await this.dashboardManager.getStats(),
      alerts: await this.alertManager.getStats()
    };
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Authenticate user
   */
  async authenticate(token: string): Promise<any> {
    return await this.securityManager.authenticate(token);
  }

  /**
   * Check user permissions
   */
  async authorize(userId: string, resource: string, action: string): Promise<boolean> {
    return await this.securityManager.authorize(userId, resource, action);
  }

  /**
   * Get configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Update configuration (requires restart)
   */
  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('Configuration updated', { config: newConfig });
  }
}
