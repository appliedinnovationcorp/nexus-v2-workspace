/**
 * Complete Implementation Example - Advanced Security Framework
 * Demonstrates how to integrate all security modules in a production application
 */

const express = require('express');
const { SecurityFramework } = require('../core/security-framework');

class SecureApplication {
  constructor() {
    this.app = express();
    this.securityFramework = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the secure application
   */
  async initialize() {
    try {
      console.log('🔐 Initializing Advanced Security Framework...');
      
      // Initialize security framework with comprehensive configuration
      this.securityFramework = new SecurityFramework({
        environment: process.env.NODE_ENV || 'development',
        enableAllModules: true,
        auditLevel: 'comprehensive',
        encryptionLevel: 'high',
        threatDetectionLevel: 'advanced',
        complianceStandards: ['OWASP', 'NIST', 'GDPR', 'SOX', 'HIPAA'],
        
        // Authentication configuration
        authentication: {
          jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
          jwtExpiresIn: '15m',
          refreshTokenExpiresIn: '7d',
          mfaRequired: process.env.NODE_ENV === 'production',
          passwordPolicy: {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            preventReuse: 5,
            maxAge: 90
          }
        },
        
        // Authorization configuration
        authorization: {
          enableRBAC: true,
          enableABAC: true,
          enableResourcePermissions: true,
          enableTemporaryAccess: true,
          defaultDenyAll: true,
          cachePermissions: true
        },
        
        // Encryption configuration
        encryption: {
          algorithm: 'aes-256-gcm',
          keyRotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
          enableKeyRotation: true,
          enableHSM: process.env.NODE_ENV === 'production'
        },
        
        // Threat detection configuration
        threatDetection: {
          enableBehavioralAnalysis: true,
          enableAnomalyDetection: true,
          enableMLThreatDetection: true,
          enableRealTimeMonitoring: true,
          enableAutomatedResponse: true,
          threatScoreThreshold: 75
        },
        
        // Session management configuration
        sessionManager: {
          sessionTimeout: 30 * 60 * 1000, // 30 minutes
          absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
          maxConcurrentSessions: 3,
          enableSessionRotation: true,
          enableDeviceTracking: true,
          enableSecureCookies: true
        },
        
        // Rate limiting configuration
        rateLimiting: {
          defaultWindowMs: 60000,
          defaultMaxRequests: 100,
          enableAdaptiveRateLimit: true
        },
        
        // CSRF protection configuration
        csrfProtection: {
          enableDoubleSubmitCookie: true,
          enableSynchronizerToken: true,
          enableOriginValidation: true,
          trustedOrigins: process.env.TRUSTED_ORIGINS?.split(',') || []
        },
        
        // XSS protection configuration
        xssProtection: {
          enableInputSanitization: true,
          enableOutputEncoding: true,
          enableCSPHeaders: true,
          strictMode: process.env.NODE_ENV === 'production'
        },
        
        // API security configuration
        apiSecurity: {
          enableRequestValidation: true,
          enableSchemaValidation: true,
          enableThreatDetection: true,
          maxRequestSize: 10 * 1024 * 1024 // 10MB
        },
        
        // Data privacy configuration
        dataPrivacy: {
          enableDataClassification: true,
          enableDataMasking: true,
          enableConsentManagement: true,
          enableDataRetention: true,
          enableRightToErasure: true
        },
        
        // Compliance configuration
        compliance: {
          enabledStandards: ['GDPR', 'SOX', 'HIPAA', 'PCI-DSS'],
          enableAutomatedReporting: true,
          enableRealTimeMonitoring: true,
          reportingSchedule: 'monthly'
        },
        
        // Audit configuration
        audit: {
          logLevel: 'info',
          enableFileLogging: true,
          enableDatabaseLogging: process.env.NODE_ENV === 'production',
          enableRemoteLogging: process.env.NODE_ENV === 'production',
          enableEncryption: true,
          enableIntegrityCheck: true,
          enableRealTimeAlerts: true
        },
        
        // Security monitoring configuration
        securityMonitor: {
          enableRealTimeMonitoring: true,
          enableAlertAggregation: true,
          enableAutomatedResponse: true,
          webhookUrl: process.env.SECURITY_WEBHOOK_URL,
          notificationChannels: ['email', 'webhook']
        }
      });

      // Initialize the security framework
      await this.securityFramework.initialize();
      
      // Setup security event listeners
      this.setupSecurityEventListeners();
      
      // Configure Express middleware
      this.configureMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      this.isInitialized = true;
      console.log('✅ Advanced Security Framework initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize security framework:', error);
      throw error;
    }
  }

  /**
   * Setup security event listeners
   */
  setupSecurityEventListeners() {
    const framework = this.securityFramework;
    
    // Authentication events
    framework.on('authSuccess', (data) => {
      console.log(`✅ Authentication successful for user: ${data.username}`);
    });
    
    framework.on('authFailure', (data) => {
      console.log(`❌ Authentication failed for user: ${data.username} - ${data.reason}`);
    });
    
    // Authorization events
    framework.on('authzFailure', (data) => {
      console.log(`🚫 Authorization failed for user: ${data.subject} - Permission: ${data.permission}`);
    });
    
    // Threat detection events
    framework.on('threatDetected', (threat) => {
      console.log(`🚨 THREAT DETECTED: ${threat.pattern} - Score: ${threat.score || 'N/A'}`);
      
      // Handle critical threats immediately
      if (threat.severity === 'critical') {
        this.handleCriticalThreat(threat);
      }
    });
    
    // Security alerts
    framework.on('securityAlert', (alert) => {
      console.log(`🔔 Security Alert: ${alert.ruleName} - Severity: ${alert.severity}`);
      
      // Send to monitoring system
      this.sendToMonitoringSystem(alert);
    });
    
    // Compliance violations
    framework.on('complianceAlert', (violation) => {
      console.log(`⚠️ Compliance Violation: ${violation.standard} - ${violation.description}`);
    });
    
    // Health check events
    framework.on('healthCheck', (status) => {
      if (status.overall !== 'healthy') {
        console.log(`⚠️ Security framework health check failed: ${JSON.stringify(status)}`);
      }
    });
  }

  /**
   * Configure Express middleware with security layers
   */
  configureMiddleware() {
    const middleware = this.securityFramework.getMiddleware();
    
    // Basic Express middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Security middleware stack (order is important)
    this.app.use(middleware.threatDetection);     // 1. Threat detection first
    this.app.use(middleware.rateLimit());         // 2. Rate limiting
    this.app.use(middleware.xssProtection);       // 3. XSS protection
    this.app.use(middleware.csrfProtection);      // 4. CSRF protection
    this.app.use(middleware.apiSecurity);         // 5. API security validation
    this.app.use(middleware.sessionManager);      // 6. Session management
    this.app.use(middleware.auditLogger);         // 7. Audit logging
    
    // Custom security headers
    this.app.use((req, res, next) => {
      res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
      });
      next();
    });
  }

  /**
   * Setup application routes with security controls
   */
  setupRoutes() {
    const middleware = this.securityFramework.getMiddleware();
    
    // Public routes (no authentication required)
    this.app.get('/health', this.handleHealthCheck.bind(this));
    this.app.get('/api/public/info', this.handlePublicInfo.bind(this));
    
    // Authentication routes
    this.app.post('/api/auth/register', this.handleRegister.bind(this));
    this.app.post('/api/auth/login', this.handleLogin.bind(this));
    this.app.post('/api/auth/logout', middleware.authenticate, this.handleLogout.bind(this));
    this.app.post('/api/auth/refresh', this.handleRefreshToken.bind(this));
    
    // MFA routes
    this.app.post('/api/auth/mfa/setup', middleware.authenticate, this.handleMFASetup.bind(this));
    this.app.post('/api/auth/mfa/verify', middleware.authenticate, this.handleMFAVerify.bind(this));
    
    // Protected user routes
    this.app.get('/api/user/profile', 
      middleware.authenticate, 
      middleware.authorize(['user:profile:read']),
      this.handleGetProfile.bind(this)
    );
    
    this.app.put('/api/user/profile', 
      middleware.authenticate, 
      middleware.authorize(['user:profile:update']),
      this.handleUpdateProfile.bind(this)
    );
    
    // Admin routes
    this.app.get('/api/admin/users', 
      middleware.authenticate, 
      middleware.authorize(['admin']),
      this.handleGetUsers.bind(this)
    );
    
    this.app.get('/api/admin/security/dashboard', 
      middleware.authenticate, 
      middleware.authorize(['security:monitor']),
      this.handleSecurityDashboard.bind(this)
    );
    
    // Data privacy routes
    this.app.post('/api/privacy/request', this.handlePrivacyRequest.bind(this));
    this.app.post('/api/privacy/consent', this.handleConsentUpdate.bind(this));
    
    // Compliance routes
    this.app.get('/api/compliance/report/:standard', 
      middleware.authenticate, 
      middleware.authorize(['compliance:read']),
      this.handleComplianceReport.bind(this)
    );
  }

  /**
   * Route handlers
   */
  async handleHealthCheck(req, res) {
    try {
      const healthStatus = await this.securityFramework.performHealthCheck();
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        security: healthStatus
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  async handlePublicInfo(req, res) {
    res.json({
      name: 'Secure Application',
      version: '1.0.0',
      security: {
        framework: 'Advanced Security Framework',
        standards: ['OWASP', 'NIST', 'GDPR', 'SOX', 'HIPAA']
      }
    });
  }

  async handleRegister(req, res) {
    try {
      const authManager = this.securityFramework.getModule('authentication');
      const { username, email, password } = req.body;
      
      // Register user (would integrate with your user management system)
      const user = await this.createUser({ username, email, password });
      
      res.json({
        success: true,
        message: 'User registered successfully',
        userId: user.id
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleLogin(req, res) {
    try {
      const authManager = this.securityFramework.getModule('authentication');
      const { username, password, mfaToken } = req.body;
      
      const result = await authManager.authenticate({
        username,
        password,
        mfaToken,
        clientInfo: {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip
        }
      });
      
      res.json({
        success: true,
        user: result.user,
        tokens: result.tokens,
        session: result.session
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleLogout(req, res) {
    try {
      const authManager = this.securityFramework.getModule('authentication');
      const sessionId = req.session?.id;
      const refreshToken = req.body.refreshToken;
      
      await authManager.logout(sessionId, refreshToken);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleMFASetup(req, res) {
    try {
      const authManager = this.securityFramework.getModule('authentication');
      const userId = req.user.sub;
      
      const mfaSetup = await authManager.setupMFA(userId);
      
      res.json({
        success: true,
        qrCode: mfaSetup.qrCode,
        secret: mfaSetup.secret
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleGetProfile(req, res) {
    try {
      const userId = req.user.sub;
      const dataPrivacy = this.securityFramework.getModule('dataPrivacy');
      
      // Get user profile (would query your database)
      const profile = await this.getUserProfile(userId);
      
      // Classify and mask sensitive data
      const classifiedData = dataPrivacy.classifyData(profile);
      const maskedProfile = dataPrivacy.maskData(profile, classifiedData.classification);
      
      res.json({
        success: true,
        profile: maskedProfile
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleSecurityDashboard(req, res) {
    try {
      const securityMonitor = this.securityFramework.getModule('securityMonitor');
      const dashboardData = securityMonitor.getDashboardData();
      
      res.json({
        success: true,
        dashboard: dashboardData
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async handlePrivacyRequest(req, res) {
    try {
      const dataPrivacy = this.securityFramework.getModule('dataPrivacy');
      const { type, email, data } = req.body;
      
      const request = await dataPrivacy.processPrivacyRequest({
        type,
        email,
        data,
        subjectId: req.body.subjectId
      });
      
      res.json({
        success: true,
        requestId: request.id,
        message: 'Privacy request submitted. Please check your email for verification.'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  async handleComplianceReport(req, res) {
    try {
      const complianceManager = this.securityFramework.getModule('complianceManager');
      const { standard } = req.params;
      
      const report = await complianceManager.generateComplianceReport(standard);
      
      res.json({
        success: true,
        report
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found',
        timestamp: new Date().toISOString()
      });
    });
    
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Application error:', error);
      
      // Log security-related errors
      if (error.type === 'security') {
        const auditManager = this.securityFramework.getModule('auditManager');
        auditManager.logEvent('SECURITY_ERROR', {
          error: error.message,
          path: req.path,
          method: req.method,
          userId: req.user?.sub,
          sourceIP: req.ip
        });
      }
      
      res.status(error.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Handle critical threats
   */
  async handleCriticalThreat(threat) {
    console.log(`🚨 CRITICAL THREAT DETECTED: ${JSON.stringify(threat)}`);
    
    // Implement immediate response actions
    if (threat.triggerEvent?.sourceIP) {
      // Block IP immediately
      console.log(`🚫 Blocking IP: ${threat.triggerEvent.sourceIP}`);
    }
    
    if (threat.triggerEvent?.userId) {
      // Suspend user account
      console.log(`🚫 Suspending user: ${threat.triggerEvent.userId}`);
    }
    
    // Send immediate alert to security team
    await this.sendCriticalAlert(threat);
  }

  /**
   * Send critical security alert
   */
  async sendCriticalAlert(threat) {
    // Implementation would send to your alerting system
    console.log('📧 Critical security alert sent to security team');
  }

  /**
   * Send to monitoring system
   */
  sendToMonitoringSystem(alert) {
    // Implementation would send to your monitoring system
    console.log('📊 Alert sent to monitoring system:', alert.ruleName);
  }

  /**
   * Mock user management methods (replace with your actual implementation)
   */
  async createUser(userData) {
    // Mock implementation
    return {
      id: 'user_' + Date.now(),
      username: userData.username,
      email: userData.email,
      createdAt: new Date().toISOString()
    };
  }

  async getUserProfile(userId) {
    // Mock implementation
    return {
      id: userId,
      username: 'john_doe',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '555-123-4567',
      address: '123 Main St, City, State 12345',
      dateOfBirth: '1990-01-01',
      ssn: '123-45-6789'
    };
  }

  /**
   * Start the secure application
   */
  async start(port = 3000) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this.app.listen(port, () => {
      console.log(`🚀 Secure application running on port ${port}`);
      console.log(`🔐 Security Framework Status: ${this.securityFramework.getSecurityStatus().isInitialized ? 'Active' : 'Inactive'}`);
    });
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('🛑 Shutting down secure application...');
    
    if (this.securityFramework) {
      await this.securityFramework.shutdown();
    }
    
    console.log('✅ Secure application shutdown complete');
  }
}

// Export for use
module.exports = { SecureApplication };

// Example usage
if (require.main === module) {
  const app = new SecureApplication();
  
  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    await app.shutdown();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    await app.shutdown();
    process.exit(0);
  });
  
  // Start the application
  app.start(process.env.PORT || 3000).catch(error => {
    console.error('Failed to start secure application:', error);
    process.exit(1);
  });
}
