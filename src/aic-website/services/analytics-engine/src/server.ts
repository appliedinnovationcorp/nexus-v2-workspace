/**
 * Analytics Engine Server
 * Main entry point for the analytics engine
 */

import dotenv from 'dotenv';
import { AnalyticsEngine } from './core/analytics-engine';
import { APIServer } from './server/api-server';
import { AnalyticsConfig } from './types';
import { createLogger } from './utils/logger';

// Load environment variables
dotenv.config();

/**
 * Load configuration from environment variables
 */
function loadConfig(): AnalyticsConfig {
  return {
    server: {
      port: parseInt(process.env.PORT || '3001'),
      host: process.env.HOST || '0.0.0.0',
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: process.env.CORS_CREDENTIALS === 'true',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
      },
      rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
        max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
        message: 'Too many requests from this IP'
      }
    },
    database: {
      mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
        database: process.env.MONGODB_DATABASE || 'analytics',
        options: {}
      },
      influxdb: {
        url: process.env.INFLUXDB_URL || 'http://localhost:8086',
        token: process.env.INFLUXDB_TOKEN || 'your-token',
        org: process.env.INFLUXDB_ORG || 'aic',
        bucket: process.env.INFLUXDB_BUCKET || 'analytics'
      }
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      database: parseInt(process.env.REDIS_DATABASE || '0')
    },
    kafka: {
      brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      clientId: process.env.KAFKA_CLIENT_ID || 'analytics-engine',
      groupId: process.env.KAFKA_GROUP_ID || 'analytics-group',
      topics: ['events', 'metrics', 'alerts']
    },
    ai: {
      enabled: process.env.AI_ENABLED === 'true',
      openai: process.env.OPENAI_API_KEY ? {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4'
      } : undefined,
      anthropic: process.env.ANTHROPIC_API_KEY ? {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229'
      } : undefined
    },
    security: {
      jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
      apiKeys: process.env.API_KEYS?.split(',') || []
    },
    monitoring: {
      prometheus: {
        enabled: process.env.PROMETHEUS_ENABLED === 'true',
        port: parseInt(process.env.PROMETHEUS_PORT || '9090')
      },
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
      },
      apm: {
        enabled: process.env.APM_ENABLED === 'true',
        serviceName: process.env.APM_SERVICE_NAME || 'analytics-engine'
      }
    }
  };
}

/**
 * Main function to start the analytics engine
 */
async function main() {
  const config = loadConfig();
  const logger = createLogger(config.monitoring.logging);

  logger.info('Starting AIC Analytics Engine...', {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  try {
    // Initialize analytics engine
    const analyticsEngine = new AnalyticsEngine(config);
    
    // Initialize API server
    const apiServer = new APIServer(analyticsEngine, config);

    // Start analytics engine
    await analyticsEngine.start();
    logger.info('Analytics Engine started successfully');

    // Start API server
    await apiServer.start();
    logger.info('API Server started successfully');

    // Log startup completion
    logger.info('AIC Analytics Engine is ready!', {
      apiUrl: `http://${config.server.host}:${config.server.port}`,
      healthCheck: `http://${config.server.host}:${config.server.port}/api/health`,
      documentation: `http://${config.server.host}:${config.server.port}/api`
    });

    // Handle graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      try {
        await apiServer.stop();
        await analyticsEngine.stop();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown', { error: error.message });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start Analytics Engine', { 
      error: error.message,
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export { main };
