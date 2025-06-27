/**
 * Session Manager - Advanced Security Framework
 * Secure session management with advanced security features
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class SessionManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      sessionTimeout: config.sessionTimeout || 30 * 60 * 1000, // 30 minutes
      absoluteTimeout: config.absoluteTimeout || 8 * 60 * 60 * 1000, // 8 hours
      maxConcurrentSessions: config.maxConcurrentSessions || 3,
      enableSessionRotation: config.enableSessionRotation !== false,
      rotationInterval: config.rotationInterval || 15 * 60 * 1000, // 15 minutes
      enableDeviceTracking: config.enableDeviceTracking !== false,
      enableLocationTracking: config.enableLocationTracking || false,
      enableSecureCookies: config.enableSecureCookies !== false,
      cookieName: config.cookieName || 'secure-session',
      cookieDomain: config.cookieDomain,
      cookiePath: config.cookiePath || '/',
      sameSite: config.sameSite || 'strict',
      enableCSRFProtection: config.enableCSRFProtection !== false,
      enableSessionFingerprinting: config.enableSessionFingerprinting !== false,
      ...config
    };
    
    this.sessions = new Map();
    this.userSessions = new Map(); // userId -> Set of sessionIds
    this.deviceSessions = new Map(); // deviceId -> Set of sessionIds
    this.sessionMetrics = {
      activeSessions: 0,
      totalSessions: 0,
      expiredSessions: 0,
      rotatedSessions: 0,
      suspiciousSessions: 0
    };
  }

  /**
   * Initialize the session manager
   */
  async initialize() {
    // Setup session cleanup
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Every minute

    // Setup session rotation
    if (this.config.enableSessionRotation) {
      setInterval(() => {
        this.rotateActiveSessions();
      }, this.config.rotationInterval);
    }

    // Setup suspicious session detection
    setInterval(() => {
      this.detectSuspiciousSessions();
    }, 5 * 60 * 1000); // Every 5 minutes

    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      config: {
        sessionTimeout: this.config.sessionTimeout,
        maxConcurrentSessions: this.config.maxConcurrentSessions,
        enableSessionRotation: this.config.enableSessionRotation
      }
    });
  }

  /**
   * Create a new session
   */
  async createSession(user, clientInfo = {}) {
    try {
      const sessionId = this.generateSecureSessionId();
      const now = new Date();
      
      // Generate device fingerprint
      const deviceFingerprint = this.config.enableSessionFingerprinting ? 
        this.generateDeviceFingerprint(clientInfo) : null;
      
      const session = {
        id: sessionId,
        userId: user.id,
        userRole: user.role || 'user',
        createdAt: now,
        lastAccessedAt: now,
        expiresAt: new Date(now.getTime() + this.config.sessionTimeout),
        absoluteExpiresAt: new Date(now.getTime() + this.config.absoluteTimeout),
        isActive: true,
        rotationCount: 0,
        clientInfo: {
          userAgent: clientInfo.userAgent,
          ipAddress: clientInfo.ipAddress,
          deviceId: clientInfo.deviceId || this.generateDeviceId(clientInfo),
          location: clientInfo.location,
          platform: this.extractPlatform(clientInfo.userAgent),
          browser: this.extractBrowser(clientInfo.userAgent)
        },
        deviceFingerprint,
        csrfToken: this.config.enableCSRFProtection ? this.generateCSRFToken() : null,
        flags: {
          suspicious: false,
          locationChanged: false,
          deviceChanged: false,
          concurrentLogin: false
        },
        metadata: {
          loginMethod: clientInfo.loginMethod || 'password',
          mfaUsed: clientInfo.mfaUsed || false,
          riskScore: 0
        }
      };

      // Check concurrent session limits
      await this.enforceConcurrentSessionLimits(user.id, session);
      
      // Store session
      this.sessions.set(sessionId, session);
      
      // Update user sessions mapping
      if (!this.userSessions.has(user.id)) {
        this.userSessions.set(user.id, new Set());
      }
      this.userSessions.get(user.id).add(sessionId);
      
      // Update device sessions mapping
      if (session.clientInfo.deviceId) {
        if (!this.deviceSessions.has(session.clientInfo.deviceId)) {
          this.deviceSessions.set(session.clientInfo.deviceId, new Set());
        }
        this.deviceSessions.get(session.clientInfo.deviceId).add(sessionId);
      }
      
      // Update metrics
      this.sessionMetrics.activeSessions++;
      this.sessionMetrics.totalSessions++;
      
      this.emit('sessionCreated', {
        sessionId,
        userId: user.id,
        clientInfo: session.clientInfo,
        timestamp: now.toISOString()
      });
      
      return session;
      
    } catch (error) {
      this.emit('sessionError', {
        type: 'CREATE_SESSION_ERROR',
        userId: user.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Validate and refresh session
   */
  async validateSession(sessionId, clientInfo = {}) {
    try {
      const session = this.sessions.get(sessionId);
      
      if (!session) {
        return { valid: false, reason: 'SESSION_NOT_FOUND' };
      }
      
      const now = new Date();
      
      // Check if session is active
      if (!session.isActive) {
        return { valid: false, reason: 'SESSION_INACTIVE' };
      }
      
      // Check absolute timeout
      if (now > session.absoluteExpiresAt) {
        await this.destroySession(sessionId, 'ABSOLUTE_TIMEOUT');
        return { valid: false, reason: 'ABSOLUTE_TIMEOUT' };
      }
      
      // Check idle timeout
      if (now > session.expiresAt) {
        await this.destroySession(sessionId, 'IDLE_TIMEOUT');
        return { valid: false, reason: 'IDLE_TIMEOUT' };
      }
      
      // Validate client information
      const validationResult = await this.validateClientInfo(session, clientInfo);
      if (!validationResult.valid) {
        session.flags.suspicious = true;
        this.sessionMetrics.suspiciousSessions++;
        
        this.emit('suspiciousSession', {
          sessionId,
          userId: session.userId,
          reason: validationResult.reason,
          clientInfo,
          timestamp: now.toISOString()
        });
        
        if (validationResult.terminate) {
          await this.destroySession(sessionId, validationResult.reason);
          return { valid: false, reason: validationResult.reason };
        }
      }
      
      // Update session activity
      session.lastAccessedAt = now;
      session.expiresAt = new Date(now.getTime() + this.config.sessionTimeout);
      
      // Update risk score
      session.metadata.riskScore = this.calculateSessionRiskScore(session, clientInfo);
      
      this.emit('sessionValidated', {
        sessionId,
        userId: session.userId,
        riskScore: session.metadata.riskScore,
        timestamp: now.toISOString()
      });
      
      return { 
        valid: true, 
        session: this.sanitizeSession(session),
        csrfToken: session.csrfToken
      };
      
    } catch (error) {
      this.emit('sessionError', {
        type: 'VALIDATE_SESSION_ERROR',
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      return { valid: false, reason: 'VALIDATION_ERROR' };
    }
  }

  /**
   * Validate client information against session
   */
  async validateClientInfo(session, clientInfo) {
    const issues = [];
    
    // Check IP address change
    if (clientInfo.ipAddress && session.clientInfo.ipAddress !== clientInfo.ipAddress) {
      issues.push('IP_ADDRESS_CHANGED');
      session.flags.locationChanged = true;
    }
    
    // Check user agent change
    if (clientInfo.userAgent && session.clientInfo.userAgent !== clientInfo.userAgent) {
      issues.push('USER_AGENT_CHANGED');
      session.flags.deviceChanged = true;
    }
    
    // Check device fingerprint
    if (this.config.enableSessionFingerprinting && clientInfo.userAgent) {
      const currentFingerprint = this.generateDeviceFingerprint(clientInfo);
      if (session.deviceFingerprint && session.deviceFingerprint !== currentFingerprint) {
        issues.push('DEVICE_FINGERPRINT_CHANGED');
        session.flags.deviceChanged = true;
      }
    }
    
    // Check location if enabled
    if (this.config.enableLocationTracking && clientInfo.location && session.clientInfo.location) {
      const distance = this.calculateDistance(session.clientInfo.location, clientInfo.location);
      if (distance > 1000) { // More than 1000km
        issues.push('LOCATION_ANOMALY');
        session.flags.locationChanged = true;
      }
    }
    
    // Determine if session should be terminated
    const criticalIssues = ['DEVICE_FINGERPRINT_CHANGED'];
    const shouldTerminate = issues.some(issue => criticalIssues.includes(issue));
    
    return {
      valid: issues.length === 0,
      issues,
      reason: issues.join(', '),
      terminate: shouldTerminate
    };
  }

  /**
   * Rotate session ID
   */
  async rotateSession(sessionId) {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Generate new session ID
      const newSessionId = this.generateSecureSessionId();
      
      // Update session
      session.id = newSessionId;
      session.rotationCount++;
      session.csrfToken = this.config.enableCSRFProtection ? this.generateCSRFToken() : null;
      
      // Move session to new ID
      this.sessions.delete(sessionId);
      this.sessions.set(newSessionId, session);
      
      // Update user sessions mapping
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        userSessions.add(newSessionId);
      }
      
      // Update device sessions mapping
      if (session.clientInfo.deviceId) {
        const deviceSessions = this.deviceSessions.get(session.clientInfo.deviceId);
        if (deviceSessions) {
          deviceSessions.delete(sessionId);
          deviceSessions.add(newSessionId);
        }
      }
      
      this.sessionMetrics.rotatedSessions++;
      
      this.emit('sessionRotated', {
        oldSessionId: sessionId,
        newSessionId,
        userId: session.userId,
        timestamp: new Date().toISOString()
      });
      
      return { newSessionId, csrfToken: session.csrfToken };
      
    } catch (error) {
      this.emit('sessionError', {
        type: 'ROTATE_SESSION_ERROR',
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Destroy session
   */
  async destroySession(sessionId, reason = 'USER_LOGOUT') {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return false;
      }
      
      // Mark as inactive
      session.isActive = false;
      session.destroyedAt = new Date();
      session.destroyReason = reason;
      
      // Remove from active sessions
      this.sessions.delete(sessionId);
      
      // Update user sessions mapping
      const userSessions = this.userSessions.get(session.userId);
      if (userSessions) {
        userSessions.delete(sessionId);
        if (userSessions.size === 0) {
          this.userSessions.delete(session.userId);
        }
      }
      
      // Update device sessions mapping
      if (session.clientInfo.deviceId) {
        const deviceSessions = this.deviceSessions.get(session.clientInfo.deviceId);
        if (deviceSessions) {
          deviceSessions.delete(sessionId);
          if (deviceSessions.size === 0) {
            this.deviceSessions.delete(session.clientInfo.deviceId);
          }
        }
      }
      
      // Update metrics
      this.sessionMetrics.activeSessions--;
      if (reason.includes('TIMEOUT')) {
        this.sessionMetrics.expiredSessions++;
      }
      
      this.emit('sessionDestroyed', {
        sessionId,
        userId: session.userId,
        reason,
        duration: session.destroyedAt.getTime() - session.createdAt.getTime(),
        timestamp: session.destroyedAt.toISOString()
      });
      
      return true;
      
    } catch (error) {
      this.emit('sessionError', {
        type: 'DESTROY_SESSION_ERROR',
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Destroy all user sessions
   */
  async destroyUserSessions(userId, reason = 'ADMIN_ACTION') {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions) {
      return 0;
    }
    
    const sessionIds = Array.from(userSessions);
    let destroyedCount = 0;
    
    for (const sessionId of sessionIds) {
      const destroyed = await this.destroySession(sessionId, reason);
      if (destroyed) destroyedCount++;
    }
    
    this.emit('userSessionsDestroyed', {
      userId,
      destroyedCount,
      reason,
      timestamp: new Date().toISOString()
    });
    
    return destroyedCount;
  }

  /**
   * Enforce concurrent session limits
   */
  async enforceConcurrentSessionLimits(userId, newSession) {
    const userSessions = this.userSessions.get(userId);
    if (!userSessions || userSessions.size < this.config.maxConcurrentSessions) {
      return;
    }
    
    // Get all user sessions sorted by last access time
    const sessions = Array.from(userSessions)
      .map(sessionId => this.sessions.get(sessionId))
      .filter(session => session && session.isActive)
      .sort((a, b) => a.lastAccessedAt - b.lastAccessedAt);
    
    // Destroy oldest sessions to make room
    const sessionsToDestroy = sessions.slice(0, sessions.length - this.config.maxConcurrentSessions + 1);
    
    for (const session of sessionsToDestroy) {
      await this.destroySession(session.id, 'CONCURRENT_SESSION_LIMIT');
    }
    
    // Mark new session as concurrent login
    newSession.flags.concurrentLogin = true;
  }

  /**
   * Calculate session risk score
   */
  calculateSessionRiskScore(session, clientInfo) {
    let score = 0;
    
    // Base factors
    if (session.flags.suspicious) score += 30;
    if (session.flags.locationChanged) score += 20;
    if (session.flags.deviceChanged) score += 25;
    if (session.flags.concurrentLogin) score += 10;
    
    // Time-based factors
    const sessionAge = Date.now() - session.createdAt.getTime();
    const hoursSinceCreation = sessionAge / (60 * 60 * 1000);
    if (hoursSinceCreation > 12) score += 15; // Long-running session
    
    // Activity patterns
    const timeSinceLastAccess = Date.now() - session.lastAccessedAt.getTime();
    const minutesSinceAccess = timeSinceLastAccess / (60 * 1000);
    if (minutesSinceAccess > 60) score += 10; // Inactive session
    
    // Rotation frequency
    if (session.rotationCount === 0 && hoursSinceCreation > 2) {
      score += 15; // Session not rotated
    }
    
    // MFA usage
    if (!session.metadata.mfaUsed) score += 20;
    
    return Math.min(score, 100);
  }

  /**
   * Detect suspicious sessions
   */
  detectSuspiciousSessions() {
    for (const [sessionId, session] of this.sessions) {
      if (!session.isActive) continue;
      
      const riskScore = this.calculateSessionRiskScore(session);
      
      if (riskScore > 70 && !session.flags.suspicious) {
        session.flags.suspicious = true;
        this.sessionMetrics.suspiciousSessions++;
        
        this.emit('suspiciousSessionDetected', {
          sessionId,
          userId: session.userId,
          riskScore,
          flags: session.flags,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Rotate active sessions
   */
  async rotateActiveSessions() {
    const now = Date.now();
    const rotationThreshold = now - this.config.rotationInterval;
    
    for (const [sessionId, session] of this.sessions) {
      if (!session.isActive) continue;
      
      const lastRotation = session.rotationCount > 0 ? 
        session.lastAccessedAt.getTime() : session.createdAt.getTime();
      
      if (lastRotation < rotationThreshold) {
        try {
          await this.rotateSession(sessionId);
        } catch (error) {
          console.error(`Failed to rotate session ${sessionId}:`, error);
        }
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    const expiredSessions = [];
    
    for (const [sessionId, session] of this.sessions) {
      if (now > session.absoluteExpiresAt || now > session.expiresAt) {
        expiredSessions.push(sessionId);
      }
    }
    
    expiredSessions.forEach(sessionId => {
      this.destroySession(sessionId, 'CLEANUP_EXPIRED');
    });
  }

  /**
   * Middleware for Express.js
   */
  middleware() {
    return async (req, res, next) => {
      try {
        // Extract session ID from cookie or header
        const sessionId = req.cookies?.[this.config.cookieName] || 
                         req.headers['x-session-id'];
        
        if (!sessionId) {
          return next();
        }
        
        // Validate session
        const clientInfo = {
          userAgent: req.get('User-Agent'),
          ipAddress: req.ip,
          location: req.headers['x-user-location']
        };
        
        const validation = await this.validateSession(sessionId, clientInfo);
        
        if (validation.valid) {
          req.session = validation.session;
          req.csrfToken = validation.csrfToken;
          
          // Set secure cookie
          if (this.config.enableSecureCookies) {
            res.cookie(this.config.cookieName, sessionId, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: this.config.sameSite,
              domain: this.config.cookieDomain,
              path: this.config.cookiePath,
              maxAge: this.config.sessionTimeout
            });
          }
        } else {
          // Clear invalid session cookie
          res.clearCookie(this.config.cookieName);
        }
        
        next();
      } catch (error) {
        next();
      }
    };
  }

  /**
   * Utility methods
   */
  generateSecureSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateCSRFToken() {
    return crypto.randomBytes(32).toString('base64');
  }

  generateDeviceId(clientInfo) {
    const data = `${clientInfo.userAgent}:${clientInfo.ipAddress}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  generateDeviceFingerprint(clientInfo) {
    const components = [
      clientInfo.userAgent,
      clientInfo.language,
      clientInfo.timezone,
      clientInfo.screenResolution,
      clientInfo.colorDepth,
      clientInfo.platform
    ].filter(Boolean);
    
    const data = components.join('|');
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  extractPlatform(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'unknown';
  }

  extractBrowser(userAgent) {
    if (!userAgent) return 'unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'unknown';
  }

  calculateDistance(loc1, loc2) {
    // Simplified distance calculation
    // In production, use a proper geolocation library
    const lat1 = parseFloat(loc1.latitude);
    const lon1 = parseFloat(loc1.longitude);
    const lat2 = parseFloat(loc2.latitude);
    const lon2 = parseFloat(loc2.longitude);
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  sanitizeSession(session) {
    const { deviceFingerprint, ...sanitized } = session;
    return sanitized;
  }

  /**
   * Get session statistics
   */
  getSessionStatistics() {
    return {
      ...this.sessionMetrics,
      activeSessionsByUser: this.userSessions.size,
      activeSessionsByDevice: this.deviceSessions.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      activeSessions: this.sessions.size,
      metrics: this.sessionMetrics,
      config: {
        sessionTimeout: this.config.sessionTimeout,
        maxConcurrentSessions: this.config.maxConcurrentSessions,
        enableSessionRotation: this.config.enableSessionRotation
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { SessionManager };
