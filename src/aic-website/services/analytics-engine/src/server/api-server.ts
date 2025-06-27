/**
 * Analytics API Server
 * RESTful API server for the analytics engine
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'winston';
import { AnalyticsEngine } from '../core/analytics-engine';
import { AnalyticsConfig, AnalyticsError } from '../types';
import { createLogger } from '../utils/logger';
import { authMiddleware } from '../middleware/auth-middleware';
import { rateLimitMiddleware } from '../middleware/rate-limit-middleware';
import { validationMiddleware } from '../middleware/validation-middleware';
import { errorHandler } from '../middleware/error-handler';

// Route imports
import { eventsRouter } from './routes/events';
import { metricsRouter } from './routes/metrics';
import { insightsRouter } from './routes/insights';
import { dashboardsRouter } from './routes/dashboards';
import { alertsRouter } from './routes/alerts';
import { healthRouter } from './routes/health';

export class APIServer {
  private app: Express;
  private server: HTTPServer;
  private io: SocketIOServer;
  private logger: Logger;
  private isRunning: boolean = false;

  constructor(
    private analyticsEngine: AnalyticsEngine,
    private config: AnalyticsConfig
  ) {
    this.logger = createLogger(config.monitoring.logging);
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS
    this.app.use(cors(this.config.server.cors));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    this.app.use(rateLimitMiddleware(this.config.server.rateLimit));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.info('API Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });

    // Authentication (except for health checks)
    this.app.use('/api', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/health')) {
        return next();
      }
      return authMiddleware(this.config)(req, res, next);
    });
  }

  /**
   * Set up API routes
   */
  private setupRoutes(): void {
    // API routes
    this.app.use('/api/v1/events', eventsRouter(this.analyticsEngine));
    this.app.use('/api/v1/metrics', metricsRouter(this.analyticsEngine));
    this.app.use('/api/v1/insights', insightsRouter(this.analyticsEngine));
    this.app.use('/api/v1/dashboards', dashboardsRouter(this.analyticsEngine));
    this.app.use('/api/v1/alerts', alertsRouter(this.analyticsEngine));
    this.app.use('/api/health', healthRouter(this.analyticsEngine));

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        name: 'AIC Analytics Engine API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        endpoints: {
          events: '/api/v1/events',
          metrics: '/api/v1/metrics',
          insights: '/api/v1/insights',
          dashboards: '/api/v1/dashboards',
          alerts: '/api/v1/alerts',
          health: '/api/health',
          websocket: '/socket.io'
        }
      });
    });

    // API documentation
    this.app.get('/api', (req: Request, res: Response) => {
      res.json({
        name: 'AIC Analytics Engine API',
        version: '1.0.0',
        documentation: 'https://docs.analytics.aic.com',
        endpoints: [
          {
            path: '/api/v1/events',
            methods: ['GET', 'POST'],
            description: 'Event tracking and retrieval'
          },
          {
            path: '/api/v1/metrics',
            methods: ['GET', 'POST'],
            description: 'Metrics calculation and querying'
          },
          {
            path: '/api/v1/insights',
            methods: ['GET', 'POST'],
            description: 'AI-powered insights generation'
          },
          {
            path: '/api/v1/dashboards',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'Dashboard management'
          },
          {
            path: '/api/v1/alerts',
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            description: 'Alert rule management'
          },
          {
            path: '/api/health',
            methods: ['GET'],
            description: 'System health and status'
          }
        ]
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Set up error handling
   */
  private setupErrorHandling(): void {
    this.app.use(errorHandler(this.logger));
  }

  /**
   * Set up WebSocket server
   */
  private setupWebSocket(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: this.config.server.cors.origin,
        methods: ["GET", "POST"],
        credentials: this.config.server.cors.credentials
      },
      transports: ['websocket', 'polling']
    });

    // Set up WebSocket authentication
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization;
        if (!token) {
          throw new Error('Authentication token required');
        }

        const user = await this.analyticsEngine.authenticate(token);
        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    // Handle WebSocket connections
    this.io.on('connection', (socket) => {
      this.logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.data.user?.id
      });

      // Handle real-time subscriptions
      socket.on('subscribe', async (data: {
        metrics?: string[];
        events?: string[];
        dashboards?: string[];
      }) => {
        try {
          // Validate permissions
          const user = socket.data.user;
          
          if (data.metrics) {
            for (const metric of data.metrics) {
              const hasPermission = await this.analyticsEngine.authorize(
                user.id, 
                'metric', 
                'read'
              );
              if (hasPermission) {
                socket.join(`metric:${metric}`);
              }
            }
          }

          if (data.events) {
            for (const event of data.events) {
              const hasPermission = await this.analyticsEngine.authorize(
                user.id, 
                'event', 
                'read'
              );
              if (hasPermission) {
                socket.join(`event:${event}`);
              }
            }
          }

          if (data.dashboards) {
            for (const dashboard of data.dashboards) {
              const hasPermission = await this.analyticsEngine.authorize(
                user.id, 
                'dashboard', 
                'read'
              );
              if (hasPermission) {
                socket.join(`dashboard:${dashboard}`);
              }
            }
          }

          socket.emit('subscribed', {
            metrics: data.metrics?.length || 0,
            events: data.events?.length || 0,
            dashboards: data.dashboards?.length || 0
          });

        } catch (error) {
          socket.emit('error', { message: error.message });
        }
      });

      socket.on('unsubscribe', (data: {
        metrics?: string[];
        events?: string[];
        dashboards?: string[];
      }) => {
        if (data.metrics) {
          data.metrics.forEach(metric => socket.leave(`metric:${metric}`));
        }
        if (data.events) {
          data.events.forEach(event => socket.leave(`event:${event}`));
        }
        if (data.dashboards) {
          data.dashboards.forEach(dashboard => socket.leave(`dashboard:${dashboard}`));
        }
      });

      socket.on('disconnect', (reason) => {
        this.logger.info('WebSocket client disconnected', {
          socketId: socket.id,
          userId: socket.data.user?.id,
          reason
        });
      });
    });

    // Connect analytics engine to WebSocket
    this.analyticsEngine.getRealtimeStream([]).on('metric', (metric) => {
      this.io.to(`metric:${metric.metric}`).emit('metric', metric);
    });

    this.analyticsEngine.on('alert', (alert) => {
      this.io.emit('alert', alert);
    });

    this.analyticsEngine.on('insight', (insight) => {
      this.io.emit('insight', insight);
    });
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('API server is already running');
      return;
    }

    try {
      // Create HTTP server
      this.server = this.app.listen(this.config.server.port, this.config.server.host, () => {
        this.logger.info('API server started', {
          host: this.config.server.host,
          port: this.config.server.port,
          environment: process.env.NODE_ENV || 'development'
        });
      });

      // Set up WebSocket
      this.setupWebSocket();

      // Handle server errors
      this.server.on('error', (error) => {
        this.logger.error('Server error', { error: error.message });
        throw error;
      });

      // Graceful shutdown handling
      process.on('SIGTERM', () => this.gracefulShutdown());
      process.on('SIGINT', () => this.gracefulShutdown());

      this.isRunning = true;
    } catch (error) {
      this.logger.error('Failed to start API server', { error: error.message });
      throw new AnalyticsError('API server start failed', 'START_ERROR');
    }
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('API server is not running');
      return;
    }

    try {
      this.logger.info('Stopping API server...');

      // Close WebSocket connections
      if (this.io) {
        this.io.close();
      }

      // Close HTTP server
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

      this.isRunning = false;
      this.logger.info('API server stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop API server', { error: error.message });
      throw new AnalyticsError('API server stop failed', 'STOP_ERROR');
    }
  }

  /**
   * Graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    this.logger.info('Received shutdown signal, starting graceful shutdown...');

    try {
      // Stop accepting new connections
      await this.stop();

      // Stop analytics engine
      await this.analyticsEngine.stop();

      this.logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during graceful shutdown', { error: error.message });
      process.exit(1);
    }
  }

  /**
   * Get server status
   */
  getStatus(): {
    running: boolean;
    uptime: number;
    connections: number;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      running: this.isRunning,
      uptime: process.uptime(),
      connections: this.io?.engine?.clientsCount || 0,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Get Express app instance
   */
  getApp(): Express {
    return this.app;
  }

  /**
   * Get Socket.IO server instance
   */
  getSocketServer(): SocketIOServer {
    return this.io;
  }
}
