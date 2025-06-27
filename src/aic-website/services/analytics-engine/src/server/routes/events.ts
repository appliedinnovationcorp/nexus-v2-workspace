/**
 * Events API Routes
 * Handle event tracking and retrieval endpoints
 */

import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { AnalyticsEngine } from '../../core/analytics-engine';
import { AnalyticsEvent, ValidationError } from '../../types';

export function eventsRouter(analyticsEngine: AnalyticsEngine): Router {
  const router = Router();

  /**
   * Track a single event
   * POST /api/v1/events
   */
  router.post('/',
    [
      body('event').isString().notEmpty().withMessage('Event name is required'),
      body('properties').isObject().withMessage('Properties must be an object'),
      body('userId').optional().isString(),
      body('sessionId').optional().isString(),
      body('timestamp').optional().isISO8601(),
      body('source').optional().isString()
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { event, properties, userId, sessionId, timestamp, source } = req.body;

        await analyticsEngine.track(event, properties, {
          userId,
          sessionId,
          timestamp: timestamp ? new Date(timestamp) : undefined,
          source
        });

        res.status(201).json({
          success: true,
          message: 'Event tracked successfully',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Track multiple events in batch
   * POST /api/v1/events/batch
   */
  router.post('/batch',
    [
      body('events').isArray().withMessage('Events must be an array'),
      body('events.*.event').isString().notEmpty().withMessage('Event name is required'),
      body('events.*.properties').isObject().withMessage('Properties must be an object'),
      body('events.*.userId').optional().isString(),
      body('events.*.sessionId').optional().isString(),
      body('events.*.timestamp').optional().isISO8601(),
      body('events.*.source').optional().isString()
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { events } = req.body;

        if (events.length > 1000) {
          throw new ValidationError('Batch size cannot exceed 1000 events');
        }

        await analyticsEngine.trackBatch(events.map((e: any) => ({
          event: e.event,
          properties: e.properties,
          userId: e.userId,
          sessionId: e.sessionId,
          timestamp: e.timestamp ? new Date(e.timestamp) : undefined,
          source: e.source
        })));

        res.status(201).json({
          success: true,
          message: `${events.length} events tracked successfully`,
          count: events.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get events by criteria
   * GET /api/v1/events
   */
  router.get('/',
    [
      query('event').optional().isString(),
      query('userId').optional().isString(),
      query('sessionId').optional().isString(),
      query('startDate').optional().isISO8601(),
      query('endDate').optional().isISO8601(),
      query('limit').optional().isInt({ min: 1, max: 1000 }),
      query('offset').optional().isInt({ min: 0 })
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const {
          event,
          userId,
          sessionId,
          startDate,
          endDate,
          limit = 100,
          offset = 0
        } = req.query;

        const criteria: any = {};

        if (event) criteria.event = event;
        if (userId) criteria.userId = userId;
        if (sessionId) criteria.sessionId = sessionId;

        if (startDate || endDate) {
          criteria.timeRange = {};
          if (startDate) criteria.timeRange.start = new Date(startDate as string);
          if (endDate) criteria.timeRange.end = new Date(endDate as string);
        }

        criteria.limit = parseInt(limit as string);
        criteria.offset = parseInt(offset as string);

        // Note: This would need to be implemented in the EventTracker
        // const events = await analyticsEngine.getEvents(criteria);

        res.json({
          success: true,
          data: [], // events,
          pagination: {
            limit: criteria.limit,
            offset: criteria.offset,
            total: 0 // This would come from the actual implementation
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get event by ID
   * GET /api/v1/events/:id
   */
  router.get('/:id',
    [
      param('id').isString().notEmpty().withMessage('Event ID is required')
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { id } = req.params;

        // Note: This would need to be implemented in the EventTracker
        // const event = await analyticsEngine.getEvent(id);

        res.json({
          success: true,
          data: null, // event,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get recent events for a specific event type
   * GET /api/v1/events/recent/:eventType
   */
  router.get('/recent/:eventType',
    [
      param('eventType').isString().notEmpty().withMessage('Event type is required'),
      query('limit').optional().isInt({ min: 1, max: 100 })
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { eventType } = req.params;
        const { limit = 10 } = req.query;

        // Note: This would need to be implemented in the EventTracker
        // const events = await analyticsEngine.getRecentEvents(eventType, parseInt(limit as string));

        res.json({
          success: true,
          data: [], // events,
          eventType,
          limit: parseInt(limit as string),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get user events
   * GET /api/v1/events/user/:userId
   */
  router.get('/user/:userId',
    [
      param('userId').isString().notEmpty().withMessage('User ID is required'),
      query('limit').optional().isInt({ min: 1, max: 1000 })
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { userId } = req.params;
        const { limit = 100 } = req.query;

        // Note: This would need to be implemented in the EventTracker
        // const events = await analyticsEngine.getUserEvents(userId, parseInt(limit as string));

        res.json({
          success: true,
          data: [], // events,
          userId,
          limit: parseInt(limit as string),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Get event statistics
   * GET /api/v1/events/stats
   */
  router.get('/stats',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const stats = await analyticsEngine.getStats();

        res.json({
          success: true,
          data: {
            events: stats.events
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * Validate event schema
   * POST /api/v1/events/validate
   */
  router.post('/validate',
    [
      body('event').isString().notEmpty().withMessage('Event name is required'),
      body('properties').isObject().withMessage('Properties must be an object')
    ],
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
          throw new ValidationError('Validation failed: ' + errors.array().map(e => e.msg).join(', '));
        }

        const { event, properties } = req.body;

        // Create a mock event for validation
        const mockEvent: Partial<AnalyticsEvent> = {
          event,
          properties,
          timestamp: new Date(),
          source: 'validation'
        };

        // Note: This would use the actual validation logic
        const isValid = true; // validateEvent(mockEvent);

        res.json({
          success: true,
          valid: isValid,
          event: mockEvent,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
