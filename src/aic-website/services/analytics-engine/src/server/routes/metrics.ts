/**
 * Metrics API Routes
 * Handle metrics calculation and querying endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { AnalyticsEngine } from '../../core/analytics-engine';
import { MetricDefinition, QueryOptions, ValidationError } from '../../types';

export function metricsRouter(analyticsEngine: AnalyticsEngine): Router {
  const router = Router();

  /**
   * Get metrics data
   * GET /api/v1/metrics
   */
  router.get('/',
    [
      query('metrics').isString().notEmpty().withMessage('Metrics parameter is required'),
      query('startDate').isISO8601().withMessage('Valid start date is required'),
      query('endDate').isISO8601().withMessage('Valid end date is required'),
      query('groupBy').optional().isString(),
      query('limit').optional().isInt({ min: 1, max: 10000 }),
      query('offset').optional().isInt({ min: 0 })
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const {
          metrics,
          startDate,
          endDate,
          groupBy,
          limit,
          offset
        } = req.query;

        const metricNames = (metrics as string).split(',').map(m => m.trim());
        
        const options: QueryOptions = {
          timeRange: {
            start: new Date(startDate as string),
            end: new Date(endDate as string)
          },
          groupBy: groupBy ? (groupBy as string).split(',').map(g => g.trim()) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
          offset: offset ? parseInt(offset as string) : undefined
        };

        const metricData = await analyticsEngine.getMetrics(metricNames, options);

        res.json({
          success: true,
          data: metricData,
          metrics: metricNames,
          timeRange: options.timeRange,
          count: metricData.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Define a new metric
   * POST /api/v1/metrics/define
   */
  router.post('/define',
    [
      body('id').isString().notEmpty().withMessage('Metric ID is required'),
      body('name').isString().notEmpty().withMessage('Metric name is required'),
      body('description').isString().notEmpty().withMessage('Metric description is required'),
      body('type').isIn(['counter', 'gauge', 'histogram', 'summary']).withMessage('Invalid metric type'),
      body('aggregation').isIn(['sum', 'avg', 'min', 'max', 'count', 'distinct']).withMessage('Invalid aggregation type'),
      body('filters').optional().isObject(),
      body('dimensions').optional().isArray()
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const metricDefinition: MetricDefinition = req.body;

        await analyticsEngine.defineMetric(metricDefinition);

        res.status(201).json({
          success: true,
          message: 'Metric defined successfully',
          metric: metricDefinition,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get real-time metrics
   * GET /api/v1/metrics/realtime
   */
  router.get('/realtime',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Note: This would get real-time metrics from the processor
        const realtimeMetrics = {
          eventsPerSecond: 0,
          activeUsers: 0,
          activeSessions: 0,
          errorRate: 0,
          avgLatency: 0
        };

        res.json({
          success: true,
          data: realtimeMetrics,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Execute custom query
   * POST /api/v1/metrics/query
   */
  router.post('/query',
    [
      body('query').isString().notEmpty().withMessage('Query is required'),
      body('parameters').optional().isObject()
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { query, parameters } = req.body;

        const results = await analyticsEngine.query(query, parameters);

        res.json({
          success: true,
          data: results,
          query,
          count: results.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get metric aggregations
   * GET /api/v1/metrics/:metric/aggregate
   */
  router.get('/:metric/aggregate',
    [
      param('metric').isString().notEmpty().withMessage('Metric name is required'),
      query('startDate').isISO8601().withMessage('Valid start date is required'),
      query('endDate').isISO8601().withMessage('Valid end date is required'),
      query('aggregation').isIn(['sum', 'avg', 'min', 'max', 'count']).withMessage('Invalid aggregation type'),
      query('interval').optional().isIn(['minute', 'hour', 'day', 'week', 'month'])
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { metric } = req.params;
        const { startDate, endDate, aggregation, interval = 'hour' } = req.query;

        const options: QueryOptions = {
          timeRange: {
            start: new Date(startDate as string),
            end: new Date(endDate as string)
          }
        };

        const metricData = await analyticsEngine.getMetrics([metric], options);

        // Perform aggregation (this would be done in the metrics calculator)
        const aggregatedData = {
          metric,
          aggregation,
          interval,
          value: 0, // This would be calculated
          dataPoints: [], // Time series data points
          timeRange: options.timeRange
        };

        res.json({
          success: true,
          data: aggregatedData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get metric statistics
   * GET /api/v1/metrics/stats
   */
  router.get('/stats',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const stats = await analyticsEngine.getStats();

        res.json({
          success: true,
          data: {
            metrics: stats.metrics
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get available metrics
   * GET /api/v1/metrics/available
   */
  router.get('/available',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // This would return all defined metrics
        const availableMetrics = [
          {
            id: 'page_views',
            name: 'Page Views',
            description: 'Total number of page views',
            type: 'counter',
            aggregation: 'sum'
          },
          {
            id: 'unique_visitors',
            name: 'Unique Visitors',
            description: 'Number of unique visitors',
            type: 'gauge',
            aggregation: 'distinct'
          },
          {
            id: 'session_duration',
            name: 'Session Duration',
            description: 'Average session duration in seconds',
            type: 'histogram',
            aggregation: 'avg'
          },
          {
            id: 'conversion_rate',
            name: 'Conversion Rate',
            description: 'Percentage of visitors who convert',
            type: 'gauge',
            aggregation: 'avg'
          }
        ];

        res.json({
          success: true,
          data: availableMetrics,
          count: availableMetrics.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get metric trends
   * GET /api/v1/metrics/:metric/trends
   */
  router.get('/:metric/trends',
    [
      param('metric').isString().notEmpty().withMessage('Metric name is required'),
      query('period').optional().isIn(['1h', '24h', '7d', '30d', '90d']),
      query('comparison').optional().isIn(['previous_period', 'previous_year'])
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { metric } = req.params;
        const { period = '24h', comparison } = req.query;

        // Calculate time ranges based on period
        const now = new Date();
        const periodMs = {
          '1h': 60 * 60 * 1000,
          '24h': 24 * 60 * 60 * 1000,
          '7d': 7 * 24 * 60 * 60 * 1000,
          '30d': 30 * 24 * 60 * 60 * 1000,
          '90d': 90 * 24 * 60 * 60 * 1000
        }[period as string] || 24 * 60 * 60 * 1000;

        const currentPeriodStart = new Date(now.getTime() - periodMs);
        
        const options: QueryOptions = {
          timeRange: {
            start: currentPeriodStart,
            end: now
          }
        };

        const currentData = await analyticsEngine.getMetrics([metric], options);

        let comparisonData = null;
        if (comparison) {
          const comparisonStart = new Date(currentPeriodStart.getTime() - periodMs);
          const comparisonEnd = new Date(currentPeriodStart.getTime());
          
          const comparisonOptions: QueryOptions = {
            timeRange: {
              start: comparisonStart,
              end: comparisonEnd
            }
          };

          comparisonData = await analyticsEngine.getMetrics([metric], comparisonOptions);
        }

        const trendData = {
          metric,
          period,
          current: {
            data: currentData,
            timeRange: options.timeRange
          },
          comparison: comparisonData ? {
            data: comparisonData,
            timeRange: {
              start: new Date(currentPeriodStart.getTime() - periodMs),
              end: currentPeriodStart
            }
          } : null,
          trend: {
            direction: 'stable', // This would be calculated
            percentage: 0, // This would be calculated
            significance: 'low' // This would be calculated
          }
        };

        res.json({
          success: true,
          data: trendData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
