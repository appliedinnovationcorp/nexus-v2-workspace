/**
 * Audit Manager - Advanced Security Framework
 * Comprehensive audit logging, compliance reporting, and forensic analysis
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class AuditManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      logLevel: config.logLevel || 'info',
      enableFileLogging: config.enableFileLogging !== false,
      enableDatabaseLogging: config.enableDatabaseLogging || false,
      enableRemoteLogging: config.enableRemoteLogging || false,
      logDirectory: config.logDirectory || './logs/audit',
      maxLogFileSize: config.maxLogFileSize || 100 * 1024 * 1024, // 100MB
      maxLogFiles: config.maxLogFiles || 10,
      retentionPeriod: config.retentionPeriod || 365 * 24 * 60 * 60 * 1000, // 1 year
      enableEncryption: config.enableEncryption || false,
      enableIntegrityCheck: config.enableIntegrityCheck !== false,
      enableRealTimeAlerts: config.enableRealTimeAlerts || false,
      complianceStandards: config.complianceStandards || ['GDPR', 'SOX', 'HIPAA'],
      ...config
    };
    
    this.auditLogs = [];
    this.logBuffer = [];
    this.currentLogFile = null;
    this.logFileSize = 0;
    this.integrityHashes = new Map();
    this.alertRules = new Map();
    
    this.initializeAlertRules();
  }

  /**
   * Initialize audit alert rules
   */
  initializeAlertRules() {
    const rules = [
      {
        id: 'admin_access',
        name: 'Administrative Access',
        condition: (event) => event.userRole === 'admin' || event.action?.includes('admin'),
        severity: 'high',
        notify: ['security-team@company.com']
      },
      {
        id: 'failed_auth_burst',
        name: 'Authentication Failure Burst',
        condition: (event) => event.eventType === 'AUTH_FAILURE',
        threshold: 5,
        window: 300000, // 5 minutes
        severity: 'critical',
        notify: ['security-team@company.com', 'soc@company.com']
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation',
        condition: (event) => event.eventType === 'PRIVILEGE_CHANGE',
        severity: 'critical',
        notify: ['security-team@company.com', 'compliance@company.com']
      },
      {
        id: 'data_access_anomaly',
        name: 'Unusual Data Access',
        condition: (event) => event.eventType === 'DATA_ACCESS' && event.recordCount > 1000,
        severity: 'medium',
        notify: ['data-protection@company.com']
      },
      {
        id: 'system_config_change',
        name: 'System Configuration Change',
        condition: (event) => event.eventType === 'CONFIG_CHANGE',
        severity: 'high',
        notify: ['system-admin@company.com', 'security-team@company.com']
      }
    ];

    rules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize the audit manager
   */
  async initialize() {
    try {
      // Ensure log directory exists
      await this.ensureLogDirectory();
      
      // Initialize current log file
      await this.initializeLogFile();
      
      // Setup log rotation
      setInterval(() => {
        this.rotateLogsIfNeeded();
      }, 60000); // Check every minute
      
      // Setup buffer flush
      setInterval(() => {
        this.flushLogBuffer();
      }, 5000); // Flush every 5 seconds
      
      // Setup cleanup
      setInterval(() => {
        this.cleanupOldLogs();
      }, 24 * 60 * 60 * 1000); // Daily cleanup
      
      this.emit('initialized', { 
        timestamp: new Date().toISOString(),
        logDirectory: this.config.logDirectory
      });
      
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
   * Log audit event
   */
  async logEvent(eventType, data, options = {}) {
    try {
      const auditEvent = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        eventType,
        severity: options.severity || 'info',
        userId: data.userId || options.userId,
        userRole: data.userRole || options.userRole,
        sessionId: data.sessionId || options.sessionId,
        sourceIP: data.sourceIP || options.sourceIP,
        userAgent: data.userAgent || options.userAgent,
        action: data.action || eventType,
        resource: data.resource,
        resourceId: data.resourceId,
        result: data.result || 'success',
        details: data.details || data,
        metadata: {
          environment: process.env.NODE_ENV || 'development',
          service: options.service || 'security-framework',
          version: options.version || '1.0.0',
          correlationId: options.correlationId || crypto.randomUUID()
        }
      };

      // Add to buffer for batch processing
      this.logBuffer.push(auditEvent);
      
      // Store in memory for immediate access
      this.auditLogs.push(auditEvent);
      
      // Check alert rules
      if (this.config.enableRealTimeAlerts) {
        await this.checkAlertRules(auditEvent);
      }
      
      // Emit event for real-time processing
      this.emit('auditEvent', auditEvent);
      
      return auditEvent;
      
    } catch (error) {
      this.emit('error', {
        type: 'LOG_EVENT_ERROR',
        error: error.message,
        eventType,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Flush log buffer to persistent storage
   */
  async flushLogBuffer() {
    if (this.logBuffer.length === 0) return;
    
    try {
      const events = [...this.logBuffer];
      this.logBuffer = [];
      
      // Write to file if enabled
      if (this.config.enableFileLogging) {
        await this.writeToFile(events);
      }
      
      // Write to database if enabled
      if (this.config.enableDatabaseLogging) {
        await this.writeToDatabase(events);
      }
      
      // Send to remote logging service if enabled
      if (this.config.enableRemoteLogging) {
        await this.sendToRemoteService(events);
      }
      
    } catch (error) {
      // Put events back in buffer on failure
      this.logBuffer.unshift(...events);
      
      this.emit('error', {
        type: 'FLUSH_BUFFER_ERROR',
        error: error.message,
        eventsCount: events.length,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Write events to log file
   */
  async writeToFile(events) {
    if (!this.currentLogFile) {
      await this.initializeLogFile();
    }
    
    const logEntries = events.map(event => {
      const logEntry = {
        ...event,
        hash: this.config.enableIntegrityCheck ? this.calculateEventHash(event) : undefined
      };
      return JSON.stringify(logEntry) + '\n';
    }).join('');
    
    // Encrypt if enabled
    const dataToWrite = this.config.enableEncryption ? 
      await this.encryptLogData(logEntries) : logEntries;
    
    await fs.appendFile(this.currentLogFile, dataToWrite);
    this.logFileSize += Buffer.byteLength(dataToWrite);
    
    // Store integrity hashes
    if (this.config.enableIntegrityCheck) {
      events.forEach(event => {
        this.integrityHashes.set(event.id, this.calculateEventHash(event));
      });
    }
  }

  /**
   * Write events to database
   */
  async writeToDatabase(events) {
    // This would integrate with your database
    // For now, this is a placeholder
    console.log(`Would write ${events.length} events to database`);
  }

  /**
   * Send events to remote logging service
   */
  async sendToRemoteService(events) {
    // This would integrate with services like Splunk, ELK, etc.
    // For now, this is a placeholder
    console.log(`Would send ${events.length} events to remote service`);
  }

  /**
   * Check alert rules against event
   */
  async checkAlertRules(event) {
    for (const [ruleId, rule] of this.alertRules) {
      try {
        if (rule.condition(event)) {
          if (rule.threshold) {
            // Check threshold-based rules
            const recentEvents = this.getRecentEvents(rule.window || 300000);
            const matchingEvents = recentEvents.filter(rule.condition);
            
            if (matchingEvents.length >= rule.threshold) {
              await this.triggerAlert(rule, event, matchingEvents);
            }
          } else {
            // Immediate alert
            await this.triggerAlert(rule, event);
          }
        }
      } catch (error) {
        this.emit('error', {
          type: 'ALERT_RULE_ERROR',
          ruleId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Trigger security alert
   */
  async triggerAlert(rule, triggerEvent, relatedEvents = []) {
    const alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      ruleName: rule.name,
      severity: rule.severity,
      triggerEvent,
      relatedEvents,
      timestamp: new Date().toISOString(),
      status: 'active'
    };
    
    this.emit('securityAlert', alert);
    
    // Log the alert itself
    await this.logEvent('SECURITY_ALERT', {
      alertId: alert.id,
      ruleName: rule.name,
      severity: rule.severity,
      triggerEventId: triggerEvent.id
    });
  }

  /**
   * Search audit logs
   */
  async searchLogs(criteria) {
    const results = this.auditLogs.filter(event => {
      // Basic filtering
      if (criteria.eventType && event.eventType !== criteria.eventType) return false;
      if (criteria.userId && event.userId !== criteria.userId) return false;
      if (criteria.severity && event.severity !== criteria.severity) return false;
      if (criteria.result && event.result !== criteria.result) return false;
      
      // Date range filtering
      if (criteria.startDate) {
        const eventDate = new Date(event.timestamp);
        const startDate = new Date(criteria.startDate);
        if (eventDate < startDate) return false;
      }
      
      if (criteria.endDate) {
        const eventDate = new Date(event.timestamp);
        const endDate = new Date(criteria.endDate);
        if (eventDate > endDate) return false;
      }
      
      // Text search in details
      if (criteria.searchText) {
        const searchText = criteria.searchText.toLowerCase();
        const eventText = JSON.stringify(event).toLowerCase();
        if (!eventText.includes(searchText)) return false;
      }
      
      return true;
    });
    
    // Sort by timestamp (newest first)
    results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply pagination
    const page = criteria.page || 1;
    const limit = criteria.limit || 100;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      events: results.slice(startIndex, endIndex),
      totalCount: results.length,
      page,
      limit,
      totalPages: Math.ceil(results.length / limit)
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(standard, options = {}) {
    const startDate = options.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = options.endDate || new Date();
    
    const relevantEvents = this.auditLogs.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= startDate && eventDate <= endDate;
    });
    
    const report = {
      id: crypto.randomUUID(),
      standard,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      },
      generatedAt: new Date().toISOString(),
      summary: {
        totalEvents: relevantEvents.length,
        criticalEvents: relevantEvents.filter(e => e.severity === 'critical').length,
        highSeverityEvents: relevantEvents.filter(e => e.severity === 'high').length,
        authenticationEvents: relevantEvents.filter(e => e.eventType.includes('AUTH')).length,
        dataAccessEvents: relevantEvents.filter(e => e.eventType === 'DATA_ACCESS').length,
        configurationChanges: relevantEvents.filter(e => e.eventType === 'CONFIG_CHANGE').length
      },
      compliance: this.assessCompliance(standard, relevantEvents),
      recommendations: this.generateRecommendations(standard, relevantEvents),
      events: relevantEvents
    };
    
    // Log report generation
    await this.logEvent('COMPLIANCE_REPORT_GENERATED', {
      reportId: report.id,
      standard,
      eventCount: relevantEvents.length,
      period: report.period
    });
    
    return report;
  }

  /**
   * Assess compliance based on standard
   */
  assessCompliance(standard, events) {
    const assessment = {
      standard,
      overallScore: 0,
      requirements: []
    };
    
    switch (standard) {
      case 'GDPR':
        assessment.requirements = [
          {
            requirement: 'Data Access Logging',
            description: 'All personal data access must be logged',
            status: events.some(e => e.eventType === 'DATA_ACCESS') ? 'compliant' : 'non-compliant',
            score: events.filter(e => e.eventType === 'DATA_ACCESS').length > 0 ? 100 : 0
          },
          {
            requirement: 'User Consent Tracking',
            description: 'User consent changes must be tracked',
            status: events.some(e => e.eventType === 'CONSENT_CHANGE') ? 'compliant' : 'partial',
            score: events.filter(e => e.eventType === 'CONSENT_CHANGE').length > 0 ? 100 : 50
          },
          {
            requirement: 'Data Breach Notification',
            description: 'Data breaches must be logged within 72 hours',
            status: 'compliant', // Assume compliant unless breach detected
            score: 100
          }
        ];
        break;
        
      case 'SOX':
        assessment.requirements = [
          {
            requirement: 'Financial Data Access Controls',
            description: 'Access to financial data must be controlled and logged',
            status: events.some(e => e.resource?.type === 'financial') ? 'compliant' : 'partial',
            score: 85
          },
          {
            requirement: 'Change Management',
            description: 'All system changes must be documented',
            status: events.some(e => e.eventType === 'CONFIG_CHANGE') ? 'compliant' : 'non-compliant',
            score: events.filter(e => e.eventType === 'CONFIG_CHANGE').length > 0 ? 100 : 0
          }
        ];
        break;
        
      case 'HIPAA':
        assessment.requirements = [
          {
            requirement: 'PHI Access Logging',
            description: 'All PHI access must be logged',
            status: events.some(e => e.resource?.type === 'phi') ? 'compliant' : 'partial',
            score: 90
          },
          {
            requirement: 'User Authentication',
            description: 'Strong authentication required for PHI access',
            status: events.some(e => e.eventType === 'AUTH_SUCCESS' && e.mfaUsed) ? 'compliant' : 'partial',
            score: 75
          }
        ];
        break;
    }
    
    // Calculate overall score
    assessment.overallScore = assessment.requirements.reduce((sum, req) => sum + req.score, 0) / assessment.requirements.length;
    
    return assessment;
  }

  /**
   * Generate compliance recommendations
   */
  generateRecommendations(standard, events) {
    const recommendations = [];
    
    // Generic recommendations based on event analysis
    const criticalEvents = events.filter(e => e.severity === 'critical');
    if (criticalEvents.length > 10) {
      recommendations.push({
        priority: 'high',
        category: 'security',
        description: 'High number of critical security events detected. Review security controls.',
        action: 'Conduct security assessment and strengthen controls'
      });
    }
    
    const failedAuth = events.filter(e => e.eventType === 'AUTH_FAILURE');
    if (failedAuth.length > 100) {
      recommendations.push({
        priority: 'medium',
        category: 'authentication',
        description: 'High number of authentication failures detected.',
        action: 'Implement account lockout policies and monitor for brute force attacks'
      });
    }
    
    // Standard-specific recommendations
    switch (standard) {
      case 'GDPR':
        if (!events.some(e => e.eventType === 'DATA_RETENTION_REVIEW')) {
          recommendations.push({
            priority: 'medium',
            category: 'data-protection',
            description: 'No data retention reviews logged.',
            action: 'Implement regular data retention policy reviews'
          });
        }
        break;
        
      case 'SOX':
        if (!events.some(e => e.eventType === 'SEGREGATION_OF_DUTIES_CHECK')) {
          recommendations.push({
            priority: 'high',
            category: 'access-control',
            description: 'No segregation of duties checks logged.',
            action: 'Implement regular segregation of duties reviews'
          });
        }
        break;
    }
    
    return recommendations;
  }

  /**
   * Verify log integrity
   */
  async verifyLogIntegrity(eventId) {
    if (!this.config.enableIntegrityCheck) {
      throw new Error('Integrity checking is not enabled');
    }
    
    const event = this.auditLogs.find(e => e.id === eventId);
    if (!event) {
      throw new Error('Event not found');
    }
    
    const storedHash = this.integrityHashes.get(eventId);
    const calculatedHash = this.calculateEventHash(event);
    
    return {
      eventId,
      isValid: storedHash === calculatedHash,
      storedHash,
      calculatedHash,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Middleware for Express.js
   */
  middleware() {
    return async (req, res, next) => {
      const startTime = Date.now();
      
      // Capture original end method
      const originalEnd = res.end;
      
      res.end = async function(...args) {
        const duration = Date.now() - startTime;
        
        // Log the request
        try {
          await this.logEvent('HTTP_REQUEST', {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            duration,
            userId: req.user?.id,
            userRole: req.user?.role,
            sessionId: req.sessionID,
            sourceIP: req.ip,
            userAgent: req.get('User-Agent'),
            contentLength: res.get('Content-Length'),
            referer: req.get('Referer')
          });
        } catch (error) {
          console.error('Audit logging error:', error);
        }
        
        // Call original end method
        originalEnd.apply(this, args);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Utility methods
   */
  async ensureLogDirectory() {
    try {
      await fs.access(this.config.logDirectory);
    } catch {
      await fs.mkdir(this.config.logDirectory, { recursive: true, mode: 0o700 });
    }
  }

  async initializeLogFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `audit-${timestamp}.log`;
    this.currentLogFile = path.join(this.config.logDirectory, filename);
    this.logFileSize = 0;
  }

  async rotateLogsIfNeeded() {
    if (this.logFileSize >= this.config.maxLogFileSize) {
      await this.initializeLogFile();
    }
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.config.logDirectory);
      const logFiles = files.filter(file => file.startsWith('audit-') && file.endsWith('.log'));
      
      // Sort by creation time (oldest first)
      const fileStats = await Promise.all(
        logFiles.map(async file => {
          const filePath = path.join(this.config.logDirectory, file);
          const stats = await fs.stat(filePath);
          return { file, path: filePath, mtime: stats.mtime };
        })
      );
      
      fileStats.sort((a, b) => a.mtime - b.mtime);
      
      // Remove old files beyond retention period
      const cutoff = Date.now() - this.config.retentionPeriod;
      const filesToDelete = fileStats.filter(f => f.mtime.getTime() < cutoff);
      
      for (const fileInfo of filesToDelete) {
        await fs.unlink(fileInfo.path);
      }
      
      // Remove excess files beyond maxLogFiles
      if (fileStats.length > this.config.maxLogFiles) {
        const excessFiles = fileStats.slice(0, fileStats.length - this.config.maxLogFiles);
        for (const fileInfo of excessFiles) {
          await fs.unlink(fileInfo.path);
        }
      }
    } catch (error) {
      this.emit('error', {
        type: 'LOG_CLEANUP_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  calculateEventHash(event) {
    const eventString = JSON.stringify(event, Object.keys(event).sort());
    return crypto.createHash('sha256').update(eventString).digest('hex');
  }

  async encryptLogData(data) {
    // This would use the encryption manager
    // For now, return data as-is
    return data;
  }

  getRecentEvents(windowMs) {
    const cutoff = Date.now() - windowMs;
    return this.auditLogs.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    );
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      eventsLogged: this.auditLogs.length,
      bufferSize: this.logBuffer.length,
      currentLogFile: this.currentLogFile,
      logFileSize: this.logFileSize,
      alertRules: this.alertRules.size,
      integrityHashes: this.integrityHashes.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { AuditManager };
