/**
 * Network Security Manager for Zero-Trust Architecture
 * Implements micro-segmentation, ZTNA, and network-based access controls
 * Provides software-defined perimeter and DNS security
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const net = require('net');
const dns = require('dns').promises;

class NetworkSecurityManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Network access control
      defaultDeny: config.defaultDeny !== false, // Default to deny-all
      allowedNetworks: config.allowedNetworks || [],
      blockedNetworks: config.blockedNetworks || [],
      blockedCountries: config.blockedCountries || [],
      
      // Micro-segmentation
      microSegments: config.microSegments || {
        'web-tier': { subnets: ['10.0.1.0/24'], ports: [80, 443] },
        'app-tier': { subnets: ['10.0.2.0/24'], ports: [8080, 8443] },
        'data-tier': { subnets: ['10.0.3.0/24'], ports: [5432, 3306] },
        'admin': { subnets: ['10.0.10.0/24'], ports: [22, 3389] }
      },
      
      // Rate limiting
      rateLimits: {
        perIP: { requests: 100, window: 60000 }, // 100 req/min per IP
        perUser: { requests: 1000, window: 60000 }, // 1000 req/min per user
        global: { requests: 10000, window: 60000 } // 10k req/min global
      },
      
      // DDoS protection
      ddosProtection: {
        enabled: config.ddosProtection !== false,
        threshold: config.ddosThreshold || 1000, // requests per minute
        blockDuration: config.ddosBlockDuration || 3600000 // 1 hour
      },
      
      // DNS security
      dnsFiltering: {
        enabled: config.dnsFiltering !== false,
        blockedDomains: config.blockedDomains || [],
        allowedDomains: config.allowedDomains || [],
        malwareDomains: new Set(),
        phishingDomains: new Set()
      },
      
      // Geolocation blocking
      geoBlocking: {
        enabled: config.geoBlocking || false,
        blockedCountries: config.blockedCountries || [],
        allowedCountries: config.allowedCountries || []
      },
      
      ...config
    };

    this.state = {
      activeConnections: new Map(),
      rateLimitCounters: new Map(),
      blockedIPs: new Map(),
      networkSegments: new Map(),
      dnsCache: new Map(),
      geoLocationCache: new Map(),
      securityRules: new Map()
    };

    this.metrics = {
      connectionsAllowed: 0,
      connectionsBlocked: 0,
      rateLimitViolations: 0,
      ddosAttacksBlocked: 0,
      dnsQueriesBlocked: 0,
      geoBlockedRequests: 0,
      malwareDomainsBlocked: 0
    };

    this.init();
  }

  async init() {
    console.log('🌐 Initializing Network Security Manager...');
    
    // Initialize network segments
    await this.initializeNetworkSegments();
    
    // Load threat intelligence feeds
    await this.loadThreatIntelligence();
    
    // Setup monitoring intervals
    setInterval(() => this.cleanupExpiredBlocks(), 300000); // 5 minutes
    setInterval(() => this.resetRateLimitCounters(), 60000); // 1 minute
    setInterval(() => this.updateThreatIntelligence(), 3600000); // 1 hour
    
    console.log('✅ Network Security Manager initialized');
  }

  async initializeNetworkSegments() {
    for (const [segmentName, config] of Object.entries(this.config.microSegments)) {
      this.state.networkSegments.set(segmentName, {
        name: segmentName,
        subnets: config.subnets,
        allowedPorts: config.ports,
        rules: config.rules || [],
        active: true
      });
    }
    
    console.log(`📡 Initialized ${this.state.networkSegments.size} network segments`);
  }

  async loadThreatIntelligence() {
    try {
      // Load malware domains (would integrate with threat intelligence feeds)
      const malwareDomains = [
        'malware-example.com',
        'phishing-site.net',
        'suspicious-domain.org'
      ];
      
      malwareDomains.forEach(domain => {
        this.config.dnsFiltering.malwareDomains.add(domain);
      });
      
      console.log(`🛡️ Loaded ${malwareDomains.length} threat intelligence indicators`);
    } catch (error) {
      console.error('❌ Failed to load threat intelligence:', error);
    }
  }

  // Core network verification method
  async verifyNetwork(request) {
    try {
      const { ip, port, protocol, hostname, userId, deviceId } = request;
      
      const verification = {
        allowed: false,
        ip: ip,
        reasons: [],
        riskScore: 0,
        segment: null
      };

      // 1. IP-based checks
      const ipCheck = await this.verifyIPAddress(ip);
      if (!ipCheck.allowed) {
        verification.reasons.push(ipCheck.reason);
        verification.riskScore += 0.3;
        return verification;
      }

      // 2. Geolocation check
      if (this.config.geoBlocking.enabled) {
        const geoCheck = await this.verifyGeolocation(ip);
        if (!geoCheck.allowed) {
          verification.reasons.push(geoCheck.reason);
          verification.riskScore += 0.4;
          this.metrics.geoBlockedRequests++;
          return verification;
        }
      }

      // 3. Rate limiting check
      const rateLimitCheck = await this.checkRateLimit(ip, userId);
      if (!rateLimitCheck.allowed) {
        verification.reasons.push(rateLimitCheck.reason);
        verification.riskScore += 0.2;
        this.metrics.rateLimitViolations++;
        return verification;
      }

      // 4. DDoS protection
      if (this.config.ddosProtection.enabled) {
        const ddosCheck = await this.checkDDoSProtection(ip);
        if (!ddosCheck.allowed) {
          verification.reasons.push(ddosCheck.reason);
          verification.riskScore += 0.5;
          this.metrics.ddosAttacksBlocked++;
          return verification;
        }
      }

      // 5. Network segment verification
      const segmentCheck = await this.verifyNetworkSegment(ip, port, protocol);
      verification.segment = segmentCheck.segment;
      if (!segmentCheck.allowed) {
        verification.reasons.push(segmentCheck.reason);
        verification.riskScore += 0.3;
        return verification;
      }

      // 6. DNS security check (if hostname provided)
      if (hostname) {
        const dnsCheck = await this.verifyDNSSecurity(hostname);
        if (!dnsCheck.allowed) {
          verification.reasons.push(dnsCheck.reason);
          verification.riskScore += 0.4;
          this.metrics.dnsQueriesBlocked++;
          return verification;
        }
      }

      // All checks passed
      verification.allowed = true;
      verification.reasons.push('All network security checks passed');
      
      // Record successful connection
      await this.recordConnection(request);
      this.metrics.connectionsAllowed++;
      
      return verification;

    } catch (error) {
      console.error('❌ Network verification failed:', error);
      this.metrics.connectionsBlocked++;
      return {
        allowed: false,
        reasons: ['Network verification error'],
        riskScore: 1.0,
        error: error.message
      };
    }
  }

  // IP address verification
  async verifyIPAddress(ip) {
    try {
      // Check if IP is blocked
      if (this.state.blockedIPs.has(ip)) {
        const blockInfo = this.state.blockedIPs.get(ip);
        return {
          allowed: false,
          reason: `IP blocked: ${blockInfo.reason}`,
          blockInfo
        };
      }

      // Check against blocked networks
      for (const blockedNetwork of this.config.blockedNetworks) {
        if (this.isIPInNetwork(ip, blockedNetwork)) {
          return {
            allowed: false,
            reason: `IP in blocked network: ${blockedNetwork}`
          };
        }
      }

      // If allowedNetworks is specified, check inclusion
      if (this.config.allowedNetworks.length > 0) {
        let inAllowedNetwork = false;
        for (const allowedNetwork of this.config.allowedNetworks) {
          if (this.isIPInNetwork(ip, allowedNetwork)) {
            inAllowedNetwork = true;
            break;
          }
        }
        
        if (!inAllowedNetwork) {
          return {
            allowed: false,
            reason: 'IP not in allowed networks'
          };
        }
      }

      // Check for private/internal IPs in production
      if (this.isPrivateIP(ip) && process.env.NODE_ENV === 'production') {
        return {
          allowed: false,
          reason: 'Private IP not allowed in production'
        };
      }

      return { allowed: true, reason: 'IP verification passed' };
    } catch (error) {
      console.error('❌ IP verification failed:', error);
      return { allowed: false, reason: 'IP verification error' };
    }
  }

  // Geolocation verification
  async verifyGeolocation(ip) {
    try {
      // Check cache first
      if (this.state.geoLocationCache.has(ip)) {
        const cachedGeo = this.state.geoLocationCache.get(ip);
        return this.evaluateGeolocation(cachedGeo);
      }

      // Get geolocation (would integrate with geolocation service)
      const geoLocation = await this.getIPGeolocation(ip);
      
      // Cache result
      this.state.geoLocationCache.set(ip, geoLocation);
      
      return this.evaluateGeolocation(geoLocation);
    } catch (error) {
      console.error('❌ Geolocation verification failed:', error);
      return { allowed: true, reason: 'Geolocation check failed, allowing by default' };
    }
  }

  evaluateGeolocation(geoLocation) {
    if (!geoLocation || !geoLocation.country) {
      return { allowed: true, reason: 'Geolocation data unavailable' };
    }

    // Check blocked countries
    if (this.config.geoBlocking.blockedCountries.includes(geoLocation.country)) {
      return {
        allowed: false,
        reason: `Access blocked from country: ${geoLocation.country}`
      };
    }

    // Check allowed countries (if specified)
    if (this.config.geoBlocking.allowedCountries.length > 0) {
      if (!this.config.geoBlocking.allowedCountries.includes(geoLocation.country)) {
        return {
          allowed: false,
          reason: `Country not in allowed list: ${geoLocation.country}`
        };
      }
    }

    return { allowed: true, reason: 'Geolocation verification passed' };
  }

  // Rate limiting
  async checkRateLimit(ip, userId) {
    try {
      const now = Date.now();
      
      // Check per-IP rate limit
      const ipKey = `ip:${ip}`;
      const ipCounter = this.state.rateLimitCounters.get(ipKey) || { count: 0, window: now };
      
      if (now - ipCounter.window < this.config.rateLimits.perIP.window) {
        if (ipCounter.count >= this.config.rateLimits.perIP.requests) {
          return {
            allowed: false,
            reason: 'IP rate limit exceeded',
            limit: this.config.rateLimits.perIP.requests,
            window: this.config.rateLimits.perIP.window
          };
        }
      } else {
        // Reset window
        ipCounter.count = 0;
        ipCounter.window = now;
      }
      
      ipCounter.count++;
      this.state.rateLimitCounters.set(ipKey, ipCounter);

      // Check per-user rate limit (if userId provided)
      if (userId) {
        const userKey = `user:${userId}`;
        const userCounter = this.state.rateLimitCounters.get(userKey) || { count: 0, window: now };
        
        if (now - userCounter.window < this.config.rateLimits.perUser.window) {
          if (userCounter.count >= this.config.rateLimits.perUser.requests) {
            return {
              allowed: false,
              reason: 'User rate limit exceeded',
              limit: this.config.rateLimits.perUser.requests,
              window: this.config.rateLimits.perUser.window
            };
          }
        } else {
          userCounter.count = 0;
          userCounter.window = now;
        }
        
        userCounter.count++;
        this.state.rateLimitCounters.set(userKey, userCounter);
      }

      // Check global rate limit
      const globalKey = 'global';
      const globalCounter = this.state.rateLimitCounters.get(globalKey) || { count: 0, window: now };
      
      if (now - globalCounter.window < this.config.rateLimits.global.window) {
        if (globalCounter.count >= this.config.rateLimits.global.requests) {
          return {
            allowed: false,
            reason: 'Global rate limit exceeded',
            limit: this.config.rateLimits.global.requests,
            window: this.config.rateLimits.global.window
          };
        }
      } else {
        globalCounter.count = 0;
        globalCounter.window = now;
      }
      
      globalCounter.count++;
      this.state.rateLimitCounters.set(globalKey, globalCounter);

      return { allowed: true, reason: 'Rate limit check passed' };
    } catch (error) {
      console.error('❌ Rate limit check failed:', error);
      return { allowed: true, reason: 'Rate limit check error, allowing by default' };
    }
  }

  // DDoS protection
  async checkDDoSProtection(ip) {
    try {
      const now = Date.now();
      const windowStart = now - 60000; // 1 minute window
      
      // Count requests from this IP in the last minute
      const ipRequests = Array.from(this.state.activeConnections.values())
        .filter(conn => conn.ip === ip && conn.timestamp > windowStart)
        .length;
      
      if (ipRequests > this.config.ddosProtection.threshold) {
        // Block IP temporarily
        await this.blockIP(ip, 'DDoS attack detected', this.config.ddosProtection.blockDuration);
        
        return {
          allowed: false,
          reason: 'DDoS protection triggered',
          requestCount: ipRequests,
          threshold: this.config.ddosProtection.threshold
        };
      }

      return { allowed: true, reason: 'DDoS protection check passed' };
    } catch (error) {
      console.error('❌ DDoS protection check failed:', error);
      return { allowed: true, reason: 'DDoS protection error, allowing by default' };
    }
  }

  // Network segment verification
  async verifyNetworkSegment(ip, port, protocol) {
    try {
      // Find which segment this IP belongs to
      let matchedSegment = null;
      
      for (const [segmentName, segment] of this.state.networkSegments) {
        for (const subnet of segment.subnets) {
          if (this.isIPInNetwork(ip, subnet)) {
            matchedSegment = segment;
            break;
          }
        }
        if (matchedSegment) break;
      }

      if (!matchedSegment) {
        // IP not in any defined segment
        if (this.config.defaultDeny) {
          return {
            allowed: false,
            reason: 'IP not in any defined network segment',
            segment: null
          };
        } else {
          return {
            allowed: true,
            reason: 'IP not in defined segments but default allow policy',
            segment: null
          };
        }
      }

      // Check if port is allowed for this segment
      if (port && matchedSegment.allowedPorts.length > 0) {
        if (!matchedSegment.allowedPorts.includes(port)) {
          return {
            allowed: false,
            reason: `Port ${port} not allowed for segment ${matchedSegment.name}`,
            segment: matchedSegment.name
          };
        }
      }

      return {
        allowed: true,
        reason: `Access allowed for segment ${matchedSegment.name}`,
        segment: matchedSegment.name
      };
    } catch (error) {
      console.error('❌ Network segment verification failed:', error);
      return {
        allowed: false,
        reason: 'Network segment verification error',
        segment: null
      };
    }
  }

  // DNS security verification
  async verifyDNSSecurity(hostname) {
    try {
      const domain = this.extractDomain(hostname);
      
      // Check DNS cache first
      if (this.state.dnsCache.has(domain)) {
        const cachedResult = this.state.dnsCache.get(domain);
        if (Date.now() - cachedResult.timestamp < 300000) { // 5 minute cache
          return cachedResult.result;
        }
      }

      // Check against blocked domains
      if (this.config.dnsFiltering.blockedDomains.includes(domain)) {
        const result = {
          allowed: false,
          reason: `Domain in blocked list: ${domain}`
        };
        this.state.dnsCache.set(domain, { result, timestamp: Date.now() });
        return result;
      }

      // Check against malware domains
      if (this.config.dnsFiltering.malwareDomains.has(domain)) {
        const result = {
          allowed: false,
          reason: `Malware domain detected: ${domain}`
        };
        this.state.dnsCache.set(domain, { result, timestamp: Date.now() });
        this.metrics.malwareDomainsBlocked++;
        return result;
      }

      // Check against phishing domains
      if (this.config.dnsFiltering.phishingDomains.has(domain)) {
        const result = {
          allowed: false,
          reason: `Phishing domain detected: ${domain}`
        };
        this.state.dnsCache.set(domain, { result, timestamp: Date.now() });
        return result;
      }

      // Check allowed domains (if specified)
      if (this.config.dnsFiltering.allowedDomains.length > 0) {
        if (!this.config.dnsFiltering.allowedDomains.includes(domain)) {
          const result = {
            allowed: false,
            reason: `Domain not in allowed list: ${domain}`
          };
          this.state.dnsCache.set(domain, { result, timestamp: Date.now() });
          return result;
        }
      }

      // Perform DNS resolution to check if domain exists
      try {
        await dns.resolve(domain);
      } catch (dnsError) {
        const result = {
          allowed: false,
          reason: `DNS resolution failed for domain: ${domain}`
        };
        this.state.dnsCache.set(domain, { result, timestamp: Date.now() });
        return result;
      }

      const result = { allowed: true, reason: 'DNS security check passed' };
      this.state.dnsCache.set(domain, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('❌ DNS security verification failed:', error);
      return { allowed: true, reason: 'DNS security check error, allowing by default' };
    }
  }

  // Connection recording
  async recordConnection(request) {
    const connectionId = crypto.randomUUID();
    const connection = {
      id: connectionId,
      ip: request.ip,
      port: request.port,
      protocol: request.protocol,
      hostname: request.hostname,
      userId: request.userId,
      deviceId: request.deviceId,
      timestamp: Date.now(),
      active: true
    };

    this.state.activeConnections.set(connectionId, connection);
    
    // Emit connection event
    this.emit('connectionAllowed', connection);
    
    return connectionId;
  }

  // IP blocking
  async blockIP(ip, reason, duration = 3600000) {
    this.state.blockedIPs.set(ip, {
      reason,
      blockedAt: Date.now(),
      duration,
      expiresAt: Date.now() + duration
    });

    this.emit('ipBlocked', {
      ip,
      reason,
      duration,
      timestamp: Date.now()
    });

    console.log(`🚫 Blocked IP ${ip}: ${reason}`);
  }

  async unblockIP(ip) {
    if (this.state.blockedIPs.has(ip)) {
      this.state.blockedIPs.delete(ip);
      
      this.emit('ipUnblocked', {
        ip,
        timestamp: Date.now()
      });
      
      console.log(`✅ Unblocked IP ${ip}`);
      return true;
    }
    return false;
  }

  // Network segment management
  async createNetworkSegment(name, config) {
    this.state.networkSegments.set(name, {
      name,
      subnets: config.subnets || [],
      allowedPorts: config.allowedPorts || [],
      rules: config.rules || [],
      active: true,
      createdAt: Date.now()
    });

    this.emit('segmentCreated', { name, config, timestamp: Date.now() });
  }

  async updateNetworkSegment(name, config) {
    const segment = this.state.networkSegments.get(name);
    if (!segment) return false;

    Object.assign(segment, config, { updatedAt: Date.now() });
    this.emit('segmentUpdated', { name, config, timestamp: Date.now() });
    return true;
  }

  async deleteNetworkSegment(name) {
    if (this.state.networkSegments.has(name)) {
      this.state.networkSegments.delete(name);
      this.emit('segmentDeleted', { name, timestamp: Date.now() });
      return true;
    }
    return false;
  }

  // Utility methods
  isIPInNetwork(ip, network) {
    try {
      const [networkAddr, prefixLength] = network.split('/');
      const prefix = parseInt(prefixLength, 10);
      
      const ipInt = this.ipToInt(ip);
      const networkInt = this.ipToInt(networkAddr);
      const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
      
      return (ipInt & mask) === (networkInt & mask);
    } catch (error) {
      console.error('❌ Network check failed:', error);
      return false;
    }
  }

  ipToInt(ip) {
    return ip.split('.').reduce((int, octet) => (int << 8) + parseInt(octet, 10), 0) >>> 0;
  }

  isPrivateIP(ip) {
    const privateRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16',
      '127.0.0.0/8'
    ];
    
    return privateRanges.some(range => this.isIPInNetwork(ip, range));
  }

  extractDomain(hostname) {
    try {
      const url = new URL(`http://${hostname}`);
      return url.hostname.toLowerCase();
    } catch {
      return hostname.toLowerCase();
    }
  }

  async getIPGeolocation(ip) {
    // This would integrate with a geolocation service like MaxMind
    // For now, return mock data
    return {
      ip,
      country: 'US',
      region: 'CA',
      city: 'San Francisco',
      latitude: 37.7749,
      longitude: -122.4194
    };
  }

  // Maintenance methods
  cleanupExpiredBlocks() {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [ip, blockInfo] of this.state.blockedIPs) {
      if (now > blockInfo.expiresAt) {
        this.state.blockedIPs.delete(ip);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired IP blocks`);
    }
  }

  resetRateLimitCounters() {
    const now = Date.now();
    let resetCount = 0;

    for (const [key, counter] of this.state.rateLimitCounters) {
      const windowExpired = now - counter.window > this.getWindowForKey(key);
      if (windowExpired) {
        counter.count = 0;
        counter.window = now;
        resetCount++;
      }
    }

    if (resetCount > 0) {
      console.log(`🔄 Reset ${resetCount} rate limit counters`);
    }
  }

  getWindowForKey(key) {
    if (key.startsWith('ip:')) return this.config.rateLimits.perIP.window;
    if (key.startsWith('user:')) return this.config.rateLimits.perUser.window;
    if (key === 'global') return this.config.rateLimits.global.window;
    return 60000; // Default 1 minute
  }

  async updateThreatIntelligence() {
    try {
      // This would fetch updated threat intelligence feeds
      console.log('🔄 Updating threat intelligence feeds...');
      
      // Mock update - in reality, this would fetch from threat intel APIs
      const newMalwareDomains = ['new-malware-site.com'];
      newMalwareDomains.forEach(domain => {
        this.config.dnsFiltering.malwareDomains.add(domain);
      });
      
      console.log(`✅ Updated threat intelligence with ${newMalwareDomains.length} new indicators`);
    } catch (error) {
      console.error('❌ Failed to update threat intelligence:', error);
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      activeConnections: this.state.activeConnections.size,
      blockedIPs: this.state.blockedIPs.size,
      networkSegments: this.state.networkSegments.size,
      rateLimitCounters: this.state.rateLimitCounters.size,
      metrics: this.metrics
    };
  }

  // Public API methods
  getNetworkStatus() {
    return {
      segments: Array.from(this.state.networkSegments.values()),
      blockedIPs: Array.from(this.state.blockedIPs.keys()),
      activeConnections: this.state.activeConnections.size,
      metrics: this.metrics
    };
  }

  // Shutdown
  async shutdown() {
    console.log('🌐 Shutting down Network Security Manager...');
    
    // Clear sensitive data
    this.state.activeConnections.clear();
    this.state.blockedIPs.clear();
    this.state.rateLimitCounters.clear();
    
    console.log('✅ Network Security Manager shutdown complete');
  }
}

module.exports = { NetworkSecurityManager };
