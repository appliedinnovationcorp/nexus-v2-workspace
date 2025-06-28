/**
 * Complete Zero-Trust Security Integration Example
 * Demonstrates full implementation with AIC Website Next.js application
 * Production-ready configuration with all security components
 */

const { ZeroTrustManager } = require('../core/zero-trust-manager');
const { createNextJSWrapper, createExpressMiddleware } = require('../middleware/zero-trust-middleware');

// ============================================================================
// CONFIGURATION
// ============================================================================

const zeroTrustConfig = {
  // Core zero-trust settings
  strictMode: true,
  riskThreshold: 0.7,
  sessionTimeout: 3600000, // 1 hour
  deviceTrustExpiry: 86400000, // 24 hours

  // Identity management integration
  identity: {
    jwtSecret: process.env.JWT_SECRET,
    mfaRequired: true,
    maxConcurrentSessions: 3,
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true
    }
  },

  // Device trust configuration
  deviceTrust: {
    trustThreshold: 0.7,
    certificateValidity: 31536000000, // 1 year
    requiredCompliance: {
      osVersion: true,
      antivirus: true,
      firewall: true,
      encryption: true,
      screenLock: true
    }
  },

  // Network security settings
  networkSecurity: {
    allowedNetworks: process.env.ALLOWED_NETWORKS?.split(',') || [],
    blockedCountries: ['CN', 'RU', 'KP', 'IR'],
    rateLimits: {
      perIP: { requests: 100, window: 60000 },
      perUser: { requests: 1000, window: 60000 },
      global: { requests: 10000, window: 60000 }
    },
    ddosProtection: {
      enabled: true,
      threshold: 1000,
      blockDuration: 3600000
    }
  },

  // Data protection configuration
  dataProtection: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 86400000
    },
    classificationLevels: {
      public: { level: 0, encryption: false, retention: 2592000000 },
      internal: { level: 1, encryption: true, retention: 7776000000 },
      confidential: { level: 2, encryption: true, retention: 31536000000 },
      restricted: { level: 3, encryption: true, retention: 157680000000 }
    },
    dlpPolicies: {
      creditCard: {
        pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        action: 'block',
        severity: 'high'
      },
      ssn: {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        action: 'redact',
        severity: 'high'
      },
      email: {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        action: 'monitor',
        severity: 'medium'
      }
    }
  },

  // Behavior analytics settings
  behaviorAnalytics: {
    learningPeriod: 604800000, // 7 days
    anomalyThreshold: 0.8,
    behaviorFactors: {
      loginTimes: { weight: 0.2, enabled: true },
      locations: { weight: 0.25, enabled: true },
      devices: { weight: 0.2, enabled: true },
      applications: { weight: 0.15, enabled: true },
      dataAccess: { weight: 0.1, enabled: true },
      networkActivity: { weight: 0.1, enabled: true }
    }
  },

  // Risk engine configuration
  riskEngine: {
    riskFactors: {
      identity: { weight: 0.25, enabled: true },
      device: { weight: 0.20, enabled: true },
      network: { weight: 0.15, enabled: true },
      behavior: { weight: 0.25, enabled: true },
      context: { weight: 0.15, enabled: true }
    },
    riskThresholds: {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.95
    },
    adaptiveControls: {
      enabled: true,
      lowRisk: {
        mfaRequired: false,
        sessionTimeout: 28800000,
        permissions: 'normal'
      },
      mediumRisk: {
        mfaRequired: true,
        sessionTimeout: 14400000,
        permissions: 'limited'
      },
      highRisk: {
        mfaRequired: true,
        sessionTimeout: 3600000,
        permissions: 'restricted',
        additionalVerification: true
      },
      criticalRisk: {
        mfaRequired: true,
        sessionTimeout: 900000,
        permissions: 'minimal',
        additionalVerification: true,
        adminNotification: true
      }
    }
  }
};

// Middleware configuration
const middlewareConfig = {
  enabled: true,
  bypassRoutes: ['/health', '/public', '/api/health', '/_next'],
  enforceRoutes: ['/api', '/admin', '/dashboard'],
  routeSecurityLevels: {
    '/api/admin/*': 'high',
    '/api/users/*': 'medium',
    '/api/data/*': 'high',
    '/api/financial/*': 'critical',
    '/admin/*': 'high',
    '/dashboard/*': 'medium',
    '/api/public/*': 'low'
  },
  blockOnFailure: true,
  includeSecurityHeaders: true,
  cacheVerifications: true,
  cacheTimeout: 300000,
  zeroTrust: zeroTrustConfig
};

// ============================================================================
// NEXT.JS INTEGRATION
// ============================================================================

// Create zero-trust wrapper for Next.js API routes
const withZeroTrust = createNextJSWrapper(middlewareConfig);

// Example API route with zero-trust protection
const protectedApiHandler = withZeroTrust(async (req, res) => {
  // Access zero-trust context
  const { verified, riskScore, verification } = req.zeroTrust;
  
  console.log(`Request verified: ${verified}, Risk score: ${riskScore}`);
  
  // Your API logic here
  res.status(200).json({
    message: 'Access granted',
    riskScore,
    timestamp: new Date().toISOString(),
    user: req.user
  });
});

// High-security API route
const adminApiHandler = withZeroTrust(async (req, res) => {
  // Additional security checks for admin routes
  if (req.zeroTrust.riskScore > 0.5) {
    return res.status(403).json({
      error: 'Risk score too high for admin access',
      riskScore: req.zeroTrust.riskScore
    });
  }

  // Admin API logic
  res.status(200).json({
    message: 'Admin access granted',
    adminLevel: true,
    riskScore: req.zeroTrust.riskScore
  });
}, { securityLevel: 'high' });

// ============================================================================
// EXPRESS.JS INTEGRATION
// ============================================================================

const express = require('express');
const app = express();

// Apply zero-trust middleware globally
const zeroTrustMiddleware = createExpressMiddleware(middlewareConfig);
app.use(zeroTrustMiddleware);

// Protected routes
app.get('/api/protected', (req, res) => {
  res.json({
    message: 'Protected resource accessed',
    zeroTrust: req.zeroTrust
  });
});

app.get('/api/admin/users', (req, res) => {
  // High-security route
  if (req.zeroTrust.riskScore > 0.3) {
    return res.status(403).json({
      error: 'Insufficient security level for admin access'
    });
  }
  
  res.json({
    users: [], // Your user data
    securityContext: req.zeroTrust
  });
});

// ============================================================================
// REACT COMPONENT INTEGRATION
// ============================================================================

const React = require('react');
const { createReactWrapper } = require('../middleware/zero-trust-middleware');

// Create zero-trust wrapper for React components
const withClientZeroTrust = createReactWrapper(middlewareConfig);

// Protected React component
const AdminDashboard = ({ zeroTrust }) => {
  if (zeroTrust.riskScore > 0.5) {
    return React.createElement('div', { className: 'security-warning' },
      `High risk detected (${zeroTrust.riskScore}). Additional verification required.`
    );
  }

  return React.createElement('div', { className: 'admin-dashboard' },
    React.createElement('h1', null, 'Admin Dashboard'),
    React.createElement('p', null, `Security Level: ${zeroTrust.riskScore < 0.3 ? 'High' : 'Medium'}`),
    React.createElement('div', { className: 'dashboard-content' },
      'Dashboard content here...'
    )
  );
};

// Wrap component with zero-trust protection
const ProtectedAdminDashboard = withClientZeroTrust(AdminDashboard, {
  securityLevel: 'high',
  requireMFA: true
});

// ============================================================================
// CUSTOM SECURITY POLICIES
// ============================================================================

class AICSecurityPolicies {
  constructor(zeroTrustManager) {
    this.zeroTrustManager = zeroTrustManager;
    this.setupCustomPolicies();
  }

  setupCustomPolicies() {
    // Custom policy for financial data access
    this.zeroTrustManager.on('accessRequest', async (request) => {
      if (request.resource === 'financial' && request.action === 'read') {
        await this.enforceFinancialDataPolicy(request);
      }
    });

    // Custom policy for admin actions
    this.zeroTrustManager.on('adminAction', async (request) => {
      await this.enforceAdminActionPolicy(request);
    });

    // Custom anomaly response
    this.zeroTrustManager.on('anomalyDetected', async (anomaly) => {
      await this.handleCustomAnomaly(anomaly);
    });
  }

  async enforceFinancialDataPolicy(request) {
    // Require MFA for financial data access
    if (!request.mfaVerified) {
      throw new Error('MFA required for financial data access');
    }

    // Require manager-level access
    if (!request.user.roles.includes('manager') && !request.user.roles.includes('admin')) {
      throw new Error('Manager-level access required for financial data');
    }

    // Log financial data access
    console.log(`Financial data accessed by ${request.user.id} at ${new Date().toISOString()}`);
  }

  async enforceAdminActionPolicy(request) {
    // Require high trust score for admin actions
    if (request.riskScore > 0.2) {
      throw new Error('Risk score too high for admin actions');
    }

    // Require recent authentication
    if (Date.now() - request.lastAuth > 1800000) { // 30 minutes
      throw new Error('Recent authentication required for admin actions');
    }

    // Notify security team of admin actions
    await this.notifySecurityTeam({
      type: 'admin_action',
      user: request.user.id,
      action: request.action,
      timestamp: Date.now()
    });
  }

  async handleCustomAnomaly(anomaly) {
    // Custom anomaly handling for AIC-specific threats
    if (anomaly.type === 'data_exfiltration') {
      // Immediate response for data exfiltration
      await this.zeroTrustManager.executeSecurityAction(anomaly.userId, 'terminate_sessions');
      await this.notifySecurityTeam({
        type: 'critical_anomaly',
        anomaly,
        response: 'sessions_terminated'
      });
    }
  }

  async notifySecurityTeam(notification) {
    // Integration with notification systems
    console.log('🚨 Security team notification:', notification);
    // Would integrate with Slack, email, SIEM, etc.
  }
}

// ============================================================================
// MONITORING AND ANALYTICS
// ============================================================================

class ZeroTrustMonitoring {
  constructor(zeroTrustManager) {
    this.zeroTrustManager = zeroTrustManager;
    this.metrics = {
      requests: 0,
      blocked: 0,
      anomalies: 0,
      riskScores: []
    };

    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor security events
    this.zeroTrustManager.on('securityEvent', (event) => {
      this.recordSecurityEvent(event);
    });

    // Monitor risk assessments
    this.zeroTrustManager.on('riskAssessment', (assessment) => {
      this.recordRiskAssessment(assessment);
    });

    // Generate periodic reports
    setInterval(() => this.generateSecurityReport(), 3600000); // Hourly
  }

  recordSecurityEvent(event) {
    this.metrics.requests++;
    
    if (event.type === 'access_denied') {
      this.metrics.blocked++;
    }
    
    if (event.type === 'anomaly_detected') {
      this.metrics.anomalies++;
    }

    // Send to monitoring systems
    this.sendToMonitoring(event);
  }

  recordRiskAssessment(assessment) {
    this.metrics.riskScores.push({
      score: assessment.riskScore,
      timestamp: assessment.timestamp
    });

    // Keep only recent scores
    if (this.metrics.riskScores.length > 1000) {
      this.metrics.riskScores = this.metrics.riskScores.slice(-500);
    }
  }

  generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      averageRiskScore: this.calculateAverageRiskScore(),
      securityHealth: this.assessSecurityHealth()
    };

    console.log('📊 Security Report:', report);
    
    // Send to dashboards, SIEM, etc.
    this.sendToAnalytics(report);
  }

  calculateAverageRiskScore() {
    if (this.metrics.riskScores.length === 0) return 0;
    
    const sum = this.metrics.riskScores.reduce((acc, score) => acc + score.score, 0);
    return sum / this.metrics.riskScores.length;
  }

  assessSecurityHealth() {
    const blockRate = this.metrics.blocked / Math.max(this.metrics.requests, 1);
    const anomalyRate = this.metrics.anomalies / Math.max(this.metrics.requests, 1);
    const avgRiskScore = this.calculateAverageRiskScore();

    if (blockRate > 0.1 || anomalyRate > 0.05 || avgRiskScore > 0.7) {
      return 'degraded';
    } else if (blockRate > 0.05 || anomalyRate > 0.02 || avgRiskScore > 0.5) {
      return 'warning';
    } else {
      return 'healthy';
    }
  }

  sendToMonitoring(event) {
    // Integration with monitoring systems (Prometheus, DataDog, etc.)
    console.log('📈 Monitoring event:', event.type);
  }

  sendToAnalytics(report) {
    // Integration with analytics platforms
    console.log('📊 Analytics report generated');
  }
}

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================

class ZeroTrustDeployment {
  constructor() {
    this.zeroTrustManager = new ZeroTrustManager(zeroTrustConfig);
    this.securityPolicies = new AICSecurityPolicies(this.zeroTrustManager);
    this.monitoring = new ZeroTrustMonitoring(this.zeroTrustManager);
  }

  async initialize() {
    console.log('🚀 Initializing AIC Zero-Trust Security System...');
    
    try {
      // Initialize core components
      await this.zeroTrustManager.init();
      
      // Setup health checks
      this.setupHealthChecks();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('✅ AIC Zero-Trust Security System initialized successfully');
      
      return {
        zeroTrustManager: this.zeroTrustManager,
        middleware: {
          nextjs: withZeroTrust,
          express: zeroTrustMiddleware,
          react: withClientZeroTrust
        },
        monitoring: this.monitoring
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize Zero-Trust Security System:', error);
      throw error;
    }
  }

  setupHealthChecks() {
    // Health check endpoint
    const healthCheck = async () => {
      const health = await this.zeroTrustManager.performSecurityHealthCheck();
      return {
        status: health.overall,
        timestamp: new Date().toISOString(),
        components: health.components,
        metrics: this.monitoring.metrics
      };
    };

    // Expose health check
    this.healthCheck = healthCheck;
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('🔄 Shutting down Zero-Trust Security System...');
      
      try {
        await this.zeroTrustManager.shutdown();
        console.log('✅ Zero-Trust Security System shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }

  // Production deployment helpers
  static async deployToProduction(config = {}) {
    const deployment = new ZeroTrustDeployment();
    
    // Override config for production
    const productionConfig = {
      ...zeroTrustConfig,
      strictMode: true,
      riskThreshold: 0.6, // Slightly more permissive for production
      ...config
    };
    
    deployment.zeroTrustManager.updateConfig(productionConfig);
    
    return await deployment.initialize();
  }

  static async deployToStaging(config = {}) {
    const deployment = new ZeroTrustDeployment();
    
    // Override config for staging
    const stagingConfig = {
      ...zeroTrustConfig,
      strictMode: false,
      riskThreshold: 0.8, // More permissive for testing
      ...config
    };
    
    deployment.zeroTrustManager.updateConfig(stagingConfig);
    
    return await deployment.initialize();
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

// Example 1: Next.js API Route
/*
// pages/api/protected.js
const { withZeroTrust } = require('../../zero-trust-security/examples/complete-integration');

export default withZeroTrust(async (req, res) => {
  // Your protected API logic
  res.json({ message: 'Protected data', riskScore: req.zeroTrust.riskScore });
});
*/

// Example 2: Express.js Application
/*
const express = require('express');
const { createExpressMiddleware } = require('./zero-trust-security/middleware/zero-trust-middleware');

const app = express();
app.use(createExpressMiddleware(middlewareConfig));

app.get('/protected', (req, res) => {
  res.json({ protected: true, zeroTrust: req.zeroTrust });
});
*/

// Example 3: React Component
/*
import { withClientZeroTrust } from '../zero-trust-security/middleware/zero-trust-middleware';

const AdminPanel = ({ zeroTrust }) => (
  <div>
    <h1>Admin Panel</h1>
    <p>Risk Score: {zeroTrust.riskScore}</p>
  </div>
);

export default withClientZeroTrust(AdminPanel, { securityLevel: 'high' });
*/

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core components
  ZeroTrustDeployment,
  AICSecurityPolicies,
  ZeroTrustMonitoring,
  
  // Configuration
  zeroTrustConfig,
  middlewareConfig,
  
  // Middleware functions
  withZeroTrust,
  protectedApiHandler,
  adminApiHandler,
  
  // Deployment helpers
  deployToProduction: ZeroTrustDeployment.deployToProduction,
  deployToStaging: ZeroTrustDeployment.deployToStaging,
  
  // React components
  ProtectedAdminDashboard
};

// ============================================================================
// INITIALIZATION FOR DIRECT USAGE
// ============================================================================

if (require.main === module) {
  // Direct execution - initialize the system
  const deployment = new ZeroTrustDeployment();
  
  deployment.initialize()
    .then((system) => {
      console.log('🎉 AIC Zero-Trust Security System is ready!');
      console.log('📊 System Status:', system.monitoring.metrics);
    })
    .catch((error) => {
      console.error('💥 Failed to start Zero-Trust Security System:', error);
      process.exit(1);
    });
}
