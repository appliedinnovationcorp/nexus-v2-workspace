/**
 * Zero-Trust Middleware for Next.js/Express Applications
 * Integrates zero-trust security into the AIC Website request pipeline
 * Provides seamless security enforcement with minimal performance impact
 */

const { ZeroTrustManager } = require('../core/zero-trust-manager');

class ZeroTrustMiddleware {
  constructor(config = {}) {
    this.config = {
      // Middleware behavior
      enabled: config.enabled !== false,
      bypassRoutes: config.bypassRoutes || ['/health', '/public'],
      enforceRoutes: config.enforceRoutes || ['/api', '/admin', '/dashboard'],
      
      // Security levels
      defaultSecurityLevel: config.defaultSecurityLevel || 'medium',
      routeSecurityLevels: {
        '/api/admin': 'high',
        '/api/users': 'medium',
        '/api/public': 'low',
        ...config.routeSecurityLevels
      },
      
      // Response behavior
      blockOnFailure: config.blockOnFailure !== false,
      logAllRequests: config.logAllRequests || false,
      includeSecurityHeaders: config.includeSecurityHeaders !== false,
      
      // Performance optimization
      cacheVerifications: config.cacheVerifications !== false,
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
      
      ...config
    };

    this.zeroTrustManager = new ZeroTrustManager(config.zeroTrust || {});
    this.verificationCache = new Map();
    this.metrics = {
      requestsProcessed: 0,
      requestsBlocked: 0,
      requestsAllowed: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageProcessingTime: 0
    };

    this.init();
  }

  async init() {
    console.log('🛡️ Initializing Zero-Trust Middleware...');
    
    // Setup cache cleanup
    setInterval(() => this.cleanupCache(), 300000); // 5 minutes
    
    console.log('✅ Zero-Trust Middleware initialized');
  }

  // Main middleware function for Express/Next.js
  middleware() {
    return async (req, res, next) => {
      if (!this.config.enabled) {
        return next();
      }

      const startTime = Date.now();
      
      try {
        // Check if route should be bypassed
        if (this.shouldBypassRoute(req.path)) {
          this.metrics.requestsProcessed++;
          return next();
        }

        // Extract request information
        const requestInfo = this.extractRequestInfo(req);
        
        // Check cache first
        const cacheKey = this.generateCacheKey(requestInfo);
        if (this.config.cacheVerifications && this.verificationCache.has(cacheKey)) {
          const cachedResult = this.verificationCache.get(cacheKey);
          if (Date.now() - cachedResult.timestamp < this.config.cacheTimeout) {
            this.metrics.cacheHits++;
            return this.handleVerificationResult(cachedResult.result, req, res, next);
          } else {
            this.verificationCache.delete(cacheKey);
          }
        }

        this.metrics.cacheMisses++;

        // Perform zero-trust verification
        const verificationResult = await this.zeroTrustManager.verifyAccess(requestInfo);
        
        // Cache the result
        if (this.config.cacheVerifications) {
          this.verificationCache.set(cacheKey, {
            result: verificationResult,
            timestamp: Date.now()
          });
        }

        // Update metrics
        const processingTime = Date.now() - startTime;
        this.updateMetrics(processingTime);

        // Handle the verification result
        return this.handleVerificationResult(verificationResult, req, res, next);

      } catch (error) {
        console.error('❌ Zero-trust middleware error:', error);
        
        // In case of error, apply fail-safe behavior
        if (this.config.blockOnFailure) {
          return this.blockRequest(res, 'Security verification failed', 500);
        } else {
          console.warn('⚠️ Allowing request due to security verification error');
          return next();
        }
      }
    };
  }

  // Next.js API route wrapper
  withZeroTrust(handler, options = {}) {
    return async (req, res) => {
      if (!this.config.enabled) {
        return handler(req, res);
      }

      const startTime = Date.now();
      
      try {
        // Check if route should be bypassed
        if (this.shouldBypassRoute(req.url)) {
          this.metrics.requestsProcessed++;
          return handler(req, res);
        }

        // Extract request information
        const requestInfo = this.extractRequestInfo(req);
        
        // Apply route-specific options
        const routeConfig = { ...this.config, ...options };
        
        // Perform zero-trust verification
        const verificationResult = await this.zeroTrustManager.verifyAccess(requestInfo);
        
        // Update metrics
        const processingTime = Date.now() - startTime;
        this.updateMetrics(processingTime);

        // Check if access is allowed
        if (!verificationResult.allowed) {
          this.metrics.requestsBlocked++;
          return this.blockRequest(res, 'Access denied by zero-trust policy', 403, {
            riskScore: verificationResult.riskScore,
            recommendations: verificationResult.recommendations
          });
        }

        // Add security context to request
        req.zeroTrust = {
          verified: true,
          riskScore: verificationResult.riskScore,
          verification: verificationResult.verification,
          timestamp: Date.now()
        };

        // Add security headers
        if (this.config.includeSecurityHeaders) {
          this.addSecurityHeaders(res, verificationResult);
        }

        this.metrics.requestsAllowed++;
        
        // Call the original handler
        return handler(req, res);

      } catch (error) {
        console.error('❌ Zero-trust API wrapper error:', error);
        
        if (this.config.blockOnFailure) {
          return this.blockRequest(res, 'Security verification failed', 500);
        } else {
          console.warn('⚠️ Allowing API request due to security verification error');
          return handler(req, res);
        }
      }
    };
  }

  // React component wrapper for client-side security
  withClientZeroTrust(Component, options = {}) {
    return function ZeroTrustWrappedComponent(props) {
      const [securityStatus, setSecurityStatus] = React.useState({
        loading: true,
        verified: false,
        riskScore: 0,
        error: null
      });

      React.useEffect(() => {
        const verifyClientSecurity = async () => {
          try {
            const response = await fetch('/api/zero-trust/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                component: Component.name,
                path: window.location.pathname,
                ...options
              })
            });

            const result = await response.json();
            
            setSecurityStatus({
              loading: false,
              verified: result.allowed,
              riskScore: result.riskScore,
              error: result.error
            });

          } catch (error) {
            console.error('Client-side zero-trust verification failed:', error);
            setSecurityStatus({
              loading: false,
              verified: false,
              riskScore: 1.0,
              error: error.message
            });
          }
        };

        verifyClientSecurity();
      }, []);

      if (securityStatus.loading) {
        return React.createElement('div', { className: 'zero-trust-loading' }, 'Verifying security...');
      }

      if (!securityStatus.verified) {
        return React.createElement('div', { 
          className: 'zero-trust-blocked' 
        }, `Access denied. Risk score: ${securityStatus.riskScore}`);
      }

      return React.createElement(Component, {
        ...props,
        zeroTrust: securityStatus
      });
    };
  }

  // Request information extraction
  extractRequestInfo(req) {
    const userAgent = req.headers['user-agent'] || '';
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               req.connection?.remoteAddress || 
               req.socket?.remoteAddress || 
               req.ip || 
               'unknown';

    return {
      // Request details
      method: req.method,
      path: req.path || req.url,
      ip,
      userAgent,
      headers: req.headers,
      
      // User context (from session/auth)
      userId: req.user?.id || req.session?.userId || null,
      sessionId: req.session?.id || req.headers['x-session-id'] || null,
      
      // Device context
      deviceId: req.headers['x-device-id'] || this.extractDeviceId(req),
      
      // Security context
      token: req.headers.authorization?.replace('Bearer ', '') || null,
      
      // Request metadata
      timestamp: Date.now(),
      resource: this.extractResource(req),
      action: this.extractAction(req),
      
      // Additional context
      referer: req.headers.referer,
      origin: req.headers.origin,
      acceptLanguage: req.headers['accept-language'],
      
      // Geolocation (if available)
      location: this.extractLocation(req)
    };
  }

  extractDeviceId(req) {
    // Try to extract device ID from various sources
    return req.headers['x-device-fingerprint'] ||
           req.headers['x-client-id'] ||
           req.cookies?.deviceId ||
           null;
  }

  extractResource(req) {
    // Extract the resource being accessed
    const path = req.path || req.url || '';
    
    // Remove query parameters and normalize
    const resource = path.split('?')[0].toLowerCase();
    
    // Map to resource categories
    if (resource.startsWith('/api/admin')) return 'admin';
    if (resource.startsWith('/api/users')) return 'users';
    if (resource.startsWith('/api/data')) return 'data';
    if (resource.startsWith('/api/')) return 'api';
    if (resource.startsWith('/admin')) return 'admin';
    
    return resource;
  }

  extractAction(req) {
    // Map HTTP methods to actions
    const methodActions = {
      'GET': 'read',
      'POST': 'create',
      'PUT': 'update',
      'PATCH': 'update',
      'DELETE': 'delete'
    };
    
    return methodActions[req.method] || 'access';
  }

  extractLocation(req) {
    // Extract location from headers if available
    const cloudflareCountry = req.headers['cf-ipcountry'];
    const cloudflareCity = req.headers['cf-ipcity'];
    
    if (cloudflareCountry) {
      return {
        country: cloudflareCountry,
        city: cloudflareCity,
        source: 'cloudflare'
      };
    }
    
    return null;
  }

  // Route checking
  shouldBypassRoute(path) {
    if (!path) return false;
    
    return this.config.bypassRoutes.some(route => {
      if (route.endsWith('*')) {
        return path.startsWith(route.slice(0, -1));
      }
      return path === route || path.startsWith(route + '/');
    });
  }

  shouldEnforceRoute(path) {
    if (!path) return false;
    
    return this.config.enforceRoutes.some(route => {
      if (route.endsWith('*')) {
        return path.startsWith(route.slice(0, -1));
      }
      return path === route || path.startsWith(route + '/');
    });
  }

  getRouteSecurityLevel(path) {
    // Check for exact matches first
    if (this.config.routeSecurityLevels[path]) {
      return this.config.routeSecurityLevels[path];
    }
    
    // Check for prefix matches
    for (const [route, level] of Object.entries(this.config.routeSecurityLevels)) {
      if (route.endsWith('*') && path.startsWith(route.slice(0, -1))) {
        return level;
      }
      if (path.startsWith(route + '/')) {
        return level;
      }
    }
    
    return this.config.defaultSecurityLevel;
  }

  // Response handling
  handleVerificationResult(verificationResult, req, res, next) {
    if (verificationResult.allowed) {
      // Add security context to request
      req.zeroTrust = {
        verified: true,
        riskScore: verificationResult.riskScore,
        verification: verificationResult.verification,
        timestamp: Date.now()
      };

      // Add security headers
      if (this.config.includeSecurityHeaders) {
        this.addSecurityHeaders(res, verificationResult);
      }

      this.metrics.requestsAllowed++;
      return next();
    } else {
      this.metrics.requestsBlocked++;
      return this.blockRequest(res, 'Access denied by zero-trust policy', 403, {
        riskScore: verificationResult.riskScore,
        recommendations: verificationResult.recommendations
      });
    }
  }

  blockRequest(res, message, statusCode = 403, additionalData = {}) {
    const response = {
      error: message,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    if (res.json) {
      // Express/Next.js API response
      return res.status(statusCode).json(response);
    } else {
      // Raw HTTP response
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(response));
    }
  }

  addSecurityHeaders(res, verificationResult) {
    // Standard security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Zero-trust specific headers
    res.setHeader('X-Zero-Trust-Verified', 'true');
    res.setHeader('X-Risk-Score', verificationResult.riskScore?.toString() || '0');
    res.setHeader('X-Security-Level', this.getRouteSecurityLevel(res.req?.path || ''));
    
    // CSP header (basic)
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  }

  // Cache management
  generateCacheKey(requestInfo) {
    const keyData = {
      userId: requestInfo.userId,
      deviceId: requestInfo.deviceId,
      ip: requestInfo.ip,
      resource: requestInfo.resource,
      action: requestInfo.action
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  cleanupCache() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, value] of this.verificationCache) {
      if (now - value.timestamp > this.config.cacheTimeout) {
        this.verificationCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  // Metrics
  updateMetrics(processingTime) {
    this.metrics.requestsProcessed++;
    
    // Update average processing time
    const currentAvg = this.metrics.averageProcessingTime;
    const totalRequests = this.metrics.requestsProcessed;
    this.metrics.averageProcessingTime = 
      (currentAvg * (totalRequests - 1) + processingTime) / totalRequests;
  }

  getMetrics() {
    return {
      ...this.metrics,
      cacheSize: this.verificationCache.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0
    };
  }

  // Configuration management
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 Zero-trust middleware configuration updated');
  }

  // Health check
  async healthCheck() {
    const zeroTrustHealth = await this.zeroTrustManager.performSecurityHealthCheck();
    
    return {
      status: 'healthy',
      middleware: {
        enabled: this.config.enabled,
        cacheSize: this.verificationCache.size,
        metrics: this.metrics
      },
      zeroTrust: zeroTrustHealth
    };
  }

  // Shutdown
  async shutdown() {
    console.log('🛡️ Shutting down Zero-Trust Middleware...');
    
    // Clear cache
    this.verificationCache.clear();
    
    // Shutdown zero-trust manager
    await this.zeroTrustManager.shutdown();
    
    console.log('✅ Zero-Trust Middleware shutdown complete');
  }
}

// Convenience functions for different frameworks

// Express.js integration
function createExpressMiddleware(config = {}) {
  const middleware = new ZeroTrustMiddleware(config);
  return middleware.middleware();
}

// Next.js API route integration
function createNextJSWrapper(config = {}) {
  const middleware = new ZeroTrustMiddleware(config);
  return (handler, options) => middleware.withZeroTrust(handler, options);
}

// React component integration
function createReactWrapper(config = {}) {
  const middleware = new ZeroTrustMiddleware(config);
  return (Component, options) => middleware.withClientZeroTrust(Component, options);
}

module.exports = {
  ZeroTrustMiddleware,
  createExpressMiddleware,
  createNextJSWrapper,
  createReactWrapper
};
