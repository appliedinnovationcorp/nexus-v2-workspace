/**
 * Data Privacy Manager - Advanced Security Framework
 * Comprehensive data privacy protection and compliance management
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class DataPrivacyManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableDataClassification: config.enableDataClassification !== false,
      enableDataMasking: config.enableDataMasking !== false,
      enableDataAnonymization: config.enableDataAnonymization || false,
      enableConsentManagement: config.enableConsentManagement !== false,
      enableDataRetention: config.enableDataRetention !== false,
      enableRightToErasure: config.enableRightToErasure !== false,
      enableDataPortability: config.enableDataPortability !== false,
      enablePrivacyByDesign: config.enablePrivacyByDesign !== false,
      defaultRetentionPeriod: config.defaultRetentionPeriod || 365 * 24 * 60 * 60 * 1000, // 1 year
      anonymizationDelay: config.anonymizationDelay || 30 * 24 * 60 * 60 * 1000, // 30 days
      ...config
    };
    
    this.dataClassifications = new Map();
    this.consentRecords = new Map();
    this.retentionPolicies = new Map();
    this.dataSubjects = new Map();
    this.privacyRequests = new Map();
    this.metrics = {
      dataClassified: 0,
      consentRecords: 0,
      privacyRequests: 0,
      dataErased: 0,
      dataAnonymized: 0
    };
    
    this.initializeDataClassifications();
    this.initializeRetentionPolicies();
  }

  /**
   * Initialize data classifications
   */
  initializeDataClassifications() {
    const classifications = [
      {
        id: 'public',
        name: 'Public Data',
        level: 0,
        description: 'Data that can be freely shared',
        retention: 'indefinite',
        maskingRequired: false
      },
      {
        id: 'internal',
        name: 'Internal Data',
        level: 1,
        description: 'Data for internal use only',
        retention: '7_years',
        maskingRequired: false
      },
      {
        id: 'confidential',
        name: 'Confidential Data',
        level: 2,
        description: 'Sensitive business data',
        retention: '5_years',
        maskingRequired: true
      },
      {
        id: 'restricted',
        name: 'Restricted Data',
        level: 3,
        description: 'Highly sensitive data',
        retention: '3_years',
        maskingRequired: true
      },
      {
        id: 'pii',
        name: 'Personally Identifiable Information',
        level: 4,
        description: 'Personal data subject to privacy laws',
        retention: 'consent_based',
        maskingRequired: true,
        requiresConsent: true
      },
      {
        id: 'phi',
        name: 'Protected Health Information',
        level: 5,
        description: 'Health information protected by HIPAA',
        retention: '6_years',
        maskingRequired: true,
        requiresConsent: true,
        specialHandling: true
      }
    ];

    classifications.forEach(classification => {
      this.dataClassifications.set(classification.id, classification);
    });
  }

  /**
   * Initialize retention policies
   */
  initializeRetentionPolicies() {
    const policies = [
      {
        id: 'user_data',
        name: 'User Data Retention',
        dataTypes: ['pii', 'user_preferences'],
        retentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
        action: 'anonymize',
        consentRequired: true
      },
      {
        id: 'transaction_data',
        name: 'Transaction Data Retention',
        dataTypes: ['financial', 'payment'],
        retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
        action: 'archive',
        legalBasis: 'legal_obligation'
      },
      {
        id: 'log_data',
        name: 'Log Data Retention',
        dataTypes: ['access_logs', 'audit_logs'],
        retentionPeriod: 1 * 365 * 24 * 60 * 60 * 1000, // 1 year
        action: 'delete',
        legalBasis: 'legitimate_interest'
      },
      {
        id: 'marketing_data',
        name: 'Marketing Data Retention',
        dataTypes: ['marketing_preferences', 'campaign_data'],
        retentionPeriod: 3 * 365 * 24 * 60 * 60 * 1000, // 3 years
        action: 'anonymize',
        consentRequired: true
      }
    ];

    policies.forEach(policy => {
      this.retentionPolicies.set(policy.id, policy);
    });
  }

  /**
   * Initialize the data privacy manager
   */
  async initialize() {
    // Setup retention policy enforcement
    setInterval(() => {
      this.enforceRetentionPolicies();
    }, 24 * 60 * 60 * 1000); // Daily

    // Setup consent expiry checks
    setInterval(() => {
      this.checkConsentExpiry();
    }, 60 * 60 * 1000); // Hourly

    // Setup privacy request processing
    setInterval(() => {
      this.processPrivacyRequests();
    }, 60 * 60 * 1000); // Hourly

    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      classifications: this.dataClassifications.size,
      retentionPolicies: this.retentionPolicies.size
    });
  }

  /**
   * Classify data
   */
  classifyData(data, context = {}) {
    const classification = this.determineDataClassification(data, context);
    
    const classifiedData = {
      originalData: data,
      classification: classification.id,
      classificationLevel: classification.level,
      timestamp: new Date().toISOString(),
      context,
      requiresConsent: classification.requiresConsent || false,
      maskingRequired: classification.maskingRequired || false,
      specialHandling: classification.specialHandling || false
    };

    this.metrics.dataClassified++;

    this.emit('dataClassified', {
      classification: classification.id,
      level: classification.level,
      requiresConsent: classification.requiresConsent,
      timestamp: new Date().toISOString()
    });

    return classifiedData;
  }

  /**
   * Determine data classification
   */
  determineDataClassification(data, context) {
    // Check for PHI patterns
    if (this.containsPHI(data)) {
      return this.dataClassifications.get('phi');
    }

    // Check for PII patterns
    if (this.containsPII(data)) {
      return this.dataClassifications.get('pii');
    }

    // Check for financial data
    if (this.containsFinancialData(data)) {
      return this.dataClassifications.get('restricted');
    }

    // Check context for classification hints
    if (context.dataType) {
      const classification = this.dataClassifications.get(context.dataType);
      if (classification) {
        return classification;
      }
    }

    // Default to internal classification
    return this.dataClassifications.get('internal');
  }

  /**
   * Check if data contains PII
   */
  containsPII(data) {
    const dataString = JSON.stringify(data).toLowerCase();
    
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone number
      /\b\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|place|pl)\b/i, // Address
      /(first.?name|last.?name|full.?name|given.?name|surname)/i,
      /(date.?of.?birth|dob|birth.?date)/i
    ];

    return piiPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Check if data contains PHI
   */
  containsPHI(data) {
    const dataString = JSON.stringify(data).toLowerCase();
    
    const phiPatterns = [
      /(medical|health|diagnosis|treatment|prescription|medication)/i,
      /(patient|doctor|physician|hospital|clinic)/i,
      /(blood.?pressure|heart.?rate|temperature|weight|height)/i,
      /(insurance|policy.?number|member.?id)/i,
      /\b\d{10}\b/ // Medical record numbers (simplified)
    ];

    return phiPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Check if data contains financial information
   */
  containsFinancialData(data) {
    const dataString = JSON.stringify(data).toLowerCase();
    
    const financialPatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{9}\b/, // Routing number
      /(account.?number|routing.?number|credit.?card|debit.?card)/i,
      /(salary|income|tax|financial|banking)/i
    ];

    return financialPatterns.some(pattern => pattern.test(dataString));
  }

  /**
   * Mask sensitive data
   */
  maskData(data, classification) {
    if (!this.config.enableDataMasking) {
      return data;
    }

    const classificationInfo = this.dataClassifications.get(classification);
    
    if (!classificationInfo || !classificationInfo.maskingRequired) {
      return data;
    }

    return this.applyDataMasking(data, classificationInfo);
  }

  /**
   * Apply data masking
   */
  applyDataMasking(data, classification) {
    if (typeof data === 'string') {
      return this.maskString(data);
    }

    if (typeof data === 'object' && data !== null) {
      const masked = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveField(key)) {
          masked[key] = this.maskValue(value, key);
        } else {
          masked[key] = this.applyDataMasking(value, classification);
        }
      }
      
      return masked;
    }

    return data;
  }

  /**
   * Mask string value
   */
  maskString(str) {
    if (str.length <= 4) {
      return '*'.repeat(str.length);
    }
    
    const visibleChars = 2;
    const maskedLength = str.length - (visibleChars * 2);
    
    return str.substring(0, visibleChars) + 
           '*'.repeat(maskedLength) + 
           str.substring(str.length - visibleChars);
  }

  /**
   * Mask specific value based on field type
   */
  maskValue(value, fieldName) {
    const field = fieldName.toLowerCase();
    
    if (field.includes('email')) {
      return this.maskEmail(value);
    }
    
    if (field.includes('phone')) {
      return this.maskPhone(value);
    }
    
    if (field.includes('ssn') || field.includes('social')) {
      return this.maskSSN(value);
    }
    
    if (field.includes('card') || field.includes('credit')) {
      return this.maskCreditCard(value);
    }
    
    return this.maskString(String(value));
  }

  /**
   * Mask email address
   */
  maskEmail(email) {
    if (!email || typeof email !== 'string') return email;
    
    const [local, domain] = email.split('@');
    if (!domain) return this.maskString(email);
    
    const maskedLocal = local.length > 2 ? 
      local[0] + '*'.repeat(local.length - 2) + local[local.length - 1] : 
      '*'.repeat(local.length);
    
    return `${maskedLocal}@${domain}`;
  }

  /**
   * Mask phone number
   */
  maskPhone(phone) {
    if (!phone || typeof phone !== 'string') return phone;
    
    const digits = phone.replace(/\D/g, '');
    if (digits.length >= 10) {
      return phone.replace(/\d(?=\d{4})/g, '*');
    }
    
    return this.maskString(phone);
  }

  /**
   * Mask SSN
   */
  maskSSN(ssn) {
    if (!ssn || typeof ssn !== 'string') return ssn;
    
    return ssn.replace(/\d(?=\d{4})/g, '*');
  }

  /**
   * Mask credit card number
   */
  maskCreditCard(cardNumber) {
    if (!cardNumber || typeof cardNumber !== 'string') return cardNumber;
    
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length >= 12) {
      return cardNumber.replace(/\d(?=\d{4})/g, '*');
    }
    
    return this.maskString(cardNumber);
  }

  /**
   * Check if field is sensitive
   */
  isSensitiveField(fieldName) {
    const sensitiveFields = [
      'password', 'ssn', 'social', 'credit', 'card', 'account',
      'phone', 'email', 'address', 'name', 'dob', 'birth'
    ];
    
    const field = fieldName.toLowerCase();
    return sensitiveFields.some(sensitive => field.includes(sensitive));
  }

  /**
   * Anonymize data
   */
  anonymizeData(data, options = {}) {
    if (!this.config.enableDataAnonymization) {
      return data;
    }

    const anonymized = this.performAnonymization(data, options);
    
    this.metrics.dataAnonymized++;
    
    this.emit('dataAnonymized', {
      originalSize: JSON.stringify(data).length,
      anonymizedSize: JSON.stringify(anonymized).length,
      timestamp: new Date().toISOString()
    });

    return anonymized;
  }

  /**
   * Perform data anonymization
   */
  performAnonymization(data, options) {
    if (typeof data === 'object' && data !== null) {
      const anonymized = {};
      
      for (const [key, value] of Object.entries(data)) {
        if (this.shouldAnonymizeField(key, options)) {
          anonymized[key] = this.generateAnonymousValue(value, key);
        } else {
          anonymized[key] = this.performAnonymization(value, options);
        }
      }
      
      return anonymized;
    }
    
    return data;
  }

  /**
   * Check if field should be anonymized
   */
  shouldAnonymizeField(fieldName, options) {
    if (options.preserveFields && options.preserveFields.includes(fieldName)) {
      return false;
    }
    
    return this.isSensitiveField(fieldName);
  }

  /**
   * Generate anonymous value
   */
  generateAnonymousValue(originalValue, fieldName) {
    const field = fieldName.toLowerCase();
    
    if (field.includes('email')) {
      return `user${crypto.randomInt(1000, 9999)}@example.com`;
    }
    
    if (field.includes('name')) {
      return `User${crypto.randomInt(1000, 9999)}`;
    }
    
    if (field.includes('phone')) {
      return `555-${crypto.randomInt(100, 999)}-${crypto.randomInt(1000, 9999)}`;
    }
    
    if (field.includes('address')) {
      return `${crypto.randomInt(100, 999)} Anonymous St`;
    }
    
    if (typeof originalValue === 'number') {
      return crypto.randomInt(1, 1000);
    }
    
    if (typeof originalValue === 'string') {
      return `anonymous_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    return null;
  }

  /**
   * Record consent
   */
  recordConsent(subjectId, consentData) {
    const consentRecord = {
      id: crypto.randomUUID(),
      subjectId,
      purposes: consentData.purposes || [],
      granted: consentData.granted !== false,
      grantedAt: new Date().toISOString(),
      expiresAt: consentData.expiresAt,
      withdrawnAt: null,
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent,
      consentMethod: consentData.method || 'explicit',
      legalBasis: consentData.legalBasis || 'consent',
      version: consentData.version || '1.0'
    };

    this.consentRecords.set(consentRecord.id, consentRecord);
    this.metrics.consentRecords++;

    this.emit('consentRecorded', {
      consentId: consentRecord.id,
      subjectId,
      purposes: consentRecord.purposes,
      granted: consentRecord.granted,
      timestamp: consentRecord.grantedAt
    });

    return consentRecord;
  }

  /**
   * Withdraw consent
   */
  withdrawConsent(consentId, withdrawalData = {}) {
    const consentRecord = this.consentRecords.get(consentId);
    
    if (!consentRecord) {
      throw new Error('Consent record not found');
    }

    consentRecord.granted = false;
    consentRecord.withdrawnAt = new Date().toISOString();
    consentRecord.withdrawalReason = withdrawalData.reason;
    consentRecord.withdrawalMethod = withdrawalData.method || 'explicit';

    this.emit('consentWithdrawn', {
      consentId,
      subjectId: consentRecord.subjectId,
      withdrawnAt: consentRecord.withdrawnAt,
      reason: withdrawalData.reason
    });

    return consentRecord;
  }

  /**
   * Check consent validity
   */
  checkConsent(subjectId, purpose) {
    const subjectConsents = Array.from(this.consentRecords.values())
      .filter(consent => consent.subjectId === subjectId && consent.granted);

    const relevantConsent = subjectConsents.find(consent => 
      consent.purposes.includes(purpose) || consent.purposes.includes('all')
    );

    if (!relevantConsent) {
      return { valid: false, reason: 'NO_CONSENT' };
    }

    // Check expiry
    if (relevantConsent.expiresAt && new Date() > new Date(relevantConsent.expiresAt)) {
      return { valid: false, reason: 'CONSENT_EXPIRED' };
    }

    return { 
      valid: true, 
      consent: relevantConsent,
      grantedAt: relevantConsent.grantedAt
    };
  }

  /**
   * Process privacy request (GDPR Article 15-22)
   */
  async processPrivacyRequest(requestData) {
    const request = {
      id: crypto.randomUUID(),
      type: requestData.type, // 'access', 'rectification', 'erasure', 'portability', 'restriction'
      subjectId: requestData.subjectId,
      email: requestData.email,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      verificationRequired: true,
      verificationCode: crypto.randomBytes(16).toString('hex'),
      data: requestData.data,
      reason: requestData.reason
    };

    this.privacyRequests.set(request.id, request);
    this.metrics.privacyRequests++;

    this.emit('privacyRequestReceived', {
      requestId: request.id,
      type: request.type,
      subjectId: request.subjectId,
      timestamp: request.requestedAt
    });

    // Send verification email (would be implemented)
    await this.sendVerificationEmail(request);

    return request;
  }

  /**
   * Verify privacy request
   */
  verifyPrivacyRequest(requestId, verificationCode) {
    const request = this.privacyRequests.get(requestId);
    
    if (!request) {
      throw new Error('Privacy request not found');
    }

    if (request.verificationCode !== verificationCode) {
      throw new Error('Invalid verification code');
    }

    request.status = 'verified';
    request.verifiedAt = new Date().toISOString();

    this.emit('privacyRequestVerified', {
      requestId,
      type: request.type,
      subjectId: request.subjectId,
      timestamp: request.verifiedAt
    });

    return request;
  }

  /**
   * Fulfill privacy request
   */
  async fulfillPrivacyRequest(requestId) {
    const request = this.privacyRequests.get(requestId);
    
    if (!request || request.status !== 'verified') {
      throw new Error('Request not found or not verified');
    }

    let result;

    switch (request.type) {
      case 'access':
        result = await this.fulfillAccessRequest(request);
        break;
      case 'rectification':
        result = await this.fulfillRectificationRequest(request);
        break;
      case 'erasure':
        result = await this.fulfillErasureRequest(request);
        break;
      case 'portability':
        result = await this.fulfillPortabilityRequest(request);
        break;
      case 'restriction':
        result = await this.fulfillRestrictionRequest(request);
        break;
      default:
        throw new Error(`Unsupported request type: ${request.type}`);
    }

    request.status = 'fulfilled';
    request.fulfilledAt = new Date().toISOString();
    request.result = result;

    this.emit('privacyRequestFulfilled', {
      requestId,
      type: request.type,
      subjectId: request.subjectId,
      timestamp: request.fulfilledAt
    });

    return result;
  }

  /**
   * Fulfill data access request
   */
  async fulfillAccessRequest(request) {
    // This would query all systems for the subject's data
    const userData = await this.collectUserData(request.subjectId);
    
    return {
      type: 'data_export',
      format: 'json',
      data: userData,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Fulfill data erasure request
   */
  async fulfillErasureRequest(request) {
    // This would delete/anonymize the subject's data across all systems
    const deletionResult = await this.eraseUserData(request.subjectId);
    
    this.metrics.dataErased++;
    
    return {
      type: 'data_erasure',
      recordsDeleted: deletionResult.deleted,
      recordsAnonymized: deletionResult.anonymized,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Fulfill data portability request
   */
  async fulfillPortabilityRequest(request) {
    const userData = await this.collectUserData(request.subjectId);
    const portableData = this.formatForPortability(userData);
    
    return {
      type: 'data_portability',
      format: 'json',
      data: portableData,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Utility methods
   */
  async collectUserData(subjectId) {
    // Mock implementation - would query actual data sources
    return {
      profile: { id: subjectId, name: 'User Name' },
      preferences: { theme: 'dark', language: 'en' },
      activity: { lastLogin: new Date().toISOString() }
    };
  }

  async eraseUserData(subjectId) {
    // Mock implementation - would delete from actual data sources
    return {
      deleted: 15,
      anonymized: 5
    };
  }

  formatForPortability(data) {
    // Format data in a portable format
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      data
    };
  }

  async sendVerificationEmail(request) {
    // Mock implementation - would send actual email
    console.log(`Verification email sent for request ${request.id}`);
  }

  enforceRetentionPolicies() {
    // Implementation for retention policy enforcement
  }

  checkConsentExpiry() {
    // Implementation for consent expiry checks
  }

  processPrivacyRequests() {
    // Implementation for processing pending privacy requests
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      classifications: this.dataClassifications.size,
      retentionPolicies: this.retentionPolicies.size,
      consentRecords: this.consentRecords.size,
      privacyRequests: this.privacyRequests.size,
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { DataPrivacyManager };
