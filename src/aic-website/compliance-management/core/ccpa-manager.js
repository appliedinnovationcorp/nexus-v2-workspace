/**
 * CCPA Compliance Manager
 * Implements California Consumer Privacy Act (CCPA) and CPRA
 * Provides comprehensive California privacy law compliance
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CCPAManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // CCPA-specific settings
      enabled: config.enabled !== false,
      jurisdiction: 'CA-US',
      
      // Consumer rights (CCPA Section 1798.100-1798.150)
      consumerRights: {
        know: { enabled: true, responseTime: 1296000000 }, // 15 days
        delete: { enabled: true, responseTime: 1296000000 }, // 15 days
        optOut: { enabled: true, responseTime: 432000000 }, // 5 days
        nonDiscrimination: { enabled: true },
        ...config.consumerRights
      },
      
      // CPRA additional rights (effective 2023)
      cpraRights: {
        correct: { enabled: true, responseTime: 1296000000 }, // 15 days
        portability: { enabled: true, responseTime: 1296000000 }, // 15 days
        limitUse: { enabled: true, responseTime: 432000000 }, // 5 days
        ...config.cpraRights
      },
      
      // Business thresholds
      businessThresholds: {
        annualRevenue: 25000000, // $25M
        consumerRecords: 50000, // 50K consumers
        personalInfoRevenue: 0.5, // 50% of revenue
        ...config.businessThresholds
      },
      
      // Data categories (CCPA Section 1798.140)
      dataCategories: {
        identifiers: true,
        personalRecords: true,
        protectedClassifications: false,
        commercialInfo: true,
        biometricInfo: false,
        internetActivity: true,
        geolocationData: true,
        sensoryData: false,
        professionalInfo: true,
        educationInfo: false,
        inferences: true,
        ...config.dataCategories
      },
      
      // Sale and sharing opt-out
      saleOptOut: {
        enabled: true,
        globalPrivacyControl: true, // GPC support
        doNotSellLink: true,
        ...config.saleOptOut
      },
      
      // Data retention
      dataRetention: {
        defaultPeriod: 63072000000, // 2 years
        requestRecords: 63072000000, // 2 years
        optOutRecords: 94608000000, // 3 years
        ...config.dataRetention
      },
      
      ...config
    };

    this.state = {
      consumerRequests: new Map(),
      optOutRecords: new Map(),
      saleRecords: new Map(),
      dataInventory: new Map(),
      thirdPartyDisclosures: new Map(),
      privacyNotices: new Map(),
      verificationAttempts: new Map()
    };

    this.metrics = {
      consumerRequests: 0,
      optOutRequests: 0,
      deleteRequests: 0,
      knowRequests: 0,
      correctRequests: 0,
      verificationFailures: 0,
      discriminationComplaints: 0
    };

    this.init();
  }

  async init() {
    console.log('🏛️ Initializing CCPA Compliance Manager...');
    
    // Setup opt-out monitoring
    setInterval(() => this.monitorOptOutCompliance(), 3600000); // Hourly
    
    // Setup data sale monitoring
    setInterval(() => this.monitorDataSales(), 86400000); // Daily
    
    // Setup request deadline monitoring
    setInterval(() => this.monitorRequestDeadlines(), 3600000); // Hourly
    
    console.log('✅ CCPA Compliance Manager initialized');
  }

  // Core CCPA compliance verification
  async verifyCompliance(request) {
    try {
      const verification = {
        compliant: true,
        violations: [],
        details: [],
        consumerRights: true,
        optOutStatus: null,
        dataMinimization: true,
        purposeDisclosure: true
      };

      // Check if business is subject to CCPA
      const subjectToCCPA = await this.isSubjectToCCPA();
      if (!subjectToCCPA) {
        verification.details.push('Business not subject to CCPA thresholds');
        return verification;
      }

      // Check consumer rights compliance
      const rightsCheck = await this.checkConsumerRights(request);
      verification.consumerRights = rightsCheck.compliant;
      
      if (!rightsCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          section: 'Section 1798.100',
          type: 'CONSUMER_RIGHTS_VIOLATION',
          description: rightsCheck.reason
        });
      }

      // Check opt-out compliance
      const optOutCheck = await this.checkOptOutCompliance(request);
      verification.optOutStatus = optOutCheck;
      
      if (!optOutCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          section: 'Section 1798.120',
          type: 'OPT_OUT_VIOLATION',
          description: optOutCheck.reason
        });
      }

      // Check data minimization
      const minimizationCheck = await this.checkDataMinimization(request);
      verification.dataMinimization = minimizationCheck.compliant;
      
      if (!minimizationCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          section: 'Section 1798.100(c)',
          type: 'DATA_MINIMIZATION_VIOLATION',
          description: 'Collecting more data than reasonably necessary'
        });
      }

      // Check purpose disclosure
      const purposeCheck = await this.checkPurposeDisclosure(request);
      verification.purposeDisclosure = purposeCheck.compliant;
      
      if (!purposeCheck.compliant) {
        verification.compliant = false;
        verification.violations.push({
          section: 'Section 1798.100(b)',
          type: 'PURPOSE_DISCLOSURE_VIOLATION',
          description: 'Purpose not disclosed at collection'
        });
      }

      return verification;

    } catch (error) {
      console.error('❌ CCPA compliance verification failed:', error);
      return {
        compliant: false,
        violations: [{ type: 'SYSTEM_ERROR', description: error.message }],
        error: error.message
      };
    }
  }

  // Consumer request handling
  async handleConsumerRequest(request) {
    try {
      const { type, consumerId, email, verificationData } = request;
      
      const response = {
        requestId: crypto.randomUUID(),
        type,
        consumerId,
        email,
        status: 'RECEIVED',
        receivedAt: Date.now(),
        deadline: Date.now() + this.getResponseDeadline(type),
        verificationStatus: 'PENDING',
        result: null
      };

      // Verify consumer identity
      const verificationResult = await this.verifyConsumerIdentity(
        consumerId, 
        email, 
        verificationData
      );
      
      response.verificationStatus = verificationResult.status;
      
      if (verificationResult.status !== 'VERIFIED') {
        response.status = 'VERIFICATION_REQUIRED';
        this.metrics.verificationFailures++;
        return response;
      }

      // Process request based on type
      switch (type.toUpperCase()) {
        case 'KNOW':
          response.result = await this.processKnowRequest(consumerId);
          break;
          
        case 'DELETE':
          response.result = await this.processDeleteRequest(consumerId);
          break;
          
        case 'OPT_OUT':
          response.result = await this.processOptOutRequest(consumerId);
          break;
          
        case 'CORRECT':
          response.result = await this.processCorrectRequest(consumerId, request.corrections);
          break;
          
        case 'LIMIT_USE':
          response.result = await this.processLimitUseRequest(consumerId);
          break;
          
        default:
          throw new Error(`Unsupported request type: ${type}`);
      }

      response.status = 'COMPLETED';
      response.completedAt = Date.now();

      // Store request record
      this.state.consumerRequests.set(response.requestId, response);
      this.updateRequestMetrics(type);

      // Log the request
      await this.logCCPAActivity({
        type: 'consumer_request',
        requestType: type,
        consumerId,
        requestId: response.requestId,
        status: response.status,
        timestamp: Date.now()
      });

      return response;

    } catch (error) {
      console.error('❌ Consumer request handling failed:', error);
      return {
        requestId: crypto.randomUUID(),
        status: 'FAILED',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  // Right to know (CCPA Section 1798.110)
  async processKnowRequest(consumerId) {
    try {
      const knowData = {
        personalInfo: await this.collectPersonalInfo(consumerId),
        categories: await this.getPersonalInfoCategories(consumerId),
        sources: await this.getPersonalInfoSources(consumerId),
        businessPurposes: await this.getBusinessPurposes(consumerId),
        thirdParties: await this.getThirdPartyDisclosures(consumerId),
        saleInfo: await this.getSaleInformation(consumerId),
        retentionPeriods: await this.getRetentionPeriods(consumerId)
      };

      return {
        format: 'portable',
        deliveryMethod: 'secure_download',
        data: knowData,
        generatedAt: Date.now()
      };

    } catch (error) {
      console.error('❌ Know request processing failed:', error);
      throw error;
    }
  }

  // Right to delete (CCPA Section 1798.105)
  async processDeleteRequest(consumerId) {
    try {
      const deleteResult = {
        deletedCategories: [],
        retainedData: [],
        thirdPartyNotifications: [],
        exceptions: []
      };

      // Check for deletion exceptions
      const exceptions = await this.checkDeletionExceptions(consumerId);
      deleteResult.exceptions = exceptions;

      // Delete personal information
      const deletedData = await this.deletePersonalInfo(consumerId, exceptions);
      deleteResult.deletedCategories = deletedData.categories;
      deleteResult.retainedData = deletedData.retained;

      // Notify third parties
      const notifications = await this.notifyThirdPartiesOfDeletion(consumerId);
      deleteResult.thirdPartyNotifications = notifications;

      return deleteResult;

    } catch (error) {
      console.error('❌ Delete request processing failed:', error);
      throw error;
    }
  }

  // Right to opt-out of sale (CCPA Section 1798.120)
  async processOptOutRequest(consumerId) {
    try {
      const optOutResult = {
        consumerId,
        optedOutAt: Date.now(),
        categories: [],
        thirdParties: [],
        effectiveDate: Date.now()
      };

      // Record opt-out preference
      const optOutRecord = {
        consumerId,
        optedOut: true,
        timestamp: Date.now(),
        method: 'consumer_request',
        categories: await this.getPersonalInfoCategories(consumerId)
      };

      this.state.optOutRecords.set(consumerId, optOutRecord);

      // Stop ongoing sales
      await this.stopPersonalInfoSales(consumerId);
      optOutResult.categories = optOutRecord.categories;

      // Notify third parties
      const thirdPartyNotifications = await this.notifyThirdPartiesOfOptOut(consumerId);
      optOutResult.thirdParties = thirdPartyNotifications;

      this.metrics.optOutRequests++;

      return optOutResult;

    } catch (error) {
      console.error('❌ Opt-out request processing failed:', error);
      throw error;
    }
  }

  // Right to correct (CPRA)
  async processCorrectRequest(consumerId, corrections) {
    try {
      const correctResult = {
        correctedFields: [],
        rejectedCorrections: [],
        thirdPartyNotifications: []
      };

      for (const correction of corrections) {
        try {
          // Validate correction
          const isValid = await this.validateCorrection(consumerId, correction);
          
          if (isValid) {
            // Apply correction
            await this.applyCorrection(consumerId, correction);
            correctResult.correctedFields.push(correction.field);
            
            // Notify third parties
            const notifications = await this.notifyThirdPartiesOfCorrection(
              consumerId, 
              correction
            );
            correctResult.thirdPartyNotifications.push(...notifications);
            
          } else {
            correctResult.rejectedCorrections.push({
              field: correction.field,
              reason: 'Invalid correction data'
            });
          }
        } catch (error) {
          correctResult.rejectedCorrections.push({
            field: correction.field,
            reason: error.message
          });
        }
      }

      this.metrics.correctRequests++;

      return correctResult;

    } catch (error) {
      console.error('❌ Correct request processing failed:', error);
      throw error;
    }
  }

  // Consumer identity verification
  async verifyConsumerIdentity(consumerId, email, verificationData) {
    try {
      const verification = {
        status: 'PENDING',
        method: 'email',
        attempts: 0,
        verifiedAt: null
      };

      // Get existing verification attempts
      const existingAttempts = this.state.verificationAttempts.get(consumerId) || [];
      verification.attempts = existingAttempts.length;

      // Check if too many failed attempts
      if (verification.attempts >= 3) {
        verification.status = 'BLOCKED';
        verification.reason = 'Too many failed verification attempts';
        return verification;
      }

      // Perform verification based on available data
      if (verificationData.email && verificationData.email === email) {
        // Email verification
        const emailVerified = await this.verifyEmail(consumerId, email);
        if (emailVerified) {
          verification.status = 'VERIFIED';
          verification.verifiedAt = Date.now();
        }
      }

      if (verificationData.phone) {
        // Phone verification
        const phoneVerified = await this.verifyPhone(consumerId, verificationData.phone);
        if (phoneVerified) {
          verification.status = 'VERIFIED';
          verification.verifiedAt = Date.now();
        }
      }

      if (verificationData.accountInfo) {
        // Account information verification
        const accountVerified = await this.verifyAccountInfo(
          consumerId, 
          verificationData.accountInfo
        );
        if (accountVerified) {
          verification.status = 'VERIFIED';
          verification.verifiedAt = Date.now();
        }
      }

      // Record verification attempt
      existingAttempts.push({
        timestamp: Date.now(),
        method: verification.method,
        status: verification.status
      });
      this.state.verificationAttempts.set(consumerId, existingAttempts);

      return verification;

    } catch (error) {
      console.error('❌ Consumer identity verification failed:', error);
      return {
        status: 'FAILED',
        error: error.message
      };
    }
  }

  // Global Privacy Control (GPC) handling
  async handleGlobalPrivacyControl(request) {
    try {
      const { consumerId, gpcSignal } = request;
      
      if (gpcSignal === '1') {
        // Consumer has opted out via GPC
        const optOutResult = await this.processOptOutRequest(consumerId);
        
        await this.logCCPAActivity({
          type: 'gpc_opt_out',
          consumerId,
          timestamp: Date.now()
        });
        
        return {
          processed: true,
          optOutResult,
          method: 'global_privacy_control'
        };
      }
      
      return { processed: false, reason: 'No GPC opt-out signal' };

    } catch (error) {
      console.error('❌ GPC handling failed:', error);
      return { processed: false, error: error.message };
    }
  }

  // Data sale monitoring
  async monitorDataSales() {
    try {
      console.log('💰 Monitoring CCPA data sales...');
      
      let violationsFound = 0;
      
      // Check for sales to opted-out consumers
      for (const [consumerId, optOutRecord] of this.state.optOutRecords) {
        if (optOutRecord.optedOut) {
          const recentSales = await this.checkRecentSales(consumerId);
          
          if (recentSales.length > 0) {
            await this.handleOptOutViolation(consumerId, recentSales);
            violationsFound++;
          }
        }
      }

      if (violationsFound > 0) {
        console.log(`⚠️ Found ${violationsFound} CCPA opt-out violations`);
      }

    } catch (error) {
      console.error('❌ CCPA data sale monitoring failed:', error);
    }
  }

  // Request deadline monitoring
  async monitorRequestDeadlines() {
    try {
      console.log('⏰ Monitoring CCPA request deadlines...');
      
      let overdueRequests = 0;
      const now = Date.now();

      // Check all pending requests
      for (const [requestId, request] of this.state.consumerRequests) {
        if (request.status === 'RECEIVED' && now > request.deadline) {
          await this.handleOverdueRequest(request);
          overdueRequests++;
        }
      }

      if (overdueRequests > 0) {
        console.log(`⚠️ Found ${overdueRequests} overdue CCPA requests`);
      }

    } catch (error) {
      console.error('❌ CCPA deadline monitoring failed:', error);
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

      // Check consumer rights compliance
      const rightsCheck = await this.scanConsumerRights();
      if (rightsCheck.violations.length > 0) {
        scan.violations.push(...rightsCheck.violations);
      }

      // Check opt-out compliance
      const optOutCheck = await this.scanOptOutCompliance();
      if (optOutCheck.violations.length > 0) {
        scan.violations.push(...optOutCheck.violations);
      }

      // Check data minimization
      const minimizationCheck = await this.scanDataMinimization();
      if (minimizationCheck.violations.length > 0) {
        scan.violations.push(...minimizationCheck.violations);
      }

      // Check privacy notice compliance
      const noticeCheck = await this.scanPrivacyNotices();
      if (noticeCheck.violations.length > 0) {
        scan.violations.push(...noticeCheck.violations);
      }

      // Calculate compliance score
      const totalChecks = 4;
      const passedChecks = totalChecks - scan.violations.length;
      scan.score = passedChecks / totalChecks;

      // Generate recommendations
      scan.recommendations = await this.generateCCPARecommendations(scan.violations);

      return scan;

    } catch (error) {
      console.error('❌ CCPA compliance scan failed:', error);
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
  async isSubjectToCCPA() {
    // Check if business meets CCPA thresholds
    const revenue = await this.getAnnualRevenue();
    const consumerRecords = await this.getConsumerRecordCount();
    const personalInfoRevenue = await this.getPersonalInfoRevenuePercentage();

    return revenue >= this.config.businessThresholds.annualRevenue ||
           consumerRecords >= this.config.businessThresholds.consumerRecords ||
           personalInfoRevenue >= this.config.businessThresholds.personalInfoRevenue;
  }

  getResponseDeadline(requestType) {
    const deadlines = {
      'KNOW': this.config.consumerRights.know.responseTime,
      'DELETE': this.config.consumerRights.delete.responseTime,
      'OPT_OUT': this.config.consumerRights.optOut.responseTime,
      'CORRECT': this.config.cpraRights.correct.responseTime,
      'LIMIT_USE': this.config.cpraRights.limitUse.responseTime
    };

    return deadlines[requestType.toUpperCase()] || this.config.consumerRights.know.responseTime;
  }

  updateRequestMetrics(type) {
    switch (type.toUpperCase()) {
      case 'KNOW':
        this.metrics.knowRequests++;
        break;
      case 'DELETE':
        this.metrics.deleteRequests++;
        break;
      case 'OPT_OUT':
        this.metrics.optOutRequests++;
        break;
      case 'CORRECT':
        this.metrics.correctRequests++;
        break;
    }
    this.metrics.consumerRequests++;
  }

  async logCCPAActivity(activity) {
    // Log CCPA-specific activities
    this.emit('ccpaActivity', {
      ...activity,
      regulation: 'CCPA',
      timestamp: activity.timestamp || Date.now()
    });
  }

  // Data collection methods (to be implemented with actual data sources)
  async collectPersonalInfo(consumerId) {
    // This would integrate with your actual data sources
    return {
      identifiers: {},
      personalRecords: {},
      commercialInfo: {},
      internetActivity: {},
      geolocationData: {},
      inferences: {}
    };
  }

  async getPersonalInfoCategories(consumerId) {
    // Return categories of personal information collected
    return Object.keys(this.config.dataCategories).filter(
      category => this.config.dataCategories[category]
    );
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      regulation: 'CCPA',
      jurisdiction: 'CA-US',
      consumerRequests: this.state.consumerRequests.size,
      optOutRecords: this.state.optOutRecords.size,
      metrics: this.metrics
    };
  }

  // Generate compliance report
  async generateReport(timeRange) {
    return {
      regulation: 'CCPA',
      period: timeRange,
      summary: {
        consumerRequests: this.metrics.consumerRequests,
        optOutRequests: this.metrics.optOutRequests,
        deleteRequests: this.metrics.deleteRequests,
        knowRequests: this.metrics.knowRequests,
        verificationFailures: this.metrics.verificationFailures
      },
      requests: Array.from(this.state.consumerRequests.values())
        .filter(r => r.receivedAt >= timeRange.start),
      recommendations: await this.generateCCPARecommendations([])
    };
  }

  // Shutdown
  async shutdown() {
    console.log('🏛️ Shutting down CCPA Manager...');
    
    // Clear sensitive data
    this.state.consumerRequests.clear();
    this.state.optOutRecords.clear();
    this.state.verificationAttempts.clear();
    
    console.log('✅ CCPA Manager shutdown complete');
  }
}

module.exports = { CCPAManager };
