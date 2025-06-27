/**
 * Validation Utilities
 * Data validation functions for the analytics engine
 */

import Joi from 'joi';
import { AnalyticsEvent, AnalyticsConfig, MetricDefinition } from '../types';

/**
 * Validate analytics event
 */
export function validateEvent(event: Partial<AnalyticsEvent>): {
  isValid: boolean;
  errors: string[];
} {
  const schema = Joi.object({
    id: Joi.string().optional(),
    event: Joi.string().required().min(1).max(100),
    properties: Joi.object().required(),
    userId: Joi.string().optional().allow(null),
    sessionId: Joi.string().optional().allow(null),
    timestamp: Joi.date().required(),
    source: Joi.string().required().min(1).max(50),
    metadata: Joi.object().optional()
  });

  const { error } = schema.validate(event);
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validate analytics configuration
 */
export function validateConfig(config: AnalyticsConfig): void {
  const schema = Joi.object({
    server: Joi.object({
      port: Joi.number().port().required(),
      host: Joi.string().required(),
      cors: Joi.object({
        origin: Joi.alternatives().try(
          Joi.string(),
          Joi.array().items(Joi.string())
        ).required(),
        credentials: Joi.boolean().required(),
        methods: Joi.array().items(Joi.string()).required()
      }).required(),
      rateLimit: Joi.object({
        windowMs: Joi.number().positive().required(),
        max: Joi.number().positive().required(),
        message: Joi.string().optional()
      }).required()
    }).required(),

    database: Joi.object({
      mongodb: Joi.object({
        uri: Joi.string().uri().required(),
        database: Joi.string().required(),
        options: Joi.object().optional()
      }).required(),
      influxdb: Joi.object({
        url: Joi.string().uri().required(),
        token: Joi.string().required(),
        org: Joi.string().required(),
        bucket: Joi.string().required()
      }).required()
    }).required(),

    redis: Joi.object({
      host: Joi.string().required(),
      port: Joi.number().port().required(),
      password: Joi.string().allow(null).optional(),
      database: Joi.number().min(0).optional()
    }).required(),

    kafka: Joi.object({
      brokers: Joi.array().items(Joi.string()).required(),
      clientId: Joi.string().required(),
      groupId: Joi.string().required(),
      topics: Joi.array().items(Joi.string()).required()
    }).optional(),

    ai: Joi.object({
      enabled: Joi.boolean().required(),
      openai: Joi.object({
        apiKey: Joi.string().required(),
        model: Joi.string().required()
      }).optional(),
      anthropic: Joi.object({
        apiKey: Joi.string().required(),
        model: Joi.string().required()
      }).optional()
    }).required(),

    security: Joi.object({
      jwtSecret: Joi.string().min(32).required(),
      jwtExpiresIn: Joi.string().required(),
      bcryptRounds: Joi.number().min(10).max(15).required(),
      apiKeys: Joi.array().items(Joi.string()).required()
    }).required(),

    monitoring: Joi.object({
      prometheus: Joi.object({
        enabled: Joi.boolean().required(),
        port: Joi.number().port().required()
      }).required(),
      logging: Joi.object({
        level: Joi.string().valid('error', 'warn', 'info', 'debug').required(),
        format: Joi.string().valid('json', 'simple').required()
      }).required(),
      apm: Joi.object({
        enabled: Joi.boolean().required(),
        serviceName: Joi.string().required()
      }).required()
    }).required()
  });

  const { error } = schema.validate(config);
  if (error) {
    throw new Error(`Configuration validation failed: ${error.details.map(d => d.message).join(', ')}`);
  }
}

/**
 * Validate metric definition
 */
export function validateMetricDefinition(metric: MetricDefinition): {
  isValid: boolean;
  errors: string[];
} {
  const schema = Joi.object({
    id: Joi.string().required().min(1).max(100),
    name: Joi.string().required().min(1).max(200),
    description: Joi.string().required().min(1).max(500),
    type: Joi.string().valid('counter', 'gauge', 'histogram', 'summary').required(),
    aggregation: Joi.string().valid('sum', 'avg', 'min', 'max', 'count', 'distinct').required(),
    filters: Joi.object().optional(),
    dimensions: Joi.array().items(Joi.string()).optional()
  });

  const { error } = schema.validate(metric);
  
  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => detail.message)
    };
  }

  return {
    isValid: true,
    errors: []
  };
}

/**
 * Validate time range
 */
export function validateTimeRange(start: Date, end: Date): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!(start instanceof Date) || isNaN(start.getTime())) {
    errors.push('Start date is invalid');
  }

  if (!(end instanceof Date) || isNaN(end.getTime())) {
    errors.push('End date is invalid');
  }

  if (start >= end) {
    errors.push('Start date must be before end date');
  }

  const maxRange = 365 * 24 * 60 * 60 * 1000; // 1 year
  if (end.getTime() - start.getTime() > maxRange) {
    errors.push('Time range cannot exceed 1 year');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes
    .substring(0, 1000); // Limit length
}

/**
 * Validate email address
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate JSON string
 */
export function validateJson(jsonString: string): {
  isValid: boolean;
  parsed?: any;
  error?: string;
} {
  try {
    const parsed = JSON.parse(jsonString);
    return {
      isValid: true,
      parsed
    };
  } catch (error) {
    return {
      isValid: false,
      error: error.message
    };
  }
}
