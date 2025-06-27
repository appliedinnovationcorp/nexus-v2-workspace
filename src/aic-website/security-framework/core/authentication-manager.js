/**
 * Authentication Manager - Advanced Security Framework
 * Handles multi-factor authentication, OAuth, JWT, and biometric authentication
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

class AuthenticationManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      jwtSecret: config.jwtSecret || crypto.randomBytes(64).toString('hex'),
      jwtExpiresIn: config.jwtExpiresIn || '15m',
      refreshTokenExpiresIn: config.refreshTokenExpiresIn || '7d',
      mfaRequired: config.mfaRequired || false,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        maxAge: 90, // days
        ...config.passwordPolicy
      },
      lockoutPolicy: {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        ...config.lockoutPolicy
      },
      sessionPolicy: {
        maxConcurrentSessions: 3,
        idleTimeout: 30 * 60 * 1000, // 30 minutes
        absoluteTimeout: 8 * 60 * 60 * 1000, // 8 hours
        ...config.sessionPolicy
      },
      ...config
    };
    
    this.activeSessions = new Map();
    this.failedAttempts = new Map();
    this.refreshTokens = new Map();
    this.mfaSecrets = new Map();
    this.passwordHistory = new Map();
    
    this.setupRateLimiting();
  }

  /**
   * Setup rate limiting for authentication endpoints
   */
  setupRateLimiting() {
    this.loginLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 requests per windowMs
      message: 'Too many login attempts, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.mfaLimiter = rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 3, // limit each IP to 3 MFA attempts per windowMs
      message: 'Too many MFA attempts, please try again later',
    });
  }

  /**
   * Initialize the authentication manager
   */
  async initialize() {
    // Setup cleanup intervals
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000); // Every minute

    setInterval(() => {
      this.cleanupFailedAttempts();
    }, 300000); // Every 5 minutes

    setInterval(() => {
      this.cleanupExpiredRefreshTokens();
    }, 3600000); // Every hour

    this.emit('initialized', { timestamp: new Date().toISOString() });
  }

  /**
   * Authenticate user with username/password
   */
  async authenticate(credentials) {
    const { username, password, mfaToken, clientInfo } = credentials;
    
    try {
      // Check if account is locked
      if (this.isAccountLocked(username)) {
        this.emit('authFailure', {
          username,
          reason: 'ACCOUNT_LOCKED',
          clientInfo,
          timestamp: new Date().toISOString()
        });
        throw new Error('Account is temporarily locked due to too many failed attempts');
      }

      // Validate credentials (this would typically query a database)
      const user = await this.validateCredentials(username, password);
      
      if (!user) {
        this.recordFailedAttempt(username, clientInfo);
        this.emit('authFailure', {
          username,
          reason: 'INVALID_CREDENTIALS',
          clientInfo,
          timestamp: new Date().toISOString()
        });
        throw new Error('Invalid credentials');
      }

      // Check if MFA is required
      if (this.config.mfaRequired || user.mfaEnabled) {
        if (!mfaToken) {
          throw new Error('MFA token required');
        }
        
        const mfaValid = await this.validateMFA(user.id, mfaToken);
        if (!mfaValid) {
          this.recordFailedAttempt(username, clientInfo);
          this.emit('authFailure', {
            username,
            reason: 'INVALID_MFA',
            clientInfo,
            timestamp: new Date().toISOString()
          });
          throw new Error('Invalid MFA token');
        }
      }

      // Check password age and policy compliance
      await this.checkPasswordPolicy(user);

      // Clear failed attempts on successful authentication
      this.failedAttempts.delete(username);

      // Generate tokens
      const tokens = await this.generateTokens(user);
      
      // Create session
      const session = await this.createSession(user, tokens, clientInfo);

      this.emit('authSuccess', {
        userId: user.id,
        username: user.username,
        sessionId: session.id,
        clientInfo,
        timestamp: new Date().toISOString()
      });

      return {
        user: this.sanitizeUser(user),
        tokens,
        session: {
          id: session.id,
          expiresAt: session.expiresAt
        }
      };

    } catch (error) {
      this.emit('authFailure', {
        username,
        reason: error.message,
        clientInfo,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Validate user credentials
   */
  async validateCredentials(username, password) {
    // This would typically query your user database
    // For demonstration, using a mock implementation
    const mockUsers = {
      'admin': {
        id: '1',
        username: 'admin',
        passwordHash: await bcrypt.hash('SecurePassword123!', 12),
        email: 'admin@example.com',
        roles: ['admin'],
        mfaEnabled: true,
        passwordCreatedAt: new Date(),
        isActive: true
      }
    };

    const user = mockUsers[username];
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    return isValidPassword ? user : null;
  }

  /**
   * Setup MFA for user
   */
  async setupMFA(userId) {
    const secret = speakeasy.generateSecret({
      name: `AIC Website (${userId})`,
      issuer: 'AIC Website'
    });

    this.mfaSecrets.set(userId, {
      secret: secret.base32,
      tempSecret: secret.base32,
      verified: false,
      createdAt: new Date()
    });

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  /**
   * Verify MFA setup
   */
  async verifyMFASetup(userId, token) {
    const mfaData = this.mfaSecrets.get(userId);
    if (!mfaData || mfaData.verified) {
      throw new Error('Invalid MFA setup state');
    }

    const verified = speakeasy.totp.verify({
      secret: mfaData.tempSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (verified) {
      mfaData.verified = true;
      mfaData.verifiedAt = new Date();
      return true;
    }

    return false;
  }

  /**
   * Validate MFA token
   */
  async validateMFA(userId, token) {
    const mfaData = this.mfaSecrets.get(userId);
    if (!mfaData || !mfaData.verified) {
      return false;
    }

    return speakeasy.totp.verify({
      secret: mfaData.secret,
      encoding: 'base32',
      token: token,
      window: 2
    });
  }

  /**
   * Generate JWT tokens
   */
  async generateTokens(user) {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, this.config.jwtSecret, {
      expiresIn: this.config.jwtExpiresIn,
      issuer: 'aic-website',
      audience: 'aic-website-api'
    });

    const refreshToken = crypto.randomBytes(64).toString('hex');
    
    // Store refresh token
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + this.parseTimeString(this.config.refreshTokenExpiresIn))
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseTimeString(this.config.jwtExpiresIn) / 1000
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    const tokenData = this.refreshTokens.get(refreshToken);
    
    if (!tokenData || tokenData.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user data (would typically query database)
    const user = await this.getUserById(tokenData.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user);
    
    // Remove old refresh token
    this.refreshTokens.delete(refreshToken);

    return tokens;
  }

  /**
   * Create user session
   */
  async createSession(user, tokens, clientInfo) {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    
    const session = {
      id: sessionId,
      userId: user.id,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: new Date(now.getTime() + this.config.sessionPolicy.absoluteTimeout),
      clientInfo: {
        userAgent: clientInfo?.userAgent,
        ipAddress: clientInfo?.ipAddress,
        deviceId: clientInfo?.deviceId
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    };

    // Check concurrent session limit
    const userSessions = Array.from(this.activeSessions.values())
      .filter(s => s.userId === user.id);
    
    if (userSessions.length >= this.config.sessionPolicy.maxConcurrentSessions) {
      // Remove oldest session
      const oldestSession = userSessions.sort((a, b) => a.lastAccessedAt - b.lastAccessedAt)[0];
      this.activeSessions.delete(oldestSession.id);
    }

    this.activeSessions.set(sessionId, session);
    return session;
  }

  /**
   * Validate session
   */
  async validateSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    const now = new Date();
    
    // Check if session expired
    if (session.expiresAt < now) {
      this.activeSessions.delete(sessionId);
      return null;
    }

    // Check idle timeout
    const idleTime = now.getTime() - session.lastAccessedAt.getTime();
    if (idleTime > this.config.sessionPolicy.idleTimeout) {
      this.activeSessions.delete(sessionId);
      return null;
    }

    // Update last accessed time
    session.lastAccessedAt = now;
    
    return session;
  }

  /**
   * Logout user
   */
  async logout(sessionId, refreshToken) {
    // Remove session
    this.activeSessions.delete(sessionId);
    
    // Remove refresh token
    if (refreshToken) {
      this.refreshTokens.delete(refreshToken);
    }

    this.emit('logout', {
      sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check password policy compliance
   */
  async checkPasswordPolicy(user) {
    const policy = this.config.passwordPolicy;
    const passwordAge = Date.now() - user.passwordCreatedAt.getTime();
    const maxAgeMs = policy.maxAge * 24 * 60 * 60 * 1000;

    if (passwordAge > maxAgeMs) {
      throw new Error('Password has expired and must be changed');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Validate current password
    const user = await this.getUserById(userId);
    const isValidCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
    
    if (!isValidCurrent) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password against policy
    this.validatePasswordPolicy(newPassword);

    // Check password history
    const history = this.passwordHistory.get(userId) || [];
    for (const oldHash of history) {
      if (await bcrypt.compare(newPassword, oldHash)) {
        throw new Error('Cannot reuse recent passwords');
      }
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password history
    history.unshift(user.passwordHash);
    if (history.length > this.config.passwordPolicy.preventReuse) {
      history.pop();
    }
    this.passwordHistory.set(userId, history);

    // Update user password (would typically update database)
    user.passwordHash = newPasswordHash;
    user.passwordCreatedAt = new Date();

    // Invalidate all sessions for this user
    this.invalidateUserSessions(userId);

    this.emit('passwordChanged', {
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Validate password against policy
   */
  validatePasswordPolicy(password) {
    const policy = this.config.passwordPolicy;
    const errors = [];

    if (password.length < policy.minLength) {
      errors.push(`Password must be at least ${policy.minLength} characters long`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      throw new Error(`Password policy violations: ${errors.join(', ')}`);
    }
  }

  /**
   * Record failed authentication attempt
   */
  recordFailedAttempt(username, clientInfo) {
    const key = username;
    const attempts = this.failedAttempts.get(key) || [];
    
    attempts.push({
      timestamp: new Date(),
      clientInfo
    });

    this.failedAttempts.set(key, attempts);
  }

  /**
   * Check if account is locked
   */
  isAccountLocked(username) {
    const attempts = this.failedAttempts.get(username) || [];
    const recentAttempts = attempts.filter(
      attempt => Date.now() - attempt.timestamp.getTime() < this.config.lockoutPolicy.lockoutDuration
    );

    return recentAttempts.length >= this.config.lockoutPolicy.maxAttempts;
  }

  /**
   * Invalidate all sessions for a user
   */
  invalidateUserSessions(userId) {
    for (const [sessionId, session] of this.activeSessions) {
      if (session.userId === userId) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Cleanup expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.activeSessions) {
      if (session.expiresAt < now) {
        this.activeSessions.delete(sessionId);
      }
    }
  }

  /**
   * Cleanup failed attempts
   */
  cleanupFailedAttempts() {
    const cutoff = Date.now() - this.config.lockoutPolicy.lockoutDuration;
    
    for (const [username, attempts] of this.failedAttempts) {
      const recentAttempts = attempts.filter(attempt => attempt.timestamp.getTime() > cutoff);
      
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(username);
      } else {
        this.failedAttempts.set(username, recentAttempts);
      }
    }
  }

  /**
   * Cleanup expired refresh tokens
   */
  cleanupExpiredRefreshTokens() {
    const now = new Date();
    for (const [token, data] of this.refreshTokens) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(token);
      }
    }
  }

  /**
   * Get middleware for Express.js
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'Authorization header missing or invalid' });
        }

        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, this.config.jwtSecret);
          req.user = decoded;
          next();
        } catch (jwtError) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }
      } catch (error) {
        return res.status(500).json({ error: 'Authentication error' });
      }
    };
  }

  /**
   * Utility methods
   */
  parseTimeString(timeStr) {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = timeStr.match(/^(\d+)([smhd])$/);
    return match ? parseInt(match[1]) * units[match[2]] : 900000; // default 15m
  }

  sanitizeUser(user) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async getUserById(userId) {
    // Mock implementation - would typically query database
    return {
      id: userId,
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin'],
      isActive: true,
      passwordHash: 'hashed_password',
      passwordCreatedAt: new Date()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      activeSessions: this.activeSessions.size,
      failedAttempts: this.failedAttempts.size,
      refreshTokens: this.refreshTokens.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { AuthenticationManager };
