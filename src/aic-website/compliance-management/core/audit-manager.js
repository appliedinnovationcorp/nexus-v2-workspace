/**
 * Audit Manager for Compliance Management System
 * Provides comprehensive audit trail, logging, and evidence collection
 * Supports regulatory audit requirements and forensic analysis
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;

class AuditManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Audit settings
      enabled: config.enabled !== false,
      detailedLogging: config.detailedLogging !== false,
      encryptLogs: config.encryptLogs !== false,
      
      // Retention policies
      retention: {
        auditLogs: config.logRetention || 220752000000, // 7 years
        evidenceFiles: config.evidenceRetention || 220752000000, // 7 years
        complianceReports: config.reportRetention || 157680000000, // 5 years
        ...config.retention
      },
      
      // Log levels
      logLevels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3,
        CRITICAL: 4
      },
      
      // Audit categories
      categories: {
        AUTHENTICATION: 'authentication',
        AUTHORIZATION: 'authorization',
        DATA_ACCESS: 'data_access',
        DATA_MODIFICATION: 'data_modification',
        SYSTEM_CONFIGURATION: 'system_configuration',
        COMPLIANCE_EVENT: 'compliance_event',
        SECURITY_EVENT: 'security_event',
        ADMINISTRATIVE: 'administrative',
        ...config.categories
      },
      
      // Evidence collection
      evidenceCollection: {
        enabled: config.evidenceCollection !== false,
        autoCapture: config.autoCapture !== false,
        screenshotCapture: config.screenshotCapture || false,
        networkCapture: config.networkCapture || false,
        ...config.evidenceCollection
      },
      
      // Integrity protection
      integrityProtection: {
        enabled: config.integrityProtection !== false,
        hashAlgorithm: config.hashAlgorithm || 'sha256',
        digitalSignatures: config.digitalSignatures || false,
        ...config.integrityProtection
      },
      
      ...config
    };

    this.state = {
      auditLog: [],
      evidenceStore: new Map(),
      integrityHashes: new Map(),
      auditSessions: new Map(),
      searchIndexes: new Map(),
      exportRequests: new Map()
    };

    this.metrics = {
      totalEvents: 0,
      eventsByCategory: new Map(),
      eventsByLevel: new Map(),
      evidenceItems: 0,
      integrityViolations: 0,
      exportRequests: 0
    };

    this.init();
  }

  async init() {
    console.log('📋 Initializing Audit Manager...');
    
    // Setup log rotation
    setInterval(() => this.rotateAuditLogs(), 86400000); // Daily
    
    // Setup integrity checks
    setInterval(() => this.verifyLogIntegrity(), 3600000); // Hourly
    
    // Setup cleanup
    setInterval(() => this.cleanupExpiredData(), 86400000); // Daily
    
    // Initialize search indexes
    await this.initializeSearchIndexes();
    
    console.log('✅ Audit Manager initialized');
  }

  // Core audit logging method
  async logEvent(event) {
    try {
      const auditEvent = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        level: event.level || 'INFO',
        category: event.category || 'GENERAL',
        source: event.source || 'SYSTEM',
        userId: event.userId || null,
        sessionId: event.sessionId || null,
        ipAddress: event.ipAddress || null,
        userAgent: event.userAgent || null,
        action: event.action || 'UNKNOWN',
        resource: event.resource || null,
        details: event.details || {},
        result: event.result || 'SUCCESS',
        riskLevel: event.riskLevel || 'LOW',
        complianceRelevant: event.complianceRelevant || false,
        ...event
      };

      // Add contextual information
      auditEvent.context = await this.gatherContext(auditEvent);
      
      // Calculate integrity hash
      if (this.config.integrityProtection.enabled) {
        auditEvent.hash = this.calculateEventHash(auditEvent);
        auditEvent.previousHash = this.getLastEventHash();
      }

      // Encrypt sensitive data if required
      if (this.config.encryptLogs && this.containsSensitiveData(auditEvent)) {
        auditEvent.encrypted = true;
        auditEvent.sensitiveData = await this.encryptSensitiveData(auditEvent.details);
        delete auditEvent.details;
      }

      // Store audit event
      this.state.auditLog.push(auditEvent);
      
      // Update metrics
      this.updateMetrics(auditEvent);
      
      // Update search indexes
      await this.updateSearchIndexes(auditEvent);
      
      // Collect evidence if required
      if (this.shouldCollectEvidence(auditEvent)) {
        await this.collectEvidence(auditEvent);
      }
      
      // Emit audit event
      this.emit('auditEvent', auditEvent);
      
      // Handle critical events
      if (auditEvent.level === 'CRITICAL') {
        await this.handleCriticalEvent(auditEvent);
      }

      return auditEvent.id;

    } catch (error) {
      console.error('❌ Audit logging failed:', error);
      // Fallback logging to prevent audit trail gaps
      await this.logFallbackEvent(event, error);
    }
  }

  // Compliance-specific audit logging
  async logComplianceEvent(event) {
    const complianceEvent = {
      ...event,
      category: 'COMPLIANCE_EVENT',
      complianceRelevant: true,
      level: event.level || 'INFO'
    };

    // Add compliance-specific fields
    if (event.regulation) {
      complianceEvent.regulation = event.regulation;
    }
    
    if (event.requirement) {
      complianceEvent.requirement = event.requirement;
    }
    
    if (event.violation) {
      complianceEvent.violation = event.violation;
      complianceEvent.level = 'WARN';
    }

    return await this.logEvent(complianceEvent);
  }

  // Evidence collection
  async collectEvidence(auditEvent) {
    try {
      const evidence = {
        id: crypto.randomUUID(),
        auditEventId: auditEvent.id,
        timestamp: Date.now(),
        type: 'AUDIT_EVIDENCE',
        items: []
      };

      // Collect system state
      if (this.config.evidenceCollection.autoCapture) {
        const systemState = await this.captureSystemState(auditEvent);
        evidence.items.push({
          type: 'SYSTEM_STATE',
          data: systemState,
          hash: this.calculateHash(JSON.stringify(systemState))
        });
      }

      // Collect database state for data events
      if (auditEvent.category === 'DATA_MODIFICATION') {
        const dataState = await this.captureDataState(auditEvent);
        evidence.items.push({
          type: 'DATA_STATE',
          data: dataState,
          hash: this.calculateHash(JSON.stringify(dataState))
        });
      }

      // Collect network information
      if (this.config.evidenceCollection.networkCapture && auditEvent.ipAddress) {
        const networkInfo = await this.captureNetworkInfo(auditEvent);
        evidence.items.push({
          type: 'NETWORK_INFO',
          data: networkInfo,
          hash: this.calculateHash(JSON.stringify(networkInfo))
        });
      }

      // Store evidence
      this.state.evidenceStore.set(evidence.id, evidence);
      this.metrics.evidenceItems++;

      // Calculate evidence integrity hash
      if (this.config.integrityProtection.enabled) {
        const evidenceHash = this.calculateHash(JSON.stringify(evidence));
        this.state.integrityHashes.set(evidence.id, evidenceHash);
      }

      return evidence.id;

    } catch (error) {
      console.error('❌ Evidence collection failed:', error);
      await this.logEvent({
        level: 'ERROR',
        category: 'SYSTEM_ERROR',
        action: 'EVIDENCE_COLLECTION_FAILED',
        details: { error: error.message, auditEventId: auditEvent.id }
      });
    }
  }

  // Audit trail search and retrieval
  async searchAuditLog(criteria) {
    try {
      const searchResults = {
        searchId: crypto.randomUUID(),
        timestamp: Date.now(),
        criteria,
        results: [],
        totalCount: 0
      };

      // Build search query
      let filteredEvents = this.state.auditLog;

      // Filter by time range
      if (criteria.startTime) {
        filteredEvents = filteredEvents.filter(e => e.timestamp >= criteria.startTime);
      }
      if (criteria.endTime) {
        filteredEvents = filteredEvents.filter(e => e.timestamp <= criteria.endTime);
      }

      // Filter by user
      if (criteria.userId) {
        filteredEvents = filteredEvents.filter(e => e.userId === criteria.userId);
      }

      // Filter by category
      if (criteria.category) {
        filteredEvents = filteredEvents.filter(e => e.category === criteria.category);
      }

      // Filter by level
      if (criteria.level) {
        filteredEvents = filteredEvents.filter(e => e.level === criteria.level);
      }

      // Filter by action
      if (criteria.action) {
        filteredEvents = filteredEvents.filter(e => 
          e.action && e.action.toLowerCase().includes(criteria.action.toLowerCase())
        );
      }

      // Filter by resource
      if (criteria.resource) {
        filteredEvents = filteredEvents.filter(e => e.resource === criteria.resource);
      }

      // Filter by compliance relevance
      if (criteria.complianceRelevant !== undefined) {
        filteredEvents = filteredEvents.filter(e => 
          e.complianceRelevant === criteria.complianceRelevant
        );
      }

      // Text search in details
      if (criteria.searchText) {
        filteredEvents = filteredEvents.filter(e => {
          const searchableText = JSON.stringify(e).toLowerCase();
          return searchableText.includes(criteria.searchText.toLowerCase());
        });
      }

      // Sort results
      filteredEvents.sort((a, b) => {
        if (criteria.sortOrder === 'asc') {
          return a.timestamp - b.timestamp;
        } else {
          return b.timestamp - a.timestamp;
        }
      });

      // Apply pagination
      const limit = criteria.limit || 100;
      const offset = criteria.offset || 0;
      
      searchResults.totalCount = filteredEvents.length;
      searchResults.results = filteredEvents.slice(offset, offset + limit);

      // Decrypt sensitive data if user has permission
      if (criteria.includeDecrypted && await this.hasDecryptionPermission(criteria.requesterId)) {
        for (const event of searchResults.results) {
          if (event.encrypted && event.sensitiveData) {
            event.details = await this.decryptSensitiveData(event.sensitiveData);
          }
        }
      }

      // Log search activity
      await this.logEvent({
        level: 'INFO',
        category: 'AUDIT_SEARCH',
        action: 'SEARCH_PERFORMED',
        userId: criteria.requesterId,
        details: {
          searchId: searchResults.searchId,
          criteria: this.sanitizeCriteria(criteria),
          resultCount: searchResults.totalCount
        }
      });

      return searchResults;

    } catch (error) {
      console.error('❌ Audit log search failed:', error);
      throw error;
    }
  }

  // Audit report generation
  async generateAuditReport(reportConfig) {
    try {
      const report = {
        reportId: crypto.randomUUID(),
        type: reportConfig.type || 'COMPREHENSIVE',
        generatedAt: Date.now(),
        generatedBy: reportConfig.requesterId,
        period: reportConfig.period,
        summary: {},
        sections: [],
        evidence: []
      };

      // Generate summary statistics
      report.summary = await this.generateReportSummary(reportConfig.period);

      // Generate sections based on report type
      switch (reportConfig.type) {
        case 'COMPLIANCE':
          report.sections = await this.generateComplianceSections(reportConfig);
          break;
        case 'SECURITY':
          report.sections = await this.generateSecuritySections(reportConfig);
          break;
        case 'ACCESS':
          report.sections = await this.generateAccessSections(reportConfig);
          break;
        case 'COMPREHENSIVE':
        default:
          report.sections = await this.generateComprehensiveSections(reportConfig);
          break;
      }

      // Collect supporting evidence
      if (reportConfig.includeEvidence) {
        report.evidence = await this.collectReportEvidence(reportConfig);
      }

      // Calculate report integrity hash
      if (this.config.integrityProtection.enabled) {
        report.integrityHash = this.calculateHash(JSON.stringify(report));
      }

      // Log report generation
      await this.logEvent({
        level: 'INFO',
        category: 'AUDIT_REPORT',
        action: 'REPORT_GENERATED',
        userId: reportConfig.requesterId,
        details: {
          reportId: report.reportId,
          type: reportConfig.type,
          period: reportConfig.period
        }
      });

      return report;

    } catch (error) {
      console.error('❌ Audit report generation failed:', error);
      throw error;
    }
  }

  // Export audit data
  async exportAuditData(exportConfig) {
    try {
      const exportRequest = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        requesterId: exportConfig.requesterId,
        format: exportConfig.format || 'JSON',
        criteria: exportConfig.criteria,
        status: 'PROCESSING'
      };

      // Store export request
      this.state.exportRequests.set(exportRequest.id, exportRequest);
      this.metrics.exportRequests++;

      // Search for data to export
      const searchResults = await this.searchAuditLog(exportConfig.criteria);
      
      // Format data based on requested format
      let exportData;
      switch (exportConfig.format.toUpperCase()) {
        case 'JSON':
          exportData = JSON.stringify(searchResults.results, null, 2);
          break;
        case 'CSV':
          exportData = await this.convertToCSV(searchResults.results);
          break;
        case 'XML':
          exportData = await this.convertToXML(searchResults.results);
          break;
        default:
          throw new Error(`Unsupported export format: ${exportConfig.format}`);
      }

      // Encrypt export if required
      if (exportConfig.encrypt) {
        exportData = await this.encryptExportData(exportData);
      }

      // Calculate export hash for integrity
      const exportHash = this.calculateHash(exportData);

      exportRequest.status = 'COMPLETED';
      exportRequest.completedAt = Date.now();
      exportRequest.recordCount = searchResults.totalCount;
      exportRequest.dataHash = exportHash;

      // Log export activity
      await this.logEvent({
        level: 'INFO',
        category: 'AUDIT_EXPORT',
        action: 'DATA_EXPORTED',
        userId: exportConfig.requesterId,
        details: {
          exportId: exportRequest.id,
          format: exportConfig.format,
          recordCount: searchResults.totalCount,
          encrypted: !!exportConfig.encrypt
        }
      });

      return {
        exportId: exportRequest.id,
        data: exportData,
        hash: exportHash,
        recordCount: searchResults.totalCount
      };

    } catch (error) {
      console.error('❌ Audit data export failed:', error);
      throw error;
    }
  }

  // Integrity verification
  async verifyLogIntegrity() {
    try {
      console.log('🔍 Verifying audit log integrity...');
      
      let integrityViolations = 0;
      let previousHash = null;

      for (const event of this.state.auditLog) {
        if (this.config.integrityProtection.enabled && event.hash) {
          // Verify event hash
          const calculatedHash = this.calculateEventHash(event);
          if (calculatedHash !== event.hash) {
            integrityViolations++;
            await this.handleIntegrityViolation(event, 'EVENT_HASH_MISMATCH');
          }

          // Verify chain integrity
          if (previousHash && event.previousHash !== previousHash) {
            integrityViolations++;
            await this.handleIntegrityViolation(event, 'CHAIN_INTEGRITY_VIOLATION');
          }

          previousHash = event.hash;
        }
      }

      // Verify evidence integrity
      for (const [evidenceId, evidence] of this.state.evidenceStore) {
        const storedHash = this.state.integrityHashes.get(evidenceId);
        if (storedHash) {
          const calculatedHash = this.calculateHash(JSON.stringify(evidence));
          if (calculatedHash !== storedHash) {
            integrityViolations++;
            await this.handleIntegrityViolation(evidence, 'EVIDENCE_INTEGRITY_VIOLATION');
          }
        }
      }

      if (integrityViolations > 0) {
        console.log(`⚠️ Found ${integrityViolations} audit integrity violations`);
        this.metrics.integrityViolations += integrityViolations;
      }

      return { violations: integrityViolations };

    } catch (error) {
      console.error('❌ Integrity verification failed:', error);
    }
  }

  // Utility methods
  calculateEventHash(event) {
    // Create a copy without the hash fields for calculation
    const { hash, previousHash, ...eventData } = event;
    const eventString = JSON.stringify(eventData, Object.keys(eventData).sort());
    return this.calculateHash(eventString);
  }

  calculateHash(data) {
    return crypto.createHash(this.config.integrityProtection.hashAlgorithm)
      .update(data)
      .digest('hex');
  }

  getLastEventHash() {
    const lastEvent = this.state.auditLog[this.state.auditLog.length - 1];
    return lastEvent ? lastEvent.hash : null;
  }

  containsSensitiveData(event) {
    const sensitiveFields = ['password', 'token', 'ssn', 'creditCard', 'personalData'];
    const eventString = JSON.stringify(event).toLowerCase();
    return sensitiveFields.some(field => eventString.includes(field));
  }

  shouldCollectEvidence(event) {
    return this.config.evidenceCollection.enabled && (
      event.complianceRelevant ||
      event.level === 'CRITICAL' ||
      event.category === 'SECURITY_EVENT' ||
      event.category === 'DATA_MODIFICATION'
    );
  }

  updateMetrics(event) {
    this.metrics.totalEvents++;
    
    // Update category metrics
    const categoryCount = this.metrics.eventsByCategory.get(event.category) || 0;
    this.metrics.eventsByCategory.set(event.category, categoryCount + 1);
    
    // Update level metrics
    const levelCount = this.metrics.eventsByLevel.get(event.level) || 0;
    this.metrics.eventsByLevel.set(event.level, levelCount + 1);
  }

  async handleIntegrityViolation(item, violationType) {
    await this.logEvent({
      level: 'CRITICAL',
      category: 'SECURITY_EVENT',
      action: 'INTEGRITY_VIOLATION',
      details: {
        violationType,
        itemId: item.id,
        itemType: item.type || 'AUDIT_EVENT'
      }
    });

    this.emit('integrityViolation', {
      type: violationType,
      item,
      timestamp: Date.now()
    });
  }

  async handleCriticalEvent(event) {
    // Immediate notification for critical events
    this.emit('criticalAuditEvent', event);
    
    // Auto-collect evidence for critical events
    if (!event.evidenceCollected) {
      await this.collectEvidence(event);
    }
  }

  // Cleanup methods
  async cleanupExpiredData() {
    console.log('🧹 Cleaning up expired audit data...');
    
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up old audit logs
    const auditRetention = this.config.retention.auditLogs;
    const originalLength = this.state.auditLog.length;
    this.state.auditLog = this.state.auditLog.filter(
      event => now - event.timestamp < auditRetention
    );
    cleanedCount += originalLength - this.state.auditLog.length;

    // Clean up old evidence
    const evidenceRetention = this.config.retention.evidenceFiles;
    for (const [evidenceId, evidence] of this.state.evidenceStore) {
      if (now - evidence.timestamp > evidenceRetention) {
        this.state.evidenceStore.delete(evidenceId);
        this.state.integrityHashes.delete(evidenceId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} expired audit records`);
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      auditLogSize: this.state.auditLog.length,
      evidenceItems: this.state.evidenceStore.size,
      integrityViolations: this.metrics.integrityViolations,
      metrics: this.metrics
    };
  }

  // Shutdown
  async shutdown() {
    console.log('📋 Shutting down Audit Manager...');
    
    // Final integrity check
    await this.verifyLogIntegrity();
    
    // Clear sensitive data
    this.state.auditLog = [];
    this.state.evidenceStore.clear();
    
    console.log('✅ Audit Manager shutdown complete');
  }
}

module.exports = { AuditManager };
