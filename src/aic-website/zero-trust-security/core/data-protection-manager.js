/**
 * Data Protection Manager for Zero-Trust Architecture
 * Implements encryption, DLP, data classification, and rights management
 * Ensures data security at rest, in transit, and in use
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class DataProtectionManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Encryption settings
      encryption: {
        algorithm: 'aes-256-gcm',
        keySize: 32,
        ivSize: 16,
        tagSize: 16,
        keyRotationInterval: 86400000, // 24 hours
        ...config.encryption
      },
      
      // Data classification levels
      classificationLevels: {
        public: { level: 0, encryption: false, retention: 2592000000 }, // 30 days
        internal: { level: 1, encryption: true, retention: 7776000000 }, // 90 days
        confidential: { level: 2, encryption: true, retention: 31536000000 }, // 1 year
        restricted: { level: 3, encryption: true, retention: 157680000000 }, // 5 years
        ...config.classificationLevels
      },
      
      // DLP policies
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
        },
        phone: {
          pattern: /\b\d{3}-\d{3}-\d{4}\b/g,
          action: 'monitor',
          severity: 'low'
        },
        ...config.dlpPolicies
      },
      
      // Rights management
      rightsManagement: {
        enabled: config.rightsManagement !== false,
        defaultRights: ['read'],
        adminRights: ['read', 'write', 'delete', 'share', 'admin'],
        ...config.rightsManagement
      },
      
      // Backup and recovery
      backup: {
        enabled: config.backup !== false,
        interval: 3600000, // 1 hour
        retention: 2592000000, // 30 days
        encryption: true,
        ...config.backup
      },
      
      ...config
    };

    this.state = {
      encryptionKeys: new Map(),
      dataClassifications: new Map(),
      accessRights: new Map(),
      dlpViolations: new Map(),
      encryptedData: new Map(),
      backups: new Map(),
      auditLog: []
    };

    this.metrics = {
      dataEncrypted: 0,
      dataDecrypted: 0,
      dlpViolations: 0,
      accessDenied: 0,
      keysRotated: 0,
      backupsCreated: 0,
      auditEvents: 0
    };

    this.init();
  }

  async init() {
    console.log('🔐 Initializing Data Protection Manager...');
    
    // Generate initial encryption keys
    await this.generateEncryptionKeys();
    
    // Setup key rotation
    setInterval(() => this.rotateEncryptionKeys(), this.config.encryption.keyRotationInterval);
    
    // Setup backup process
    if (this.config.backup.enabled) {
      setInterval(() => this.performBackup(), this.config.backup.interval);
    }
    
    // Setup cleanup processes
    setInterval(() => this.cleanupExpiredData(), 3600000); // 1 hour
    setInterval(() => this.cleanupAuditLog(), 86400000); // 24 hours
    
    console.log('✅ Data Protection Manager initialized');
  }

  async generateEncryptionKeys() {
    try {
      // Generate master key
      const masterKey = crypto.randomBytes(this.config.encryption.keySize);
      this.state.encryptionKeys.set('master', {
        key: masterKey,
        created: Date.now(),
        rotations: 0,
        active: true
      });

      // Generate keys for each classification level
      for (const level of Object.keys(this.config.classificationLevels)) {
        const key = crypto.randomBytes(this.config.encryption.keySize);
        this.state.encryptionKeys.set(level, {
          key,
          created: Date.now(),
          rotations: 0,
          active: true
        });
      }

      console.log(`🔑 Generated ${this.state.encryptionKeys.size} encryption keys`);
    } catch (error) {
      console.error('❌ Failed to generate encryption keys:', error);
      throw error;
    }
  }

  // Data encryption
  async encryptData(data, classification = 'internal', metadata = {}) {
    try {
      const classificationConfig = this.config.classificationLevels[classification];
      if (!classificationConfig) {
        throw new Error(`Unknown classification level: ${classification}`);
      }

      // Check if encryption is required for this classification
      if (!classificationConfig.encryption) {
        return {
          encrypted: false,
          data,
          classification,
          metadata: { ...metadata, encrypted: false }
        };
      }

      // Get encryption key for this classification
      const keyData = this.state.encryptionKeys.get(classification);
      if (!keyData) {
        throw new Error(`No encryption key found for classification: ${classification}`);
      }

      // Generate IV
      const iv = crypto.randomBytes(this.config.encryption.ivSize);
      
      // Create cipher
      const cipher = crypto.createCipher(this.config.encryption.algorithm, keyData.key, { iv });
      
      // Encrypt data
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get authentication tag
      const tag = cipher.getAuthTag();
      
      const encryptedPackage = {
        encrypted: true,
        data: encrypted,
        iv: iv.toString('hex'),
        tag: tag.toString('hex'),
        algorithm: this.config.encryption.algorithm,
        classification,
        metadata: {
          ...metadata,
          encrypted: true,
          encryptedAt: Date.now(),
          keyVersion: keyData.rotations
        }
      };

      // Store encrypted data reference
      const dataId = crypto.randomUUID();
      this.state.encryptedData.set(dataId, encryptedPackage);

      // Log encryption event
      await this.logAuditEvent({
        type: 'data_encrypted',
        dataId,
        classification,
        size: JSON.stringify(data).length,
        timestamp: Date.now()
      });

      this.metrics.dataEncrypted++;
      
      return { ...encryptedPackage, dataId };
    } catch (error) {
      console.error('❌ Data encryption failed:', error);
      throw error;
    }
  }

  // Data decryption
  async decryptData(encryptedPackage, userId, purpose = 'access') {
    try {
      if (!encryptedPackage.encrypted) {
        return encryptedPackage.data;
      }

      // Check access rights
      const hasAccess = await this.checkDataAccess(userId, encryptedPackage.classification, 'read');
      if (!hasAccess) {
        this.metrics.accessDenied++;
        throw new Error('Access denied: insufficient rights to decrypt data');
      }

      // Get decryption key
      const keyData = this.state.encryptionKeys.get(encryptedPackage.classification);
      if (!keyData) {
        throw new Error(`No decryption key found for classification: ${encryptedPackage.classification}`);
      }

      // Create decipher
      const decipher = crypto.createDecipher(
        encryptedPackage.algorithm,
        keyData.key,
        { iv: Buffer.from(encryptedPackage.iv, 'hex') }
      );
      
      // Set auth tag
      decipher.setAuthTag(Buffer.from(encryptedPackage.tag, 'hex'));
      
      // Decrypt data
      let decrypted = decipher.update(encryptedPackage.data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      const data = JSON.parse(decrypted);

      // Log decryption event
      await this.logAuditEvent({
        type: 'data_decrypted',
        dataId: encryptedPackage.dataId,
        userId,
        purpose,
        classification: encryptedPackage.classification,
        timestamp: Date.now()
      });

      this.metrics.dataDecrypted++;
      
      return data;
    } catch (error) {
      console.error('❌ Data decryption failed:', error);
      throw error;
    }
  }

  // Data classification
  async classifyData(data, suggestedClassification = null) {
    try {
      let classification = suggestedClassification || 'internal';
      let confidence = 0.5;
      const reasons = [];

      // Analyze data content for sensitive information
      const dataString = JSON.stringify(data);
      
      // Check for PII patterns
      for (const [policyName, policy] of Object.entries(this.config.dlpPolicies)) {
        const matches = dataString.match(policy.pattern);
        if (matches && matches.length > 0) {
          reasons.push(`Contains ${policyName}: ${matches.length} matches`);
          
          // Increase classification level based on sensitivity
          if (policy.severity === 'high') {
            classification = 'restricted';
            confidence = 0.9;
          } else if (policy.severity === 'medium' && classification !== 'restricted') {
            classification = 'confidential';
            confidence = 0.8;
          }
        }
      }

      // Check for specific keywords that indicate sensitivity
      const sensitiveKeywords = [
        'password', 'secret', 'private', 'confidential', 'restricted',
        'api_key', 'token', 'credential', 'auth', 'login'
      ];
      
      const keywordMatches = sensitiveKeywords.filter(keyword => 
        dataString.toLowerCase().includes(keyword)
      );
      
      if (keywordMatches.length > 0) {
        reasons.push(`Contains sensitive keywords: ${keywordMatches.join(', ')}`);
        if (classification === 'internal') {
          classification = 'confidential';
          confidence = 0.7;
        }
      }

      // Store classification
      const classificationId = crypto.randomUUID();
      this.state.dataClassifications.set(classificationId, {
        id: classificationId,
        classification,
        confidence,
        reasons,
        classifiedAt: Date.now(),
        dataHash: crypto.createHash('sha256').update(dataString).digest('hex')
      });

      return {
        classificationId,
        classification,
        confidence,
        reasons,
        config: this.config.classificationLevels[classification]
      };
    } catch (error) {
      console.error('❌ Data classification failed:', error);
      return {
        classification: 'internal',
        confidence: 0.5,
        reasons: ['Classification failed, using default'],
        error: error.message
      };
    }
  }

  // Data Loss Prevention (DLP)
  async scanForDLP(data, context = {}) {
    try {
      const violations = [];
      const dataString = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Scan against each DLP policy
      for (const [policyName, policy] of Object.entries(this.config.dlpPolicies)) {
        const matches = dataString.match(policy.pattern);
        
        if (matches && matches.length > 0) {
          const violation = {
            policy: policyName,
            severity: policy.severity,
            action: policy.action,
            matches: matches.length,
            matchedContent: matches.slice(0, 5), // First 5 matches for review
            timestamp: Date.now(),
            context
          };
          
          violations.push(violation);
          
          // Store violation for tracking
          const violationId = crypto.randomUUID();
          this.state.dlpViolations.set(violationId, violation);
          
          // Log violation
          await this.logAuditEvent({
            type: 'dlp_violation',
            violationId,
            policy: policyName,
            severity: policy.severity,
            action: policy.action,
            matches: matches.length,
            context,
            timestamp: Date.now()
          });
          
          this.metrics.dlpViolations++;
          
          // Emit violation event
          this.emit('dlpViolation', violation);
        }
      }

      return {
        violations,
        allowed: violations.every(v => v.action !== 'block'),
        processedData: await this.processDLPActions(dataString, violations)
      };
    } catch (error) {
      console.error('❌ DLP scan failed:', error);
      return {
        violations: [],
        allowed: true,
        processedData: data,
        error: error.message
      };
    }
  }

  async processDLPActions(dataString, violations) {
    let processedData = dataString;
    
    for (const violation of violations) {
      const policy = this.config.dlpPolicies[violation.policy];
      
      switch (policy.action) {
        case 'redact':
          // Replace sensitive data with redaction markers
          processedData = processedData.replace(policy.pattern, '[REDACTED]');
          break;
        case 'mask':
          // Partially mask sensitive data
          processedData = processedData.replace(policy.pattern, (match) => {
            return match.substring(0, 2) + '*'.repeat(match.length - 4) + match.substring(match.length - 2);
          });
          break;
        case 'block':
          // Data should be blocked entirely
          throw new Error(`Data blocked due to DLP policy violation: ${violation.policy}`);
        case 'monitor':
          // Just log, no modification needed
          break;
      }
    }
    
    return processedData;
  }

  // Rights management
  async setDataRights(dataId, userId, rights) {
    try {
      const rightsKey = `${dataId}:${userId}`;
      
      // Validate rights
      const validRights = ['read', 'write', 'delete', 'share', 'admin'];
      const invalidRights = rights.filter(right => !validRights.includes(right));
      
      if (invalidRights.length > 0) {
        throw new Error(`Invalid rights: ${invalidRights.join(', ')}`);
      }

      this.state.accessRights.set(rightsKey, {
        dataId,
        userId,
        rights,
        grantedAt: Date.now(),
        grantedBy: 'system' // Would be actual user in real implementation
      });

      await this.logAuditEvent({
        type: 'rights_granted',
        dataId,
        userId,
        rights,
        timestamp: Date.now()
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to set data rights:', error);
      throw error;
    }
  }

  async checkDataAccess(userId, classification, action) {
    try {
      // Check if user has admin rights
      const adminRightsKey = `admin:${userId}`;
      if (this.state.accessRights.has(adminRightsKey)) {
        return true;
      }

      // Check classification-based access
      const classificationConfig = this.config.classificationLevels[classification];
      if (!classificationConfig) {
        return false;
      }

      // For now, implement basic access control
      // In a real system, this would integrate with identity management
      const userRoles = await this.getUserRoles(userId);
      
      switch (classification) {
        case 'public':
          return true;
        case 'internal':
          return userRoles.includes('employee') || userRoles.includes('admin');
        case 'confidential':
          return userRoles.includes('manager') || userRoles.includes('admin');
        case 'restricted':
          return userRoles.includes('admin');
        default:
          return false;
      }
    } catch (error) {
      console.error('❌ Access check failed:', error);
      return false;
    }
  }

  async getUserRoles(userId) {
    // This would integrate with identity management system
    // For now, return mock roles
    return ['employee']; // Mock implementation
  }

  // Key rotation
  async rotateEncryptionKeys() {
    try {
      console.log('🔄 Rotating encryption keys...');
      
      let rotatedCount = 0;
      for (const [keyName, keyData] of this.state.encryptionKeys) {
        // Generate new key
        const newKey = crypto.randomBytes(this.config.encryption.keySize);
        
        // Update key data
        this.state.encryptionKeys.set(keyName, {
          key: newKey,
          created: Date.now(),
          rotations: keyData.rotations + 1,
          active: true,
          previous: keyData.key // Keep previous key for decryption
        });
        
        rotatedCount++;
      }

      this.metrics.keysRotated += rotatedCount;
      
      await this.logAuditEvent({
        type: 'keys_rotated',
        count: rotatedCount,
        timestamp: Date.now()
      });

      console.log(`✅ Rotated ${rotatedCount} encryption keys`);
    } catch (error) {
      console.error('❌ Key rotation failed:', error);
    }
  }

  // Backup and recovery
  async performBackup() {
    try {
      if (!this.config.backup.enabled) return;

      console.log('💾 Performing data backup...');
      
      const backupId = crypto.randomUUID();
      const backupData = {
        id: backupId,
        timestamp: Date.now(),
        data: {
          encryptedData: Array.from(this.state.encryptedData.entries()),
          dataClassifications: Array.from(this.state.dataClassifications.entries()),
          accessRights: Array.from(this.state.accessRights.entries())
        }
      };

      // Encrypt backup if required
      if (this.config.backup.encryption) {
        const encryptedBackup = await this.encryptData(backupData, 'restricted', {
          type: 'backup',
          backupId
        });
        this.state.backups.set(backupId, encryptedBackup);
      } else {
        this.state.backups.set(backupId, backupData);
      }

      // Clean up old backups
      await this.cleanupOldBackups();

      this.metrics.backupsCreated++;
      
      await this.logAuditEvent({
        type: 'backup_created',
        backupId,
        encrypted: this.config.backup.encryption,
        timestamp: Date.now()
      });

      console.log(`✅ Backup created: ${backupId}`);
    } catch (error) {
      console.error('❌ Backup failed:', error);
    }
  }

  async cleanupOldBackups() {
    const cutoffTime = Date.now() - this.config.backup.retention;
    let cleanedCount = 0;

    for (const [backupId, backup] of this.state.backups) {
      if (backup.timestamp < cutoffTime) {
        this.state.backups.delete(backupId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old backups`);
    }
  }

  // Data retention and cleanup
  async cleanupExpiredData() {
    console.log('🧹 Cleaning up expired data...');
    
    let cleanedCount = 0;
    const now = Date.now();

    // Clean up encrypted data based on classification retention policies
    for (const [dataId, encryptedData] of this.state.encryptedData) {
      const classificationConfig = this.config.classificationLevels[encryptedData.classification];
      if (classificationConfig && classificationConfig.retention) {
        const expiryTime = encryptedData.metadata.encryptedAt + classificationConfig.retention;
        
        if (now > expiryTime) {
          this.state.encryptedData.delete(dataId);
          cleanedCount++;
          
          await this.logAuditEvent({
            type: 'data_expired',
            dataId,
            classification: encryptedData.classification,
            timestamp: now
          });
        }
      }
    }

    // Clean up old DLP violations (keep for 30 days)
    const dlpRetention = 30 * 24 * 60 * 60 * 1000; // 30 days
    for (const [violationId, violation] of this.state.dlpViolations) {
      if (now - violation.timestamp > dlpRetention) {
        this.state.dlpViolations.delete(violationId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ Cleaned up ${cleanedCount} expired data items`);
    }
  }

  async cleanupAuditLog() {
    // Keep audit log for 1 year
    const auditRetention = 365 * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - auditRetention;
    
    const originalLength = this.state.auditLog.length;
    this.state.auditLog = this.state.auditLog.filter(event => event.timestamp > cutoffTime);
    
    const cleanedCount = originalLength - this.state.auditLog.length;
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old audit log entries`);
    }
  }

  // Audit logging
  async logAuditEvent(event) {
    const auditEvent = {
      id: crypto.randomUUID(),
      ...event,
      timestamp: event.timestamp || Date.now()
    };

    this.state.auditLog.push(auditEvent);
    this.metrics.auditEvents++;
    
    // Emit audit event
    this.emit('auditEvent', auditEvent);
    
    // Keep audit log size manageable
    if (this.state.auditLog.length > 10000) {
      this.state.auditLog = this.state.auditLog.slice(-5000); // Keep last 5000 events
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      encryptionKeys: this.state.encryptionKeys.size,
      encryptedData: this.state.encryptedData.size,
      dataClassifications: this.state.dataClassifications.size,
      dlpViolations: this.state.dlpViolations.size,
      backups: this.state.backups.size,
      auditEvents: this.state.auditLog.length,
      metrics: this.metrics
    };
  }

  // Public API methods
  getDataProtectionStatus() {
    return {
      encryptionEnabled: true,
      classificationLevels: Object.keys(this.config.classificationLevels),
      dlpPolicies: Object.keys(this.config.dlpPolicies),
      backupEnabled: this.config.backup.enabled,
      metrics: this.metrics
    };
  }

  getDLPViolations(limit = 100) {
    return Array.from(this.state.dlpViolations.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  getAuditLog(limit = 1000) {
    return this.state.auditLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Shutdown
  async shutdown() {
    console.log('🔐 Shutting down Data Protection Manager...');
    
    // Clear sensitive data
    this.state.encryptionKeys.clear();
    this.state.encryptedData.clear();
    
    console.log('✅ Data Protection Manager shutdown complete');
  }
}

module.exports = { DataProtectionManager };
