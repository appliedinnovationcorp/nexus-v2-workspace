/**
 * Rate Limit Manager - Advanced Security Framework
 * Advanced rate limiting with multiple algorithms and adaptive controls
 */

const EventEmitter = require('events');

class RateLimitManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      defaultWindowMs: config.defaultWindowMs || 60000, // 1 minute
      defaultMaxRequests: config.defaultMaxRequests || 100,
      enableAdaptiveRateLimit: config.enableAdaptiveRateLimit || false,
      enableDistributedRateLimit: config.enableDistributedRateLimit || false,
      algorithms: config.algorithms || ['token-bucket', 'sliding-window'],
      skipSuccessfulRequests: config.skipSuccessfulRequests || false,
      skipFailedRequests: config.skipFailedRequests || false,
      keyGenerator: config.keyGenerator || ((req) => req.ip),
      ...config
    };
    
    // Rate limit stores
    this.tokenBuckets = new Map();
    this.slidingWindows = new Map();
    this.fixedWindows = new Map();
    this.leakyBuckets = new Map();
    
    // Rate limit rules
    this.rules = new Map();
    this.metrics = {
      totalRequests: 0,
      blockedRequests: 0,
      allowedRequests: 0
    };
    
    this.initializeDefaultRules();
  }

  /**
   * Initialize default rate limiting rules
   */
  initializeDefaultRules() {
    const defaultRules = [
      {
        id: 'global',
        name: 'Global Rate Limit',
        windowMs: 60000, // 1 minute
        maxRequests: 1000,
        algorithm: 'sliding-window',
        keyGenerator: () => 'global',
        skipIf: () => false
      },
      {
        id: 'per-ip',
        name: 'Per IP Rate Limit',
        windowMs: 60000,
        maxRequests: 100,
        algorithm: 'token-bucket',
        keyGenerator: (req) => req.ip,
        skipIf: () => false
      },
      {
        id: 'auth-attempts',
        name: 'Authentication Attempts',
        windowMs: 300000, // 5 minutes
        maxRequests: 5,
        algorithm: 'fixed-window',
        keyGenerator: (req) => `auth:${req.ip}`,
        skipIf: (req) => !req.path.includes('/auth/')
      },
      {
        id: 'api-calls',
        name: 'API Calls',
        windowMs: 60000,
        maxRequests: 200,
        algorithm: 'leaky-bucket',
        keyGenerator: (req) => `api:${req.user?.id || req.ip}`,
        skipIf: (req) => !req.path.startsWith('/api/')
      },
      {
        id: 'password-reset',
        name: 'Password Reset Requests',
        windowMs: 3600000, // 1 hour
        maxRequests: 3,
        algorithm: 'fixed-window',
        keyGenerator: (req) => `pwd-reset:${req.ip}`,
        skipIf: (req) => !req.path.includes('/password-reset')
      }
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  /**
   * Initialize the rate limit manager
   */
  async initialize() {
    // Setup cleanup intervals
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60000); // Every minute

    // Setup metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds

    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      rulesCount: this.rules.size
    });
  }

  /**
   * Check rate limit for request
   */
  async checkRateLimit(req, ruleId = null) {
    const results = [];
    const rulesToCheck = ruleId ? [this.rules.get(ruleId)] : Array.from(this.rules.values());
    
    for (const rule of rulesToCheck) {
      if (!rule || rule.skipIf(req)) continue;
      
      const key = rule.keyGenerator(req);
      const result = await this.checkRule(rule, key, req);
      results.push(result);
      
      // If any rule blocks the request, return immediately
      if (!result.allowed) {
        this.metrics.blockedRequests++;
        return result;
      }
    }
    
    this.metrics.allowedRequests++;
    this.metrics.totalRequests++;
    
    return {
      allowed: true,
      rule: null,
      remaining: Math.min(...results.map(r => r.remaining)),
      resetTime: Math.max(...results.map(r => r.resetTime))
    };
  }

  /**
   * Check individual rate limit rule
   */
  async checkRule(rule, key, req) {
    switch (rule.algorithm) {
      case 'token-bucket':
        return this.checkTokenBucket(rule, key);
      case 'sliding-window':
        return this.checkSlidingWindow(rule, key);
      case 'fixed-window':
        return this.checkFixedWindow(rule, key);
      case 'leaky-bucket':
        return this.checkLeakyBucket(rule, key);
      default:
        throw new Error(`Unknown algorithm: ${rule.algorithm}`);
    }
  }

  /**
   * Token bucket algorithm
   */
  checkTokenBucket(rule, key) {
    const now = Date.now();
    let bucket = this.tokenBuckets.get(key);
    
    if (!bucket) {
      bucket = {
        tokens: rule.maxRequests,
        lastRefill: now,
        capacity: rule.maxRequests,
        refillRate: rule.maxRequests / (rule.windowMs / 1000) // tokens per second
      };
      this.tokenBuckets.set(key, bucket);
    }
    
    // Refill tokens based on time elapsed
    const timeElapsed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timeElapsed * bucket.refillRate);
    bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    if (bucket.tokens > 0) {
      bucket.tokens--;
      return {
        allowed: true,
        rule: rule.id,
        remaining: bucket.tokens,
        resetTime: now + ((bucket.capacity - bucket.tokens) / bucket.refillRate * 1000)
      };
    }
    
    return {
      allowed: false,
      rule: rule.id,
      remaining: 0,
      resetTime: now + (1 / bucket.refillRate * 1000),
      retryAfter: Math.ceil(1 / bucket.refillRate)
    };
  }

  /**
   * Sliding window algorithm
   */
  checkSlidingWindow(rule, key) {
    const now = Date.now();
    let window = this.slidingWindows.get(key);
    
    if (!window) {
      window = {
        requests: [],
        windowMs: rule.windowMs
      };
      this.slidingWindows.set(key, window);
    }
    
    // Remove expired requests
    const cutoff = now - window.windowMs;
    window.requests = window.requests.filter(timestamp => timestamp > cutoff);
    
    if (window.requests.length < rule.maxRequests) {
      window.requests.push(now);
      return {
        allowed: true,
        rule: rule.id,
        remaining: rule.maxRequests - window.requests.length,
        resetTime: window.requests[0] + window.windowMs
      };
    }
    
    const oldestRequest = window.requests[0];
    return {
      allowed: false,
      rule: rule.id,
      remaining: 0,
      resetTime: oldestRequest + window.windowMs,
      retryAfter: Math.ceil((oldestRequest + window.windowMs - now) / 1000)
    };
  }

  /**
   * Fixed window algorithm
   */
  checkFixedWindow(rule, key) {
    const now = Date.now();
    const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
    const windowKey = `${key}:${windowStart}`;
    
    let window = this.fixedWindows.get(windowKey);
    
    if (!window) {
      window = {
        count: 0,
        windowStart,
        windowEnd: windowStart + rule.windowMs
      };
      this.fixedWindows.set(windowKey, window);
    }
    
    if (window.count < rule.maxRequests) {
      window.count++;
      return {
        allowed: true,
        rule: rule.id,
        remaining: rule.maxRequests - window.count,
        resetTime: window.windowEnd
      };
    }
    
    return {
      allowed: false,
      rule: rule.id,
      remaining: 0,
      resetTime: window.windowEnd,
      retryAfter: Math.ceil((window.windowEnd - now) / 1000)
    };
  }

  /**
   * Leaky bucket algorithm
   */
  checkLeakyBucket(rule, key) {
    const now = Date.now();
    let bucket = this.leakyBuckets.get(key);
    
    if (!bucket) {
      bucket = {
        volume: 0,
        lastLeak: now,
        capacity: rule.maxRequests,
        leakRate: rule.maxRequests / (rule.windowMs / 1000) // requests per second
      };
      this.leakyBuckets.set(key, bucket);
    }
    
    // Leak requests based on time elapsed
    const timeElapsed = (now - bucket.lastLeak) / 1000;
    const requestsToLeak = timeElapsed * bucket.leakRate;
    bucket.volume = Math.max(0, bucket.volume - requestsToLeak);
    bucket.lastLeak = now;
    
    if (bucket.volume < bucket.capacity) {
      bucket.volume++;
      return {
        allowed: true,
        rule: rule.id,
        remaining: Math.floor(bucket.capacity - bucket.volume),
        resetTime: now + ((bucket.volume / bucket.leakRate) * 1000)
      };
    }
    
    return {
      allowed: false,
      rule: rule.id,
      remaining: 0,
      resetTime: now + ((bucket.volume / bucket.leakRate) * 1000),
      retryAfter: Math.ceil(1 / bucket.leakRate)
    };
  }

  /**
   * Add custom rate limit rule
   */
  addRule(rule) {
    this.rules.set(rule.id, {
      windowMs: 60000,
      maxRequests: 100,
      algorithm: 'sliding-window',
      keyGenerator: (req) => req.ip,
      skipIf: () => false,
      ...rule
    });
    
    this.emit('ruleAdded', {
      ruleId: rule.id,
      ruleName: rule.name,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Remove rate limit rule
   */
  removeRule(ruleId) {
    const removed = this.rules.delete(ruleId);
    
    if (removed) {
      this.emit('ruleRemoved', {
        ruleId,
        timestamp: new Date().toISOString()
      });
    }
    
    return removed;
  }

  /**
   * Update rate limit rule
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    
    const updatedRule = { ...rule, ...updates };
    this.rules.set(ruleId, updatedRule);
    
    this.emit('ruleUpdated', {
      ruleId,
      updates,
      timestamp: new Date().toISOString()
    });
    
    return updatedRule;
  }

  /**
   * Reset rate limit for key
   */
  resetRateLimit(key, algorithm = null) {
    let resetCount = 0;
    
    if (!algorithm || algorithm === 'token-bucket') {
      if (this.tokenBuckets.delete(key)) resetCount++;
    }
    
    if (!algorithm || algorithm === 'sliding-window') {
      if (this.slidingWindows.delete(key)) resetCount++;
    }
    
    if (!algorithm || algorithm === 'fixed-window') {
      // Reset all fixed windows for this key
      for (const [windowKey] of this.fixedWindows) {
        if (windowKey.startsWith(key + ':')) {
          this.fixedWindows.delete(windowKey);
          resetCount++;
        }
      }
    }
    
    if (!algorithm || algorithm === 'leaky-bucket') {
      if (this.leakyBuckets.delete(key)) resetCount++;
    }
    
    this.emit('rateLimitReset', {
      key,
      algorithm,
      resetCount,
      timestamp: new Date().toISOString()
    });
    
    return resetCount > 0;
  }

  /**
   * Get rate limit status for key
   */
  getRateLimitStatus(key, ruleId) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error('Rule not found');
    }
    
    const now = Date.now();
    
    switch (rule.algorithm) {
      case 'token-bucket':
        const bucket = this.tokenBuckets.get(key);
        return bucket ? {
          algorithm: 'token-bucket',
          remaining: bucket.tokens,
          resetTime: now + ((bucket.capacity - bucket.tokens) / bucket.refillRate * 1000),
          total: bucket.capacity
        } : null;
        
      case 'sliding-window':
        const window = this.slidingWindows.get(key);
        if (!window) return null;
        
        const cutoff = now - window.windowMs;
        const activeRequests = window.requests.filter(timestamp => timestamp > cutoff);
        return {
          algorithm: 'sliding-window',
          remaining: rule.maxRequests - activeRequests.length,
          resetTime: activeRequests[0] + window.windowMs,
          total: rule.maxRequests
        };
        
      case 'fixed-window':
        const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
        const windowKey = `${key}:${windowStart}`;
        const fixedWindow = this.fixedWindows.get(windowKey);
        
        return fixedWindow ? {
          algorithm: 'fixed-window',
          remaining: rule.maxRequests - fixedWindow.count,
          resetTime: fixedWindow.windowEnd,
          total: rule.maxRequests
        } : {
          algorithm: 'fixed-window',
          remaining: rule.maxRequests,
          resetTime: windowStart + rule.windowMs,
          total: rule.maxRequests
        };
        
      case 'leaky-bucket':
        const leakyBucket = this.leakyBuckets.get(key);
        return leakyBucket ? {
          algorithm: 'leaky-bucket',
          remaining: Math.floor(leakyBucket.capacity - leakyBucket.volume),
          resetTime: now + ((leakyBucket.volume / leakyBucket.leakRate) * 1000),
          total: leakyBucket.capacity
        } : null;
        
      default:
        return null;
    }
  }

  /**
   * Middleware for Express.js
   */
  middleware(options = {}) {
    const ruleId = options.ruleId;
    const onLimitReached = options.onLimitReached || ((req, res) => {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.'
      });
    });
    
    return async (req, res, next) => {
      try {
        const result = await this.checkRateLimit(req, ruleId);
        
        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': result.rule ? this.rules.get(result.rule).maxRequests : 'N/A',
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });
        
        if (!result.allowed) {
          if (result.retryAfter) {
            res.set('Retry-After', result.retryAfter);
          }
          
          this.emit('rateLimitExceeded', {
            rule: result.rule,
            key: this.rules.get(result.rule)?.keyGenerator(req),
            ip: req.ip,
            path: req.path,
            timestamp: new Date().toISOString()
          });
          
          return onLimitReached(req, res, result);
        }
        
        next();
      } catch (error) {
        this.emit('error', {
          type: 'RATE_LIMIT_ERROR',
          error: error.message,
          timestamp: new Date().toISOString()
        });
        next(); // Continue on error
      }
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    
    // Cleanup sliding windows
    for (const [key, window] of this.slidingWindows) {
      const cutoff = now - window.windowMs;
      window.requests = window.requests.filter(timestamp => timestamp > cutoff);
      
      if (window.requests.length === 0) {
        this.slidingWindows.delete(key);
      }
    }
    
    // Cleanup fixed windows
    for (const [key, window] of this.fixedWindows) {
      if (now > window.windowEnd) {
        this.fixedWindows.delete(key);
      }
    }
    
    // Cleanup token buckets (remove inactive ones)
    for (const [key, bucket] of this.tokenBuckets) {
      if (now - bucket.lastRefill > 300000) { // 5 minutes inactive
        this.tokenBuckets.delete(key);
      }
    }
    
    // Cleanup leaky buckets (remove empty ones)
    for (const [key, bucket] of this.leakyBuckets) {
      const timeElapsed = (now - bucket.lastLeak) / 1000;
      const requestsToLeak = timeElapsed * bucket.leakRate;
      const currentVolume = Math.max(0, bucket.volume - requestsToLeak);
      
      if (currentVolume === 0 && now - bucket.lastLeak > 300000) {
        this.leakyBuckets.delete(key);
      }
    }
  }

  /**
   * Collect metrics
   */
  collectMetrics() {
    const metrics = {
      ...this.metrics,
      activeTokenBuckets: this.tokenBuckets.size,
      activeSlidingWindows: this.slidingWindows.size,
      activeFixedWindows: this.fixedWindows.size,
      activeLeakyBuckets: this.leakyBuckets.size,
      totalRules: this.rules.size,
      timestamp: new Date().toISOString()
    };
    
    this.emit('metricsCollected', metrics);
    return metrics;
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      rules: this.rules.size,
      activeStores: {
        tokenBuckets: this.tokenBuckets.size,
        slidingWindows: this.slidingWindows.size,
        fixedWindows: this.fixedWindows.size,
        leakyBuckets: this.leakyBuckets.size
      },
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { RateLimitManager };
