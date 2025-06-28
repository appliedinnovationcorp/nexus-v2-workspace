/**
 * Behavior Analytics Manager for Zero-Trust Architecture
 * Implements User and Entity Behavior Analytics (UEBA)
 * Detects anomalies and suspicious activities in real-time
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BehaviorAnalyticsManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Learning parameters
      learningPeriod: config.learningPeriod || 604800000, // 7 days
      minDataPoints: config.minDataPoints || 50,
      anomalyThreshold: config.anomalyThreshold || 0.8,
      
      // Behavioral factors to analyze
      behaviorFactors: {
        loginTimes: { weight: 0.2, enabled: true },
        locations: { weight: 0.25, enabled: true },
        devices: { weight: 0.2, enabled: true },
        applications: { weight: 0.15, enabled: true },
        dataAccess: { weight: 0.1, enabled: true },
        networkActivity: { weight: 0.1, enabled: true },
        ...config.behaviorFactors
      },
      
      // Anomaly detection settings
      anomalyDetection: {
        statisticalThreshold: 2.5, // Standard deviations
        timeWindowHours: 24,
        minConfidence: 0.7,
        ...config.anomalyDetection
      },
      
      // Risk scoring
      riskScoring: {
        baselineRisk: 0.1,
        maxRisk: 1.0,
        decayRate: 0.05, // Risk decay per hour
        ...config.riskScoring
      },
      
      ...config
    };

    this.state = {
      userProfiles: new Map(),
      behaviorBaselines: new Map(),
      anomalies: new Map(),
      riskScores: new Map(),
      activityLog: [],
      learningData: new Map()
    };

    this.metrics = {
      profilesCreated: 0,
      anomaliesDetected: 0,
      riskAssessments: 0,
      behaviorUpdates: 0,
      falsePositives: 0,
      truePositives: 0
    };

    this.init();
  }

  async init() {
    console.log('🧠 Initializing Behavior Analytics Manager...');
    
    // Setup analysis intervals
    setInterval(() => this.performBehaviorAnalysis(), 300000); // 5 minutes
    setInterval(() => this.updateRiskScores(), 600000); // 10 minutes
    setInterval(() => this.cleanupOldData(), 3600000); // 1 hour
    
    console.log('✅ Behavior Analytics Manager initialized');
  }

  // Core behavior analysis method
  async analyzeBehavior(request) {
    try {
      const { userId, deviceId, ip, timestamp, activity, location } = request;
      
      if (!userId) {
        return { normal: true, confidence: 0, reasons: ['No user ID provided'] };
      }

      // Record activity
      await this.recordActivity(request);
      
      // Get or create user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Analyze each behavior factor
      const analysis = {
        normal: true,
        confidence: 1.0,
        anomalies: [],
        riskFactors: [],
        overallScore: 0
      };

      // Time-based analysis
      if (this.config.behaviorFactors.loginTimes.enabled) {
        const timeAnalysis = await this.analyzeLoginTime(userId, timestamp);
        this.updateAnalysis(analysis, timeAnalysis, 'loginTimes');
      }

      // Location-based analysis
      if (this.config.behaviorFactors.locations.enabled && (ip || location)) {
        const locationAnalysis = await this.analyzeLocation(userId, ip, location);
        this.updateAnalysis(analysis, locationAnalysis, 'locations');
      }

      // Device-based analysis
      if (this.config.behaviorFactors.devices.enabled && deviceId) {
        const deviceAnalysis = await this.analyzeDevice(userId, deviceId);
        this.updateAnalysis(analysis, deviceAnalysis, 'devices');
      }

      // Application usage analysis
      if (this.config.behaviorFactors.applications.enabled && activity) {
        const appAnalysis = await this.analyzeApplicationUsage(userId, activity);
        this.updateAnalysis(analysis, appAnalysis, 'applications');
      }

      // Data access pattern analysis
      if (this.config.behaviorFactors.dataAccess.enabled) {
        const dataAnalysis = await this.analyzeDataAccess(userId, request);
        this.updateAnalysis(analysis, dataAnalysis, 'dataAccess');
      }

      // Network activity analysis
      if (this.config.behaviorFactors.networkActivity.enabled) {
        const networkAnalysis = await this.analyzeNetworkActivity(userId, request);
        this.updateAnalysis(analysis, networkAnalysis, 'networkActivity');
      }

      // Calculate overall anomaly score
      analysis.overallScore = this.calculateOverallScore(analysis);
      analysis.normal = analysis.overallScore < this.config.anomalyThreshold;

      // Update user profile with new data
      await this.updateUserProfile(userId, request, analysis);

      // Record anomaly if detected
      if (!analysis.normal) {
        await this.recordAnomaly(userId, analysis, request);
      }

      this.metrics.riskAssessments++;

      return {
        normal: analysis.normal,
        confidence: analysis.confidence,
        score: analysis.overallScore,
        anomalies: analysis.anomalies,
        riskFactors: analysis.riskFactors,
        reasons: analysis.anomalies.map(a => a.description)
      };

    } catch (error) {
      console.error('❌ Behavior analysis failed:', error);
      return {
        normal: true,
        confidence: 0,
        score: 0,
        error: error.message
      };
    }
  }

  // Time-based behavior analysis
  async analyzeLoginTime(userId, timestamp) {
    try {
      const userProfile = this.state.userProfiles.get(userId);
      if (!userProfile || !userProfile.loginTimes || userProfile.loginTimes.length < this.config.minDataPoints) {
        return { anomalous: false, confidence: 0, reason: 'Insufficient data for time analysis' };
      }

      const hour = new Date(timestamp).getHours();
      const loginTimes = userProfile.loginTimes;
      
      // Calculate hour frequency distribution
      const hourCounts = new Array(24).fill(0);
      loginTimes.forEach(time => {
        const loginHour = new Date(time).getHours();
        hourCounts[loginHour]++;
      });

      // Calculate probability of this hour
      const totalLogins = loginTimes.length;
      const hourProbability = hourCounts[hour] / totalLogins;
      
      // Consider it anomalous if probability is very low
      const threshold = 0.05; // 5% threshold
      const anomalous = hourProbability < threshold;
      
      return {
        anomalous,
        confidence: anomalous ? (1 - hourProbability / threshold) : 0.8,
        score: anomalous ? 0.7 : 0.1,
        details: {
          hour,
          probability: hourProbability,
          threshold,
          historicalLogins: totalLogins
        },
        description: anomalous ? 
          `Unusual login time: ${hour}:00 (probability: ${(hourProbability * 100).toFixed(1)}%)` :
          'Normal login time pattern'
      };
    } catch (error) {
      console.error('❌ Time analysis failed:', error);
      return { anomalous: false, confidence: 0, error: error.message };
    }
  }

  // Location-based behavior analysis
  async analyzeLocation(userId, ip, location) {
    try {
      const userProfile = this.state.userProfiles.get(userId);
      if (!userProfile || !userProfile.locations || userProfile.locations.length < this.config.minDataPoints) {
        return { anomalous: false, confidence: 0, reason: 'Insufficient data for location analysis' };
      }

      const currentLocation = location || await this.getLocationFromIP(ip);
      if (!currentLocation) {
        return { anomalous: false, confidence: 0, reason: 'Unable to determine location' };
      }

      const historicalLocations = userProfile.locations;
      
      // Check if this is a known location
      const knownLocation = historicalLocations.some(loc => 
        this.calculateLocationDistance(loc, currentLocation) < 50 // 50km threshold
      );

      if (knownLocation) {
        return {
          anomalous: false,
          confidence: 0.9,
          score: 0.1,
          description: 'Known location'
        };
      }

      // Calculate distance from usual locations
      const distances = historicalLocations.map(loc => 
        this.calculateLocationDistance(loc, currentLocation)
      );
      
      const minDistance = Math.min(...distances);
      const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
      
      // Consider it anomalous if it's far from usual locations
      const anomalous = minDistance > 500; // 500km threshold
      const confidence = Math.min(minDistance / 1000, 1); // Scale by distance
      
      return {
        anomalous,
        confidence,
        score: anomalous ? Math.min(minDistance / 1000, 1) : 0.2,
        details: {
          currentLocation,
          minDistance,
          avgDistance,
          knownLocations: historicalLocations.length
        },
        description: anomalous ?
          `Unusual location: ${minDistance.toFixed(0)}km from nearest known location` :
          'Location within normal range'
      };
    } catch (error) {
      console.error('❌ Location analysis failed:', error);
      return { anomalous: false, confidence: 0, error: error.message };
    }
  }

  // Device-based behavior analysis
  async analyzeDevice(userId, deviceId) {
    try {
      const userProfile = this.state.userProfiles.get(userId);
      if (!userProfile || !userProfile.devices) {
        return { anomalous: false, confidence: 0, reason: 'No device history' };
      }

      const knownDevice = userProfile.devices.some(device => device.id === deviceId);
      
      if (knownDevice) {
        return {
          anomalous: false,
          confidence: 0.9,
          score: 0.1,
          description: 'Known device'
        };
      }

      // New device - check how often user uses new devices
      const totalDevices = userProfile.devices.length;
      const recentNewDevices = userProfile.devices.filter(device => 
        Date.now() - device.firstSeen < 2592000000 // 30 days
      ).length;

      const newDeviceRate = recentNewDevices / Math.max(totalDevices, 1);
      const anomalous = newDeviceRate < 0.1 && totalDevices > 5; // Rarely uses new devices
      
      return {
        anomalous,
        confidence: anomalous ? 0.8 : 0.5,
        score: anomalous ? 0.6 : 0.3,
        details: {
          deviceId,
          totalDevices,
          recentNewDevices,
          newDeviceRate
        },
        description: anomalous ?
          'New device from user who rarely uses new devices' :
          'New device usage pattern normal for this user'
      };
    } catch (error) {
      console.error('❌ Device analysis failed:', error);
      return { anomalous: false, confidence: 0, error: error.message };
    }
  }

  // Application usage analysis
  async analyzeApplicationUsage(userId, activity) {
    try {
      const userProfile = this.state.userProfiles.get(userId);
      if (!userProfile || !userProfile.applications) {
        return { anomalous: false, confidence: 0, reason: 'No application usage history' };
      }

      const appUsage = userProfile.applications;
      const currentApp = activity.application || activity.endpoint || 'unknown';
      
      // Check if this application is commonly used by this user
      const appHistory = appUsage[currentApp];
      if (!appHistory) {
        // New application
        const totalApps = Object.keys(appUsage).length;
        const anomalous = totalApps > 10; // User with many apps using a new one
        
        return {
          anomalous,
          confidence: anomalous ? 0.6 : 0.3,
          score: anomalous ? 0.4 : 0.2,
          description: anomalous ?
            'New application for user with established usage patterns' :
            'New application usage'
        };
      }

      // Analyze usage frequency
      const avgUsageGap = appHistory.avgGap || 86400000; // Default 1 day
      const lastUsed = appHistory.lastUsed || 0;
      const timeSinceLastUse = Date.now() - lastUsed;
      
      const anomalous = timeSinceLastUse > (avgUsageGap * 5); // 5x normal gap
      
      return {
        anomalous,
        confidence: anomalous ? 0.7 : 0.8,
        score: anomalous ? 0.5 : 0.1,
        details: {
          application: currentApp,
          timeSinceLastUse,
          avgUsageGap,
          usageCount: appHistory.count
        },
        description: anomalous ?
          `Unusual application usage: ${Math.round(timeSinceLastUse / 86400000)} days since last use` :
          'Normal application usage pattern'
      };
    } catch (error) {
      console.error('❌ Application analysis failed:', error);
      return { anomalous: false, confidence: 0, error: error.message };
    }
  }

  // Data access pattern analysis
  async analyzeDataAccess(userId, request) {
    try {
      const userProfile = this.state.userProfiles.get(userId);
      if (!userProfile || !userProfile.dataAccess) {
        return { anomalous: false, confidence: 0, reason: 'No data access history' };
      }

      const dataAccess = userProfile.dataAccess;
      const currentHour = new Date().getHours();
      
      // Analyze data access volume
      const recentAccess = dataAccess.filter(access => 
        Date.now() - access.timestamp < 3600000 // Last hour
      );
      
      const hourlyAverage = dataAccess.length / Math.max(
        (Date.now() - userProfile.created) / 3600000, 1
      );
      
      const currentHourlyRate = recentAccess.length;
      const anomalous = currentHourlyRate > (hourlyAverage * 3); // 3x normal rate
      
      return {
        anomalous,
        confidence: anomalous ? 0.8 : 0.7,
        score: anomalous ? Math.min(currentHourlyRate / hourlyAverage / 3, 1) : 0.1,
        details: {
          currentHourlyRate,
          hourlyAverage,
          totalAccess: dataAccess.length
        },
        description: anomalous ?
          `High data access rate: ${currentHourlyRate} vs avg ${hourlyAverage.toFixed(1)}` :
          'Normal data access pattern'
      };
    } catch (error) {
      console.error('❌ Data access analysis failed:', error);
      return { anomalous: false, confidence: 0, error: error.message };
    }
  }

  // Network activity analysis
  async analyzeNetworkActivity(userId, request) {
    try {
      const userProfile = this.state.userProfiles.get(userId);
      if (!userProfile || !userProfile.networkActivity) {
        return { anomalous: false, confidence: 0, reason: 'No network activity history' };
      }

      const networkActivity = userProfile.networkActivity;
      const currentActivity = {
        ip: request.ip,
        userAgent: request.userAgent,
        timestamp: Date.now()
      };

      // Check for rapid IP changes
      const recentIPs = networkActivity
        .filter(activity => Date.now() - activity.timestamp < 3600000) // Last hour
        .map(activity => activity.ip)
        .filter((ip, index, arr) => arr.indexOf(ip) === index); // Unique IPs

      const anomalous = recentIPs.length > 5; // More than 5 different IPs in an hour
      
      return {
        anomalous,
        confidence: anomalous ? 0.9 : 0.8,
        score: anomalous ? Math.min(recentIPs.length / 10, 1) : 0.1,
        details: {
          recentIPs: recentIPs.length,
          currentIP: request.ip,
          totalNetworkEvents: networkActivity.length
        },
        description: anomalous ?
          `Rapid IP changes: ${recentIPs.length} different IPs in last hour` :
          'Normal network activity pattern'
      };
    } catch (error) {
      console.error('❌ Network activity analysis failed:', error);
      return { anomalous: false, confidence: 0, error: error.message };
    }
  }

  // Helper methods
  updateAnalysis(analysis, factorAnalysis, factorName) {
    const weight = this.config.behaviorFactors[factorName].weight;
    
    if (factorAnalysis.anomalous) {
      analysis.anomalies.push({
        factor: factorName,
        ...factorAnalysis
      });
      
      analysis.overallScore += (factorAnalysis.score || 0.5) * weight;
      analysis.confidence = Math.min(analysis.confidence, factorAnalysis.confidence);
    } else {
      analysis.overallScore += 0.1 * weight; // Small contribution for normal behavior
    }
  }

  calculateOverallScore(analysis) {
    // Normalize score and apply confidence
    const rawScore = analysis.overallScore;
    const confidenceAdjusted = rawScore * analysis.confidence;
    return Math.min(confidenceAdjusted, 1.0);
  }

  // User profile management
  async getUserProfile(userId) {
    if (!this.state.userProfiles.has(userId)) {
      const profile = {
        userId,
        created: Date.now(),
        loginTimes: [],
        locations: [],
        devices: [],
        applications: {},
        dataAccess: [],
        networkActivity: [],
        lastUpdated: Date.now()
      };
      
      this.state.userProfiles.set(userId, profile);
      this.metrics.profilesCreated++;
    }
    
    return this.state.userProfiles.get(userId);
  }

  async updateUserProfile(userId, request, analysis) {
    try {
      const profile = await this.getUserProfile(userId);
      const now = Date.now();
      
      // Update login times
      profile.loginTimes.push(now);
      if (profile.loginTimes.length > 1000) {
        profile.loginTimes = profile.loginTimes.slice(-500); // Keep last 500
      }
      
      // Update locations
      if (request.location || request.ip) {
        const location = request.location || await this.getLocationFromIP(request.ip);
        if (location) {
          profile.locations.push({ ...location, timestamp: now });
          if (profile.locations.length > 100) {
            profile.locations = profile.locations.slice(-50); // Keep last 50
          }
        }
      }
      
      // Update devices
      if (request.deviceId) {
        const existingDevice = profile.devices.find(d => d.id === request.deviceId);
        if (existingDevice) {
          existingDevice.lastSeen = now;
          existingDevice.count++;
        } else {
          profile.devices.push({
            id: request.deviceId,
            firstSeen: now,
            lastSeen: now,
            count: 1
          });
        }
      }
      
      // Update applications
      if (request.activity && request.activity.application) {
        const app = request.activity.application;
        if (!profile.applications[app]) {
          profile.applications[app] = {
            count: 0,
            firstUsed: now,
            lastUsed: now,
            avgGap: 0
          };
        }
        
        const appData = profile.applications[app];
        const gap = now - appData.lastUsed;
        appData.avgGap = (appData.avgGap * appData.count + gap) / (appData.count + 1);
        appData.lastUsed = now;
        appData.count++;
      }
      
      // Update data access
      if (request.dataAccess) {
        profile.dataAccess.push({
          timestamp: now,
          type: request.dataAccess.type,
          classification: request.dataAccess.classification
        });
        if (profile.dataAccess.length > 1000) {
          profile.dataAccess = profile.dataAccess.slice(-500);
        }
      }
      
      // Update network activity
      profile.networkActivity.push({
        ip: request.ip,
        userAgent: request.userAgent,
        timestamp: now
      });
      if (profile.networkActivity.length > 500) {
        profile.networkActivity = profile.networkActivity.slice(-250);
      }
      
      profile.lastUpdated = now;
      this.metrics.behaviorUpdates++;
      
    } catch (error) {
      console.error('❌ Failed to update user profile:', error);
    }
  }

  // Activity recording
  async recordActivity(request) {
    const activity = {
      id: crypto.randomUUID(),
      userId: request.userId,
      deviceId: request.deviceId,
      ip: request.ip,
      timestamp: request.timestamp || Date.now(),
      activity: request.activity,
      location: request.location
    };
    
    this.state.activityLog.push(activity);
    
    // Keep activity log manageable
    if (this.state.activityLog.length > 10000) {
      this.state.activityLog = this.state.activityLog.slice(-5000);
    }
  }

  // Anomaly recording
  async recordAnomaly(userId, analysis, request) {
    const anomalyId = crypto.randomUUID();
    const anomaly = {
      id: anomalyId,
      userId,
      timestamp: Date.now(),
      score: analysis.overallScore,
      confidence: analysis.confidence,
      anomalies: analysis.anomalies,
      request: {
        ip: request.ip,
        deviceId: request.deviceId,
        activity: request.activity
      },
      status: 'detected',
      investigated: false
    };
    
    this.state.anomalies.set(anomalyId, anomaly);
    this.metrics.anomaliesDetected++;
    
    // Emit anomaly event
    this.emit('anomalyDetected', anomaly);
    
    console.log(`🚨 Anomaly detected for user ${userId}: score ${analysis.overallScore.toFixed(2)}`);
  }

  // Utility methods
  calculateLocationDistance(loc1, loc2) {
    if (!loc1 || !loc2 || !loc1.latitude || !loc2.latitude) return 0;
    
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  async getLocationFromIP(ip) {
    // This would integrate with a geolocation service
    // For now, return mock data
    return {
      ip,
      latitude: 37.7749,
      longitude: -122.4194,
      city: 'San Francisco',
      country: 'US'
    };
  }

  // Maintenance methods
  async performBehaviorAnalysis() {
    console.log('🔍 Performing periodic behavior analysis...');
    
    // This would run more sophisticated ML models
    // For now, just update risk scores
    await this.updateRiskScores();
  }

  async updateRiskScores() {
    let updatedCount = 0;
    
    for (const [userId, profile] of this.state.userProfiles) {
      const riskScore = await this.calculateUserRiskScore(userId);
      this.state.riskScores.set(userId, {
        score: riskScore,
        updated: Date.now(),
        factors: await this.getRiskFactors(userId)
      });
      updatedCount++;
    }
    
    if (updatedCount > 0) {
      console.log(`📊 Updated risk scores for ${updatedCount} users`);
    }
  }

  async calculateUserRiskScore(userId) {
    const profile = this.state.userProfiles.get(userId);
    if (!profile) return this.config.riskScoring.baselineRisk;
    
    let riskScore = this.config.riskScoring.baselineRisk;
    
    // Recent anomalies increase risk
    const recentAnomalies = Array.from(this.state.anomalies.values())
      .filter(anomaly => 
        anomaly.userId === userId && 
        Date.now() - anomaly.timestamp < 86400000 // Last 24 hours
      );
    
    riskScore += recentAnomalies.length * 0.1;
    
    // Apply time-based decay
    const hoursSinceLastActivity = (Date.now() - profile.lastUpdated) / 3600000;
    const decayFactor = hoursSinceLastActivity * this.config.riskScoring.decayRate;
    riskScore = Math.max(riskScore - decayFactor, this.config.riskScoring.baselineRisk);
    
    return Math.min(riskScore, this.config.riskScoring.maxRisk);
  }

  async getRiskFactors(userId) {
    const factors = [];
    
    // Get recent anomalies
    const recentAnomalies = Array.from(this.state.anomalies.values())
      .filter(anomaly => 
        anomaly.userId === userId && 
        Date.now() - anomaly.timestamp < 86400000
      );
    
    if (recentAnomalies.length > 0) {
      factors.push({
        type: 'recent_anomalies',
        count: recentAnomalies.length,
        impact: 'high'
      });
    }
    
    return factors;
  }

  cleanupOldData() {
    const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    let cleanedCount = 0;
    
    // Clean up old anomalies
    for (const [anomalyId, anomaly] of this.state.anomalies) {
      if (anomaly.timestamp < cutoffTime) {
        this.state.anomalies.delete(anomalyId);
        cleanedCount++;
      }
    }
    
    // Clean up old activity log entries
    const originalLength = this.state.activityLog.length;
    this.state.activityLog = this.state.activityLog.filter(
      activity => activity.timestamp > cutoffTime
    );
    cleanedCount += originalLength - this.state.activityLog.length;
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old behavior analytics data`);
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      userProfiles: this.state.userProfiles.size,
      anomalies: this.state.anomalies.size,
      activityLog: this.state.activityLog.length,
      riskScores: this.state.riskScores.size,
      metrics: this.metrics
    };
  }

  // Public API methods
  getBehaviorAnalyticsStatus() {
    return {
      userProfiles: this.state.userProfiles.size,
      recentAnomalies: Array.from(this.state.anomalies.values())
        .filter(a => Date.now() - a.timestamp < 86400000).length,
      metrics: this.metrics,
      config: {
        learningPeriod: this.config.learningPeriod,
        anomalyThreshold: this.config.anomalyThreshold,
        behaviorFactors: Object.keys(this.config.behaviorFactors)
      }
    };
  }

  getAnomalies(userId = null, limit = 100) {
    let anomalies = Array.from(this.state.anomalies.values());
    
    if (userId) {
      anomalies = anomalies.filter(a => a.userId === userId);
    }
    
    return anomalies
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Shutdown
  async shutdown() {
    console.log('🧠 Shutting down Behavior Analytics Manager...');
    
    // Clear sensitive data
    this.state.userProfiles.clear();
    this.state.anomalies.clear();
    this.state.activityLog = [];
    
    console.log('✅ Behavior Analytics Manager shutdown complete');
  }
}

module.exports = { BehaviorAnalyticsManager };
