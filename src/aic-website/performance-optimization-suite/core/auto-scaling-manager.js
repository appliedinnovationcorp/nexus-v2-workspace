/**
 * Auto Scaling Manager - Performance Optimization Suite
 * Intelligent auto-scaling with predictive analytics and cost optimization
 */

const EventEmitter = require('events');

class AutoScalingManager extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableHorizontalScaling: config.enableHorizontalScaling !== false,
      enableVerticalScaling: config.enableVerticalScaling || false,
      enablePredictiveScaling: config.enablePredictiveScaling || false,
      minReplicas: config.minReplicas || 2,
      maxReplicas: config.maxReplicas || 10,
      targetCPUUtilization: config.targetCPUUtilization || 70,
      targetMemoryUtilization: config.targetMemoryUtilization || 80,
      scaleUpThreshold: config.scaleUpThreshold || 80,
      scaleDownThreshold: config.scaleDownThreshold || 30,
      scaleUpCooldown: config.scaleUpCooldown || 300000, // 5 minutes
      scaleDownCooldown: config.scaleDownCooldown || 600000, // 10 minutes
      enableCostOptimization: config.enableCostOptimization || false,
      maxCostPerHour: config.maxCostPerHour || 100,
      ...config
    };
    
    this.currentReplicas = this.config.minReplicas;
    this.scalingHistory = [];
    this.metrics = {
      cpuUtilization: 0,
      memoryUtilization: 0,
      requestRate: 0,
      responseTime: 0,
      errorRate: 0
    };
    
    this.lastScaleAction = null;
    this.predictiveModel = {
      patterns: new Map(),
      predictions: []
    };
    
    this.costMetrics = {
      currentCost: 0,
      projectedCost: 0,
      costSavings: 0
    };
  }

  /**
   * Initialize the auto scaling manager
   */
  async initialize() {
    try {
      // Setup metrics collection
      this.startMetricsCollection();
      
      // Setup scaling evaluation
      this.startScalingEvaluation();
      
      // Setup predictive scaling if enabled
      if (this.config.enablePredictiveScaling) {
        this.startPredictiveScaling();
      }
      
      // Setup cost monitoring if enabled
      if (this.config.enableCostOptimization) {
        this.startCostMonitoring();
      }
      
      this.emit('initialized', { 
        timestamp: new Date().toISOString(),
        currentReplicas: this.currentReplicas,
        config: this.config
      });
      
    } catch (error) {
      this.emit('error', {
        type: 'AUTO_SCALING_INIT_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }

  /**
   * Start scaling evaluation
   */
  startScalingEvaluation() {
    setInterval(() => {
      this.evaluateScaling();
    }, 60000); // Every minute
  }

  /**
   * Start predictive scaling
   */
  startPredictiveScaling() {
    setInterval(() => {
      this.updatePredictiveModel();
      this.generatePredictions();
    }, 300000); // Every 5 minutes
  }

  /**
   * Start cost monitoring
   */
  startCostMonitoring() {
    setInterval(() => {
      this.updateCostMetrics();
    }, 300000); // Every 5 minutes
  }

  /**
   * Collect performance metrics
   */
  async collectMetrics() {
    try {
      // In production, these would come from actual monitoring systems
      this.metrics = {
        cpuUtilization: this.simulateCPUUtilization(),
        memoryUtilization: this.simulateMemoryUtilization(),
        requestRate: this.simulateRequestRate(),
        responseTime: this.simulateResponseTime(),
        errorRate: this.simulateErrorRate(),
        timestamp: new Date().toISOString()
      };
      
      this.emit('metricsCollected', this.metrics);
      
    } catch (error) {
      this.emit('error', {
        type: 'METRICS_COLLECTION_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Evaluate scaling decisions
   */
  async evaluateScaling() {
    try {
      const decision = this.makeScalingDecision();
      
      if (decision.action !== 'none') {
        const canScale = this.canPerformScaling(decision.action);
        
        if (canScale) {
          await this.executeScaling(decision);
        } else {
          this.emit('scalingBlocked', {
            decision,
            reason: 'Cooldown period active or limits reached',
            timestamp: new Date().toISOString()
          });
        }
      }
      
    } catch (error) {
      this.emit('error', {
        type: 'SCALING_EVALUATION_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Make scaling decision based on metrics
   */
  makeScalingDecision() {
    const decision = {
      action: 'none',
      reason: '',
      targetReplicas: this.currentReplicas,
      confidence: 0,
      metrics: { ...this.metrics }
    };
    
    // Check for scale up conditions
    const scaleUpReasons = [];
    
    if (this.metrics.cpuUtilization > this.config.scaleUpThreshold) {
      scaleUpReasons.push(`CPU utilization ${this.metrics.cpuUtilization}% > ${this.config.scaleUpThreshold}%`);
    }
    
    if (this.metrics.memoryUtilization > this.config.scaleUpThreshold) {
      scaleUpReasons.push(`Memory utilization ${this.metrics.memoryUtilization}% > ${this.config.scaleUpThreshold}%`);
    }
    
    if (this.metrics.responseTime > 1000) { // 1 second
      scaleUpReasons.push(`Response time ${this.metrics.responseTime}ms > 1000ms`);
    }
    
    if (this.metrics.errorRate > 1) { // 1%
      scaleUpReasons.push(`Error rate ${this.metrics.errorRate}% > 1%`);
    }
    
    // Check for scale down conditions
    const scaleDownReasons = [];
    
    if (this.metrics.cpuUtilization < this.config.scaleDownThreshold &&
        this.metrics.memoryUtilization < this.config.scaleDownThreshold &&
        this.metrics.responseTime < 200 &&
        this.metrics.errorRate < 0.1) {
      scaleDownReasons.push('All metrics below scale-down thresholds');
    }
    
    // Make decision
    if (scaleUpReasons.length > 0 && this.currentReplicas < this.config.maxReplicas) {
      decision.action = 'scale_up';
      decision.reason = scaleUpReasons.join(', ');
      decision.targetReplicas = Math.min(this.currentReplicas + 1, this.config.maxReplicas);
      decision.confidence = Math.min(scaleUpReasons.length * 25, 100);
    } else if (scaleDownReasons.length > 0 && this.currentReplicas > this.config.minReplicas) {
      decision.action = 'scale_down';
      decision.reason = scaleDownReasons.join(', ');
      decision.targetReplicas = Math.max(this.currentReplicas - 1, this.config.minReplicas);
      decision.confidence = 75;
    }
    
    // Apply predictive scaling if enabled
    if (this.config.enablePredictiveScaling && decision.action === 'none') {
      const predictiveDecision = this.getPredictiveScalingDecision();
      if (predictiveDecision.action !== 'none') {
        decision.action = predictiveDecision.action;
        decision.reason = `Predictive: ${predictiveDecision.reason}`;
        decision.targetReplicas = predictiveDecision.targetReplicas;
        decision.confidence = predictiveDecision.confidence;
      }
    }
    
    return decision;
  }

  /**
   * Get predictive scaling decision
   */
  getPredictiveScalingDecision() {
    const decision = {
      action: 'none',
      reason: '',
      targetReplicas: this.currentReplicas,
      confidence: 0
    };
    
    // Check predictions for next 15 minutes
    const nearTermPredictions = this.predictiveModel.predictions.filter(
      p => new Date(p.timestamp).getTime() <= Date.now() + 900000 // 15 minutes
    );
    
    if (nearTermPredictions.length === 0) {
      return decision;
    }
    
    const avgPredictedLoad = nearTermPredictions.reduce((sum, p) => sum + p.predictedLoad, 0) / nearTermPredictions.length;
    
    if (avgPredictedLoad > 80 && this.currentReplicas < this.config.maxReplicas) {
      decision.action = 'scale_up';
      decision.reason = `Predicted load increase to ${avgPredictedLoad.toFixed(1)}%`;
      decision.targetReplicas = Math.min(this.currentReplicas + 1, this.config.maxReplicas);
      decision.confidence = 60;
    } else if (avgPredictedLoad < 30 && this.currentReplicas > this.config.minReplicas) {
      decision.action = 'scale_down';
      decision.reason = `Predicted load decrease to ${avgPredictedLoad.toFixed(1)}%`;
      decision.targetReplicas = Math.max(this.currentReplicas - 1, this.config.minReplicas);
      decision.confidence = 50;
    }
    
    return decision;
  }

  /**
   * Check if scaling can be performed
   */
  canPerformScaling(action) {
    const now = Date.now();
    
    if (!this.lastScaleAction) {
      return true;
    }
    
    const timeSinceLastScale = now - this.lastScaleAction.timestamp;
    
    if (action === 'scale_up') {
      return timeSinceLastScale >= this.config.scaleUpCooldown;
    } else if (action === 'scale_down') {
      return timeSinceLastScale >= this.config.scaleDownCooldown;
    }
    
    return false;
  }

  /**
   * Execute scaling action
   */
  async executeScaling(decision) {
    try {
      const previousReplicas = this.currentReplicas;
      
      // Apply cost optimization check
      if (this.config.enableCostOptimization) {
        const costCheck = this.checkCostConstraints(decision);
        if (!costCheck.allowed) {
          this.emit('scalingBlocked', {
            decision,
            reason: costCheck.reason,
            timestamp: new Date().toISOString()
          });
          return;
        }
      }
      
      // Execute the scaling action
      if (decision.action === 'scale_up') {
        await this.scaleUp(decision);
      } else if (decision.action === 'scale_down') {
        await this.scaleDown(decision);
      }
      
      // Record scaling action
      const scalingAction = {
        action: decision.action,
        previousReplicas,
        newReplicas: this.currentReplicas,
        reason: decision.reason,
        confidence: decision.confidence,
        metrics: decision.metrics,
        timestamp: Date.now(),
        timestampISO: new Date().toISOString()
      };
      
      this.scalingHistory.push(scalingAction);
      this.lastScaleAction = scalingAction;
      
      // Keep only recent history
      if (this.scalingHistory.length > 100) {
        this.scalingHistory = this.scalingHistory.slice(-100);
      }
      
      this.emit('scalingExecuted', scalingAction);
      
    } catch (error) {
      this.emit('error', {
        type: 'SCALING_EXECUTION_ERROR',
        error: error.message,
        decision,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Scale up
   */
  async scaleUp(decision) {
    const targetReplicas = decision.targetReplicas;
    
    // Simulate scaling up (in production, this would interact with Kubernetes, Docker Swarm, etc.)
    this.currentReplicas = targetReplicas;
    
    this.emit('scaleUp', {
      previousReplicas: decision.targetReplicas - 1,
      newReplicas: this.currentReplicas,
      reason: decision.reason,
      timestamp: new Date().toISOString()
    });
    
    // Simulate deployment time
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  /**
   * Scale down
   */
  async scaleDown(decision) {
    const targetReplicas = decision.targetReplicas;
    
    // Simulate scaling down
    this.currentReplicas = targetReplicas;
    
    this.emit('scaleDown', {
      previousReplicas: decision.targetReplicas + 1,
      newReplicas: this.currentReplicas,
      reason: decision.reason,
      timestamp: new Date().toISOString()
    });
    
    // Simulate graceful shutdown time
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  /**
   * Check cost constraints
   */
  checkCostConstraints(decision) {
    const currentHourlyCost = this.calculateHourlyCost(this.currentReplicas);
    const projectedHourlyCost = this.calculateHourlyCost(decision.targetReplicas);
    
    if (projectedHourlyCost > this.config.maxCostPerHour) {
      return {
        allowed: false,
        reason: `Projected cost $${projectedHourlyCost}/hour exceeds limit $${this.config.maxCostPerHour}/hour`
      };
    }
    
    return { allowed: true };
  }

  /**
   * Calculate hourly cost
   */
  calculateHourlyCost(replicas) {
    // Simplified cost calculation - in production, this would use actual cloud pricing
    const costPerReplicaPerHour = 2.50; // $2.50 per replica per hour
    return replicas * costPerReplicaPerHour;
  }

  /**
   * Update predictive model
   */
  updatePredictiveModel() {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const patternKey = `${dayOfWeek}-${hour}`;
    
    if (!this.predictiveModel.patterns.has(patternKey)) {
      this.predictiveModel.patterns.set(patternKey, []);
    }
    
    this.predictiveModel.patterns.get(patternKey).push({
      cpuUtilization: this.metrics.cpuUtilization,
      memoryUtilization: this.metrics.memoryUtilization,
      requestRate: this.metrics.requestRate,
      timestamp: now.toISOString()
    });
    
    // Keep only recent data (last 4 weeks)
    const fourWeeksAgo = Date.now() - (4 * 7 * 24 * 60 * 60 * 1000);
    for (const [key, patterns] of this.predictiveModel.patterns) {
      this.predictiveModel.patterns.set(key, 
        patterns.filter(p => new Date(p.timestamp).getTime() > fourWeeksAgo)
      );
    }
  }

  /**
   * Generate predictions
   */
  generatePredictions() {
    this.predictiveModel.predictions = [];
    
    const now = new Date();
    
    // Generate predictions for next 2 hours
    for (let i = 1; i <= 8; i++) { // 15-minute intervals
      const futureTime = new Date(now.getTime() + (i * 15 * 60 * 1000));
      const hour = futureTime.getHours();
      const dayOfWeek = futureTime.getDay();
      const patternKey = `${dayOfWeek}-${hour}`;
      
      const historicalData = this.predictiveModel.patterns.get(patternKey) || [];
      
      if (historicalData.length > 0) {
        const avgCPU = historicalData.reduce((sum, d) => sum + d.cpuUtilization, 0) / historicalData.length;
        const avgMemory = historicalData.reduce((sum, d) => sum + d.memoryUtilization, 0) / historicalData.length;
        const avgRequests = historicalData.reduce((sum, d) => sum + d.requestRate, 0) / historicalData.length;
        
        // Simple prediction based on historical averages
        const predictedLoad = Math.max(avgCPU, avgMemory);
        
        this.predictiveModel.predictions.push({
          timestamp: futureTime.toISOString(),
          predictedLoad,
          predictedCPU: avgCPU,
          predictedMemory: avgMemory,
          predictedRequests: avgRequests,
          confidence: Math.min(historicalData.length * 10, 100)
        });
      }
    }
    
    this.emit('predictionsGenerated', {
      predictions: this.predictiveModel.predictions.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update cost metrics
   */
  updateCostMetrics() {
    this.costMetrics = {
      currentCost: this.calculateHourlyCost(this.currentReplicas),
      projectedCost: this.calculateDailyCost(this.currentReplicas),
      costSavings: this.calculateCostSavings(),
      timestamp: new Date().toISOString()
    };
    
    this.emit('costMetricsUpdated', this.costMetrics);
  }

  calculateDailyCost(replicas) {
    return this.calculateHourlyCost(replicas) * 24;
  }

  calculateCostSavings() {
    // Calculate savings compared to running at max capacity
    const maxCost = this.calculateHourlyCost(this.config.maxReplicas);
    const currentCost = this.calculateHourlyCost(this.currentReplicas);
    return maxCost - currentCost;
  }

  /**
   * Simulation methods (replace with actual metrics in production)
   */
  simulateCPUUtilization() {
    // Simulate CPU usage with some randomness and time-based patterns
    const hour = new Date().getHours();
    const baseLoad = hour >= 9 && hour <= 17 ? 60 : 30; // Higher during business hours
    return Math.max(0, Math.min(100, baseLoad + (Math.random() - 0.5) * 40));
  }

  simulateMemoryUtilization() {
    const hour = new Date().getHours();
    const baseLoad = hour >= 9 && hour <= 17 ? 50 : 25;
    return Math.max(0, Math.min(100, baseLoad + (Math.random() - 0.5) * 30));
  }

  simulateRequestRate() {
    const hour = new Date().getHours();
    const baseRate = hour >= 9 && hour <= 17 ? 100 : 20;
    return Math.max(0, baseRate + (Math.random() - 0.5) * 50);
  }

  simulateResponseTime() {
    return Math.max(50, 200 + (Math.random() - 0.5) * 300);
  }

  simulateErrorRate() {
    return Math.max(0, 0.5 + (Math.random() - 0.5) * 1);
  }

  /**
   * Get scaling status
   */
  getScalingStatus() {
    return {
      currentReplicas: this.currentReplicas,
      minReplicas: this.config.minReplicas,
      maxReplicas: this.config.maxReplicas,
      lastScaleAction: this.lastScaleAction,
      metrics: this.metrics,
      costMetrics: this.costMetrics,
      predictions: this.predictiveModel.predictions.slice(0, 4), // Next hour
      scalingHistory: this.scalingHistory.slice(-10), // Last 10 actions
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get scaling recommendations
   */
  getScalingRecommendations() {
    const recommendations = [];
    
    // Analyze scaling history for patterns
    const recentScaling = this.scalingHistory.slice(-20);
    const scaleUpCount = recentScaling.filter(s => s.action === 'scale_up').length;
    const scaleDownCount = recentScaling.filter(s => s.action === 'scale_down').length;
    
    if (scaleUpCount > scaleDownCount * 2) {
      recommendations.push({
        type: 'INCREASE_MIN_REPLICAS',
        priority: 'medium',
        description: 'Frequent scale-up events suggest increasing minimum replicas',
        currentMin: this.config.minReplicas,
        suggestedMin: Math.min(this.config.minReplicas + 1, this.config.maxReplicas)
      });
    }
    
    if (scaleDownCount > scaleUpCount * 2) {
      recommendations.push({
        type: 'DECREASE_MAX_REPLICAS',
        priority: 'low',
        description: 'Frequent scale-down events suggest decreasing maximum replicas',
        currentMax: this.config.maxReplicas,
        suggestedMax: Math.max(this.config.maxReplicas - 1, this.config.minReplicas)
      });
    }
    
    // Cost optimization recommendations
    if (this.config.enableCostOptimization) {
      const avgCost = this.costMetrics.currentCost;
      if (avgCost > this.config.maxCostPerHour * 0.8) {
        recommendations.push({
          type: 'COST_OPTIMIZATION',
          priority: 'high',
          description: 'Current costs approaching limit',
          suggestion: 'Consider optimizing application performance to reduce resource requirements'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Health check
   */
  async healthCheck() {
    const status = this.getScalingStatus();
    
    return {
      status: 'healthy',
      scaling: status,
      recommendations: this.getScalingRecommendations(),
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { AutoScalingManager };
