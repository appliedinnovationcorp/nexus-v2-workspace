/**
 * API Security Gateway - Advanced Security Framework
 * Comprehensive API security with validation, rate limiting, and threat protection
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class APISecurityGateway extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableRequestValidation: config.enableRequestValidation !== false,
      enableResponseValidation: config.enableResponseValidation || false,
      enableAPIKeyValidation: config.enableAPIKeyValidation || false,
      enableJWTValidation: config.enableJWTValidation !== false,
      enableSchemaValidation: config.enableSchemaValidation || false,
      enableThreatDetection: config.enableThreatDetection !== false,
      maxRequestSize: config.maxRequestSize || 10 * 1024 * 1024, // 10MB
      maxResponseSize: config.maxResponseSize || 50 * 1024 * 1024, // 50MB
      allowedMethods: config.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedContentTypes: config.allowedContentTypes || ['application/json', 'application/xml', 'text/plain'],
      blockedUserAgents: config.blockedUserAgents || [],
      apiKeyHeader: config.apiKeyHeader || 'x-api-key',
      ...config
    };
    
    this.apiKeys = new Map();
    this.schemas = new Map();
    this.metrics = {
      totalRequests: 0,
      validRequests: 0,
      blockedRequests: 0,
      validationErrors: 0,
      threatDetections: 0
    };
    
    this.initializeDefaultSchemas();
  }

  /**
   * Initialize default API schemas
   */
  initializeDefaultSchemas() {
    // User registration schema
    this.schemas.set('/api/auth/register', {
      method: 'POST',
      requestSchema: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string', minLength: 3, maxLength: 50 },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
          firstName: { type: 'string', maxLength: 50 },
          lastName: { type: 'string', maxLength: 50 }
        }
      },
      responseSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          userId: { type: 'string' }
        }
      }
    });

    // User login schema
    this.schemas.set('/api/auth/login', {
      method: 'POST',
      requestSchema: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 1 },
          rememberMe: { type: 'boolean' }
        }
      }
    });
  }

  /**
   * Initialize the API security gateway
   */
  async initialize() {
    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      config: {
        enableRequestValidation: this.config.enableRequestValidation,
        enableSchemaValidation: this.config.enableSchemaValidation,
        enableThreatDetection: this.config.enableThreatDetection
      }
    });
  }

  /**
   * Validate API request
   */
  async validateRequest(req) {
    const validationResult = {
      valid: true,
      errors: [],
      warnings: [],
      blocked: false,
      reason: null
    };

    try {
      // Basic request validation
      const basicValidation = this.performBasicValidation(req);
      if (!basicValidation.valid) {
        validationResult.valid = false;
        validationResult.errors.push(...basicValidation.errors);
      }

      // Method validation
      if (!this.config.allowedMethods.includes(req.method.toUpperCase())) {
        validationResult.valid = false;
        validationResult.blocked = true;
        validationResult.errors.push(`Method ${req.method} not allowed`);
        validationResult.reason = 'METHOD_NOT_ALLOWED';
      }

      // Content-Type validation
      if (req.body && req.headers['content-type']) {
        const contentType = req.headers['content-type'].split(';')[0];
        if (!this.config.allowedContentTypes.includes(contentType)) {
          validationResult.valid = false;
          validationResult.errors.push(`Content-Type ${contentType} not allowed`);
        }
      }

      // Size validation
      const requestSize = this.calculateRequestSize(req);
      if (requestSize > this.config.maxRequestSize) {
        validationResult.valid = false;
        validationResult.blocked = true;
        validationResult.errors.push(`Request size ${requestSize} exceeds limit`);
        validationResult.reason = 'REQUEST_TOO_LARGE';
      }

      // User-Agent validation
      const userAgent = req.headers['user-agent'] || '';
      if (this.isBlockedUserAgent(userAgent)) {
        validationResult.valid = false;
        validationResult.blocked = true;
        validationResult.errors.push('Blocked user agent');
        validationResult.reason = 'BLOCKED_USER_AGENT';
      }

      // API Key validation
      if (this.config.enableAPIKeyValidation) {
        const apiKeyValidation = await this.validateAPIKey(req);
        if (!apiKeyValidation.valid) {
          validationResult.valid = false;
          validationResult.errors.push(...apiKeyValidation.errors);
        }
      }

      // JWT validation
      if (this.config.enableJWTValidation) {
        const jwtValidation = await this.validateJWT(req);
        if (!jwtValidation.valid) {
          validationResult.valid = false;
          validationResult.errors.push(...jwtValidation.errors);
        }
      }

      // Schema validation
      if (this.config.enableSchemaValidation) {
        const schemaValidation = await this.validateSchema(req);
        if (!schemaValidation.valid) {
          validationResult.valid = false;
          validationResult.errors.push(...schemaValidation.errors);
        }
      }

      // Threat detection
      if (this.config.enableThreatDetection) {
        const threatDetection = await this.detectThreats(req);
        if (threatDetection.threatsDetected) {
          validationResult.valid = false;
          validationResult.blocked = true;
          validationResult.errors.push(...threatDetection.threats);
          validationResult.reason = 'THREAT_DETECTED';
          this.metrics.threatDetections++;
        }
      }

      // Update metrics
      this.metrics.totalRequests++;
      if (validationResult.valid) {
        this.metrics.validRequests++;
      } else {
        this.metrics.validationErrors++;
        if (validationResult.blocked) {
          this.metrics.blockedRequests++;
        }
      }

      return validationResult;

    } catch (error) {
      this.emit('validationError', {
        error: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      return {
        valid: false,
        errors: ['Internal validation error'],
        blocked: true,
        reason: 'VALIDATION_ERROR'
      };
    }
  }

  /**
   * Perform basic request validation
   */
  performBasicValidation(req) {
    const errors = [];

    // Check required headers
    if (!req.headers['user-agent']) {
      errors.push('User-Agent header is required');
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    suspiciousHeaders.forEach(header => {
      if (req.headers[header] && this.containsSuspiciousContent(req.headers[header])) {
        errors.push(`Suspicious content in ${header} header`);
      }
    });

    // Check URL length
    if (req.url && req.url.length > 2048) {
      errors.push('URL length exceeds maximum allowed');
    }

    // Check for null bytes
    if (req.url && req.url.includes('\0')) {
      errors.push('Null bytes detected in URL');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate API key
   */
  async validateAPIKey(req) {
    const apiKey = req.headers[this.config.apiKeyHeader];
    
    if (!apiKey) {
      return {
        valid: false,
        errors: ['API key is required']
      };
    }

    const keyData = this.apiKeys.get(apiKey);
    
    if (!keyData) {
      return {
        valid: false,
        errors: ['Invalid API key']
      };
    }

    // Check if key is active
    if (!keyData.active) {
      return {
        valid: false,
        errors: ['API key is inactive']
      };
    }

    // Check expiration
    if (keyData.expiresAt && new Date() > keyData.expiresAt) {
      return {
        valid: false,
        errors: ['API key has expired']
      };
    }

    // Check rate limits
    if (keyData.rateLimit) {
      const rateLimitCheck = this.checkAPIKeyRateLimit(keyData);
      if (!rateLimitCheck.allowed) {
        return {
          valid: false,
          errors: ['API key rate limit exceeded']
        };
      }
    }

    // Update usage
    keyData.lastUsed = new Date();
    keyData.usageCount = (keyData.usageCount || 0) + 1;

    return { valid: true };
  }

  /**
   * Validate JWT token
   */
  async validateJWT(req) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        errors: ['JWT token is required']
      };
    }

    const token = authHeader.substring(7);
    
    try {
      // This would use a JWT library to validate the token
      // For now, we'll do basic validation
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        return {
          valid: false,
          errors: ['Invalid JWT format']
        };
      }

      // Decode and validate (simplified)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return {
          valid: false,
          errors: ['JWT token has expired']
        };
      }

      return { valid: true };

    } catch (error) {
      return {
        valid: false,
        errors: ['Invalid JWT token']
      };
    }
  }

  /**
   * Validate request against schema
   */
  async validateSchema(req) {
    const schema = this.schemas.get(req.path);
    
    if (!schema) {
      return { valid: true }; // No schema defined, skip validation
    }

    if (schema.method && schema.method !== req.method) {
      return { valid: true }; // Different method, skip validation
    }

    const errors = [];

    // Validate request body against schema
    if (schema.requestSchema && req.body) {
      const validation = this.validateAgainstSchema(req.body, schema.requestSchema);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate data against JSON schema
   */
  validateAgainstSchema(data, schema) {
    const errors = [];

    // Type validation
    if (schema.type && typeof data !== schema.type) {
      errors.push(`Expected type ${schema.type}, got ${typeof data}`);
      return { valid: false, errors };
    }

    // Required fields validation
    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach(field => {
        if (!(field in data)) {
          errors.push(`Required field '${field}' is missing`);
        }
      });
    }

    // Properties validation
    if (schema.properties && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        const propertySchema = schema.properties[key];
        if (propertySchema) {
          const propertyValidation = this.validateAgainstSchema(data[key], propertySchema);
          if (!propertyValidation.valid) {
            errors.push(...propertyValidation.errors.map(err => `${key}: ${err}`));
          }
        }
      });
    }

    // String validations
    if (schema.type === 'string' && typeof data === 'string') {
      if (schema.minLength && data.length < schema.minLength) {
        errors.push(`String length ${data.length} is less than minimum ${schema.minLength}`);
      }
      if (schema.maxLength && data.length > schema.maxLength) {
        errors.push(`String length ${data.length} exceeds maximum ${schema.maxLength}`);
      }
      if (schema.format === 'email' && !this.isValidEmail(data)) {
        errors.push('Invalid email format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect threats in request
   */
  async detectThreats(req) {
    const threats = [];
    let threatsDetected = false;

    // SQL Injection detection
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /((\%27)|(\'))\s*((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i
    ];

    const requestString = JSON.stringify(req.body) + req.url + JSON.stringify(req.query);
    
    sqlPatterns.forEach(pattern => {
      if (pattern.test(requestString)) {
        threats.push('SQL injection attempt detected');
        threatsDetected = true;
      }
    });

    // XSS detection
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(requestString)) {
        threats.push('XSS attempt detected');
        threatsDetected = true;
      }
    });

    // Command injection detection
    const commandPatterns = [
      /[;&|`$(){}[\]]/,
      /\b(cat|ls|pwd|whoami|id|uname|wget|curl)\b/i
    ];

    commandPatterns.forEach(pattern => {
      if (pattern.test(requestString)) {
        threats.push('Command injection attempt detected');
        threatsDetected = true;
      }
    });

    // Path traversal detection
    const pathTraversalPatterns = [
      /\.\.\//,
      /\.\.\\/,
      /%2e%2e%2f/i,
      /%2e%2e%5c/i
    ];

    pathTraversalPatterns.forEach(pattern => {
      if (pattern.test(req.url)) {
        threats.push('Path traversal attempt detected');
        threatsDetected = true;
      }
    });

    return {
      threatsDetected,
      threats
    };
  }

  /**
   * Validate response
   */
  async validateResponse(res, body) {
    if (!this.config.enableResponseValidation) {
      return { valid: true };
    }

    const errors = [];

    // Size validation
    const responseSize = Buffer.byteLength(JSON.stringify(body));
    if (responseSize > this.config.maxResponseSize) {
      errors.push(`Response size ${responseSize} exceeds limit`);
    }

    // Schema validation for response
    const schema = this.schemas.get(res.req.path);
    if (schema && schema.responseSchema) {
      const validation = this.validateAgainstSchema(body, schema.responseSchema);
      if (!validation.valid) {
        errors.push(...validation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Add API key
   */
  addAPIKey(keyData) {
    const apiKey = keyData.key || crypto.randomBytes(32).toString('hex');
    
    this.apiKeys.set(apiKey, {
      key: apiKey,
      name: keyData.name,
      active: keyData.active !== false,
      createdAt: new Date(),
      expiresAt: keyData.expiresAt,
      rateLimit: keyData.rateLimit,
      permissions: keyData.permissions || [],
      usageCount: 0,
      lastUsed: null
    });

    this.emit('apiKeyAdded', {
      key: apiKey,
      name: keyData.name,
      timestamp: new Date().toISOString()
    });

    return apiKey;
  }

  /**
   * Remove API key
   */
  removeAPIKey(apiKey) {
    const removed = this.apiKeys.delete(apiKey);
    
    if (removed) {
      this.emit('apiKeyRemoved', {
        key: apiKey,
        timestamp: new Date().toISOString()
      });
    }

    return removed;
  }

  /**
   * Add schema
   */
  addSchema(path, schema) {
    this.schemas.set(path, schema);
    
    this.emit('schemaAdded', {
      path,
      method: schema.method,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Middleware for Express.js
   */
  middleware(options = {}) {
    const customConfig = { ...this.config, ...options };
    
    return async (req, res, next) => {
      try {
        // Validate request
        const validation = await this.validateRequest(req);
        
        if (!validation.valid) {
          if (validation.blocked) {
            this.emit('requestBlocked', {
              path: req.path,
              method: req.method,
              ip: req.ip,
              reason: validation.reason,
              errors: validation.errors,
              timestamp: new Date().toISOString()
            });

            return res.status(403).json({
              error: 'Request blocked',
              reason: validation.reason,
              message: validation.errors[0] || 'Request validation failed'
            });
          } else {
            return res.status(400).json({
              error: 'Request validation failed',
              errors: validation.errors
            });
          }
        }

        // Override res.json to validate responses
        if (customConfig.enableResponseValidation) {
          const originalJson = res.json;
          res.json = async function(body) {
            const responseValidation = await this.validateResponse(res, body);
            
            if (!responseValidation.valid) {
              this.emit('responseValidationFailed', {
                path: req.path,
                method: req.method,
                errors: responseValidation.errors,
                timestamp: new Date().toISOString()
              });
            }
            
            return originalJson.call(this, body);
          }.bind(this);
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
          error: 'API security gateway error'
        });
      }
    };
  }

  /**
   * Utility methods
   */
  calculateRequestSize(req) {
    let size = 0;
    
    // Headers size
    size += JSON.stringify(req.headers).length;
    
    // URL size
    size += (req.url || '').length;
    
    // Body size
    if (req.body) {
      size += JSON.stringify(req.body).length;
    }
    
    return size;
  }

  isBlockedUserAgent(userAgent) {
    return this.config.blockedUserAgents.some(blocked => 
      userAgent.toLowerCase().includes(blocked.toLowerCase())
    );
  }

  containsSuspiciousContent(content) {
    const suspiciousPatterns = [
      /[<>'"]/,
      /javascript:/i,
      /data:/i,
      /vbscript:/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(content));
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  checkAPIKeyRateLimit(keyData) {
    // Simplified rate limiting - would use proper rate limiting in production
    return { allowed: true };
  }

  /**
   * Get API statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      apiKeys: this.apiKeys.size,
      schemas: this.schemas.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      metrics: this.metrics,
      apiKeys: this.apiKeys.size,
      schemas: this.schemas.size,
      config: {
        enableRequestValidation: this.config.enableRequestValidation,
        enableSchemaValidation: this.config.enableSchemaValidation,
        enableThreatDetection: this.config.enableThreatDetection
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { APISecurityGateway };
