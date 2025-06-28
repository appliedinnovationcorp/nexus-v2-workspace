/**
 * Device Trust Manager for Zero-Trust Architecture
 * Handles device registration, verification, and trust scoring
 * Implements certificate-based authentication and device compliance checking
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const forge = require('node-forge');

class DeviceTrustManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Device trust settings
      trustThreshold: config.trustThreshold || 0.7,
      trustDecayRate: config.trustDecayRate || 0.1, // per day
      maxTrustAge: config.maxTrustAge || 2592000000, // 30 days
      
      // Certificate settings
      certificateValidity: config.certificateValidity || 31536000000, // 1 year
      keySize: config.keySize || 2048,
      
      // Device compliance
      requiredCompliance: config.requiredCompliance || {
        osVersion: true,
        antivirus: true,
        firewall: true,
        encryption: true,
        screenLock: true
      },
      
      // Device fingerprinting
      fingerprintComponents: config.fingerprintComponents || [
        'userAgent',
        'screen',
        'timezone',
        'language',
        'platform',
        'hardwareConcurrency',
        'deviceMemory'
      ],
      
      ...config
    };

    this.state = {
      registeredDevices: new Map(),
      deviceCertificates: new Map(),
      deviceFingerprints: new Map(),
      trustScores: new Map(),
      complianceStatus: new Map(),
      deviceSessions: new Map()
    };

    this.metrics = {
      devicesRegistered: 0,
      certificatesIssued: 0,
      trustVerifications: 0,
      complianceChecks: 0,
      suspiciousDevices: 0,
      blockedDevices: 0
    };

    this.init();
  }

  async init() {
    console.log('📱 Initializing Device Trust Manager...');
    
    // Generate CA certificate for device certificates
    await this.generateCACertificate();
    
    // Setup cleanup intervals
    setInterval(() => this.updateTrustScores(), 3600000); // 1 hour
    setInterval(() => this.cleanupExpiredDevices(), 86400000); // 24 hours
    setInterval(() => this.performComplianceChecks(), 1800000); // 30 minutes
    
    console.log('✅ Device Trust Manager initialized');
  }

  async generateCACertificate() {
    try {
      // Generate CA key pair
      const keys = forge.pki.rsa.generateKeyPair(this.config.keySize);
      
      // Create CA certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = '01';
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);
      
      const attrs = [{
        name: 'commonName',
        value: 'AIC Zero-Trust CA'
      }, {
        name: 'organizationName',
        value: 'Applied Innovation Corporation'
      }, {
        name: 'organizationalUnitName',
        value: 'Security'
      }];
      
      cert.setSubject(attrs);
      cert.setIssuer(attrs);
      cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
      }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        keyEncipherment: true
      }]);
      
      // Self-sign certificate
      cert.sign(keys.privateKey);
      
      this.caCertificate = {
        certificate: cert,
        privateKey: keys.privateKey,
        publicKey: keys.publicKey
      };
      
      console.log('🔐 CA certificate generated successfully');
    } catch (error) {
      console.error('❌ Failed to generate CA certificate:', error);
      throw error;
    }
  }

  // Device registration
  async registerDevice(deviceInfo, userId) {
    try {
      const deviceId = this.generateDeviceId(deviceInfo);
      
      // Create device fingerprint
      const fingerprint = this.createDeviceFingerprint(deviceInfo);
      
      // Check for existing device
      const existingDevice = this.findDeviceByFingerprint(fingerprint);
      if (existingDevice) {
        return await this.updateExistingDevice(existingDevice, userId);
      }
      
      // Generate device certificate
      const certificate = await this.generateDeviceCertificate(deviceId, userId);
      
      // Create device record
      const device = {
        id: deviceId,
        userId,
        fingerprint,
        certificate,
        registeredAt: Date.now(),
        lastSeen: Date.now(),
        trustScore: 0.5, // Initial neutral trust
        complianceStatus: 'pending',
        metadata: {
          userAgent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          screen: deviceInfo.screen,
          timezone: deviceInfo.timezone,
          language: deviceInfo.language
        },
        status: 'active'
      };
      
      // Store device information
      this.state.registeredDevices.set(deviceId, device);
      this.state.deviceFingerprints.set(fingerprint, deviceId);
      this.state.deviceCertificates.set(deviceId, certificate);
      this.state.trustScores.set(deviceId, {
        score: 0.5,
        factors: [],
        lastUpdated: Date.now()
      });
      
      // Perform initial compliance check
      await this.checkDeviceCompliance(deviceId);
      
      this.metrics.devicesRegistered++;
      this.metrics.certificatesIssued++;
      
      this.emit('deviceRegistered', {
        deviceId,
        userId,
        timestamp: Date.now()
      });
      
      return {
        deviceId,
        certificate: forge.pki.certificateToPem(certificate.certificate),
        privateKey: forge.pki.privateKeyToPem(certificate.privateKey),
        trustScore: 0.5
      };
      
    } catch (error) {
      console.error('❌ Device registration failed:', error);
      throw error;
    }
  }

  generateDeviceId(deviceInfo) {
    const data = JSON.stringify({
      userAgent: deviceInfo.userAgent,
      platform: deviceInfo.platform,
      screen: deviceInfo.screen,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  createDeviceFingerprint(deviceInfo) {
    const components = this.config.fingerprintComponents
      .map(component => deviceInfo[component] || '')
      .join('|');
    
    return crypto.createHash('sha256').update(components).digest('hex');
  }

  findDeviceByFingerprint(fingerprint) {
    const deviceId = this.state.deviceFingerprints.get(fingerprint);
    return deviceId ? this.state.registeredDevices.get(deviceId) : null;
  }

  async updateExistingDevice(device, userId) {
    // Update last seen and user association
    device.lastSeen = Date.now();
    if (device.userId !== userId) {
      // Device is being used by different user - potential security issue
      await this.handleDeviceUserMismatch(device, userId);
    }
    
    return {
      deviceId: device.id,
      certificate: forge.pki.certificateToPem(this.state.deviceCertificates.get(device.id).certificate),
      trustScore: device.trustScore
    };
  }

  async handleDeviceUserMismatch(device, newUserId) {
    this.emit('deviceUserMismatch', {
      deviceId: device.id,
      originalUserId: device.userId,
      newUserId,
      timestamp: Date.now()
    });
    
    // Reduce trust score
    await this.adjustTrustScore(device.id, -0.3, 'user_mismatch');
    
    // Require additional verification
    device.requiresVerification = true;
  }

  // Device certificate generation
  async generateDeviceCertificate(deviceId, userId) {
    try {
      // Generate device key pair
      const keys = forge.pki.rsa.generateKeyPair(this.config.keySize);
      
      // Create device certificate
      const cert = forge.pki.createCertificate();
      cert.publicKey = keys.publicKey;
      cert.serialNumber = deviceId.substring(0, 16);
      cert.validity.notBefore = new Date();
      cert.validity.notAfter = new Date();
      cert.validity.notAfter.setTime(cert.validity.notBefore.getTime() + this.config.certificateValidity);
      
      const attrs = [{
        name: 'commonName',
        value: `Device-${deviceId}`
      }, {
        name: 'organizationName',
        value: 'Applied Innovation Corporation'
      }, {
        name: 'organizationalUnitName',
        value: 'Trusted Devices'
      }];
      
      cert.setSubject(attrs);
      cert.setIssuer(this.caCertificate.certificate.subject.attributes);
      
      cert.setExtensions([{
        name: 'basicConstraints',
        cA: false
      }, {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true
      }, {
        name: 'extKeyUsage',
        clientAuth: true
      }, {
        name: 'subjectAltName',
        altNames: [{
          type: 2, // DNS
          value: `device-${deviceId}.aic.local`
        }]
      }]);
      
      // Sign with CA private key
      cert.sign(this.caCertificate.privateKey);
      
      return {
        certificate: cert,
        privateKey: keys.privateKey,
        publicKey: keys.publicKey,
        deviceId,
        userId,
        issuedAt: Date.now()
      };
      
    } catch (error) {
      console.error('❌ Device certificate generation failed:', error);
      throw error;
    }
  }

  // Device verification for zero-trust
  async verifyDevice(request) {
    try {
      const { deviceId, certificate, signature, challenge } = request;
      
      if (!deviceId) {
        return { trusted: false, reason: 'No device ID provided' };
      }
      
      // Get device record
      const device = this.state.registeredDevices.get(deviceId);
      if (!device) {
        return { trusted: false, reason: 'Device not registered' };
      }
      
      // Check device status
      if (device.status !== 'active') {
        return { trusted: false, reason: 'Device is not active' };
      }
      
      // Verify certificate if provided
      if (certificate && signature && challenge) {
        const certValid = await this.verifyCertificate(deviceId, certificate, signature, challenge);
        if (!certValid) {
          return { trusted: false, reason: 'Certificate verification failed' };
        }
      }
      
      // Update last seen
      device.lastSeen = Date.now();
      
      // Get current trust score
      const trustData = this.state.trustScores.get(deviceId);
      const trustScore = trustData ? trustData.score : 0;
      
      // Check trust threshold
      const trusted = trustScore >= this.config.trustThreshold;
      
      // Update metrics
      this.metrics.trustVerifications++;
      if (!trusted) {
        this.metrics.suspiciousDevices++;
      }
      
      return {
        trusted,
        trustScore,
        deviceId,
        lastSeen: device.lastSeen,
        complianceStatus: device.complianceStatus,
        factors: trustData ? trustData.factors : []
      };
      
    } catch (error) {
      console.error('❌ Device verification failed:', error);
      return { trusted: false, reason: error.message };
    }
  }

  async verifyCertificate(deviceId, certificatePem, signature, challenge) {
    try {
      // Parse certificate
      const cert = forge.pki.certificateFromPem(certificatePem);
      
      // Verify certificate chain
      const caStore = forge.pki.createCaStore([this.caCertificate.certificate]);
      const verified = forge.pki.verifyCertificateChain(caStore, [cert]);
      
      if (!verified) {
        return false;
      }
      
      // Verify signature
      const md = forge.md.sha256.create();
      md.update(challenge, 'utf8');
      
      const signatureBytes = forge.util.decode64(signature);
      const verified2 = cert.publicKey.verify(md.digest().bytes(), signatureBytes);
      
      return verified2;
    } catch (error) {
      console.error('❌ Certificate verification failed:', error);
      return false;
    }
  }

  // Trust scoring
  async calculateTrustScore(deviceId) {
    try {
      const device = this.state.registeredDevices.get(deviceId);
      if (!device) return 0;
      
      let score = 0.5; // Base score
      const factors = [];
      
      // Age factor (older devices are more trusted)
      const ageInDays = (Date.now() - device.registeredAt) / 86400000;
      const ageFactor = Math.min(ageInDays / 30, 1) * 0.2; // Max 0.2 for 30+ days
      score += ageFactor;
      factors.push({ type: 'age', value: ageFactor, description: `Device age: ${Math.round(ageInDays)} days` });
      
      // Usage frequency factor
      const sessions = this.getDeviceSessions(deviceId);
      const frequencyFactor = Math.min(sessions.length / 10, 1) * 0.15; // Max 0.15 for 10+ sessions
      score += frequencyFactor;
      factors.push({ type: 'frequency', value: frequencyFactor, description: `${sessions.length} sessions` });
      
      // Compliance factor
      const compliance = this.state.complianceStatus.get(deviceId);
      if (compliance) {
        const complianceScore = compliance.score || 0;
        const complianceFactor = complianceScore * 0.25; // Max 0.25 for full compliance
        score += complianceFactor;
        factors.push({ type: 'compliance', value: complianceFactor, description: `Compliance: ${Math.round(complianceScore * 100)}%` });
      }
      
      // Consistency factor (same location, time patterns)
      const consistencyFactor = await this.calculateConsistencyFactor(deviceId);
      score += consistencyFactor;
      factors.push({ type: 'consistency', value: consistencyFactor, description: 'Usage pattern consistency' });
      
      // Security incidents factor (negative)
      const incidents = await this.getDeviceSecurityIncidents(deviceId);
      const incidentPenalty = incidents.length * 0.1; // -0.1 per incident
      score -= incidentPenalty;
      if (incidentPenalty > 0) {
        factors.push({ type: 'incidents', value: -incidentPenalty, description: `${incidents.length} security incidents` });
      }
      
      // Apply trust decay
      const lastUpdate = this.state.trustScores.get(deviceId)?.lastUpdated || Date.now();
      const daysSinceUpdate = (Date.now() - lastUpdate) / 86400000;
      const decayFactor = daysSinceUpdate * this.config.trustDecayRate;
      score -= decayFactor;
      
      // Ensure score is between 0 and 1
      score = Math.max(0, Math.min(1, score));
      
      return { score, factors };
    } catch (error) {
      console.error('❌ Trust score calculation failed:', error);
      return { score: 0, factors: [] };
    }
  }

  async adjustTrustScore(deviceId, adjustment, reason) {
    const currentTrust = this.state.trustScores.get(deviceId);
    if (!currentTrust) return;
    
    const newScore = Math.max(0, Math.min(1, currentTrust.score + adjustment));
    
    this.state.trustScores.set(deviceId, {
      score: newScore,
      factors: [...currentTrust.factors, {
        type: 'adjustment',
        value: adjustment,
        reason,
        timestamp: Date.now()
      }],
      lastUpdated: Date.now()
    });
    
    this.emit('trustScoreUpdated', {
      deviceId,
      oldScore: currentTrust.score,
      newScore,
      adjustment,
      reason,
      timestamp: Date.now()
    });
  }

  async calculateConsistencyFactor(deviceId) {
    // Analyze usage patterns for consistency
    const sessions = this.getDeviceSessions(deviceId);
    if (sessions.length < 3) return 0;
    
    // Check time patterns
    const hours = sessions.map(s => new Date(s.timestamp).getHours());
    const timeConsistency = this.calculateVariance(hours) < 4 ? 0.1 : 0;
    
    // Check location patterns (if available)
    const locations = sessions.map(s => s.location).filter(Boolean);
    const locationConsistency = locations.length > 0 && new Set(locations).size <= 3 ? 0.1 : 0;
    
    return timeConsistency + locationConsistency;
  }

  calculateVariance(numbers) {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const squaredDiffs = numbers.map(num => Math.pow(num - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
  }

  // Device compliance checking
  async checkDeviceCompliance(deviceId) {
    try {
      const device = this.state.registeredDevices.get(deviceId);
      if (!device) return;
      
      const compliance = {
        deviceId,
        checkedAt: Date.now(),
        requirements: {},
        score: 0,
        status: 'compliant'
      };
      
      // Check each compliance requirement
      for (const [requirement, required] of Object.entries(this.config.requiredCompliance)) {
        if (required) {
          const result = await this.checkComplianceRequirement(deviceId, requirement);
          compliance.requirements[requirement] = result;
          
          if (!result.compliant) {
            compliance.status = 'non-compliant';
          }
        }
      }
      
      // Calculate compliance score
      const totalRequirements = Object.keys(compliance.requirements).length;
      const compliantRequirements = Object.values(compliance.requirements)
        .filter(req => req.compliant).length;
      
      compliance.score = totalRequirements > 0 ? compliantRequirements / totalRequirements : 1;
      
      // Store compliance status
      this.state.complianceStatus.set(deviceId, compliance);
      
      // Update device record
      device.complianceStatus = compliance.status;
      device.lastComplianceCheck = Date.now();
      
      // Adjust trust score based on compliance
      if (compliance.status === 'compliant') {
        await this.adjustTrustScore(deviceId, 0.1, 'compliance_check_passed');
      } else {
        await this.adjustTrustScore(deviceId, -0.2, 'compliance_check_failed');
      }
      
      this.metrics.complianceChecks++;
      
      this.emit('complianceChecked', {
        deviceId,
        compliance,
        timestamp: Date.now()
      });
      
      return compliance;
    } catch (error) {
      console.error('❌ Device compliance check failed:', error);
      return null;
    }
  }

  async checkComplianceRequirement(deviceId, requirement) {
    // This would integrate with device management systems
    // For now, we'll simulate the checks
    
    switch (requirement) {
      case 'osVersion':
        return { compliant: true, details: 'OS version is up to date' };
      case 'antivirus':
        return { compliant: true, details: 'Antivirus is active and updated' };
      case 'firewall':
        return { compliant: true, details: 'Firewall is enabled' };
      case 'encryption':
        return { compliant: true, details: 'Device encryption is enabled' };
      case 'screenLock':
        return { compliant: true, details: 'Screen lock is configured' };
      default:
        return { compliant: false, details: 'Unknown requirement' };
    }
  }

  // Device session management
  createDeviceSession(deviceId, userId, sessionData) {
    const sessionId = crypto.randomUUID();
    const session = {
      id: sessionId,
      deviceId,
      userId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      location: sessionData.location,
      ip: sessionData.ip,
      userAgent: sessionData.userAgent,
      active: true
    };
    
    if (!this.state.deviceSessions.has(deviceId)) {
      this.state.deviceSessions.set(deviceId, []);
    }
    
    this.state.deviceSessions.get(deviceId).push(session);
    
    return sessionId;
  }

  getDeviceSessions(deviceId) {
    return this.state.deviceSessions.get(deviceId) || [];
  }

  async getDeviceSecurityIncidents(deviceId) {
    // This would query security incident database
    // For now, return empty array
    return [];
  }

  // Device management
  async blockDevice(deviceId, reason) {
    const device = this.state.registeredDevices.get(deviceId);
    if (!device) return false;
    
    device.status = 'blocked';
    device.blockedAt = Date.now();
    device.blockReason = reason;
    
    // Set trust score to 0
    this.state.trustScores.set(deviceId, {
      score: 0,
      factors: [{ type: 'blocked', reason, timestamp: Date.now() }],
      lastUpdated: Date.now()
    });
    
    this.metrics.blockedDevices++;
    
    this.emit('deviceBlocked', {
      deviceId,
      reason,
      timestamp: Date.now()
    });
    
    return true;
  }

  async unblockDevice(deviceId) {
    const device = this.state.registeredDevices.get(deviceId);
    if (!device) return false;
    
    device.status = 'active';
    delete device.blockedAt;
    delete device.blockReason;
    
    // Reset trust score to neutral
    this.state.trustScores.set(deviceId, {
      score: 0.5,
      factors: [{ type: 'unblocked', timestamp: Date.now() }],
      lastUpdated: Date.now()
    });
    
    this.emit('deviceUnblocked', {
      deviceId,
      timestamp: Date.now()
    });
    
    return true;
  }

  // Maintenance methods
  async updateTrustScores() {
    console.log('🔄 Updating device trust scores...');
    
    let updatedCount = 0;
    for (const deviceId of this.state.registeredDevices.keys()) {
      const trustData = await this.calculateTrustScore(deviceId);
      this.state.trustScores.set(deviceId, {
        ...trustData,
        lastUpdated: Date.now()
      });
      updatedCount++;
    }
    
    console.log(`✅ Updated ${updatedCount} device trust scores`);
  }

  async cleanupExpiredDevices() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [deviceId, device] of this.state.registeredDevices) {
      // Remove devices not seen for max trust age
      if (now - device.lastSeen > this.config.maxTrustAge) {
        this.state.registeredDevices.delete(deviceId);
        this.state.deviceCertificates.delete(deviceId);
        this.state.trustScores.delete(deviceId);
        this.state.complianceStatus.delete(deviceId);
        this.state.deviceSessions.delete(deviceId);
        
        // Remove from fingerprint index
        this.state.deviceFingerprints.delete(device.fingerprint);
        
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired devices`);
    }
  }

  async performComplianceChecks() {
    console.log('🔍 Performing device compliance checks...');
    
    let checkedCount = 0;
    for (const deviceId of this.state.registeredDevices.keys()) {
      await this.checkDeviceCompliance(deviceId);
      checkedCount++;
    }
    
    console.log(`✅ Checked compliance for ${checkedCount} devices`);
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      registeredDevices: this.state.registeredDevices.size,
      activeCertificates: this.state.deviceCertificates.size,
      averageTrustScore: this.calculateAverageTrustScore(),
      metrics: this.metrics
    };
  }

  calculateAverageTrustScore() {
    if (this.state.trustScores.size === 0) return 0;
    
    const scores = Array.from(this.state.trustScores.values()).map(t => t.score);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }

  // Shutdown
  async shutdown() {
    console.log('📱 Shutting down Device Trust Manager...');
    
    // Clear sensitive data
    this.state.deviceCertificates.clear();
    this.caCertificate = null;
    
    console.log('✅ Device Trust Manager shutdown complete');
  }
}

module.exports = { DeviceTrustManager };
