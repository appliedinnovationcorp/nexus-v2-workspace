/**
 * Advanced Security Framework - Core Module
 * Enterprise-grade security framework for production applications
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { AuthenticationManager } = require('./authentication-manager');
const { AuthorizationManager } = require('./authorization-manager');
const { EncryptionManager } = require('./encryption-manager');
const { ThreatDetectionSystem } = require('./threat-detection-system');
const { AuditManager } = require('./audit-manager');
const { SessionManager } = require('./session-manager');
const { SecurityMonitor } = require('./security-monitor');
const { ComplianceManager } = require('./compliance-manager');
const { RateLimitManager } = require('./rate-limit-manager');
const { CSRFProtection } = require('./csrf-protection');
const { XSSProtection } = require('./xss-protection');
const { APISecurityGateway } = require('./api-security-gateway');
const { DataPrivacyManager } = require('./data-privacy-manager');

class SecurityFramework extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      environment: config.environment || 'development',
      enableAllModules: config.enableAllModules || false,
      auditLevel: config.auditLevel || 'standard',
      encryptionLevel: config.encryptionLevel || 'high',
      threatDetectionLevel: config.threatDetectionLevel || 'standard',
      complianceStandards: config.complianceStandards || ['OWASP', 'NIST'],
      ...config
    };
    
    this.modules = new Map();
    this.isInitialized = false;
    this.securityMetrics = {
      threatsDetected: 0,
      authenticationAttempts: 0,
      authorizationFailures: 0,
      encryptionOperations: 0,
      auditEvents: 0,
      complianceViolations: 0
    };
    
    this.initializeModules();
  }

  /**
   * Initialize all security modules
   */
  initializeModules() {
    try {
      // Core Authentication & Authorization
      this.modules.set('authentication', new AuthenticationManager(this.config));
      this.modules.set('authorization', new AuthorizationManager(this.config));
      
      // Encryption & Data Protection
      this.modules.set('encryption', new EncryptionManager(this.config));
      this.modules.set('dataPrivacy', new DataPrivacyManager(this.config));
      
      // Threat Detection & Monitoring
      this.modules.set('threatDetection', new ThreatDetectionSystem(this.config));
      this.modules.set('securityMonitor', new SecurityMonitor(this.config));
      
      // Session & Request Management
      this.modules.set('sessionManager', new SessionManager(this.config));
      this.modules.set('rateLimiter', new RateLimitManager(this.config));
      
      // Web Security Protections
      this.modules.set('csrfProtection', new CSRFProtection(this.config));
      this.modules.set('xssProtection', new XSSProtection(this.config));
      
      // API Security
      this.modules.set('apiGateway', new APISecurityGateway(this.config));
      
      // Audit & Compliance
      this.modules.set('auditManager', new AuditManager(this.config));
      this.modules.set('complianceManager', new ComplianceManager(this.config));
      
      // Setup inter-module communication
      this.setupModuleCommunication();
      
    } catch (error) {
      this.emit('error', {
        type: 'MODULE_INITIALIZATION_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Setup communication between modules
   */
  setupModuleCommunication() {
    // Authentication events
    this.modules.get('authentication').on('authSuccess', (data) => {
      this.securityMetrics.authenticationAttempts++;
      this.modules.get('auditManager').logEvent('AUTH_SUCCESS', data);
      this.modules.get('threatDetection').analyzeAuthEvent(data);
    });

    this.modules.get('authentication').on('authFailure', (data) => {
      this.securityMetrics.authenticationAttempts++;
      this.modules.get('auditManager').logEvent('AUTH_FAILURE', data);
      this.modules.get('threatDetection').analyzeAuthEvent(data);
    });

    // Authorization events
    this.modules.get('authorization').on('authzFailure', (data) => {
      this.securityMetrics.authorizationFailures++;
      this.modules.get('auditManager').logEvent('AUTHZ_FAILURE', data);
      this.modules.get('threatDetection').analyzeAuthzEvent(data);
    });

    // Threat detection events
    this.modules.get('threatDetection').on('threatDetected', (threat) => {
      this.securityMetrics.threatsDetected++;
      this.modules.get('auditManager').logEvent('THREAT_DETECTED', threat);
      this.modules.get('securityMonitor').handleThreat(threat);
      this.emit('securityAlert', threat);
    });

    // Compliance events
    this.modules.get('complianceManager').on('violationDetected', (violation) => {
      this.securityMetrics.complianceViolations++;
      this.modules.get('auditManager').logEvent('COMPLIANCE_VIOLATION', violation);
      this.emit('complianceAlert', violation);
    });
  }

  /**
   * Initialize the security framework
   */
  async initialize() {
    if (this.isInitialized) {
      throw new Error('Security framework is already initialized');
    }

    try {
      // Initialize modules in dependency order
      const initOrder = [
        'encryption',
        'auditManager',
        'authentication',
        'authorization',
        'sessionManager',
        'threatDetection',
        'securityMonitor',
        'rateLimiter',
        'csrfProtection',
        'xssProtection',
        'apiGateway',
        'dataPrivacy',
        'complianceManager'
      ];

      for (const moduleName of initOrder) {
        const module = this.modules.get(moduleName);
        if (module && typeof module.initialize === 'function') {
          await module.initialize();
        }
      }

      this.isInitialized = true;
      
      // Start security monitoring
      this.startSecurityMonitoring();
      
      this.emit('initialized', {
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        modulesLoaded: Array.from(this.modules.keys())
      });

      return true;
    } catch (error) {
      this.emit('error', {
        type: 'INITIALIZATION_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    // Health check interval
    setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds

    // Metrics collection interval
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    // Compliance check interval
    setInterval(() => {
      this.performComplianceCheck();
    }, 300000); // Every 5 minutes
  }

  /**
   * Perform health check on all modules
   */
  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      modules: {}
    };

    for (const [name, module] of this.modules) {
      try {
        if (typeof module.healthCheck === 'function') {
          healthStatus.modules[name] = await module.healthCheck();
        } else {
          healthStatus.modules[name] = { status: 'healthy', message: 'No health check implemented' };
        }
      } catch (error) {
        healthStatus.modules[name] = { status: 'unhealthy', error: error.message };
        healthStatus.overall = 'degraded';
      }
    }

    this.emit('healthCheck', healthStatus);
    return healthStatus;
  }

  /**
   * Collect security metrics
   */
  collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      ...this.securityMetrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };

    this.emit('metricsCollected', metrics);
    return metrics;
  }

  /**
   * Perform compliance check
   */
  async performComplianceCheck() {
    try {
      const complianceStatus = await this.modules.get('complianceManager').performCheck();
      this.emit('complianceCheck', complianceStatus);
      return complianceStatus;
    } catch (error) {
      this.emit('error', {
        type: 'COMPLIANCE_CHECK_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get security middleware for Express.js
   */
  getMiddleware() {
    return {
      // Authentication middleware
      authenticate: this.modules.get('authentication').middleware(),
      
      // Authorization middleware
      authorize: (permissions) => this.modules.get('authorization').middleware(permissions),
      
      // Rate limiting middleware
      rateLimit: (options) => this.modules.get('rateLimiter').middleware(options),
      
      // CSRF protection middleware
      csrfProtection: this.modules.get('csrfProtection').middleware(),
      
      // XSS protection middleware
      xssProtection: this.modules.get('xssProtection').middleware(),
      
      // API security middleware
      apiSecurity: this.modules.get('apiGateway').middleware(),
      
      // Session management middleware
      sessionManager: this.modules.get('sessionManager').middleware(),
      
      // Audit logging middleware
      auditLogger: this.modules.get('auditManager').middleware(),
      
      // Threat detection middleware
      threatDetection: this.modules.get('threatDetection').middleware()
    };
  }

  /**
   * Get module instance
   */
  getModule(name) {
    return this.modules.get(name);
  }

  /**
   * Get security status
   */
  getSecurityStatus() {
    return {
      isInitialized: this.isInitialized,
      environment: this.config.environment,
      metrics: this.securityMetrics,
      modules: Array.from(this.modules.keys()),
      uptime: process.uptime()
    };
  }

  /**
   * Shutdown the security framework
   */
  async shutdown() {
    try {
      for (const [name, module] of this.modules) {
        if (typeof module.shutdown === 'function') {
          await module.shutdown();
        }
      }
      
      this.isInitialized = false;
      this.emit('shutdown', { timestamp: new Date().toISOString() });
    } catch (error) {
      this.emit('error', {
        type: 'SHUTDOWN_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
}

module.exports = { SecurityFramework };
