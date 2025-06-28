/**
 * GDPR Compliance Manager
 * Implements General Data Protection Regulation (EU) 2016/679
 * Provides comprehensive GDPR compliance automation
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class GDPRManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // GDPR-specific settings
      enabled: config.enabled !== false,
      jurisdiction: 'EU',
      
      // Data processing lawful bases (Article 6)
      lawfulBases: {
        consent: { enabled: true, ...config.consent },
        contract: { enabled: true, ...config.contract },
        legalObligation: { enabled: true, ...config.legalObligation },
        vitalInterests: { enabled: false, ...config.vitalInterests },
        publicTask: { enabled: false, ...config.publicTask },
        legitimateInterests: { enabled: true, ...config.legitimateInterests }
      },
      
      // Data subject rights (Chapter III)
      dataSubjectRights: {
        access: { enabled: true, responseTime: 2592000000 }, // 30 days
        rectification: { enabled: true, responseTime: 2592000000 },
        erasure: { enabled: true, responseTime: 2592000000 },
        restriction: { enabled: true, responseTime: 2592000000 },
        portability: { enabled: true, responseTime: 2592000000 },
        objection: { enabled: true, responseTime: 2592000000 },
        ...config.dataSubjectRights
      },
      
      // Data retention (Article 5)
      dataRetention: {
        defaultPeriod: 63072000000, // 2 years
        consentBased: 31536000000, // 1 year after consent withdrawal
        contractBased: 189216000000, // 6 years for contracts
        legalObligation: 220752000000, // 7 years for legal requirements
        ...config.dataRetention
      },
      
      // Data protection principles (Article 5)
      principles: {
        lawfulness: true,
        fairness: true,
        transparency: true,
        purposeLimitation: true,
        dataMinimisation: true,
        accuracy: true,
        storageLimitation: true,
        integrityConfidentiality: true,
        accountability: true
      },
      
      // Breach notification (Articles 33-34)
      breachNotification: {
        supervisoryAuthorityDeadline: 259200000, // 72 hours
        dataSubjectDeadline: 259200000, // 72 hours
        riskThreshold: 'high',
        ...config.breachNotification
      },
      
      ...config
    };

    this.state = {
      dataProcessingActivities: new Map(),
      consentRecords: new Map(),
      dataSubjectRequests: new Map(),
      breachIncidents: new Map(),
      lawfulnessAssessments: new Map(),
      privacyImpactAssessments: new Map(),
      dataTransfers: new Map()
    };

    this.metrics = {
      dataSubjectRequests: 0,
      consentWithdrawals: 0,
      breachNotifications: 0,
      privacyImpactAssessments: 0,
      dataTransfers: 0,
      complianceViolations: 0
    };

    this.init();
  }

  async init() {
    console.log('🇪🇺 Initializing GDPR Compliance Manager...');
    
    // Setup data retention monitoring
    setInterval(() => this.monitorDataRetention(), 86400000); // Daily
    
    // Setup consent monitoring
    setInterval(() => this.monitorConsent(), 3600000); // Hourly
    
    // Setup breach detection
    setInterval(() => this.detectPotentialBreaches(), 1800000); // 30 minutes
    
    console.log('✅ GDPR Compliance Manager initialized');
  }

  // Core GDPR compliance verification
  async verifyCompliance(request) {
    try {
      const verification = {
        compliant: true,
        violations: [],
        details: [],
        lawfulBasis: null,
        consentStatus: null,
        dataMinimization: true,
        purposeLimitation: true
      };

      // Check lawful basis for processing (Article 6)
      const lawfulBasisCheck = await this.checkLawfulBasis(request);
      verification.lawfulBasis = lawfulBasisCheck.basis;
      
      if (!lawfulBasisCheck.valid) {
        verification.compliant = false;
        verification.violations.push({
          article: 'Article 6',
          type: 'NO_LAWFUL_BASIS',
          description: 'No valid lawful basis for data processing'
        });
      }

      // Check consent if required
      if (lawfulBasisCheck.basis === 'consent') {
        const consentCheck = await this.checkConsent(request);
        verification.consentStatus = consentCheck;
        
        if (!consentCheck.valid) {
          verification.compliant = false;
          verification.violations.push({
            article: 'Article 7',
            type: 'INVALID_CONSENT',
            description: consentCheck.reason
          });
        }
      }

      // Check data minimization (Article 5(1)(c))
      const minimizationCheck = await this.checkDataMinimization(request);
      verification.dataMinimization = minimizationCheck.compliant;
      
      if (!minimizationCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          article: 'Article 5(1)(c)',
          type: 'DATA_MINIMIZATION_VIOLATION',
          description: 'Processing more data than necessary'
        });
      }

      // Check purpose limitation (Article 5(1)(b))
      const purposeCheck = await this.checkPurposeLimitation(request);
      verification.purposeLimitation = purposeCheck.compliant;
      
      if (!purposeCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          article: 'Article 5(1)(b)',
          type: 'PURPOSE_LIMITATION_VIOLATION',
          description: 'Data used for incompatible purposes'
        });
      }

      // Check data retention (Article 5(1)(e))
      const retentionCheck = await this.checkDataRetention(request);
      if (!retentionCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          article: 'Article 5(1)(e)',
          type: 'RETENTION_VIOLATION',
          description: 'Data retained longer than necessary'
        });
      }

      return verification;

    } catch (error) {
      console.error('❌ GDPR compliance verification failed:', error);
      return {
        compliant: false,
        violations: [{ type: 'SYSTEM_ERROR', description: error.message }],
        error: error.message
      };
    }
  }

  // Lawful basis assessment (Article 6)
  async checkLawfulBasis(request) {
    try {
      const { userId, dataType, processingPurpose, userConsent } = request;
      
      // Check each lawful basis in order of preference
      
      // 1. Consent (Article 6(1)(a))
      if (this.config.lawfulBases.consent.enabled && userConsent) {
        const consentValid = await this.validateConsent(userId, processingPurpose);
        if (consentValid) {
          return { valid: true, basis: 'consent' };
        }
      }
      
      // 2. Contract (Article 6(1)(b))
      if (this.config.lawfulBases.contract.enabled) {
        const contractNecessary = await this.checkContractNecessity(userId, processingPurpose);
        if (contractNecessary) {
          return { valid: true, basis: 'contract' };
        }
      }
      
      // 3. Legal obligation (Article 6(1)(c))
      if (this.config.lawfulBases.legalObligation.enabled) {
        const legallyRequired = await this.checkLegalObligation(processingPurpose);
        if (legallyRequired) {
          return { valid: true, basis: 'legalObligation' };
        }
      }
      
      // 4. Legitimate interests (Article 6(1)(f))
      if (this.config.lawfulBases.legitimateInterests.enabled) {
        const legitimateInterest = await this.assessLegitimateInterests(request);
        if (legitimateInterest.valid) {
          return { valid: true, basis: 'legitimateInterests' };
        }
      }
      
      return { valid: false, basis: null, reason: 'No valid lawful basis found' };

    } catch (error) {
      console.error('❌ Lawful basis check failed:', error);
      return { valid: false, basis: null, error: error.message };
    }
  }

  // Consent validation (Article 7)
  async checkConsent(request) {
    try {
      const { userId, processingPurpose } = request;
      
      // Get consent record
      const consentRecord = await this.getConsentRecord(userId, processingPurpose);
      
      if (!consentRecord) {
        return { valid: false, reason: 'No consent record found' };
      }
      
      // Check consent validity criteria (Article 7)
      const checks = {
        freely_given: this.isConsentFreelyGiven(consentRecord),
        specific: this.isConsentSpecific(consentRecord, processingPurpose),
        informed: this.isConsentInformed(consentRecord),
        unambiguous: this.isConsentUnambiguous(consentRecord),
        not_withdrawn: !this.isConsentWithdrawn(consentRecord),
        not_expired: !this.isConsentExpired(consentRecord)
      };
      
      const allValid = Object.values(checks).every(check => check === true);
      
      return {
        valid: allValid,
        checks,
        consentId: consentRecord.id,
        grantedAt: consentRecord.timestamp,
        reason: allValid ? 'Valid consent' : 'Consent validation failed'
      };

    } catch (error) {
      console.error('❌ Consent check failed:', error);
      return { valid: false, error: error.message };
    }
  }

  // Data minimization check (Article 5(1)(c))
  async checkDataMinimization(request) {
    try {
      const { dataFields, processingPurpose } = request;
      
      // Get necessary data fields for the purpose
      const necessaryFields = await this.getNecessaryDataFields(processingPurpose);
      
      // Check if requested fields exceed necessary fields
      const excessiveFields = dataFields.filter(field => 
        !necessaryFields.includes(field)
      );
      
      return {
        compliant: excessiveFields.length === 0,
        necessaryFields,
        requestedFields: dataFields,
        excessiveFields,
        reason: excessiveFields.length > 0 ? 
          `Excessive data fields: ${excessiveFields.join(', ')}` : 
          'Data minimization compliant'
      };

    } catch (error) {
      console.error('❌ Data minimization check failed:', error);
      return { compliant: false, error: error.message };
    }
  }

  // Purpose limitation check (Article 5(1)(b))
  async checkPurposeLimitation(request) {
    try {
      const { userId, currentPurpose, originalPurpose } = request;
      
      if (!originalPurpose) {
        // First-time processing - check if purpose is specified
        return {
          compliant: currentPurpose && currentPurpose.length > 0,
          reason: currentPurpose ? 'Purpose specified' : 'No purpose specified'
        };
      }
      
      // Check if current purpose is compatible with original
      const compatibility = await this.assessPurposeCompatibility(
        originalPurpose, 
        currentPurpose
      );
      
      return {
        compliant: compatibility.compatible,
        originalPurpose,
        currentPurpose,
        compatibility,
        reason: compatibility.compatible ? 
          'Compatible purpose' : 
          'Incompatible purpose change'
      };

    } catch (error) {
      console.error('❌ Purpose limitation check failed:', error);
      return { compliant: false, error: error.message };
    }
  }

  // Data retention monitoring (Article 5(1)(e))
  async checkDataRetention(request) {
    try {
      const { userId, dataType, processingPurpose, dataAge } = request;
      
      // Get retention period for this data type and purpose
      const retentionPeriod = await this.getRetentionPeriod(dataType, processingPurpose);
      
      const compliant = dataAge <= retentionPeriod;
      
      return {
        compliant,
        dataAge,
        retentionPeriod,
        excessDays: compliant ? 0 : Math.ceil((dataAge - retentionPeriod) / 86400000),
        reason: compliant ? 
          'Within retention period' : 
          'Data retained beyond allowed period'
      };

    } catch (error) {
      console.error('❌ Data retention check failed:', error);
      return { compliant: false, error: error.message };
    }
  }

  // Data subject rights handling (Chapter III)
  async handleDataSubjectRequest(request) {
    try {
      const { type, userId, email, details } = request;
      
      const response = {
        requestId: crypto.randomUUID(),
        type,
        userId,
        email,
        status: 'RECEIVED',
        receivedAt: Date.now(),
        deadline: Date.now() + this.config.dataSubjectRights[type.toLowerCase()].responseTime,
        result: null
      };

      // Verify identity
      const identityVerified = await this.verifyDataSubjectIdentity(userId, email);
      if (!identityVerified) {
        response.status = 'IDENTITY_VERIFICATION_REQUIRED';
        return response;
      }

      // Process request based on type
      switch (type.toUpperCase()) {
        case 'ACCESS':
          response.result = await this.processAccessRequest(userId);
          break;
          
        case 'RECTIFICATION':
          response.result = await this.processRectificationRequest(userId, details);
          break;
          
        case 'ERASURE':
          response.result = await this.processErasureRequest(userId);
          break;
          
        case 'RESTRICTION':
          response.result = await this.processRestrictionRequest(userId);
          break;
          
        case 'PORTABILITY':
          response.result = await this.processPortabilityRequest(userId);
          break;
          
        case 'OBJECTION':
          response.result = await this.processObjectionRequest(userId, details);
          break;
          
        default:
          throw new Error(`Unsupported request type: ${type}`);
      }

      response.status = 'COMPLETED';
      response.completedAt = Date.now();

      // Store request record
      this.state.dataSubjectRequests.set(response.requestId, response);
      this.metrics.dataSubjectRequests++;

      // Log the request
      await this.logGDPRActivity({
        type: 'data_subject_request',
        requestType: type,
        userId,
        requestId: response.requestId,
        status: response.status,
        timestamp: Date.now()
      });

      return response;

    } catch (error) {
      console.error('❌ Data subject request handling failed:', error);
      return {
        requestId: crypto.randomUUID(),
        status: 'FAILED',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Right of access (Article 15)
  async processAccessRequest(userId) {
    try {
      const accessData = {
        personalData: await this.collectPersonalData(userId),
        processingPurposes: await this.getProcessingPurposes(userId),
        dataCategories: await this.getDataCategories(userId),
        recipients: await this.getDataRecipients(userId),
        retentionPeriods: await this.getRetentionPeriods(userId),
        dataSubjectRights: this.getDataSubjectRights(),
        dataSource: await this.getDataSource(userId),
        automatedDecisionMaking: await this.getAutomatedDecisionInfo(userId),
        thirdCountryTransfers: await this.getThirdCountryTransfers(userId)
      };

      return {
        format: 'structured',
        data: accessData,
        generatedAt: Date.now()
      };

    } catch (error) {
      console.error('❌ Access request processing failed:', error);
      throw error;
    }
  }

  // Right to rectification (Article 16)
  async processRectificationRequest(userId, corrections) {
    try {
      const rectificationResult = {
        correctedFields: [],
        rejectedCorrections: [],
        notificationsSent: []
      };

      for (const correction of corrections) {
        try {
          // Validate correction
          const isValid = await this.validateCorrection(userId, correction);
          
          if (isValid) {
            // Apply correction
            await this.applyDataCorrection(userId, correction);
            rectificationResult.correctedFields.push(correction.field);
            
            // Notify recipients if required
            const notifications = await this.notifyRecipientsOfRectification(userId, correction);
            rectificationResult.notificationsSent.push(...notifications);
            
          } else {
            rectificationResult.rejectedCorrections.push({
              field: correction.field,
              reason: 'Invalid correction data'
            });
          }
        } catch (error) {
          rectificationResult.rejectedCorrections.push({
            field: correction.field,
            reason: error.message
          });
        }
      }

      return rectificationResult;

    } catch (error) {
      console.error('❌ Rectification request processing failed:', error);
      throw error;
    }
  }

  // Right to erasure (Article 17)
  async processErasureRequest(userId) {
    try {
      // Check if erasure is required
      const erasureAssessment = await this.assessErasureRequirement(userId);
      
      if (!erasureAssessment.required) {
        return {
          erased: false,
          reason: erasureAssessment.reason,
          legalBasisForRetention: erasureAssessment.legalBasis
        };
      }

      const erasureResult = {
        erased: true,
        erasedData: [],
        retainedData: [],
        notificationsSent: [],
        completedAt: Date.now()
      };

      // Erase personal data
      const erasedItems = await this.erasePersonalData(userId);
      erasureResult.erasedData = erasedItems;

      // Check for data that must be retained
      const retainedItems = await this.identifyRetainedData(userId);
      erasureResult.retainedData = retainedItems;

      // Notify recipients and third parties
      const notifications = await this.notifyRecipientsOfErasure(userId);
      erasureResult.notificationsSent = notifications;

      return erasureResult;

    } catch (error) {
      console.error('❌ Erasure request processing failed:', error);
      throw error;
    }
  }

  // Breach notification (Articles 33-34)
  async handleDataBreach(incident) {
    try {
      const breach = {
        id: crypto.randomUUID(),
        type: incident.type,
        description: incident.description,
        affectedDataSubjects: incident.affectedDataSubjects || 0,
        dataCategories: incident.dataCategories || [],
        riskLevel: incident.riskLevel || 'medium',
        detectedAt: Date.now(),
        reportedAt: null,
        notifiedAt: null,
        status: 'DETECTED'
      };

      // Assess breach risk
      const riskAssessment = await this.assessBreachRisk(breach);
      breach.riskLevel = riskAssessment.level;
      breach.riskFactors = riskAssessment.factors;

      // Store breach record
      this.state.breachIncidents.set(breach.id, breach);

      // Notify supervisory authority if required (Article 33)
      if (this.requiresSupervisoryAuthorityNotification(breach)) {
        await this.notifySupervisoryAuthority(breach);
        breach.reportedAt = Date.now();
        breach.status = 'REPORTED_TO_AUTHORITY';
      }

      // Notify data subjects if required (Article 34)
      if (this.requiresDataSubjectNotification(breach)) {
        await this.notifyDataSubjects(breach);
        breach.notifiedAt = Date.now();
        breach.status = 'DATA_SUBJECTS_NOTIFIED';
      }

      // Log breach incident
      await this.logGDPRActivity({
        type: 'data_breach',
        breachId: breach.id,
        riskLevel: breach.riskLevel,
        affectedDataSubjects: breach.affectedDataSubjects,
        timestamp: Date.now()
      });

      this.metrics.breachNotifications++;

      return breach;

    } catch (error) {
      console.error('❌ Data breach handling failed:', error);
      throw error;
    }
  }

  // Privacy Impact Assessment (Article 35)
  async conductPrivacyImpactAssessment(processing) {
    try {
      const pia = {
        id: crypto.randomUUID(),
        processingActivity: processing.name,
        description: processing.description,
        dataTypes: processing.dataTypes,
        purposes: processing.purposes,
        conductedAt: Date.now(),
        riskLevel: 'unknown',
        risks: [],
        mitigations: [],
        conclusion: null
      };

      // Assess if PIA is required
      const piaRequired = await this.isPIARequired(processing);
      
      if (!piaRequired.required) {
        pia.conclusion = 'PIA not required';
        pia.reason = piaRequired.reason;
        return pia;
      }

      // Identify privacy risks
      pia.risks = await this.identifyPrivacyRisks(processing);

      // Assess overall risk level
      pia.riskLevel = this.calculatePIARiskLevel(pia.risks);

      // Recommend mitigations
      pia.mitigations = await this.recommendMitigations(pia.risks);

      // Determine if processing can proceed
      pia.conclusion = this.determinePIAConclusion(pia);

      // Store PIA record
      this.state.privacyImpactAssessments.set(pia.id, pia);
      this.metrics.privacyImpactAssessments++;

      // Log PIA
      await this.logGDPRActivity({
        type: 'privacy_impact_assessment',
        piaId: pia.id,
        processingActivity: processing.name,
        riskLevel: pia.riskLevel,
        timestamp: Date.now()
      });

      return pia;

    } catch (error) {
      console.error('❌ Privacy Impact Assessment failed:', error);
      throw error;
    }
  }

  // Data processing activity monitoring
  async monitorDataRetention() {
    try {
      console.log('🕐 Monitoring GDPR data retention...');
      
      let violationsFound = 0;
      const now = Date.now();

      // Check all data processing activities
      for (const [activityId, activity] of this.state.dataProcessingActivities) {
        const retentionPeriod = this.getRetentionPeriod(
          activity.dataType, 
          activity.purpose
        );
        
        if (now - activity.createdAt > retentionPeriod) {
          // Data retention violation
          await this.handleRetentionViolation(activity);
          violationsFound++;
        }
      }

      if (violationsFound > 0) {
        console.log(`⚠️ Found ${violationsFound} GDPR retention violations`);
      }

    } catch (error) {
      console.error('❌ GDPR retention monitoring failed:', error);
    }
  }

  async monitorConsent() {
    try {
      console.log('✋ Monitoring GDPR consent status...');
      
      let expiredConsents = 0;
      const now = Date.now();

      // Check all consent records
      for (const [consentId, consent] of this.state.consentRecords) {
        if (this.isConsentExpired(consent)) {
          // Handle expired consent
          await this.handleExpiredConsent(consent);
          expiredConsents++;
        }
      }

      if (expiredConsents > 0) {
        console.log(`⚠️ Found ${expiredConsents} expired GDPR consents`);
      }

    } catch (error) {
      console.error('❌ GDPR consent monitoring failed:', error);
    }
  }

  // Compliance scanning
  async performScan() {
    try {
      const scan = {
        scanId: crypto.randomUUID(),
        timestamp: Date.now(),
        score: 0,
        violations: [],
        recommendations: []
      };

      // Check data processing lawfulness
      const lawfulnessCheck = await this.scanDataProcessingLawfulness();
      if (lawfulnessCheck.violations.length > 0) {
        scan.violations.push(...lawfulnessCheck.violations);
      }

      // Check consent validity
      const consentCheck = await this.scanConsentValidity();
      if (consentCheck.violations.length > 0) {
        scan.violations.push(...consentCheck.violations);
      }

      // Check data retention compliance
      const retentionCheck = await this.scanDataRetention();
      if (retentionCheck.violations.length > 0) {
        scan.violations.push(...retentionCheck.violations);
      }

      // Check data subject rights handling
      const rightsCheck = await this.scanDataSubjectRights();
      if (rightsCheck.violations.length > 0) {
        scan.violations.push(...rightsCheck.violations);
      }

      // Calculate compliance score
      const totalChecks = 4;
      const passedChecks = totalChecks - scan.violations.length;
      scan.score = passedChecks / totalChecks;

      // Generate recommendations
      scan.recommendations = await this.generateGDPRRecommendations(scan.violations);

      return scan;

    } catch (error) {
      console.error('❌ GDPR compliance scan failed:', error);
      return {
        scanId: crypto.randomUUID(),
        timestamp: Date.now(),
        score: 0,
        violations: [{ type: 'SCAN_ERROR', description: error.message }],
        error: error.message
      };
    }
  }

  // Utility methods
  async validateConsent(userId, purpose) {
    const consentRecord = await this.getConsentRecord(userId, purpose);
    return consentRecord && 
           !this.isConsentWithdrawn(consentRecord) && 
           !this.isConsentExpired(consentRecord);
  }

  isConsentFreelyGiven(consent) {
    // Check if consent was given without coercion
    return !consent.coerced && !consent.bundled;
  }

  isConsentSpecific(consent, purpose) {
    // Check if consent is specific to the purpose
    return consent.purposes.includes(purpose);
  }

  isConsentInformed(consent) {
    // Check if consent was informed
    return consent.privacyNoticeProvided && consent.purposesExplained;
  }

  isConsentUnambiguous(consent) {
    // Check if consent was unambiguous
    return consent.method !== 'pre_ticked' && consent.explicit;
  }

  isConsentWithdrawn(consent) {
    return consent.withdrawnAt !== null;
  }

  isConsentExpired(consent) {
    const maxAge = 31536000000; // 1 year
    return Date.now() - consent.timestamp > maxAge;
  }

  async getRetentionPeriod(dataType, purpose) {
    // Return appropriate retention period based on data type and purpose
    const retentionMap = {
      'marketing': this.config.dataRetention.consentBased,
      'contract': this.config.dataRetention.contractBased,
      'legal': this.config.dataRetention.legalObligation,
      'default': this.config.dataRetention.defaultPeriod
    };

    return retentionMap[purpose] || retentionMap.default;
  }

  async logGDPRActivity(activity) {
    // Log GDPR-specific activities
    this.emit('gdprActivity', {
      ...activity,
      regulation: 'GDPR',
      timestamp: activity.timestamp || Date.now()
    });
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      regulation: 'GDPR',
      jurisdiction: 'EU',
      dataSubjectRequests: this.state.dataSubjectRequests.size,
      consentRecords: this.state.consentRecords.size,
      breachIncidents: this.state.breachIncidents.size,
      metrics: this.metrics
    };
  }

  // Generate compliance report
  async generateReport(timeRange) {
    return {
      regulation: 'GDPR',
      period: timeRange,
      summary: {
        dataSubjectRequests: this.metrics.dataSubjectRequests,
        consentWithdrawals: this.metrics.consentWithdrawals,
        breachNotifications: this.metrics.breachNotifications,
        complianceViolations: this.metrics.complianceViolations
      },
      violations: Array.from(this.state.breachIncidents.values())
        .filter(b => b.detectedAt >= timeRange.start),
      recommendations: await this.generateGDPRRecommendations([])
    };
  }

  // Shutdown
  async shutdown() {
    console.log('🇪🇺 Shutting down GDPR Manager...');
    
    // Clear sensitive data
    this.state.consentRecords.clear();
    this.state.dataSubjectRequests.clear();
    
    console.log('✅ GDPR Manager shutdown complete');
  }
}

module.exports = { GDPRManager };
