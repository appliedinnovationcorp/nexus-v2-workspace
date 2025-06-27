/**
 * Security Monitor - Advanced Security Framework
 * Real-time security monitoring and alerting system
 */

const EventEmitter = require('events');

class SecurityMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableRealTimeMonitoring: config.enableRealTimeMonitoring !== false,
      enableAlertAggregation: config.enableAlertAggregation !== false,
      enableAutomatedResponse: config.enableAutomatedResponse || false,
      alertThresholds: {
        critical: 1,
        high: 3,
        medium: 10,
        low: 50,
        ...config.alertThresholds
      },
      aggregationWindow: config.aggregationWindow || 300000, // 5 minutes
      maxAlertsPerWindow: config.maxAlertsPerWindow || 100,
      notificationChannels: config.notificationChannels || ['email', 'webhook'],
      webhookUrl: config.webhookUrl,
      emailConfig: config.emailConfig,
      ...config
    };
    
    this.alerts = [];
    this.metrics = {
      totalAlerts: 0,
      criticalAlerts: 0,
      highAlerts: 0,
      mediumAlerts: 0,
      lowAlerts: 0,
      suppressedAlerts: 0,
      automatedResponses: 0
    };
    
    this.alertRules = new Map();
    this.suppressionRules = new Map();
    this.activeIncidents = new Map();
    
    this.initializeDefaultRules();
  }

  /**
   * Initialize default monitoring rules
   */
  initializeDefaultRules() {
    const defaultRules = [
      {
        id: 'multiple_failed_logins',
        name: 'Multiple Failed Login Attempts',
        eventType: 'AUTH_FAILURE',
        threshold: 5,
        window: 300000, // 5 minutes
        severity: 'high',
        description: 'Multiple failed login attempts detected',
        response: ['block_ip', 'notify_admin']
      },
      {
        id: 'privilege_escalation_attempt',
        name: 'Privilege Escalation Attempt',
        eventType: 'AUTHZ_FAILURE',
        threshold: 3,
        window: 300000,
        severity: 'critical',
        description: 'Potential privilege escalation attempt',
        response: ['block_user', 'notify_security_team']
      },
      {
        id: 'suspicious_data_access',
        name: 'Suspicious Data Access Pattern',
        eventType: 'DATA_ACCESS',
        threshold: 100,
        window: 600000, // 10 minutes
        severity: 'medium',
        description: 'Unusual data access pattern detected',
        response: ['monitor_user', 'log_detailed']
      },
      {
        id: 'xss_attack_attempt',
        name: 'XSS Attack Attempt',
        eventType: 'XSS_DETECTED',
        threshold: 1,
        window: 60000,
        severity: 'high',
        description: 'Cross-site scripting attack attempt',
        response: ['block_request', 'notify_admin']
      },
      {
        id: 'sql_injection_attempt',
        name: 'SQL Injection Attempt',
        eventType: 'SQL_INJECTION_DETECTED',
        threshold: 1,
        window: 60000,
        severity: 'critical',
        description: 'SQL injection attack attempt',
        response: ['block_ip', 'notify_security_team', 'create_incident']
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    // Default suppression rules
    const suppressionRules = [
      {
        id: 'duplicate_alerts',
        name: 'Suppress Duplicate Alerts',
        condition: (alert, existingAlerts) => {
          return existingAlerts.some(existing => 
            existing.type === alert.type &&
            existing.source === alert.source &&
            (Date.now() - new Date(existing.timestamp).getTime()) < 60000 // 1 minute
          );
        }
      },
      {
        id: 'maintenance_window',
        name: 'Suppress During Maintenance',
        condition: (alert) => {
          // Check if we're in maintenance window
          return this.isMaintenanceWindow();
        }
      }
    ];

    suppressionRules.forEach(rule => {
      this.suppressionRules.set(rule.id, rule);
    });
  }

  /**
   * Initialize the security monitor
   */
  async initialize() {
    // Setup alert processing
    setInterval(() => {
      this.processAlertQueue();
    }, 5000); // Every 5 seconds

    // Setup metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    // Setup alert cleanup
    setInterval(() => {
      this.cleanupOldAlerts();
    }, 300000); // Every 5 minutes

    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      alertRules: this.alertRules.size,
      suppressionRules: this.suppressionRules.size
    });
  }

  /**
   * Process security event
   */
  async processSecurityEvent(event) {
    try {
      // Check if event matches any alert rules
      for (const [ruleId, rule] of this.alertRules) {
        if (this.matchesRule(event, rule)) {
          await this.evaluateRule(rule, event);
        }
      }
      
      // Store event for pattern analysis
      this.storeEventForAnalysis(event);
      
    } catch (error) {
      this.emit('processingError', {
        error: error.message,
        event: event.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check if event matches rule
   */
  matchesRule(event, rule) {
    if (rule.eventType && event.eventType !== rule.eventType) {
      return false;
    }
    
    if (rule.severity && event.severity !== rule.severity) {
      return false;
    }
    
    if (rule.source && event.source !== rule.source) {
      return false;
    }
    
    return true;
  }

  /**
   * Evaluate rule against recent events
   */
  async evaluateRule(rule, triggerEvent) {
    const now = Date.now();
    const windowStart = now - rule.window;
    
    // Get recent events that match this rule
    const recentEvents = this.alerts.filter(alert => {
      const alertTime = new Date(alert.timestamp).getTime();
      return alertTime > windowStart && this.matchesRule(alert.originalEvent, rule);
    });
    
    if (recentEvents.length >= rule.threshold) {
      await this.createAlert({
        type: 'RULE_TRIGGERED',
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        description: rule.description,
        triggerEvent,
        relatedEvents: recentEvents,
        eventCount: recentEvents.length,
        threshold: rule.threshold,
        window: rule.window,
        response: rule.response
      });
    }
  }

  /**
   * Create security alert
   */
  async createAlert(alertData) {
    const alert = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      status: 'active',
      acknowledged: false,
      ...alertData
    };
    
    // Check suppression rules
    if (this.shouldSuppressAlert(alert)) {
      this.metrics.suppressedAlerts++;
      return null;
    }
    
    // Store alert
    this.alerts.push(alert);
    this.updateMetrics(alert);
    
    // Emit alert event
    this.emit('alertCreated', alert);
    
    // Process automated responses
    if (this.config.enableAutomatedResponse && alert.response) {
      await this.executeAutomatedResponse(alert);
    }
    
    // Send notifications
    await this.sendNotifications(alert);
    
    // Create incident if critical
    if (alert.severity === 'critical') {
      await this.createIncident(alert);
    }
    
    return alert;
  }

  /**
   * Check if alert should be suppressed
   */
  shouldSuppressAlert(alert) {
    for (const [ruleId, rule] of this.suppressionRules) {
      try {
        if (rule.condition(alert, this.alerts)) {
          this.emit('alertSuppressed', {
            alertId: alert.id,
            suppressionRule: ruleId,
            timestamp: new Date().toISOString()
          });
          return true;
        }
      } catch (error) {
        console.error(`Error in suppression rule ${ruleId}:`, error);
      }
    }
    return false;
  }

  /**
   * Execute automated response
   */
  async executeAutomatedResponse(alert) {
    if (!alert.response || !Array.isArray(alert.response)) {
      return;
    }
    
    for (const action of alert.response) {
      try {
        await this.executeResponseAction(action, alert);
        this.metrics.automatedResponses++;
      } catch (error) {
        this.emit('responseError', {
          action,
          alertId: alert.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Execute specific response action
   */
  async executeResponseAction(action, alert) {
    switch (action) {
      case 'block_ip':
        this.emit('blockIPRequested', {
          ip: alert.triggerEvent?.sourceIP,
          reason: alert.description,
          alertId: alert.id
        });
        break;
        
      case 'block_user':
        this.emit('blockUserRequested', {
          userId: alert.triggerEvent?.userId,
          reason: alert.description,
          alertId: alert.id
        });
        break;
        
      case 'notify_admin':
        await this.sendAdminNotification(alert);
        break;
        
      case 'notify_security_team':
        await this.sendSecurityTeamNotification(alert);
        break;
        
      case 'create_incident':
        await this.createIncident(alert);
        break;
        
      case 'monitor_user':
        this.emit('enhancedMonitoringRequested', {
          userId: alert.triggerEvent?.userId,
          reason: alert.description,
          alertId: alert.id
        });
        break;
        
      case 'log_detailed':
        this.emit('detailedLoggingRequested', {
          target: alert.triggerEvent?.userId || alert.triggerEvent?.sourceIP,
          reason: alert.description,
          alertId: alert.id
        });
        break;
    }
  }

  /**
   * Send notifications
   */
  async sendNotifications(alert) {
    for (const channel of this.config.notificationChannels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
          case 'sms':
            await this.sendSMSNotification(alert);
            break;
        }
      } catch (error) {
        this.emit('notificationError', {
          channel,
          alertId: alert.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Send webhook notification
   */
  async sendWebhookNotification(alert) {
    if (!this.config.webhookUrl) return;
    
    const payload = {
      alert: {
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        description: alert.description,
        timestamp: alert.timestamp
      },
      metadata: {
        source: 'security-framework',
        version: '1.0.0'
      }
    };
    
    // This would make an HTTP request to the webhook URL
    console.log('Would send webhook notification:', payload);
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(alert) {
    if (!this.config.emailConfig) return;
    
    const emailData = {
      to: this.getEmailRecipients(alert.severity),
      subject: `Security Alert: ${alert.description}`,
      body: this.formatEmailBody(alert)
    };
    
    // This would send an email using your email service
    console.log('Would send email notification:', emailData);
  }

  /**
   * Create security incident
   */
  async createIncident(alert) {
    const incident = {
      id: crypto.randomUUID(),
      title: `Security Incident: ${alert.description}`,
      severity: alert.severity,
      status: 'open',
      createdAt: new Date().toISOString(),
      alerts: [alert.id],
      assignee: null,
      description: this.formatIncidentDescription(alert)
    };
    
    this.activeIncidents.set(incident.id, incident);
    
    this.emit('incidentCreated', incident);
    
    return incident;
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy) {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date().toISOString();
      
      this.emit('alertAcknowledged', {
        alertId,
        acknowledgedBy,
        timestamp: alert.acknowledgedAt
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, resolvedBy, resolution) {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = new Date().toISOString();
      alert.resolution = resolution;
      
      this.emit('alertResolved', {
        alertId,
        resolvedBy,
        resolution,
        timestamp: alert.resolvedAt
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(filters = {}) {
    let alerts = this.alerts.filter(alert => alert.status === 'active');
    
    if (filters.severity) {
      alerts = alerts.filter(alert => alert.severity === filters.severity);
    }
    
    if (filters.type) {
      alerts = alerts.filter(alert => alert.type === filters.type);
    }
    
    if (filters.acknowledged !== undefined) {
      alerts = alerts.filter(alert => alert.acknowledged === filters.acknowledged);
    }
    
    // Sort by timestamp (newest first)
    alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return alerts;
  }

  /**
   * Get security dashboard data
   */
  getDashboardData() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    const last7Days = now - (7 * 24 * 60 * 60 * 1000);
    
    const recent24h = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > last24Hours
    );
    
    const recent7d = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > last7Days
    );
    
    return {
      summary: {
        activeAlerts: this.getActiveAlerts().length,
        activeIncidents: this.activeIncidents.size,
        alertsLast24h: recent24h.length,
        alertsLast7d: recent7d.length
      },
      metrics: this.metrics,
      severityBreakdown: {
        critical: recent24h.filter(a => a.severity === 'critical').length,
        high: recent24h.filter(a => a.severity === 'high').length,
        medium: recent24h.filter(a => a.severity === 'medium').length,
        low: recent24h.filter(a => a.severity === 'low').length
      },
      topAlertTypes: this.getTopAlertTypes(recent24h),
      recentAlerts: this.getActiveAlerts().slice(0, 10),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Utility methods
   */
  updateMetrics(alert) {
    this.metrics.totalAlerts++;
    
    switch (alert.severity) {
      case 'critical':
        this.metrics.criticalAlerts++;
        break;
      case 'high':
        this.metrics.highAlerts++;
        break;
      case 'medium':
        this.metrics.mediumAlerts++;
        break;
      case 'low':
        this.metrics.lowAlerts++;
        break;
    }
  }

  getTopAlertTypes(alerts) {
    const typeCounts = {};
    
    alerts.forEach(alert => {
      typeCounts[alert.type] = (typeCounts[alert.type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));
  }

  getEmailRecipients(severity) {
    const recipients = {
      critical: ['security-team@company.com', 'ciso@company.com'],
      high: ['security-team@company.com'],
      medium: ['security-team@company.com'],
      low: ['security-team@company.com']
    };
    
    return recipients[severity] || recipients.medium;
  }

  formatEmailBody(alert) {
    return `
Security Alert Details:

Alert ID: ${alert.id}
Severity: ${alert.severity.toUpperCase()}
Type: ${alert.type}
Description: ${alert.description}
Timestamp: ${alert.timestamp}

${alert.triggerEvent ? `
Trigger Event:
- Event Type: ${alert.triggerEvent.eventType}
- Source IP: ${alert.triggerEvent.sourceIP}
- User ID: ${alert.triggerEvent.userId}
` : ''}

Please investigate this alert promptly.

Security Framework
    `;
  }

  formatIncidentDescription(alert) {
    return `
Incident created from security alert.

Alert Details:
- ID: ${alert.id}
- Type: ${alert.type}
- Severity: ${alert.severity}
- Description: ${alert.description}
- Timestamp: ${alert.timestamp}

Automated responses executed: ${alert.response?.join(', ') || 'None'}

This incident requires immediate attention.
    `;
  }

  isMaintenanceWindow() {
    // Check if current time is within maintenance window
    // This would typically check against a maintenance schedule
    return false;
  }

  storeEventForAnalysis(event) {
    // Store event for pattern analysis and machine learning
    // This would typically send to a data pipeline
  }

  processAlertQueue() {
    // Process any queued alerts
  }

  collectMetrics() {
    const metrics = {
      ...this.metrics,
      activeAlerts: this.getActiveAlerts().length,
      activeIncidents: this.activeIncidents.size,
      timestamp: new Date().toISOString()
    };
    
    this.emit('metricsCollected', metrics);
  }

  cleanupOldAlerts() {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoff
    );
    
    const cleanedCount = initialCount - this.alerts.length;
    
    if (cleanedCount > 0) {
      this.emit('alertsCleanedUp', {
        cleanedCount,
        remainingAlerts: this.alerts.length,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      activeAlerts: this.getActiveAlerts().length,
      activeIncidents: this.activeIncidents.size,
      alertRules: this.alertRules.size,
      suppressionRules: this.suppressionRules.size,
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { SecurityMonitor };
