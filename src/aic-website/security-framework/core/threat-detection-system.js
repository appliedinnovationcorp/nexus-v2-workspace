/**
 * Threat Detection System - Advanced Security Framework
 * Real-time threat monitoring, behavioral analysis, and automated response
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ThreatDetectionSystem extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableBehavioralAnalysis: config.enableBehavioralAnalysis !== false,
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      enableMLThreatDetection: config.enableMLThreatDetection || false,
      enableRealTimeMonitoring: config.enableRealTimeMonitoring !== false,
      enableAutomatedResponse: config.enableAutomatedResponse || false,
      threatScoreThreshold: config.threatScoreThreshold || 75,
      anomalyThreshold: config.anomalyThreshold || 2.5, // Standard deviations
      analysisWindow: config.analysisWindow || 300000, // 5 minutes
      retentionPeriod: config.retentionPeriod || 30 * 24 * 60 * 60 * 1000, // 30 days
      maxEventsPerWindow: config.maxEventsPerWindow || 1000,
      ...config
    };
    
    // Threat detection data structures
    this.events = [];
    this.userBehaviorProfiles = new Map();
    this.ipBehaviorProfiles = new Map();
    this.threatPatterns = new Map();
    this.activeThreats = new Map();
    this.blockedEntities = new Set();
    this.whitelistedEntities = new Set();
    
    // Metrics and statistics
    this.detectionMetrics = {
      threatsDetected: 0,
      falsePositives: 0,
      eventsAnalyzed: 0,
      automatedResponses: 0,
      blockedRequests: 0
    };
    
    this.initializeThreatPatterns();
  }

  /**
   * Initialize known threat patterns
   */
  initializeThreatPatterns() {
    const patterns = [
      {
        id: 'brute_force_login',
        name: 'Brute Force Login Attack',
        description: 'Multiple failed login attempts from same source',
        severity: 'high',
        indicators: [
          { type: 'failed_login_count', threshold: 5, window: 300000 },
          { type: 'failed_login_rate', threshold: 10, window: 60000 }
        ],
        response: ['block_ip', 'alert_admin', 'increase_monitoring']
      },
      {
        id: 'credential_stuffing',
        name: 'Credential Stuffing Attack',
        description: 'Login attempts with multiple username/password combinations',
        severity: 'high',
        indicators: [
          { type: 'unique_usernames_per_ip', threshold: 10, window: 300000 },
          { type: 'login_attempt_rate', threshold: 20, window: 60000 }
        ],
        response: ['block_ip', 'alert_admin', 'require_captcha']
      },
      {
        id: 'sql_injection',
        name: 'SQL Injection Attempt',
        description: 'Malicious SQL patterns in requests',
        severity: 'critical',
        indicators: [
          { type: 'sql_pattern_match', patterns: ['union select', 'drop table', '1=1', 'or 1=1'] },
          { type: 'suspicious_parameter_count', threshold: 20 }
        ],
        response: ['block_request', 'block_ip', 'alert_admin', 'log_forensics']
      },
      {
        id: 'xss_attempt',
        name: 'Cross-Site Scripting Attempt',
        description: 'Malicious script injection patterns',
        severity: 'high',
        indicators: [
          { type: 'script_pattern_match', patterns: ['<script', 'javascript:', 'onerror=', 'onload='] },
          { type: 'encoded_payload_detection', patterns: ['%3Cscript', '%3C%2Fscript'] }
        ],
        response: ['block_request', 'sanitize_input', 'alert_admin']
      },
      {
        id: 'ddos_attack',
        name: 'Distributed Denial of Service',
        description: 'High volume of requests from multiple sources',
        severity: 'critical',
        indicators: [
          { type: 'request_rate_per_ip', threshold: 100, window: 60000 },
          { type: 'total_request_rate', threshold: 1000, window: 60000 },
          { type: 'unique_ips_spike', threshold: 50, window: 300000 }
        ],
        response: ['rate_limit', 'block_suspicious_ips', 'alert_admin', 'scale_resources']
      },
      {
        id: 'privilege_escalation',
        name: 'Privilege Escalation Attempt',
        description: 'Unauthorized access to elevated permissions',
        severity: 'critical',
        indicators: [
          { type: 'permission_denied_rate', threshold: 10, window: 300000 },
          { type: 'admin_endpoint_access', threshold: 5, window: 300000 },
          { type: 'role_change_attempts', threshold: 3, window: 300000 }
        ],
        response: ['block_user', 'revoke_session', 'alert_admin', 'audit_permissions']
      },
      {
        id: 'data_exfiltration',
        name: 'Data Exfiltration Attempt',
        description: 'Unusual data access or download patterns',
        severity: 'critical',
        indicators: [
          { type: 'large_data_download', threshold: 100 * 1024 * 1024, window: 300000 }, // 100MB
          { type: 'bulk_data_access', threshold: 1000, window: 300000 },
          { type: 'off_hours_access', timeRange: ['22:00', '06:00'] }
        ],
        response: ['block_user', 'alert_admin', 'audit_data_access', 'require_mfa']
      }
    ];

    patterns.forEach(pattern => {
      this.threatPatterns.set(pattern.id, pattern);
    });
  }

  /**
   * Initialize the threat detection system
   */
  async initialize() {
    // Setup event cleanup
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60000); // Every minute

    // Setup behavioral analysis
    if (this.config.enableBehavioralAnalysis) {
      setInterval(() => {
        this.analyzeBehavioralPatterns();
      }, this.config.analysisWindow);
    }

    // Setup anomaly detection
    if (this.config.enableAnomalyDetection) {
      setInterval(() => {
        this.detectAnomalies();
      }, this.config.analysisWindow);
    }

    // Setup threat pattern analysis
    setInterval(() => {
      this.analyzeThreatPatterns();
    }, 30000); // Every 30 seconds

    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      patternsLoaded: this.threatPatterns.size
    });
  }

  /**
   * Analyze security event
   */
  async analyzeEvent(event) {
    try {
      // Add timestamp and ID if not present
      const enrichedEvent = {
        id: event.id || crypto.randomUUID(),
        timestamp: event.timestamp || new Date().toISOString(),
        ...event
      };

      // Store event
      this.events.push(enrichedEvent);
      this.detectionMetrics.eventsAnalyzed++;

      // Real-time analysis
      if (this.config.enableRealTimeMonitoring) {
        await this.performRealTimeAnalysis(enrichedEvent);
      }

      // Update behavioral profiles
      if (this.config.enableBehavioralAnalysis) {
        this.updateBehavioralProfiles(enrichedEvent);
      }

      // Check against threat patterns
      await this.checkThreatPatterns(enrichedEvent);

      return enrichedEvent;

    } catch (error) {
      this.emit('analysisError', {
        error: error.message,
        event: event.id,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Perform real-time analysis on event
   */
  async performRealTimeAnalysis(event) {
    const threatScore = this.calculateThreatScore(event);
    
    if (threatScore >= this.config.threatScoreThreshold) {
      const threat = {
        id: crypto.randomUUID(),
        type: 'real_time_detection',
        severity: this.getThreatSeverity(threatScore),
        score: threatScore,
        event,
        detectedAt: new Date().toISOString(),
        status: 'active'
      };

      await this.handleThreat(threat);
    }
  }

  /**
   * Calculate threat score for an event
   */
  calculateThreatScore(event) {
    let score = 0;
    
    // Base scoring factors
    const factors = {
      // Authentication events
      failed_login: 15,
      successful_login_after_failures: 25,
      login_from_new_location: 10,
      login_outside_hours: 8,
      
      // Authorization events
      permission_denied: 12,
      privilege_escalation_attempt: 30,
      admin_access_attempt: 20,
      
      // Request patterns
      high_request_rate: 18,
      suspicious_user_agent: 10,
      malformed_request: 15,
      
      // Data access
      bulk_data_access: 25,
      sensitive_data_access: 20,
      unusual_data_pattern: 15,
      
      // Network patterns
      tor_exit_node: 20,
      known_malicious_ip: 35,
      geolocation_anomaly: 12
    };

    // Calculate base score
    Object.keys(factors).forEach(factor => {
      if (event[factor] || event.indicators?.includes(factor)) {
        score += factors[factor];
      }
    });

    // Apply multipliers based on context
    if (event.userType === 'admin') score *= 1.5;
    if (event.isRepeatOffender) score *= 1.3;
    if (event.timeOfDay && this.isOffHours(event.timeOfDay)) score *= 1.2;
    if (event.sourceIP && this.isKnownThreat(event.sourceIP)) score *= 1.4;

    return Math.min(score, 100); // Cap at 100
  }

  /**
   * Update behavioral profiles
   */
  updateBehavioralProfiles(event) {
    // Update user behavior profile
    if (event.userId) {
      this.updateUserBehaviorProfile(event.userId, event);
    }

    // Update IP behavior profile
    if (event.sourceIP) {
      this.updateIPBehaviorProfile(event.sourceIP, event);
    }
  }

  /**
   * Update user behavior profile
   */
  updateUserBehaviorProfile(userId, event) {
    let profile = this.userBehaviorProfiles.get(userId);
    
    if (!profile) {
      profile = {
        userId,
        createdAt: new Date(),
        loginTimes: [],
        locations: [],
        userAgents: [],
        requestPatterns: [],
        failedAttempts: 0,
        lastActivity: null,
        riskScore: 0
      };
    }

    // Update profile based on event
    profile.lastActivity = new Date(event.timestamp);
    
    if (event.type === 'login') {
      profile.loginTimes.push(new Date(event.timestamp).getHours());
      if (event.location) profile.locations.push(event.location);
      if (event.userAgent) profile.userAgents.push(event.userAgent);
      
      if (event.success === false) {
        profile.failedAttempts++;
      } else {
        profile.failedAttempts = 0; // Reset on successful login
      }
    }

    if (event.type === 'request') {
      profile.requestPatterns.push({
        endpoint: event.endpoint,
        method: event.method,
        timestamp: event.timestamp
      });
    }

    // Calculate risk score
    profile.riskScore = this.calculateUserRiskScore(profile);
    
    this.userBehaviorProfiles.set(userId, profile);
  }

  /**
   * Update IP behavior profile
   */
  updateIPBehaviorProfile(ip, event) {
    let profile = this.ipBehaviorProfiles.get(ip);
    
    if (!profile) {
      profile = {
        ip,
        createdAt: new Date(),
        requestCount: 0,
        failedLogins: 0,
        userAgents: new Set(),
        endpoints: new Set(),
        countries: new Set(),
        lastActivity: null,
        riskScore: 0
      };
    }

    // Update profile
    profile.lastActivity = new Date(event.timestamp);
    profile.requestCount++;
    
    if (event.userAgent) profile.userAgents.add(event.userAgent);
    if (event.endpoint) profile.endpoints.add(event.endpoint);
    if (event.country) profile.countries.add(event.country);
    
    if (event.type === 'login' && event.success === false) {
      profile.failedLogins++;
    }

    // Calculate risk score
    profile.riskScore = this.calculateIPRiskScore(profile);
    
    this.ipBehaviorProfiles.set(ip, profile);
  }

  /**
   * Calculate user risk score
   */
  calculateUserRiskScore(profile) {
    let score = 0;
    
    // Failed attempts factor
    score += Math.min(profile.failedAttempts * 5, 30);
    
    // Login time variance (unusual hours)
    const avgLoginHour = profile.loginTimes.reduce((a, b) => a + b, 0) / profile.loginTimes.length;
    const offHoursLogins = profile.loginTimes.filter(hour => hour < 6 || hour > 22).length;
    score += (offHoursLogins / profile.loginTimes.length) * 20;
    
    // Location variance
    const uniqueLocations = new Set(profile.locations).size;
    if (uniqueLocations > 5) score += 15;
    
    // User agent variance
    const uniqueUserAgents = new Set(profile.userAgents).size;
    if (uniqueUserAgents > 3) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Calculate IP risk score
   */
  calculateIPRiskScore(profile) {
    let score = 0;
    
    // High request rate
    const requestRate = profile.requestCount / ((Date.now() - profile.createdAt.getTime()) / 60000);
    if (requestRate > 10) score += 20;
    if (requestRate > 50) score += 30;
    
    // Failed login attempts
    score += Math.min(profile.failedLogins * 3, 25);
    
    // Multiple user agents (potential bot)
    if (profile.userAgents.size > 5) score += 15;
    
    // Multiple countries (proxy/VPN usage)
    if (profile.countries.size > 2) score += 20;
    
    // Endpoint diversity (scanning behavior)
    if (profile.endpoints.size > 20) score += 25;
    
    return Math.min(score, 100);
  }

  /**
   * Analyze threat patterns
   */
  async analyzeThreatPatterns() {
    const recentEvents = this.getRecentEvents(this.config.analysisWindow);
    
    for (const [patternId, pattern] of this.threatPatterns) {
      const matches = this.checkPatternMatch(pattern, recentEvents);
      
      if (matches.length > 0) {
        const threat = {
          id: crypto.randomUUID(),
          type: 'pattern_match',
          patternId,
          pattern: pattern.name,
          severity: pattern.severity,
          matches,
          detectedAt: new Date().toISOString(),
          status: 'active'
        };

        await this.handleThreat(threat);
      }
    }
  }

  /**
   * Check if events match a threat pattern
   */
  checkPatternMatch(pattern, events) {
    const matches = [];
    
    for (const indicator of pattern.indicators) {
      const indicatorMatches = this.checkIndicator(indicator, events);
      if (indicatorMatches.length > 0) {
        matches.push({
          indicator: indicator.type,
          matches: indicatorMatches,
          threshold: indicator.threshold,
          actual: indicatorMatches.length
        });
      }
    }
    
    return matches;
  }

  /**
   * Check individual threat indicator
   */
  checkIndicator(indicator, events) {
    const matches = [];
    const now = Date.now();
    const windowStart = now - (indicator.window || this.config.analysisWindow);
    
    switch (indicator.type) {
      case 'failed_login_count':
        const failedLogins = events.filter(e => 
          e.type === 'login' && 
          e.success === false &&
          new Date(e.timestamp).getTime() > windowStart
        );
        if (failedLogins.length >= indicator.threshold) {
          matches.push(...failedLogins);
        }
        break;
        
      case 'request_rate_per_ip':
        const ipGroups = this.groupEventsByIP(events, windowStart);
        for (const [ip, ipEvents] of ipGroups) {
          if (ipEvents.length >= indicator.threshold) {
            matches.push(...ipEvents);
          }
        }
        break;
        
      case 'sql_pattern_match':
        const sqlEvents = events.filter(e => 
          e.type === 'request' &&
          indicator.patterns.some(pattern => 
            (e.query || '').toLowerCase().includes(pattern.toLowerCase()) ||
            (e.body || '').toLowerCase().includes(pattern.toLowerCase())
          )
        );
        matches.push(...sqlEvents);
        break;
        
      case 'permission_denied_rate':
        const deniedEvents = events.filter(e => 
          e.type === 'authorization' && 
          e.result === 'denied' &&
          new Date(e.timestamp).getTime() > windowStart
        );
        if (deniedEvents.length >= indicator.threshold) {
          matches.push(...deniedEvents);
        }
        break;
    }
    
    return matches;
  }

  /**
   * Handle detected threat
   */
  async handleThreat(threat) {
    this.activeThreats.set(threat.id, threat);
    this.detectionMetrics.threatsDetected++;
    
    this.emit('threatDetected', threat);
    
    // Automated response if enabled
    if (this.config.enableAutomatedResponse) {
      await this.executeAutomatedResponse(threat);
    }
  }

  /**
   * Execute automated response to threat
   */
  async executeAutomatedResponse(threat) {
    const pattern = this.threatPatterns.get(threat.patternId);
    const responses = pattern?.response || ['alert_admin'];
    
    for (const response of responses) {
      try {
        await this.executeResponse(response, threat);
        this.detectionMetrics.automatedResponses++;
      } catch (error) {
        this.emit('responseError', {
          response,
          threat: threat.id,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Execute specific response action
   */
  async executeResponse(response, threat) {
    switch (response) {
      case 'block_ip':
        if (threat.event?.sourceIP) {
          this.blockedEntities.add(threat.event.sourceIP);
          this.emit('ipBlocked', {
            ip: threat.event.sourceIP,
            reason: threat.pattern,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case 'block_user':
        if (threat.event?.userId) {
          this.blockedEntities.add(threat.event.userId);
          this.emit('userBlocked', {
            userId: threat.event.userId,
            reason: threat.pattern,
            timestamp: new Date().toISOString()
          });
        }
        break;
        
      case 'alert_admin':
        this.emit('adminAlert', {
          threat,
          severity: threat.severity,
          timestamp: new Date().toISOString()
        });
        break;
        
      case 'increase_monitoring':
        // Increase monitoring for related entities
        break;
        
      case 'require_mfa':
        this.emit('mfaRequired', {
          userId: threat.event?.userId,
          reason: threat.pattern,
          timestamp: new Date().toISOString()
        });
        break;
    }
  }

  /**
   * Detect anomalies in behavior patterns
   */
  detectAnomalies() {
    // Analyze user behavior anomalies
    for (const [userId, profile] of this.userBehaviorProfiles) {
      const anomalies = this.detectUserAnomalies(profile);
      if (anomalies.length > 0) {
        this.emit('anomalyDetected', {
          type: 'user_behavior',
          userId,
          anomalies,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Analyze IP behavior anomalies
    for (const [ip, profile] of this.ipBehaviorProfiles) {
      const anomalies = this.detectIPAnomalies(profile);
      if (anomalies.length > 0) {
        this.emit('anomalyDetected', {
          type: 'ip_behavior',
          ip,
          anomalies,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Detect user behavior anomalies
   */
  detectUserAnomalies(profile) {
    const anomalies = [];
    
    // Login time anomalies
    if (profile.loginTimes.length > 5) {
      const avgHour = profile.loginTimes.reduce((a, b) => a + b, 0) / profile.loginTimes.length;
      const variance = profile.loginTimes.reduce((sum, hour) => sum + Math.pow(hour - avgHour, 2), 0) / profile.loginTimes.length;
      const stdDev = Math.sqrt(variance);
      
      const recentLogins = profile.loginTimes.slice(-5);
      const recentAvg = recentLogins.reduce((a, b) => a + b, 0) / recentLogins.length;
      
      if (Math.abs(recentAvg - avgHour) > this.config.anomalyThreshold * stdDev) {
        anomalies.push({
          type: 'unusual_login_time',
          severity: 'medium',
          description: 'Login times significantly different from historical pattern'
        });
      }
    }
    
    return anomalies;
  }

  /**
   * Detect IP behavior anomalies
   */
  detectIPAnomalies(profile) {
    const anomalies = [];
    
    // Request rate anomalies
    const timeSpan = (Date.now() - profile.createdAt.getTime()) / 60000; // minutes
    const requestRate = profile.requestCount / timeSpan;
    
    if (requestRate > 100) { // More than 100 requests per minute
      anomalies.push({
        type: 'high_request_rate',
        severity: 'high',
        description: `Unusually high request rate: ${requestRate.toFixed(2)} req/min`
      });
    }
    
    return anomalies;
  }

  /**
   * Middleware for Express.js
   */
  middleware() {
    return async (req, res, next) => {
      try {
        // Check if IP is blocked
        if (this.blockedEntities.has(req.ip)) {
          this.detectionMetrics.blockedRequests++;
          return res.status(403).json({ error: 'Access denied - IP blocked' });
        }
        
        // Check if user is blocked
        if (req.user && this.blockedEntities.has(req.user.id)) {
          this.detectionMetrics.blockedRequests++;
          return res.status(403).json({ error: 'Access denied - User blocked' });
        }
        
        // Create security event
        const event = {
          type: 'request',
          method: req.method,
          endpoint: req.path,
          sourceIP: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id,
          timestamp: new Date().toISOString(),
          headers: req.headers,
          query: req.query,
          body: req.method === 'POST' ? req.body : undefined
        };
        
        // Analyze event
        await this.analyzeEvent(event);
        
        next();
      } catch (error) {
        next();
      }
    };
  }

  /**
   * Utility methods
   */
  getRecentEvents(windowMs) {
    const cutoff = Date.now() - windowMs;
    return this.events.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    );
  }

  groupEventsByIP(events, windowStart) {
    const groups = new Map();
    
    events
      .filter(e => new Date(e.timestamp).getTime() > windowStart)
      .forEach(event => {
        if (event.sourceIP) {
          if (!groups.has(event.sourceIP)) {
            groups.set(event.sourceIP, []);
          }
          groups.get(event.sourceIP).push(event);
        }
      });
    
    return groups;
  }

  getThreatSeverity(score) {
    if (score >= 90) return 'critical';
    if (score >= 75) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  }

  isOffHours(timeOfDay) {
    const hour = new Date(timeOfDay).getHours();
    return hour < 6 || hour > 22;
  }

  isKnownThreat(ip) {
    // This would check against threat intelligence feeds
    return false;
  }

  cleanupOldEvents() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    this.events = this.events.filter(event => 
      new Date(event.timestamp).getTime() > cutoff
    );
    
    // Limit events to prevent memory issues
    if (this.events.length > this.config.maxEventsPerWindow) {
      this.events = this.events.slice(-this.config.maxEventsPerWindow);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      eventsStored: this.events.length,
      activeThreats: this.activeThreats.size,
      blockedEntities: this.blockedEntities.size,
      userProfiles: this.userBehaviorProfiles.size,
      ipProfiles: this.ipBehaviorProfiles.size,
      threatPatterns: this.threatPatterns.size,
      metrics: this.detectionMetrics,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { ThreatDetectionSystem };
