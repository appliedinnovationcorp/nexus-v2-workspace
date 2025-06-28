/**
 * Complete Compliance Management Integration Example
 * Demonstrates full implementation with AIC Website Next.js application
 * Production-ready configuration with all compliance components
 */

const { ComplianceManager } = require('../core/compliance-manager');

// ============================================================================
// CONFIGURATION
// ============================================================================

const complianceConfig = {
  // Core compliance settings
  enabled: true,
  strictMode: true,
  autoRemediation: true,

  // Supported regulations
  regulations: {
    gdpr: {
      enabled: true,
      jurisdiction: 'EU',
      dataRetention: {
        defaultPeriod: 63072000000, // 2 years
        consentBased: 31536000000, // 1 year
        contractBased: 189216000000, // 6 years
        legalObligation: 220752000000 // 7 years
      },
      dataSubjectRights: {
        access: { enabled: true, responseTime: 2592000000 }, // 30 days
        rectification: { enabled: true, responseTime: 2592000000 },
        erasure: { enabled: true, responseTime: 2592000000 },
        restriction: { enabled: true, responseTime: 2592000000 },
        portability: { enabled: true, responseTime: 2592000000 },
        objection: { enabled: true, responseTime: 2592000000 }
      }
    },
    
    ccpa: {
      enabled: true,
      jurisdiction: 'CA-US',
      consumerRights: {
        know: { enabled: true, responseTime: 1296000000 }, // 15 days
        delete: { enabled: true, responseTime: 1296000000 },
        optOut: { enabled: true, responseTime: 432000000 }, // 5 days
        nonDiscrimination: { enabled: true }
      },
      businessThresholds: {
        annualRevenue: 25000000, // $25M
        consumerRecords: 50000, // 50K consumers
        personalInfoRevenue: 0.5 // 50% of revenue
      }
    },
    
    sox: {
      enabled: true,
      jurisdiction: 'US',
      sections: {
        section302: { enabled: true }, // CEO/CFO certifications
        section404: { enabled: true }, // Internal controls
        section409: { enabled: true }  // Real-time disclosure
      },
      financialControls: {
        journalEntries: { enabled: true, approval: true, segregation: true },
        monthEndClose: { enabled: true, review: true, documentation: true },
        financialStatements: { enabled: true, review: true, certification: true },
        disclosures: { enabled: true, review: true, approval: true }
      }
    },
    
    pciDss: {
      enabled: false, // Enable if processing payments
      jurisdiction: 'GLOBAL',
      level: 'LEVEL_4', // Based on transaction volume
      requirements: {
        firewall: true,
        defaultPasswords: true,
        cardholderData: true,
        encryptedTransmission: true,
        antivirus: true,
        secureCode: true,
        accessControl: true,
        uniqueIds: true,
        physicalAccess: true,
        networkMonitoring: true,
        regularTesting: true,
        informationSecurity: true
      }
    },
    
    hipaa: {
      enabled: false, // Enable if handling health data
      jurisdiction: 'US',
      safeguards: {
        administrative: true,
        physical: true,
        technical: true
      }
    }
  },

  // Data retention policies
  dataRetention: {
    defaultPeriod: 2592000000, // 30 days
    gdprMaxPeriod: 63072000000, // 2 years
    auditLogPeriod: 220752000000, // 7 years
    financialDataPeriod: 220752000000 // 7 years
  },

  // Compliance monitoring
  monitoring: {
    scanInterval: 3600000, // 1 hour
    alertThreshold: 0.95, // 95% compliance required
    reportingInterval: 86400000 // Daily reports
  },

  // Audit settings
  audit: {
    enabled: true,
    detailedLogging: true,
    encryptLogs: true,
    logRetention: 220752000000, // 7 years
    evidenceCollection: true,
    integrityProtection: true
  }
};

// ============================================================================
// NEXT.JS INTEGRATION
// ============================================================================

// Compliance middleware for Next.js
const withCompliance = (handler, options = {}) => {
  return async (req, res) => {
    try {
      // Initialize compliance manager if not already done
      if (!global.complianceManager) {
        global.complianceManager = new ComplianceManager(complianceConfig);
        await global.complianceManager.init();
      }

      const complianceManager = global.complianceManager;

      // Extract request information
      const requestInfo = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        userId: req.user?.id || req.session?.userId,
        sessionId: req.session?.id,
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        timestamp: Date.now(),
        dataFields: options.dataFields || [],
        processingPurpose: options.processingPurpose || 'service_provision',
        dataType: options.dataType || 'general'
      };

      // Verify compliance
      const complianceResult = await complianceManager.verifyCompliance(requestInfo);

      if (!complianceResult.compliant) {
        // Log compliance violation
        await complianceManager.modules.audit.logComplianceEvent({
          level: 'WARN',
          action: 'COMPLIANCE_VIOLATION',
          userId: requestInfo.userId,
          details: {
            violations: complianceResult.violations,
            url: req.url,
            method: req.method
          },
          regulation: 'MULTIPLE'
        });

        return res.status(403).json({
          error: 'Compliance violation detected',
          violations: complianceResult.violations,
          timestamp: new Date().toISOString()
        });
      }

      // Add compliance context to request
      req.compliance = {
        verified: true,
        score: complianceResult.score,
        violations: complianceResult.violations,
        timestamp: Date.now()
      };

      // Log compliant access
      await complianceManager.modules.audit.logEvent({
        level: 'INFO',
        category: 'DATA_ACCESS',
        action: 'COMPLIANT_ACCESS',
        userId: requestInfo.userId,
        resource: req.url,
        details: {
          method: req.method,
          complianceScore: complianceResult.score
        }
      });

      // Call the original handler
      return handler(req, res);

    } catch (error) {
      console.error('❌ Compliance middleware error:', error);
      
      // Log error
      if (global.complianceManager) {
        await global.complianceManager.modules.audit.logEvent({
          level: 'ERROR',
          category: 'SYSTEM_ERROR',
          action: 'COMPLIANCE_MIDDLEWARE_ERROR',
          details: { error: error.message, url: req.url }
        });
      }

      return res.status(500).json({
        error: 'Compliance verification failed',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// ============================================================================
// API ROUTE EXAMPLES
// ============================================================================

// Protected user data API with GDPR compliance
const userDataHandler = withCompliance(async (req, res) => {
  const { method } = req;
  const userId = req.query.id;

  switch (method) {
    case 'GET':
      // Handle data access request (GDPR Article 15)
      const userData = await getUserData(userId);
      
      // Log data access
      await global.complianceManager.modules.audit.logEvent({
        level: 'INFO',
        category: 'DATA_ACCESS',
        action: 'USER_DATA_ACCESSED',
        userId: req.user?.id,
        resource: `user:${userId}`,
        details: { accessedFields: Object.keys(userData) }
      });

      res.json(userData);
      break;

    case 'PUT':
      // Handle data rectification (GDPR Article 16)
      const updates = req.body;
      
      // Validate updates
      const validationResult = await validateDataUpdates(userId, updates);
      if (!validationResult.valid) {
        return res.status(400).json({ error: validationResult.reason });
      }

      // Apply updates
      await updateUserData(userId, updates);
      
      // Log data modification
      await global.complianceManager.modules.audit.logEvent({
        level: 'INFO',
        category: 'DATA_MODIFICATION',
        action: 'USER_DATA_UPDATED',
        userId: req.user?.id,
        resource: `user:${userId}`,
        details: { updatedFields: Object.keys(updates) }
      });

      res.json({ success: true, message: 'Data updated successfully' });
      break;

    case 'DELETE':
      // Handle data erasure (GDPR Article 17)
      const erasureResult = await global.complianceManager.handlePrivacyRequest({
        type: 'ERASURE',
        userId,
        email: req.user?.email,
        jurisdiction: 'EU'
      });

      res.json(erasureResult);
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}, {
  dataFields: ['name', 'email', 'phone', 'address'],
  processingPurpose: 'user_account_management',
  dataType: 'personal_data'
});

// Privacy request handling API
const privacyRequestHandler = withCompliance(async (req, res) => {
  const { type, userId, email, details } = req.body;

  try {
    // Handle privacy request based on applicable regulation
    let result;
    
    if (isEUResident(email)) {
      // Handle GDPR request
      result = await global.complianceManager.modules.gdpr.handleDataSubjectRequest({
        type,
        userId,
        email,
        details
      });
    } else if (isCaliforniaResident(email)) {
      // Handle CCPA request
      result = await global.complianceManager.modules.ccpa.handleConsumerRequest({
        type,
        consumerId: userId,
        email,
        verificationData: details
      });
    } else {
      // Handle general privacy request
      result = await global.complianceManager.handlePrivacyRequest({
        type,
        userId,
        email,
        jurisdiction: 'US'
      });
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Privacy request handling failed:', error);
    res.status(500).json({
      error: 'Privacy request processing failed',
      requestId: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    });
  }
}, {
  processingPurpose: 'privacy_rights_fulfillment',
  dataType: 'privacy_request'
});

// Consent management API
const consentHandler = withCompliance(async (req, res) => {
  const { method } = req;
  const userId = req.user?.id;

  switch (method) {
    case 'GET':
      // Get current consent status
      const consentStatus = await getConsentStatus(userId);
      res.json(consentStatus);
      break;

    case 'POST':
      // Record new consent
      const consentData = req.body;
      
      const consentRecord = await global.complianceManager.manageConsent(userId, {
        ...consentData,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        method: 'web_form'
      });

      res.json(consentRecord);
      break;

    case 'DELETE':
      // Withdraw consent
      await withdrawConsent(userId);
      
      // Log consent withdrawal
      await global.complianceManager.modules.audit.logComplianceEvent({
        level: 'INFO',
        action: 'CONSENT_WITHDRAWN',
        userId,
        regulation: 'GDPR',
        details: { withdrawnAt: Date.now() }
      });

      res.json({ success: true, message: 'Consent withdrawn successfully' });
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}, {
  processingPurpose: 'consent_management',
  dataType: 'consent_data'
});

// ============================================================================
// COMPLIANCE DASHBOARD API
// ============================================================================

const complianceDashboardHandler = withCompliance(async (req, res) => {
  try {
    const dashboard = {
      timestamp: Date.now(),
      overallStatus: {},
      regulations: {},
      recentViolations: [],
      metrics: {},
      recommendations: []
    };

    // Get overall compliance status
    dashboard.overallStatus = global.complianceManager.getComplianceStatus();

    // Get regulation-specific status
    for (const [regulation, config] of Object.entries(complianceConfig.regulations)) {
      if (config.enabled && global.complianceManager.modules[regulation]) {
        dashboard.regulations[regulation.toUpperCase()] = 
          await global.complianceManager.modules[regulation].healthCheck();
      }
    }

    // Get recent violations
    dashboard.recentViolations = global.complianceManager.getViolations(10);

    // Get metrics
    dashboard.metrics = global.complianceManager.metrics;

    // Generate recommendations
    dashboard.recommendations = await generateComplianceRecommendations(dashboard);

    res.json(dashboard);

  } catch (error) {
    console.error('❌ Compliance dashboard error:', error);
    res.status(500).json({
      error: 'Failed to load compliance dashboard',
      timestamp: new Date().toISOString()
    });
  }
}, {
  processingPurpose: 'compliance_monitoring',
  dataType: 'compliance_data'
});

// ============================================================================
// COMPLIANCE REPORTING API
// ============================================================================

const complianceReportHandler = withCompliance(async (req, res) => {
  const { period, format, regulations } = req.query;

  try {
    // Generate compliance report
    const report = await global.complianceManager.generateComplianceReport(period);

    // Filter by specific regulations if requested
    if (regulations) {
      const requestedRegulations = regulations.split(',');
      report.regulations = Object.keys(report.regulations)
        .filter(key => requestedRegulations.includes(key.toLowerCase()))
        .reduce((obj, key) => {
          obj[key] = report.regulations[key];
          return obj;
        }, {});
    }

    // Format response based on requested format
    switch (format?.toLowerCase()) {
      case 'pdf':
        const pdfBuffer = await generatePDFReport(report);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${period}.pdf"`);
        res.send(pdfBuffer);
        break;

      case 'csv':
        const csvData = await convertReportToCSV(report);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="compliance-report-${period}.csv"`);
        res.send(csvData);
        break;

      case 'json':
      default:
        res.json(report);
        break;
    }

  } catch (error) {
    console.error('❌ Compliance report generation failed:', error);
    res.status(500).json({
      error: 'Failed to generate compliance report',
      timestamp: new Date().toISOString()
    });
  }
}, {
  processingPurpose: 'compliance_reporting',
  dataType: 'compliance_report'
});

// ============================================================================
// REACT COMPONENT INTEGRATION
// ============================================================================

// Privacy notice component with consent management
const PrivacyNotice = ({ userId, onConsentChange }) => {
  const [consentStatus, setConsentStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchConsentStatus();
  }, [userId]);

  const fetchConsentStatus = async () => {
    try {
      const response = await fetch('/api/consent');
      const status = await response.json();
      setConsentStatus(status);
    } catch (error) {
      console.error('Failed to fetch consent status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = async (purposes, granted) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purposes,
          granted,
          version: '1.0'
        })
      });

      const result = await response.json();
      setConsentStatus(result);
      
      if (onConsentChange) {
        onConsentChange(result);
      }
      
    } catch (error) {
      console.error('Failed to update consent:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return React.createElement('div', { className: 'privacy-notice loading' }, 'Loading privacy settings...');
  }

  return React.createElement('div', { className: 'privacy-notice' },
    React.createElement('h3', null, 'Privacy & Data Processing'),
    React.createElement('p', null, 'We process your personal data for the following purposes:'),
    React.createElement('div', { className: 'consent-options' },
      ['marketing', 'analytics', 'personalization'].map(purpose =>
        React.createElement('label', { key: purpose, className: 'consent-option' },
          React.createElement('input', {
            type: 'checkbox',
            checked: consentStatus?.purposes?.includes(purpose) || false,
            onChange: (e) => {
              const purposes = consentStatus?.purposes || [];
              const newPurposes = e.target.checked
                ? [...purposes, purpose]
                : purposes.filter(p => p !== purpose);
              handleConsentChange(newPurposes, e.target.checked);
            }
          }),
          React.createElement('span', null, purpose.charAt(0).toUpperCase() + purpose.slice(1))
        )
      )
    ),
    React.createElement('div', { className: 'privacy-rights' },
      React.createElement('h4', null, 'Your Privacy Rights'),
      React.createElement('p', null, 'You have the right to access, rectify, erase, or port your data.'),
      React.createElement('button', {
        onClick: () => window.location.href = '/privacy/requests'
      }, 'Manage Your Data')
    )
  );
};

// Compliance status indicator component
const ComplianceStatusIndicator = () => {
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/compliance/dashboard');
        const data = await response.json();
        setStatus(data.overallStatus);
      } catch (error) {
        console.error('Failed to fetch compliance status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const getStatusColor = (score) => {
    if (score >= 0.95) return 'green';
    if (score >= 0.8) return 'yellow';
    return 'red';
  };

  return React.createElement('div', { 
    className: 'compliance-status',
    style: { 
      padding: '10px',
      border: `2px solid ${getStatusColor(status.overallScore)}`,
      borderRadius: '5px',
      margin: '10px 0'
    }
  },
    React.createElement('h4', null, 'Compliance Status'),
    React.createElement('div', null, `Overall Score: ${(status.overallScore * 100).toFixed(1)}%`),
    React.createElement('div', null, `Active Violations: ${status.activeViolations}`),
    React.createElement('div', null, `Last Scan: ${new Date(status.lastScanTime).toLocaleString()}`)
  );
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Helper functions for compliance checks
const isEUResident = (email) => {
  // Implement logic to determine if user is EU resident
  // This could check user profile, IP geolocation, etc.
  return false; // Simplified for example
};

const isCaliforniaResident = (email) => {
  // Implement logic to determine if user is California resident
  return false; // Simplified for example
};

const getUserData = async (userId) => {
  // Implement actual user data retrieval
  return {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    // ... other user data
  };
};

const updateUserData = async (userId, updates) => {
  // Implement actual user data update
  console.log(`Updating user ${userId} with:`, updates);
};

const validateDataUpdates = async (userId, updates) => {
  // Implement data validation logic
  return { valid: true };
};

const getConsentStatus = async (userId) => {
  // Implement consent status retrieval
  return {
    userId,
    purposes: ['marketing', 'analytics'],
    granted: true,
    timestamp: Date.now()
  };
};

const withdrawConsent = async (userId) => {
  // Implement consent withdrawal
  console.log(`Withdrawing consent for user ${userId}`);
};

const generateComplianceRecommendations = async (dashboard) => {
  const recommendations = [];
  
  if (dashboard.overallStatus.overallScore < 0.95) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Improve Overall Compliance Score',
      description: 'Address active violations to improve compliance score',
      action: 'Review and remediate active violations'
    });
  }
  
  if (dashboard.recentViolations.length > 5) {
    recommendations.push({
      priority: 'MEDIUM',
      title: 'High Violation Rate',
      description: 'Recent increase in compliance violations detected',
      action: 'Review processes and implement preventive measures'
    });
  }
  
  return recommendations;
};

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================

class ComplianceDeployment {
  constructor() {
    this.complianceManager = null;
  }

  async initialize() {
    console.log('🚀 Initializing AIC Compliance Management System...');
    
    try {
      // Initialize compliance manager
      this.complianceManager = new ComplianceManager(complianceConfig);
      await this.complianceManager.init();
      
      // Set global reference
      global.complianceManager = this.complianceManager;
      
      // Setup health checks
      this.setupHealthChecks();
      
      // Setup graceful shutdown
      this.setupGracefulShutdown();
      
      console.log('✅ AIC Compliance Management System initialized successfully');
      
      return {
        complianceManager: this.complianceManager,
        middleware: {
          withCompliance,
          userDataHandler,
          privacyRequestHandler,
          consentHandler,
          complianceDashboardHandler,
          complianceReportHandler
        },
        components: {
          PrivacyNotice,
          ComplianceStatusIndicator
        }
      };
      
    } catch (error) {
      console.error('❌ Failed to initialize Compliance Management System:', error);
      throw error;
    }
  }

  setupHealthChecks() {
    const healthCheck = async () => {
      const health = await this.complianceManager.healthCheck();
      return {
        status: health.status,
        timestamp: new Date().toISOString(),
        components: health.modules,
        metrics: health.metrics
      };
    };

    this.healthCheck = healthCheck;
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      console.log('🔄 Shutting down Compliance Management System...');
      
      try {
        await this.complianceManager.shutdown();
        console.log('✅ Compliance Management System shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Core components
  ComplianceDeployment,
  complianceConfig,
  
  // Middleware
  withCompliance,
  
  // API handlers
  userDataHandler,
  privacyRequestHandler,
  consentHandler,
  complianceDashboardHandler,
  complianceReportHandler,
  
  // React components
  PrivacyNotice,
  ComplianceStatusIndicator,
  
  // Utility functions
  isEUResident,
  isCaliforniaResident,
  generateComplianceRecommendations
};

// ============================================================================
// INITIALIZATION FOR DIRECT USAGE
// ============================================================================

if (require.main === module) {
  const deployment = new ComplianceDeployment();
  
  deployment.initialize()
    .then((system) => {
      console.log('🎉 AIC Compliance Management System is ready!');
      console.log('📊 System Status:', system.complianceManager.getComplianceStatus());
    })
    .catch((error) => {
      console.error('💥 Failed to start Compliance Management System:', error);
      process.exit(1);
    });
}
