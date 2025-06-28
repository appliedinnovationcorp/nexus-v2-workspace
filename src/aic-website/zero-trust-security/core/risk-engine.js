/**
 * Risk Engine for Zero-Trust Architecture
 * Calculates comprehensive risk scores based on multiple factors
 * Provides real-time risk assessment and adaptive security controls
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class RiskEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Risk calculation weights
      riskFactors: {
        identity: { weight: 0.25, enabled: true },
        device: { weight: 0.20, enabled: true },
        network: { weight: 0.15, enabled: true },
        behavior: { weight: 0.25, enabled: true },
        context: { weight: 0.15, enabled: true },
        ...config.riskFactors
      },
      
      // Risk thresholds
      riskThresholds: {
        low: 0.3,
        medium: 0.6,
        high: 0.8,
        critical: 0.95,
        ...config.riskThresholds
      },
      
      // Risk scoring parameters
      scoring: {
        baseRisk: 0.1,
        maxRisk: 1.0,
        decayRate: 0.02, // Risk decay per hour
        escalationRate: 0.1, // Risk increase per incident
        ...config.scoring
      },
      
      // Adaptive controls
      adaptiveControls: {
        enabled: config.adaptiveControls !== false,
        lowRisk: {
          mfaRequired: false,
          sessionTimeout: 28800000, // 8 hours
          permissions: 'normal'
        },
        mediumRisk: {
          mfaRequired: true,
          sessionTimeout: 14400000, // 4 hours
          permissions: 'limited'
        },
        highRisk: {
          mfaRequired: true,
          sessionTimeout: 3600000, // 1 hour
          permissions: 'restricted',
          additionalVerification: true
        },
        criticalRisk: {
          mfaRequired: true,
          sessionTimeout: 900000, // 15 minutes
          permissions: 'minimal',
          additionalVerification: true,
          adminNotification: true
        },
        ...config.adaptiveControls
      },
      
      // Machine learning parameters
      machineLearning: {
        enabled: config.machineLearning !== false,
        modelUpdateInterval: 86400000, // 24 hours
        trainingDataSize: 10000,
        ...config.machineLearning
      },
      
      ...config
    };

    this.state = {
      riskScores: new Map(),
      riskHistory: new Map(),
      riskFactorWeights: new Map(),
      adaptiveRules: new Map(),
      mlModel: null,
      riskEvents: []
    };

    this.metrics = {
      riskAssessments: 0,
      highRiskEvents: 0,
      criticalRiskEvents: 0,
      adaptiveActionsTriggered: 0,
      falsePositives: 0,
      truePositives: 0,
      modelUpdates: 0
    };

    this.init();
  }

  async init() {
    console.log('⚖️ Initializing Risk Engine...');
    
    // Initialize risk factor weights
    this.initializeRiskFactorWeights();
    
    // Setup periodic risk updates
    setInterval(() => this.updateRiskScores(), 300000); // 5 minutes
    setInterval(() => this.decayRiskScores(), 3600000); // 1 hour
    setInterval(() => this.cleanupOldData(), 86400000); // 24 hours
    
    // Setup ML model updates if enabled
    if (this.config.machineLearning.enabled) {
      setInterval(() => this.updateMLModel(), this.config.machineLearning.modelUpdateInterval);
    }
    
    console.log('✅ Risk Engine initialized');
  }

  initializeRiskFactorWeights() {
    for (const [factor, config] of Object.entries(this.config.riskFactors)) {
      if (config.enabled) {
        this.state.riskFactorWeights.set(factor, config.weight);
      }
    }
  }

  // Core risk assessment method
  async assessRisk(request, verificationResults = {}) {
    try {
      const { userId, deviceId, ip, timestamp = Date.now() } = request;
      
      if (!userId) {
        return { score: 1.0, level: 'critical', reason: 'No user identification' };
      }

      // Calculate risk factors
      const riskFactors = {
        identity: await this.calculateIdentityRisk(verificationResults.identity, userId),
        device: await this.calculateDeviceRisk(verificationResults.device, deviceId),
        network: await this.calculateNetworkRisk(verificationResults.network, ip),
        behavior: await this.calculateBehaviorRisk(verificationResults.behavior, userId),
        context: await this.calculateContextualRisk(request)
      };

      // Calculate weighted risk score
      const riskScore = this.calculateWeightedRiskScore(riskFactors);
      
      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore);
      
      // Get adaptive controls
      const adaptiveControls = this.getAdaptiveControls(riskLevel);
      
      // Store risk assessment
      const assessment = {
        userId,
        deviceId,
        ip,
        timestamp,
        score: riskScore,
        level: riskLevel,
        factors: riskFactors,
        adaptiveControls,
        id: crypto.randomUUID()
      };
      
      await this.storeRiskAssessment(assessment);
      
      // Trigger adaptive actions if needed
      if (riskScore >= this.config.riskThresholds.medium) {
        await this.triggerAdaptiveActions(assessment);
      }
      
      this.metrics.riskAssessments++;
      
      if (riskScore >= this.config.riskThresholds.high) {
        this.metrics.highRiskEvents++;
      }
      
      if (riskScore >= this.config.riskThresholds.critical) {
        this.metrics.criticalRiskEvents++;
      }

      return {
        score: riskScore,
        level: riskLevel,
        factors: riskFactors,
        adaptiveControls,
        assessmentId: assessment.id
      };

    } catch (error) {
      console.error('❌ Risk assessment failed:', error);
      return {
        score: 1.0,
        level: 'critical',
        reason: 'Risk assessment error',
        error: error.message
      };
    }
  }

  // Identity risk calculation
  async calculateIdentityRisk(identityResult, userId) {
    try {
      let risk = this.config.scoring.baseRisk;
      const factors = [];

      if (!identityResult || !identityResult.verified) {
        risk = 1.0;
        factors.push({ type: 'identity_not_verified', impact: 1.0 });
        return { score: risk, factors };
      }

      // Check authentication strength
      if (!identityResult.mfaUsed) {
        risk += 0.3;
        factors.push({ type: 'no_mfa', impact: 0.3 });
      }

      // Check session age
      if (identityResult.sessionAge > 86400000) { // 24 hours
        risk += 0.2;
        factors.push({ type: 'old_session', impact: 0.2 });
      }

      // Check for recent password changes
      if (identityResult.passwordAge && identityResult.passwordAge < 3600000) { // 1 hour
        risk += 0.1;
        factors.push({ type: 'recent_password_change', impact: 0.1 });
      }

      // Check for account lockout history
      const lockoutHistory = await this.getAccountLockoutHistory(userId);
      if (lockoutHistory.length > 0) {
        const recentLockouts = lockoutHistory.filter(
          lockout => Date.now() - lockout.timestamp < 86400000
        );
        if (recentLockouts.length > 0) {
          risk += 0.2;
          factors.push({ type: 'recent_lockouts', impact: 0.2, count: recentLockouts.length });
        }
      }

      return {
        score: Math.min(risk, 1.0),
        factors,
        details: {
          verified: identityResult.verified,
          mfaUsed: identityResult.mfaUsed,
          sessionAge: identityResult.sessionAge
        }
      };
    } catch (error) {
      console.error('❌ Identity risk calculation failed:', error);
      return { score: 0.5, factors: [], error: error.message };
    }
  }

  // Device risk calculation
  async calculateDeviceRisk(deviceResult, deviceId) {
    try {
      let risk = this.config.scoring.baseRisk;
      const factors = [];

      if (!deviceResult || !deviceResult.trusted) {
        risk += 0.4;
        factors.push({ type: 'device_not_trusted', impact: 0.4 });
      }

      if (deviceResult) {
        // Trust score factor
        const trustScore = deviceResult.trustScore || 0;
        const trustRisk = (1 - trustScore) * 0.3;
        risk += trustRisk;
        if (trustRisk > 0.1) {
          factors.push({ type: 'low_trust_score', impact: trustRisk, trustScore });
        }

        // Compliance factor
        if (deviceResult.complianceStatus === 'non-compliant') {
          risk += 0.3;
          factors.push({ type: 'non_compliant_device', impact: 0.3 });
        }

        // New device factor
        if (deviceResult.isNewDevice) {
          risk += 0.2;
          factors.push({ type: 'new_device', impact: 0.2 });
        }

        // Jailbroken/rooted device
        if (deviceResult.isJailbroken || deviceResult.isRooted) {
          risk += 0.5;
          factors.push({ type: 'compromised_device', impact: 0.5 });
        }
      }

      return {
        score: Math.min(risk, 1.0),
        factors,
        details: deviceResult
      };
    } catch (error) {
      console.error('❌ Device risk calculation failed:', error);
      return { score: 0.5, factors: [], error: error.message };
    }
  }

  // Network risk calculation
  async calculateNetworkRisk(networkResult, ip) {
    try {
      let risk = this.config.scoring.baseRisk;
      const factors = [];

      if (!networkResult || !networkResult.allowed) {
        risk = 1.0;
        factors.push({ type: 'network_not_allowed', impact: 1.0 });
        return { score: risk, factors };
      }

      // VPN/Proxy detection
      const vpnDetection = await this.detectVPN(ip);
      if (vpnDetection.isVPN) {
        risk += 0.2;
        factors.push({ type: 'vpn_detected', impact: 0.2 });
      }

      // Tor network detection
      const torDetection = await this.detectTor(ip);
      if (torDetection.isTor) {
        risk += 0.4;
        factors.push({ type: 'tor_detected', impact: 0.4 });
      }

      // Geolocation risk
      if (networkResult.geoLocation) {
        const geoRisk = await this.calculateGeolocationRisk(networkResult.geoLocation);
        risk += geoRisk.score;
        if (geoRisk.score > 0.1) {
          factors.push({ type: 'geolocation_risk', impact: geoRisk.score, ...geoRisk.details });
        }
      }

      // Rate limiting violations
      if (networkResult.rateLimitViolations > 0) {
        const rateLimitRisk = Math.min(networkResult.rateLimitViolations * 0.1, 0.3);
        risk += rateLimitRisk;
        factors.push({ type: 'rate_limit_violations', impact: rateLimitRisk });
      }

      return {
        score: Math.min(risk, 1.0),
        factors,
        details: networkResult
      };
    } catch (error) {
      console.error('❌ Network risk calculation failed:', error);
      return { score: 0.5, factors: [], error: error.message };
    }
  }

  // Behavior risk calculation
  async calculateBehaviorRisk(behaviorResult, userId) {
    try {
      let risk = this.config.scoring.baseRisk;
      const factors = [];

      if (!behaviorResult) {
        return { score: 0.3, factors: [{ type: 'no_behavior_data', impact: 0.2 }] };
      }

      if (!behaviorResult.normal) {
        const behaviorRisk = behaviorResult.score || 0.5;
        risk += behaviorRisk * 0.6; // Scale behavior risk
        factors.push({ 
          type: 'abnormal_behavior', 
          impact: behaviorRisk * 0.6,
          anomalies: behaviorResult.anomalies
        });
      }

      // Check for specific high-risk behaviors
      if (behaviorResult.anomalies) {
        for (const anomaly of behaviorResult.anomalies) {
          if (anomaly.factor === 'locations' && anomaly.score > 0.8) {
            risk += 0.2;
            factors.push({ type: 'unusual_location', impact: 0.2 });
          }
          
          if (anomaly.factor === 'loginTimes' && anomaly.score > 0.7) {
            risk += 0.1;
            factors.push({ type: 'unusual_time', impact: 0.1 });
          }
          
          if (anomaly.factor === 'dataAccess' && anomaly.score > 0.8) {
            risk += 0.3;
            factors.push({ type: 'unusual_data_access', impact: 0.3 });
          }
        }
      }

      return {
        score: Math.min(risk, 1.0),
        factors,
        details: behaviorResult
      };
    } catch (error) {
      console.error('❌ Behavior risk calculation failed:', error);
      return { score: 0.5, factors: [], error: error.message };
    }
  }

  // Contextual risk calculation
  async calculateContextualRisk(request) {
    try {
      let risk = this.config.scoring.baseRisk;
      const factors = [];

      // Time-based risk
      const hour = new Date(request.timestamp).getHours();
      if (hour < 6 || hour > 22) { // Outside business hours
        risk += 0.1;
        factors.push({ type: 'outside_business_hours', impact: 0.1, hour });
      }

      // Weekend access
      const dayOfWeek = new Date(request.timestamp).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        risk += 0.05;
        factors.push({ type: 'weekend_access', impact: 0.05 });
      }

      // Resource sensitivity
      if (request.resource) {
        const resourceRisk = await this.calculateResourceRisk(request.resource);
        risk += resourceRisk.score;
        if (resourceRisk.score > 0.1) {
          factors.push({ type: 'sensitive_resource', impact: resourceRisk.score, ...resourceRisk.details });
        }
      }

      // Action sensitivity
      if (request.action) {
        const actionRisk = this.calculateActionRisk(request.action);
        risk += actionRisk.score;
        if (actionRisk.score > 0.1) {
          factors.push({ type: 'sensitive_action', impact: actionRisk.score, action: request.action });
        }
      }

      // Concurrent sessions
      const concurrentSessions = await this.getConcurrentSessions(request.userId);
      if (concurrentSessions > 3) {
        const sessionRisk = Math.min((concurrentSessions - 3) * 0.05, 0.2);
        risk += sessionRisk;
        factors.push({ type: 'multiple_sessions', impact: sessionRisk, count: concurrentSessions });
      }

      return {
        score: Math.min(risk, 1.0),
        factors,
        details: {
          hour,
          dayOfWeek,
          resource: request.resource,
          action: request.action,
          concurrentSessions
        }
      };
    } catch (error) {
      console.error('❌ Contextual risk calculation failed:', error);
      return { score: 0.3, factors: [], error: error.message };
    }
  }

  // Risk score calculation
  calculateWeightedRiskScore(riskFactors) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [factorName, factorData] of Object.entries(riskFactors)) {
      const weight = this.state.riskFactorWeights.get(factorName) || 0;
      if (weight > 0 && factorData && typeof factorData.score === 'number') {
        totalScore += factorData.score * weight;
        totalWeight += weight;
      }
    }

    // Normalize score
    const normalizedScore = totalWeight > 0 ? totalScore / totalWeight : this.config.scoring.baseRisk;
    
    // Apply ML model adjustment if available
    if (this.state.mlModel && this.config.machineLearning.enabled) {
      return this.applyMLAdjustment(normalizedScore, riskFactors);
    }

    return Math.min(Math.max(normalizedScore, 0), 1);
  }

  // Risk level determination
  determineRiskLevel(score) {
    if (score >= this.config.riskThresholds.critical) return 'critical';
    if (score >= this.config.riskThresholds.high) return 'high';
    if (score >= this.config.riskThresholds.medium) return 'medium';
    return 'low';
  }

  // Adaptive controls
  getAdaptiveControls(riskLevel) {
    return this.config.adaptiveControls[`${riskLevel}Risk`] || this.config.adaptiveControls.mediumRisk;
  }

  async triggerAdaptiveActions(assessment) {
    try {
      const controls = assessment.adaptiveControls;
      const actions = [];

      // MFA requirement
      if (controls.mfaRequired) {
        actions.push({ type: 'require_mfa', userId: assessment.userId });
      }

      // Session timeout adjustment
      if (controls.sessionTimeout) {
        actions.push({ 
          type: 'adjust_session_timeout', 
          userId: assessment.userId,
          timeout: controls.sessionTimeout 
        });
      }

      // Permission restrictions
      if (controls.permissions && controls.permissions !== 'normal') {
        actions.push({ 
          type: 'restrict_permissions', 
          userId: assessment.userId,
          level: controls.permissions 
        });
      }

      // Additional verification
      if (controls.additionalVerification) {
        actions.push({ 
          type: 'require_additional_verification', 
          userId: assessment.userId 
        });
      }

      // Admin notification
      if (controls.adminNotification) {
        actions.push({ 
          type: 'notify_admin', 
          userId: assessment.userId,
          riskScore: assessment.score,
          riskLevel: assessment.level
        });
      }

      // Execute actions
      for (const action of actions) {
        await this.executeAdaptiveAction(action);
      }

      this.metrics.adaptiveActionsTriggered += actions.length;

      // Emit adaptive action event
      this.emit('adaptiveActionsTriggered', {
        assessment,
        actions,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('❌ Failed to trigger adaptive actions:', error);
    }
  }

  async executeAdaptiveAction(action) {
    // This would integrate with the identity manager and other components
    console.log(`🔧 Executing adaptive action: ${action.type} for user ${action.userId}`);
    
    // Emit action for external handlers
    this.emit('adaptiveAction', action);
  }

  // Risk assessment storage
  async storeRiskAssessment(assessment) {
    // Store current risk score
    this.state.riskScores.set(assessment.userId, {
      score: assessment.score,
      level: assessment.level,
      timestamp: assessment.timestamp,
      assessmentId: assessment.id
    });

    // Store in history
    if (!this.state.riskHistory.has(assessment.userId)) {
      this.state.riskHistory.set(assessment.userId, []);
    }
    
    const history = this.state.riskHistory.get(assessment.userId);
    history.push(assessment);
    
    // Keep history manageable
    if (history.length > 1000) {
      this.state.riskHistory.set(assessment.userId, history.slice(-500));
    }

    // Store in events for ML training
    this.state.riskEvents.push({
      ...assessment,
      outcome: null // Will be updated based on actual security events
    });
    
    if (this.state.riskEvents.length > this.config.machineLearning.trainingDataSize) {
      this.state.riskEvents = this.state.riskEvents.slice(-this.config.machineLearning.trainingDataSize / 2);
    }
  }

  // User risk calculation
  async calculateUserRisk(userId, userData = {}) {
    try {
      const currentRisk = this.state.riskScores.get(userId);
      if (!currentRisk) {
        return this.config.scoring.baseRisk;
      }

      // Apply time-based decay
      const hoursSinceAssessment = (Date.now() - currentRisk.timestamp) / 3600000;
      const decayFactor = hoursSinceAssessment * this.config.scoring.decayRate;
      const decayedScore = Math.max(
        currentRisk.score - decayFactor,
        this.config.scoring.baseRisk
      );

      return Math.min(decayedScore, this.config.scoring.maxRisk);
    } catch (error) {
      console.error('❌ User risk calculation failed:', error);
      return this.config.scoring.baseRisk;
    }
  }

  async getRiskFactors(userId) {
    const history = this.state.riskHistory.get(userId);
    if (!history || history.length === 0) {
      return [];
    }

    const latestAssessment = history[history.length - 1];
    const factors = [];

    // Aggregate factors from all risk categories
    for (const [category, categoryData] of Object.entries(latestAssessment.factors)) {
      if (categoryData.factors) {
        factors.push(...categoryData.factors.map(factor => ({
          ...factor,
          category
        })));
      }
    }

    return factors.sort((a, b) => (b.impact || 0) - (a.impact || 0));
  }

  // Utility methods
  async detectVPN(ip) {
    // This would integrate with VPN detection services
    return { isVPN: false, confidence: 0.5 };
  }

  async detectTor(ip) {
    // This would integrate with Tor detection services
    return { isTor: false, confidence: 0.5 };
  }

  async calculateGeolocationRisk(geoLocation) {
    // Risk based on country, known threat locations, etc.
    const highRiskCountries = ['CN', 'RU', 'KP', 'IR'];
    
    if (highRiskCountries.includes(geoLocation.country)) {
      return {
        score: 0.3,
        details: { country: geoLocation.country, reason: 'high_risk_country' }
      };
    }

    return { score: 0.0, details: {} };
  }

  async calculateResourceRisk(resource) {
    // Risk based on resource sensitivity
    const sensitiveResources = {
      '/admin': 0.4,
      '/api/users': 0.3,
      '/api/financial': 0.5,
      '/api/sensitive': 0.4
    };

    const resourceRisk = sensitiveResources[resource] || 0.1;
    
    return {
      score: resourceRisk,
      details: { resource, sensitivity: resourceRisk }
    };
  }

  calculateActionRisk(action) {
    const sensitiveActions = {
      'delete': 0.3,
      'admin': 0.4,
      'export': 0.2,
      'modify': 0.1
    };

    const actionRisk = sensitiveActions[action] || 0.05;
    
    return {
      score: actionRisk,
      details: { action, sensitivity: actionRisk }
    };
  }

  async getConcurrentSessions(userId) {
    // This would integrate with session management
    return 1; // Mock implementation
  }

  async getAccountLockoutHistory(userId) {
    // This would integrate with identity management
    return []; // Mock implementation
  }

  // Machine learning integration
  applyMLAdjustment(baseScore, riskFactors) {
    // This would apply ML model predictions
    // For now, just return the base score
    return baseScore;
  }

  async updateMLModel() {
    if (!this.config.machineLearning.enabled) return;

    try {
      console.log('🤖 Updating ML model for risk assessment...');
      
      // This would train/update the ML model with recent risk events
      // For now, just log the update
      this.metrics.modelUpdates++;
      
      console.log('✅ ML model updated');
    } catch (error) {
      console.error('❌ ML model update failed:', error);
    }
  }

  // Maintenance methods
  async updateRiskScores() {
    console.log('📊 Updating risk scores...');
    
    let updatedCount = 0;
    for (const [userId, riskData] of this.state.riskScores) {
      const newScore = await this.calculateUserRisk(userId);
      if (Math.abs(newScore - riskData.score) > 0.05) { // Significant change
        riskData.score = newScore;
        riskData.timestamp = Date.now();
        updatedCount++;
      }
    }
    
    if (updatedCount > 0) {
      console.log(`✅ Updated ${updatedCount} risk scores`);
    }
  }

  async decayRiskScores() {
    let decayedCount = 0;
    
    for (const [userId, riskData] of this.state.riskScores) {
      const hoursSinceUpdate = (Date.now() - riskData.timestamp) / 3600000;
      const decayAmount = hoursSinceUpdate * this.config.scoring.decayRate;
      
      if (decayAmount > 0.01) { // Meaningful decay
        riskData.score = Math.max(
          riskData.score - decayAmount,
          this.config.scoring.baseRisk
        );
        riskData.timestamp = Date.now();
        decayedCount++;
      }
    }
    
    if (decayedCount > 0) {
      console.log(`📉 Applied risk decay to ${decayedCount} scores`);
    }
  }

  cleanupOldData() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    let cleanedCount = 0;

    // Clean up old risk history
    for (const [userId, history] of this.state.riskHistory) {
      const filteredHistory = history.filter(assessment => assessment.timestamp > cutoffTime);
      if (filteredHistory.length !== history.length) {
        this.state.riskHistory.set(userId, filteredHistory);
        cleanedCount += history.length - filteredHistory.length;
      }
    }

    // Clean up old risk events
    const originalLength = this.state.riskEvents.length;
    this.state.riskEvents = this.state.riskEvents.filter(event => event.timestamp > cutoffTime);
    cleanedCount += originalLength - this.state.riskEvents.length;

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old risk data items`);
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      riskScores: this.state.riskScores.size,
      riskHistory: this.state.riskHistory.size,
      riskEvents: this.state.riskEvents.length,
      mlModelActive: this.state.mlModel !== null,
      metrics: this.metrics
    };
  }

  // Public API methods
  getRiskEngineStatus() {
    return {
      activeRiskScores: this.state.riskScores.size,
      riskThresholds: this.config.riskThresholds,
      adaptiveControlsEnabled: this.config.adaptiveControls.enabled,
      mlEnabled: this.config.machineLearning.enabled,
      metrics: this.metrics
    };
  }

  getUserRiskScore(userId) {
    return this.state.riskScores.get(userId) || {
      score: this.config.scoring.baseRisk,
      level: 'low',
      timestamp: Date.now()
    };
  }

  getUserRiskHistory(userId, limit = 100) {
    const history = this.state.riskHistory.get(userId) || [];
    return history
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Shutdown
  async shutdown() {
    console.log('⚖️ Shutting down Risk Engine...');
    
    // Clear sensitive data
    this.state.riskScores.clear();
    this.state.riskHistory.clear();
    this.state.riskEvents = [];
    
    console.log('✅ Risk Engine shutdown complete');
  }
}

module.exports = { RiskEngine };
