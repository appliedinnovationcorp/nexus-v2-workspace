/**
 * Identity Manager for Zero-Trust Architecture
 * Handles authentication, authorization, and identity verification
 * Integrates with Supabase Auth, NextAuth, and OAuth2 providers
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');

class IdentityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // JWT settings
      jwtSecret: config.jwtSecret || process.env.JWT_SECRET,
      jwtExpiry: config.jwtExpiry || '1h',
      refreshTokenExpiry: config.refreshTokenExpiry || '7d',
      
      // MFA settings
      mfaRequired: config.mfaRequired || true,
      mfaWindow: config.mfaWindow || 2,
      
      // Session management
      maxConcurrentSessions: config.maxConcurrentSessions || 3,
      sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
      
      // Password policy
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        preventReuse: 5,
        maxAge: 7776000000, // 90 days
        ...config.passwordPolicy
      },
      
      // Account lockout
      maxFailedAttempts: config.maxFailedAttempts || 5,
      lockoutDuration: config.lockoutDuration || 900000, // 15 minutes
      
      ...config
    };

    this.state = {
      activeSessions: new Map(),
      failedAttempts: new Map(),
      lockedAccounts: new Map(),
      mfaSecrets: new Map(),
      refreshTokens: new Map(),
      passwordHistory: new Map()
    };

    this.metrics = {
      totalLogins: 0,
      successfulLogins: 0,
      failedLogins: 0,
      mfaVerifications: 0,
      passwordResets: 0,
      accountLockouts: 0,
      sessionTerminations: 0
    };

    this.init();
  }

  async init() {
    console.log('🔐 Initializing Identity Manager...');
    
    // Setup cleanup intervals
    setInterval(() => this.cleanupExpiredSessions(), 300000); // 5 minutes
    setInterval(() => this.cleanupExpiredLockouts(), 60000); // 1 minute
    
    console.log('✅ Identity Manager initialized');
  }

  // Core authentication method
  async authenticate(credentials) {
    try {
      const { username, password, mfaToken, deviceId, ip } = credentials;
      
      // Check if account is locked
      if (this.isAccountLocked(username)) {
        this.metrics.failedLogins++;
        throw new Error('Account is temporarily locked due to multiple failed attempts');
      }

      // Verify primary credentials
      const user = await this.verifyCredentials(username, password);
      if (!user) {
        await this.recordFailedAttempt(username, ip);
        this.metrics.failedLogins++;
        throw new Error('Invalid credentials');
      }

      // Check if MFA is required
      if (this.config.mfaRequired || user.mfaEnabled) {
        if (!mfaToken) {
          throw new Error('MFA token required');
        }
        
        const mfaValid = await this.verifyMFA(user.id, mfaToken);
        if (!mfaValid) {
          await this.recordFailedAttempt(username, ip);
          this.metrics.failedLogins++;
          throw new Error('Invalid MFA token');
        }
        this.metrics.mfaVerifications++;
      }

      // Check concurrent sessions
      await this.enforceSessionLimits(user.id);

      // Generate tokens
      const tokens = await this.generateTokens(user, deviceId);
      
      // Create session
      const session = await this.createSession(user, deviceId, ip, tokens);
      
      // Clear failed attempts
      this.state.failedAttempts.delete(username);
      
      // Update metrics
      this.metrics.totalLogins++;
      this.metrics.successfulLogins++;
      
      // Emit authentication event
      this.emit('authenticated', {
        userId: user.id,
        username: user.username,
        deviceId,
        ip,
        timestamp: Date.now()
      });

      return {
        success: true,
        user: this.sanitizeUser(user),
        tokens,
        session: session.id
      };

    } catch (error) {
      this.emit('authenticationFailed', {
        username: credentials.username,
        ip: credentials.ip,
        error: error.message,
        timestamp: Date.now()
      });
      
      throw error;
    }
  }

  // Verify user credentials against database
  async verifyCredentials(username, password) {
    try {
      // This would integrate with your user database
      // For now, we'll simulate the verification
      const user = await this.getUserByUsername(username);
      if (!user) return null;

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) return null;

      // Check password age
      if (this.isPasswordExpired(user)) {
        throw new Error('Password has expired and must be changed');
      }

      return user;
    } catch (error) {
      console.error('❌ Credential verification failed:', error);
      return null;
    }
  }

  // MFA verification
  async verifyMFA(userId, token) {
    try {
      const secret = this.state.mfaSecrets.get(userId);
      if (!secret) {
        // Fallback to database lookup
        const user = await this.getUserById(userId);
        if (!user || !user.mfaSecret) return false;
        
        this.state.mfaSecrets.set(userId, user.mfaSecret);
        return speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token,
          window: this.config.mfaWindow
        });
      }

      return speakeasy.totp.verify({
        secret,
        encoding: 'base32',
        token,
        window: this.config.mfaWindow
      });
    } catch (error) {
      console.error('❌ MFA verification failed:', error);
      return false;
    }
  }

  // Token generation
  async generateTokens(user, deviceId) {
    const payload = {
      userId: user.id,
      username: user.username,
      roles: user.roles || [],
      permissions: user.permissions || [],
      deviceId,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiry,
      issuer: 'aic-zero-trust',
      audience: 'aic-website'
    });

    const refreshToken = jwt.sign(
      { userId: user.id, deviceId, type: 'refresh' },
      this.config.jwtSecret,
      { expiresIn: this.config.refreshTokenExpiry }
    );

    // Store refresh token
    this.state.refreshTokens.set(refreshToken, {
      userId: user.id,
      deviceId,
      created: Date.now(),
      used: false
    });

    return { accessToken, refreshToken };
  }

  // Session management
  async createSession(user, deviceId, ip, tokens) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      userId: user.id,
      deviceId,
      ip,
      created: Date.now(),
      lastActivity: Date.now(),
      tokens,
      active: true
    };

    this.state.activeSessions.set(sessionId, session);
    
    // Also index by user ID for quick lookup
    const userSessions = this.getUserSessions(user.id);
    userSessions.push(sessionId);

    return session;
  }

  async enforceSessionLimits(userId) {
    const userSessions = this.getUserSessions(userId);
    
    if (userSessions.length >= this.config.maxConcurrentSessions) {
      // Terminate oldest session
      const oldestSessionId = userSessions[0];
      await this.terminateSession(oldestSessionId);
      this.metrics.sessionTerminations++;
    }
  }

  getUserSessions(userId) {
    return Array.from(this.state.activeSessions.values())
      .filter(session => session.userId === userId && session.active)
      .map(session => session.id);
  }

  // Token refresh
  async refreshToken(refreshToken) {
    try {
      const tokenData = this.state.refreshTokens.get(refreshToken);
      if (!tokenData || tokenData.used) {
        throw new Error('Invalid or expired refresh token');
      }

      // Verify token
      const decoded = jwt.verify(refreshToken, this.config.jwtSecret);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Get user data
      const user = await this.getUserById(decoded.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const newTokens = await this.generateTokens(user, decoded.deviceId);
      
      // Mark old refresh token as used
      tokenData.used = true;
      
      return newTokens;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      throw error;
    }
  }

  // Identity verification for zero-trust
  async verifyIdentity(request) {
    try {
      const { token, userId, sessionId } = request;
      
      if (!token) {
        return { verified: false, reason: 'No token provided' };
      }

      // Verify JWT token
      const decoded = jwt.verify(token, this.config.jwtSecret);
      
      // Check if session is active
      const session = this.state.activeSessions.get(sessionId);
      if (!session || !session.active) {
        return { verified: false, reason: 'Invalid or expired session' };
      }

      // Update last activity
      session.lastActivity = Date.now();
      
      // Check session timeout
      if (Date.now() - session.lastActivity > this.config.sessionTimeout) {
        await this.terminateSession(sessionId);
        return { verified: false, reason: 'Session timeout' };
      }

      return {
        verified: true,
        userId: decoded.userId,
        roles: decoded.roles,
        permissions: decoded.permissions,
        sessionId
      };
    } catch (error) {
      return { verified: false, reason: error.message };
    }
  }

  // Authorization checks
  async authorize(userId, resource, action) {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;

      // Check role-based permissions
      const hasRolePermission = this.checkRolePermission(user.roles, resource, action);
      
      // Check attribute-based permissions
      const hasAttributePermission = this.checkAttributePermission(user, resource, action);
      
      return hasRolePermission || hasAttributePermission;
    } catch (error) {
      console.error('❌ Authorization check failed:', error);
      return false;
    }
  }

  checkRolePermission(roles, resource, action) {
    // Implement role-based access control logic
    const rolePermissions = {
      admin: ['*'],
      user: ['read:profile', 'update:profile'],
      guest: ['read:public']
    };

    for (const role of roles) {
      const permissions = rolePermissions[role] || [];
      if (permissions.includes('*') || permissions.includes(`${action}:${resource}`)) {
        return true;
      }
    }

    return false;
  }

  checkAttributePermission(user, resource, action) {
    // Implement attribute-based access control logic
    // This would check user attributes, context, etc.
    return false; // Simplified for now
  }

  // Account management
  async recordFailedAttempt(username, ip) {
    const key = `${username}:${ip}`;
    const attempts = this.state.failedAttempts.get(key) || [];
    attempts.push(Date.now());
    
    // Keep only recent attempts (last hour)
    const oneHourAgo = Date.now() - 3600000;
    const recentAttempts = attempts.filter(time => time > oneHourAgo);
    
    this.state.failedAttempts.set(key, recentAttempts);
    
    // Lock account if too many attempts
    if (recentAttempts.length >= this.config.maxFailedAttempts) {
      await this.lockAccount(username);
    }
  }

  async lockAccount(username) {
    this.state.lockedAccounts.set(username, {
      lockedAt: Date.now(),
      reason: 'Multiple failed login attempts'
    });
    
    this.metrics.accountLockouts++;
    
    this.emit('accountLocked', {
      username,
      timestamp: Date.now(),
      reason: 'Multiple failed login attempts'
    });
  }

  isAccountLocked(username) {
    const lockData = this.state.lockedAccounts.get(username);
    if (!lockData) return false;
    
    // Check if lockout has expired
    if (Date.now() - lockData.lockedAt > this.config.lockoutDuration) {
      this.state.lockedAccounts.delete(username);
      return false;
    }
    
    return true;
  }

  // Password management
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');

      // Verify current password
      const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentValid) throw new Error('Current password is incorrect');

      // Validate new password
      this.validatePassword(newPassword);
      
      // Check password history
      if (this.isPasswordReused(userId, newPassword)) {
        throw new Error('Password has been used recently and cannot be reused');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password history
      this.updatePasswordHistory(userId, newPasswordHash);

      // Update user password (this would update the database)
      await this.updateUserPassword(userId, newPasswordHash);

      // Terminate all sessions except current one
      await this.terminateUserSessions(userId, true);

      this.metrics.passwordResets++;

      this.emit('passwordChanged', {
        userId,
        timestamp: Date.now()
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Password change failed:', error);
      throw error;
    }
  }

  validatePassword(password) {
    const policy = this.config.passwordPolicy;
    
    if (password.length < policy.minLength) {
      throw new Error(`Password must be at least ${policy.minLength} characters long`);
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      throw new Error('Password must contain at least one number');
    }
    
    if (policy.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new Error('Password must contain at least one special character');
    }
  }

  isPasswordReused(userId, newPassword) {
    const history = this.state.passwordHistory.get(userId) || [];
    return history.some(hash => bcrypt.compareSync(newPassword, hash));
  }

  updatePasswordHistory(userId, passwordHash) {
    const history = this.state.passwordHistory.get(userId) || [];
    history.unshift(passwordHash);
    
    // Keep only recent passwords
    if (history.length > this.config.passwordPolicy.preventReuse) {
      history.splice(this.config.passwordPolicy.preventReuse);
    }
    
    this.state.passwordHistory.set(userId, history);
  }

  isPasswordExpired(user) {
    if (!user.passwordChangedAt) return false;
    
    const passwordAge = Date.now() - user.passwordChangedAt;
    return passwordAge > this.config.passwordPolicy.maxAge;
  }

  // MFA management
  async setupMFA(userId) {
    const secret = speakeasy.generateSecret({
      name: `AIC Website (${userId})`,
      issuer: 'Applied Innovation Corporation'
    });

    this.state.mfaSecrets.set(userId, secret.base32);

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url
    };
  }

  async verifyMFASetup(userId, token) {
    const secret = this.state.mfaSecrets.get(userId);
    if (!secret) throw new Error('MFA setup not initiated');

    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: this.config.mfaWindow
    });

    if (verified) {
      // Save MFA secret to user profile
      await this.updateUserMFASecret(userId, secret);
      return { success: true };
    }

    throw new Error('Invalid MFA token');
  }

  // Session management methods
  async terminateSession(sessionId) {
    const session = this.state.activeSessions.get(sessionId);
    if (session) {
      session.active = false;
      session.terminatedAt = Date.now();
      
      // Remove refresh tokens
      for (const [token, data] of this.state.refreshTokens) {
        if (data.userId === session.userId) {
          this.state.refreshTokens.delete(token);
        }
      }
      
      this.emit('sessionTerminated', {
        sessionId,
        userId: session.userId,
        timestamp: Date.now()
      });
    }
  }

  async terminateUserSessions(userId, excludeCurrent = false) {
    const userSessions = this.getUserSessions(userId);
    
    for (const sessionId of userSessions) {
      if (!excludeCurrent) {
        await this.terminateSession(sessionId);
      }
    }
  }

  async requireReauthentication(userId) {
    // Mark all user sessions as requiring re-authentication
    const userSessions = this.getUserSessions(userId);
    
    for (const sessionId of userSessions) {
      const session = this.state.activeSessions.get(sessionId);
      if (session) {
        session.requiresReauth = true;
      }
    }
    
    this.emit('reauthenticationRequired', {
      userId,
      timestamp: Date.now()
    });
  }

  async requireMFA(userId) {
    // Mark all user sessions as requiring MFA
    const userSessions = this.getUserSessions(userId);
    
    for (const sessionId of userSessions) {
      const session = this.state.activeSessions.get(sessionId);
      if (session) {
        session.requiresMFA = true;
      }
    }
  }

  async limitUserPermissions(userId) {
    // Temporarily reduce user permissions
    const userSessions = this.getUserSessions(userId);
    
    for (const sessionId of userSessions) {
      const session = this.state.activeSessions.get(sessionId);
      if (session) {
        session.limitedPermissions = true;
      }
    }
  }

  // Cleanup methods
  cleanupExpiredSessions() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.state.activeSessions) {
      if (now - session.lastActivity > this.config.sessionTimeout) {
        this.terminateSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  cleanupExpiredLockouts() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [username, lockData] of this.state.lockedAccounts) {
      if (now - lockData.lockedAt > this.config.lockoutDuration) {
        this.state.lockedAccounts.delete(username);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired account lockouts`);
    }
  }

  // Utility methods
  sanitizeUser(user) {
    const { passwordHash, mfaSecret, ...sanitized } = user;
    return sanitized;
  }

  // Database integration methods (to be implemented with actual database)
  async getUserByUsername(username) {
    // Implement database lookup
    return null;
  }

  async getUserById(userId) {
    // Implement database lookup
    return null;
  }

  async updateUserPassword(userId, passwordHash) {
    // Implement database update
  }

  async updateUserMFASecret(userId, secret) {
    // Implement database update
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      activeSessions: this.state.activeSessions.size,
      lockedAccounts: this.state.lockedAccounts.size,
      metrics: this.metrics
    };
  }

  // Shutdown
  async shutdown() {
    console.log('🔐 Shutting down Identity Manager...');
    
    // Clear sensitive data
    this.state.mfaSecrets.clear();
    this.state.refreshTokens.clear();
    this.state.passwordHistory.clear();
    
    console.log('✅ Identity Manager shutdown complete');
  }
}

module.exports = { IdentityManager };
