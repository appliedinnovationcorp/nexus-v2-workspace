/**
 * Rate Limiting Middleware
 * Implements comprehensive rate limiting for different endpoint types
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

// Initialize Redis client for rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});

// Store for rate limiting
const store = new RedisStore({
  sendCommand: (...args: string[]) => redis.call(...args),
});

// Authentication endpoints - strict rate limiting
export const authRateLimit = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts',
    message: 'Please try again after 15 minutes',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests
  skipSuccessfulRequests: true,
  // Custom key generator to include user agent for better tracking
  keyGenerator: (req) => {
    return `auth:${req.ip}:${req.get('User-Agent') || 'unknown'}`;
  },
});

// Password reset endpoints - very strict rate limiting
export const passwordResetRateLimit = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset requests per hour
  message: {
    error: 'Too many password reset attempts',
    message: 'Please try again after 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API endpoints - moderate rate limiting
export const apiRateLimit = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many API requests',
    message: 'Please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload endpoints - strict rate limiting
export const uploadRateLimit = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 uploads per hour
  message: {
    error: 'Too many upload attempts',
    message: 'Please try again after 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Contact form endpoints - moderate rate limiting
export const contactRateLimit = rateLimit({
  store,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 contact form submissions per hour
  message: {
    error: 'Too many contact form submissions',
    message: 'Please try again after 1 hour',
    retryAfter: 60 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Global rate limiting - very permissive, just to prevent abuse
export const globalRateLimit = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for authenticated users (more permissive)
export const authenticatedRateLimit = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Authenticated users get higher limits
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use user ID for authenticated requests
    return `auth-user:${req.user?.userId || req.ip}`;
  },
  skip: (req) => {
    // Skip if user is not authenticated
    return !req.user;
  },
});

// Admin endpoints - moderate rate limiting
export const adminRateLimit = rateLimit({
  store,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Admins get higher limits
  message: {
    error: 'Too many admin requests',
    message: 'Please try again later',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return `admin:${req.user?.userId || req.ip}`;
  },
});

export default {
  authRateLimit,
  passwordResetRateLimit,
  apiRateLimit,
  uploadRateLimit,
  contactRateLimit,
  globalRateLimit,
  authenticatedRateLimit,
  adminRateLimit,
};
