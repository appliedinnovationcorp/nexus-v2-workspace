/**
 * XSS Protection - Advanced Security Framework
 * Cross-Site Scripting protection with input sanitization and output encoding
 */

const EventEmitter = require('events');
const DOMPurify = require('isomorphic-dompurify');

class XSSProtection extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableInputSanitization: config.enableInputSanitization !== false,
      enableOutputEncoding: config.enableOutputEncoding !== false,
      enableCSPHeaders: config.enableCSPHeaders !== false,
      enableXSSFilter: config.enableXSSFilter !== false,
      strictMode: config.strictMode || false,
      allowedTags: config.allowedTags || ['b', 'i', 'em', 'strong', 'p', 'br'],
      allowedAttributes: config.allowedAttributes || ['class', 'id'],
      blockedPatterns: config.blockedPatterns || [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /data:text\/html/gi,
        /vbscript:/gi
      ],
      cspDirectives: config.cspDirectives || {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'font-src': ["'self'"],
        'connect-src': ["'self'"],
        'frame-ancestors': ["'none'"]
      },
      ...config
    };
    
    this.metrics = {
      inputsSanitized: 0,
      outputsEncoded: 0,
      threatsBlocked: 0,
      patternsDetected: 0
    };
    
    this.initializeDOMPurify();
  }

  /**
   * Initialize DOMPurify with custom configuration
   */
  initializeDOMPurify() {
    this.purifyConfig = {
      ALLOWED_TAGS: this.config.allowedTags,
      ALLOWED_ATTR: this.config.allowedAttributes,
      KEEP_CONTENT: !this.config.strictMode,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      RETURN_DOM_IMPORT: false,
      SANITIZE_DOM: true,
      WHOLE_DOCUMENT: false,
      FORCE_BODY: false
    };
  }

  /**
   * Initialize XSS protection
   */
  async initialize() {
    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      config: {
        enableInputSanitization: this.config.enableInputSanitization,
        enableOutputEncoding: this.config.enableOutputEncoding,
        enableCSPHeaders: this.config.enableCSPHeaders,
        strictMode: this.config.strictMode
      }
    });
  }

  /**
   * Sanitize input data
   */
  sanitizeInput(input, options = {}) {
    if (typeof input !== 'string') {
      return input;
    }
    
    try {
      let sanitized = input;
      
      // Check for blocked patterns first
      const detectedPatterns = this.detectMaliciousPatterns(input);
      if (detectedPatterns.length > 0) {
        this.metrics.patternsDetected++;
        this.metrics.threatsBlocked++;
        
        this.emit('maliciousPatternDetected', {
          input: input.substring(0, 100) + '...', // Truncate for logging
          patterns: detectedPatterns,
          timestamp: new Date().toISOString()
        });
        
        if (this.config.strictMode) {
          throw new Error('Malicious pattern detected in input');
        }
      }
      
      // Use DOMPurify for HTML sanitization
      if (this.config.enableInputSanitization) {
        const customConfig = { ...this.purifyConfig, ...options };
        sanitized = DOMPurify.sanitize(sanitized, customConfig);
        this.metrics.inputsSanitized++;
      }
      
      // Additional custom sanitization
      sanitized = this.performCustomSanitization(sanitized);
      
      return sanitized;
      
    } catch (error) {
      this.emit('sanitizationError', {
        error: error.message,
        input: input.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
      
      // Return empty string on error in strict mode
      return this.config.strictMode ? '' : input;
    }
  }

  /**
   * Encode output for safe display
   */
  encodeOutput(output, context = 'html') {
    if (typeof output !== 'string') {
      return output;
    }
    
    try {
      let encoded = output;
      
      switch (context.toLowerCase()) {
        case 'html':
          encoded = this.htmlEncode(output);
          break;
        case 'attribute':
          encoded = this.attributeEncode(output);
          break;
        case 'javascript':
          encoded = this.javascriptEncode(output);
          break;
        case 'css':
          encoded = this.cssEncode(output);
          break;
        case 'url':
          encoded = this.urlEncode(output);
          break;
        default:
          encoded = this.htmlEncode(output);
      }
      
      this.metrics.outputsEncoded++;
      return encoded;
      
    } catch (error) {
      this.emit('encodingError', {
        error: error.message,
        output: output.substring(0, 100) + '...',
        context,
        timestamp: new Date().toISOString()
      });
      
      return output;
    }
  }

  /**
   * HTML encode
   */
  htmlEncode(str) {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'/]/g, (match) => htmlEntities[match]);
  }

  /**
   * Attribute encode
   */
  attributeEncode(str) {
    return str.replace(/[&<>"']/g, (match) => {
      const code = match.charCodeAt(0);
      return `&#${code};`;
    });
  }

  /**
   * JavaScript encode
   */
  javascriptEncode(str) {
    return str.replace(/[\\'"<>&\r\n\t]/g, (match) => {
      switch (match) {
        case '\\': return '\\\\';
        case "'": return "\\'";
        case '"': return '\\"';
        case '<': return '\\u003c';
        case '>': return '\\u003e';
        case '&': return '\\u0026';
        case '\r': return '\\r';
        case '\n': return '\\n';
        case '\t': return '\\t';
        default: return match;
      }
    });
  }

  /**
   * CSS encode
   */
  cssEncode(str) {
    return str.replace(/[<>"'&\\\r\n]/g, (match) => {
      const code = match.charCodeAt(0);
      return `\\${code.toString(16)} `;
    });
  }

  /**
   * URL encode
   */
  urlEncode(str) {
    return encodeURIComponent(str);
  }

  /**
   * Detect malicious patterns
   */
  detectMaliciousPatterns(input) {
    const detectedPatterns = [];
    
    for (const pattern of this.config.blockedPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source);
      }
    }
    
    // Additional pattern checks
    const additionalChecks = [
      {
        name: 'script_tag',
        test: /<script/i.test(input)
      },
      {
        name: 'javascript_protocol',
        test: /javascript:/i.test(input)
      },
      {
        name: 'event_handler',
        test: /on\w+\s*=/i.test(input)
      },
      {
        name: 'data_uri_html',
        test: /data:text\/html/i.test(input)
      },
      {
        name: 'vbscript_protocol',
        test: /vbscript:/i.test(input)
      },
      {
        name: 'expression_css',
        test: /expression\s*\(/i.test(input)
      },
      {
        name: 'import_css',
        test: /@import/i.test(input)
      }
    ];
    
    for (const check of additionalChecks) {
      if (check.test) {
        detectedPatterns.push(check.name);
      }
    }
    
    return detectedPatterns;
  }

  /**
   * Perform custom sanitization
   */
  performCustomSanitization(input) {
    let sanitized = input;
    
    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');
    
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Normalize Unicode
    sanitized = sanitized.normalize('NFC');
    
    // Remove potentially dangerous Unicode characters
    sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Zero-width characters
    sanitized = sanitized.replace(/[\u2028\u2029]/g, ''); // Line/paragraph separators
    
    return sanitized;
  }

  /**
   * Generate Content Security Policy header
   */
  generateCSPHeader() {
    const directives = [];
    
    for (const [directive, sources] of Object.entries(this.config.cspDirectives)) {
      const sourceList = Array.isArray(sources) ? sources.join(' ') : sources;
      directives.push(`${directive} ${sourceList}`);
    }
    
    return directives.join('; ');
  }

  /**
   * Validate and sanitize object recursively
   */
  sanitizeObject(obj, options = {}) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.sanitizeInput(obj, options);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        const sanitizedKey = this.sanitizeInput(key, options);
        sanitized[sanitizedKey] = this.sanitizeObject(value, options);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Middleware for Express.js
   */
  middleware(options = {}) {
    const customConfig = { ...this.config, ...options };
    
    return (req, res, next) => {
      try {
        // Set security headers
        if (customConfig.enableCSPHeaders) {
          res.set('Content-Security-Policy', this.generateCSPHeader());
        }
        
        if (customConfig.enableXSSFilter) {
          res.set('X-XSS-Protection', '1; mode=block');
          res.set('X-Content-Type-Options', 'nosniff');
          res.set('X-Frame-Options', 'DENY');
        }
        
        // Sanitize request body
        if (customConfig.enableInputSanitization && req.body) {
          req.body = this.sanitizeObject(req.body, customConfig);
        }
        
        // Sanitize query parameters
        if (customConfig.enableInputSanitization && req.query) {
          req.query = this.sanitizeObject(req.query, customConfig);
        }
        
        // Add sanitization methods to request object
        req.sanitize = (input, opts) => this.sanitizeInput(input, opts);
        req.encode = (output, context) => this.encodeOutput(output, context);
        
        // Override res.json to encode output
        if (customConfig.enableOutputEncoding) {
          const originalJson = res.json;
          res.json = function(obj) {
            if (typeof obj === 'object' && obj !== null) {
              // Don't encode error objects or already encoded data
              if (!obj.error && !obj._encoded) {
                obj = this.sanitizeObject(obj);
                obj._encoded = true;
              }
            }
            return originalJson.call(this, obj);
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
        
        next();
      }
    };
  }

  /**
   * Add custom blocked pattern
   */
  addBlockedPattern(pattern) {
    if (pattern instanceof RegExp) {
      this.config.blockedPatterns.push(pattern);
    } else if (typeof pattern === 'string') {
      this.config.blockedPatterns.push(new RegExp(pattern, 'gi'));
    }
    
    this.emit('patternAdded', {
      pattern: pattern.toString(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Remove blocked pattern
   */
  removeBlockedPattern(pattern) {
    const patternStr = pattern.toString();
    const index = this.config.blockedPatterns.findIndex(p => p.toString() === patternStr);
    
    if (index !== -1) {
      this.config.blockedPatterns.splice(index, 1);
      this.emit('patternRemoved', {
        pattern: patternStr,
        timestamp: new Date().toISOString()
      });
      return true;
    }
    
    return false;
  }

  /**
   * Update CSP directive
   */
  updateCSPDirective(directive, sources) {
    this.config.cspDirectives[directive] = sources;
    
    this.emit('cspDirectiveUpdated', {
      directive,
      sources,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get protection statistics
   */
  getStatistics() {
    return {
      ...this.metrics,
      blockedPatterns: this.config.blockedPatterns.length,
      allowedTags: this.config.allowedTags.length,
      cspDirectives: Object.keys(this.config.cspDirectives).length,
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
      config: {
        enableInputSanitization: this.config.enableInputSanitization,
        enableOutputEncoding: this.config.enableOutputEncoding,
        enableCSPHeaders: this.config.enableCSPHeaders,
        strictMode: this.config.strictMode,
        blockedPatterns: this.config.blockedPatterns.length
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { XSSProtection };
