/**
 * CSRF Protection - Advanced Security Framework
 * Cross-Site Request Forgery protection with multiple validation methods
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CSRFProtection extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      tokenLength: config.tokenLength || 32,
      cookieName: config.cookieName || 'csrf-token',
      headerName: config.headerName || 'x-csrf-token',
      paramName: config.paramName || '_csrf',
      sessionKey: config.sessionKey || 'csrfSecret',
      enableDoubleSubmitCookie: config.enableDoubleSubmitCookie !== false,
      enableSynchronizerToken: config.enableSynchronizerToken !== false,
      enableOriginValidation: config.enableOriginValidation !== false,
      enableRefererValidation: config.enableRefererValidation || false,
      enableSameSiteProtection: config.enableSameSiteProtection !== false,
      trustedOrigins: config.trustedOrigins || [],
      ignoredMethods: config.ignoredMethods || ['GET', 'HEAD', 'OPTIONS'],
      ignoredPaths: config.ignoredPaths || [],
      tokenExpiry: config.tokenExpiry || 3600000, // 1 hour
      ...config
    };
    
    this.tokens = new Map(); // Store tokens with expiry
    this.metrics = {
      tokensGenerated: 0,
      tokensValidated: 0,
      validationFailures: 0,
      blockedRequests: 0
    };
  }

  /**
   * Initialize CSRF protection
   */
  async initialize() {
    // Setup token cleanup
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 300000); // Every 5 minutes

    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      config: {
        enableDoubleSubmitCookie: this.config.enableDoubleSubmitCookie,
        enableSynchronizerToken: this.config.enableSynchronizerToken,
        enableOriginValidation: this.config.enableOriginValidation
      }
    });
  }

  /**
   * Generate CSRF token
   */
  generateToken(sessionId = null) {
    const token = crypto.randomBytes(this.config.tokenLength).toString('hex');
    const secret = crypto.randomBytes(this.config.tokenLength).toString('hex');
    const timestamp = Date.now();
    
    const tokenData = {
      token,
      secret,
      sessionId,
      createdAt: timestamp,
      expiresAt: timestamp + this.config.tokenExpiry,
      used: false
    };
    
    this.tokens.set(token, tokenData);
    this.metrics.tokensGenerated++;
    
    this.emit('tokenGenerated', {
      token,
      sessionId,
      timestamp: new Date().toISOString()
    });
    
    return {
      token,
      secret,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Validate CSRF token
   */
  async validateToken(req, providedToken, providedSecret = null) {
    try {
      // Skip validation for ignored methods
      if (this.config.ignoredMethods.includes(req.method.toUpperCase())) {
        return { valid: true, reason: 'METHOD_IGNORED' };
      }
      
      // Skip validation for ignored paths
      if (this.config.ignoredPaths.some(path => req.path.startsWith(path))) {
        return { valid: true, reason: 'PATH_IGNORED' };
      }
      
      const validationResults = [];
      
      // Origin validation
      if (this.config.enableOriginValidation) {
        const originResult = this.validateOrigin(req);
        validationResults.push(originResult);
      }
      
      // Referer validation
      if (this.config.enableRefererValidation) {
        const refererResult = this.validateReferer(req);
        validationResults.push(refererResult);
      }
      
      // Token validation
      if (this.config.enableSynchronizerToken || this.config.enableDoubleSubmitCookie) {
        const tokenResult = await this.validateCSRFToken(req, providedToken, providedSecret);
        validationResults.push(tokenResult);
      }
      
      // Check if all validations passed
      const failedValidations = validationResults.filter(result => !result.valid);
      
      if (failedValidations.length > 0) {
        this.metrics.validationFailures++;
        this.metrics.blockedRequests++;
        
        this.emit('validationFailed', {
          sessionId: req.sessionID,
          ip: req.ip,
          path: req.path,
          method: req.method,
          failures: failedValidations.map(f => f.reason),
          timestamp: new Date().toISOString()
        });
        
        return {
          valid: false,
          reasons: failedValidations.map(f => f.reason),
          details: failedValidations
        };
      }
      
      this.metrics.tokensValidated++;
      
      this.emit('validationSuccess', {
        sessionId: req.sessionID,
        ip: req.ip,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      return { valid: true, reason: 'ALL_VALIDATIONS_PASSED' };
      
    } catch (error) {
      this.emit('validationError', {
        error: error.message,
        sessionId: req.sessionID,
        timestamp: new Date().toISOString()
      });
      
      return { valid: false, reason: 'VALIDATION_ERROR', error: error.message };
    }
  }

  /**
   * Validate CSRF token (synchronizer token pattern)
   */
  async validateCSRFToken(req, providedToken, providedSecret) {
    // Extract token from various sources
    const token = providedToken || 
                  req.headers[this.config.headerName] ||
                  req.body?.[this.config.paramName] ||
                  req.query?.[this.config.paramName];
    
    if (!token) {
      return { valid: false, reason: 'TOKEN_MISSING' };
    }
    
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return { valid: false, reason: 'TOKEN_INVALID' };
    }
    
    // Check token expiry
    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return { valid: false, reason: 'TOKEN_EXPIRED' };
    }
    
    // Check if token was already used (prevent replay attacks)
    if (tokenData.used) {
      return { valid: false, reason: 'TOKEN_ALREADY_USED' };
    }
    
    // Validate session association
    if (tokenData.sessionId && tokenData.sessionId !== req.sessionID) {
      return { valid: false, reason: 'SESSION_MISMATCH' };
    }
    
    // Double submit cookie validation
    if (this.config.enableDoubleSubmitCookie) {
      const cookieToken = req.cookies?.[this.config.cookieName];
      const secret = providedSecret || req.headers['x-csrf-secret'];
      
      if (!cookieToken || !secret) {
        return { valid: false, reason: 'DOUBLE_SUBMIT_MISSING' };
      }
      
      if (cookieToken !== token || secret !== tokenData.secret) {
        return { valid: false, reason: 'DOUBLE_SUBMIT_MISMATCH' };
      }
    }
    
    // Mark token as used
    tokenData.used = true;
    
    return { valid: true, reason: 'TOKEN_VALID' };
  }

  /**
   * Validate request origin
   */
  validateOrigin(req) {
    const origin = req.headers.origin;
    
    if (!origin) {
      return { valid: false, reason: 'ORIGIN_MISSING' };
    }
    
    // Check against trusted origins
    if (this.config.trustedOrigins.length > 0) {
      const isOriginTrusted = this.config.trustedOrigins.some(trustedOrigin => {
        if (trustedOrigin === origin) return true;
        if (trustedOrigin.startsWith('*.')) {
          const domain = trustedOrigin.substring(2);
          return origin.endsWith(domain);
        }
        return false;
      });
      
      if (!isOriginTrusted) {
        return { valid: false, reason: 'ORIGIN_NOT_TRUSTED', origin };
      }
    } else {
      // If no trusted origins configured, validate against request host
      const host = req.headers.host;
      const expectedOrigin = `${req.protocol}://${host}`;
      
      if (origin !== expectedOrigin) {
        return { valid: false, reason: 'ORIGIN_HOST_MISMATCH', origin, expected: expectedOrigin };
      }
    }
    
    return { valid: true, reason: 'ORIGIN_VALID', origin };
  }

  /**
   * Validate request referer
   */
  validateReferer(req) {
    const referer = req.headers.referer;
    
    if (!referer) {
      return { valid: false, reason: 'REFERER_MISSING' };
    }
    
    try {
      const refererUrl = new URL(referer);
      const host = req.headers.host;
      
      // Check if referer matches request host
      if (refererUrl.host !== host) {
        return { valid: false, reason: 'REFERER_HOST_MISMATCH', referer: refererUrl.host, expected: host };
      }
      
      return { valid: true, reason: 'REFERER_VALID', referer };
    } catch (error) {
      return { valid: false, reason: 'REFERER_INVALID', error: error.message };
    }
  }

  /**
   * Generate secure cookie options
   */
  getSecureCookieOptions(req) {
    return {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: this.config.enableSameSiteProtection ? this.config.sameSite || 'strict' : false,
      maxAge: this.config.tokenExpiry,
      path: '/'
    };
  }

  /**
   * Middleware for Express.js
   */
  middleware(options = {}) {
    const customConfig = { ...this.config, ...options };
    
    return async (req, res, next) => {
      try {
        // Generate token for safe methods or if requested
        if (customConfig.ignoredMethods.includes(req.method.toUpperCase()) || req.query.generateToken) {
          const tokenData = this.generateToken(req.sessionID);
          
          // Set token in response headers
          res.set('X-CSRF-Token', tokenData.token);
          
          // Set double submit cookie if enabled
          if (customConfig.enableDoubleSubmitCookie) {
            res.cookie(customConfig.cookieName, tokenData.token, this.getSecureCookieOptions(req));
            res.set('X-CSRF-Secret', tokenData.secret);
          }
          
          // Store in session if using synchronizer token pattern
          if (customConfig.enableSynchronizerToken && req.session) {
            req.session[customConfig.sessionKey] = tokenData.secret;
          }
          
          req.csrfToken = tokenData.token;
          req.csrfSecret = tokenData.secret;
          
          return next();
        }
        
        // Validate token for unsafe methods
        const validation = await this.validateToken(req);
        
        if (!validation.valid) {
          const errorResponse = {
            error: 'CSRF validation failed',
            reasons: validation.reasons || [validation.reason],
            timestamp: new Date().toISOString()
          };
          
          return res.status(403).json(errorResponse);
        }
        
        next();
      } catch (error) {
        this.emit('middlewareError', {
          error: error.message,
          path: req.path,
          method: req.method,
          timestamp: new Date().toISOString()
        });
        
        return res.status(500).json({
          error: 'CSRF protection error',
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  /**
   * Get CSRF token for client
   */
  getTokenForClient(sessionId) {
    const tokenData = this.generateToken(sessionId);
    
    return {
      token: tokenData.token,
      headerName: this.config.headerName,
      paramName: this.config.paramName,
      expiresAt: tokenData.expiresAt
    };
  }

  /**
   * Invalidate token
   */
  invalidateToken(token) {
    const tokenData = this.tokens.get(token);
    
    if (tokenData) {
      tokenData.used = true;
      this.emit('tokenInvalidated', {
        token,
        sessionId: tokenData.sessionId,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    
    return false;
  }

  /**
   * Invalidate all tokens for session
   */
  invalidateSessionTokens(sessionId) {
    let invalidatedCount = 0;
    
    for (const [token, tokenData] of this.tokens) {
      if (tokenData.sessionId === sessionId) {
        tokenData.used = true;
        invalidatedCount++;
      }
    }
    
    this.emit('sessionTokensInvalidated', {
      sessionId,
      invalidatedCount,
      timestamp: new Date().toISOString()
    });
    
    return invalidatedCount;
  }

  /**
   * Cleanup expired tokens
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [token, tokenData] of this.tokens) {
      if (now > tokenData.expiresAt || tokenData.used) {
        this.tokens.delete(token);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.emit('tokensCleanedUp', {
        cleanedCount,
        remainingTokens: this.tokens.size,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get protection statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      activeTokens: this.tokens.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      activeTokens: this.tokens.size,
      metrics: this.metrics,
      config: {
        enableDoubleSubmitCookie: this.config.enableDoubleSubmitCookie,
        enableSynchronizerToken: this.config.enableSynchronizerToken,
        enableOriginValidation: this.config.enableOriginValidation,
        enableRefererValidation: this.config.enableRefererValidation
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { CSRFProtection };
