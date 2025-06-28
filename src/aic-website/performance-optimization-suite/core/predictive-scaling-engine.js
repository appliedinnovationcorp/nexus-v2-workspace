/**
 * Predictive Scaling Engine - Performance Optimization Suite
 * Advanced predictive scaling with machine learning capabilities
 */

const EventEmitter = require('events');

class PredictiveScalingEngine extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      predictionHorizon: config.predictionHorizon || 24, // Hours to predict ahead
      predictionInterval: config.predictionInterval || 15, // Minutes between predictions
      minDataPoints: config.minDataPoints || 5, // Minimum data points needed for prediction
      confidenceThreshold: config.confidenceThreshold || 60, // Minimum confidence to act on prediction
      seasonalPatterns: config.seasonalPatterns || ['hourly', 'daily', 'weekly'],
      anomalyDetection: config.enableAnomalyDetection !== false,
      smoothingFactor: config.smoothingFactor || 0.3, // For exponential smoothing
      trendDetection: config.enableTrendDetection !== false,
      maxPredictionAge: config.maxPredictionAge || 300000, // 5 minutes
      ...config
    };
    
    this.metricHistory = {
      cpu: [],
      memory: [],
      requestRate: [],
      responseTime: [],
      errorRate: []
    };
    
    this.seasonalPatterns = {
      hourly: new Map(), // Hour -> metrics
      daily: new Map(),  // Day of week -> metrics
      weekly: new Map()  // Week of year -> metrics
    };
    
    this.predictions = [];
    this.lastPredictionTime = null;
    this.anomalies = [];
    this.trends = {
      cpu: { direction: 'stable', magnitude: 0 },
      memory: { direction: 'stable', magnitude: 0 },
      requestRate: { direction: 'stable', magnitude: 0 }
    };
    
    // Initialize models
    this.models = {
      exponentialSmoothing: { alpha: this.config.smoothingFactor, lastSmoothed: null },
      linearRegression: { slope: 0, intercept: 0, lastUpdated: null },
      seasonalDecomposition: { trend: [], seasonal: [], residual: [] }
    };
  }

  /**
   * Initialize the predictive scaling engine
   */
  async initialize() {
    try {
      this.emit('initialized', {
        timestamp: new Date().toISOString(),
        config: this.config
      });
      
      return true;
    } catch (error) {
      this.emit('error', {
        type: 'PREDICTIVE_ENGINE_INIT_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Add metrics data point
   * @param {Object} metrics Current system metrics
   */
  addMetricsDataPoint(metrics) {
    const timestamp = new Date(metrics.timestamp || new Date().toISOString());
    
    const dataPoint = {
      cpu: metrics.cpuUtilization,
      memory: metrics.memoryUtilization,
      requestRate: metrics.requestRate,
      responseTime: metrics.responseTime,
      errorRate: metrics.errorRate,
      timestamp: timestamp.toISOString(),
      hour: timestamp.getHours(),
      dayOfWeek: timestamp.getDay(),
      weekOfYear: this.getWeekOfYear(timestamp)
    };
    
    // Add to time series
    this.metricHistory.cpu.push({ value: dataPoint.cpu, timestamp: dataPoint.timestamp });
    this.metricHistory.memory.push({ value: dataPoint.memory, timestamp: dataPoint.timestamp });
    this.metricHistory.requestRate.push({ value: dataPoint.requestRate, timestamp: dataPoint.timestamp });
    this.metricHistory.responseTime.push({ value: dataPoint.responseTime, timestamp: dataPoint.timestamp });
    this.metricHistory.errorRate.push({ value: dataPoint.errorRate, timestamp: dataPoint.timestamp });
    
    // Keep history manageable (last 4 weeks)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    Object.keys(this.metricHistory).forEach(key => {
      this.metricHistory[key] = this.metricHistory[key].filter(
        item => new Date(item.timestamp) >= fourWeeksAgo
      );
    });
    
    // Update seasonal patterns
    this.updateSeasonalPatterns(dataPoint);
    
    // Check for anomalies
    if (this.config.anomalyDetection) {
      this.detectAnomalies(dataPoint);
    }
    
    // Update trend detection
    if (this.config.trendDetection) {
      this.updateTrends();
    }
    
    // Update statistical models
    this.updateStatisticalModels(dataPoint);
    
    this.emit('dataPointAdded', {
      timestamp: dataPoint.timestamp,
      metrics: {
        cpu: dataPoint.cpu,
        memory: dataPoint.memory,
        requestRate: dataPoint.requestRate
      }
    });
    
    return dataPoint;
  }

  /**
   * Update seasonal patterns with new data point
   */
  updateSeasonalPatterns(dataPoint) {
    // Hourly patterns
    const hourKey = dataPoint.hour.toString();
    if (!this.seasonalPatterns.hourly.has(hourKey)) {
      this.seasonalPatterns.hourly.set(hourKey, []);
    }
    this.seasonalPatterns.hourly.get(hourKey).push({
      cpu: dataPoint.cpu,
      memory: dataPoint.memory,
      requestRate: dataPoint.requestRate,
      timestamp: dataPoint.timestamp
    });
    
    // Daily patterns
    const dayKey = dataPoint.dayOfWeek.toString();
    if (!this.seasonalPatterns.daily.has(dayKey)) {
      this.seasonalPatterns.daily.set(dayKey, []);
    }
    this.seasonalPatterns.daily.get(dayKey).push({
      cpu: dataPoint.cpu,
      memory: dataPoint.memory,
      requestRate: dataPoint.requestRate,
      timestamp: dataPoint.timestamp
    });
    
    // Weekly patterns
    const weekKey = dataPoint.weekOfYear.toString();
    if (!this.seasonalPatterns.weekly.has(weekKey)) {
      this.seasonalPatterns.weekly.set(weekKey, []);
    }
    this.seasonalPatterns.weekly.get(weekKey).push({
      cpu: dataPoint.cpu,
      memory: dataPoint.memory,
      requestRate: dataPoint.requestRate,
      timestamp: dataPoint.timestamp
    });
    
    // Prune old data
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    for (const [pattern, map] of Object.entries(this.seasonalPatterns)) {
      for (const [key, data] of map.entries()) {
        this.seasonalPatterns[pattern].set(
          key,
          data.filter(item => new Date(item.timestamp) >= fourWeeksAgo)
        );
      }
    }
  }

  /**
   * Generate predictions for future load
   */
  generatePredictions() {
    const now = new Date();
    this.lastPredictionTime = now;
    this.predictions = [];
    
    // Generate predictions for the configured horizon
    const intervals = Math.floor((this.config.predictionHorizon * 60) / this.config.predictionInterval);
    
    for (let i = 1; i <= intervals; i++) {
      const futureTime = new Date(now.getTime() + (i * this.config.predictionInterval * 60 * 1000));
      const prediction = this.predictLoadAt(futureTime);
      
      if (prediction) {
        this.predictions.push(prediction);
      }
    }
    
    this.emit('predictionsGenerated', {
      count: this.predictions.length,
      horizon: `${this.config.predictionHorizon} hours`,
      timestamp: now.toISOString()
    });
    
    return this.predictions;
  }

  /**
   * Predict load at a specific future time
   */
  predictLoadAt(targetTime) {
    // Get time components
    const hour = targetTime.getHours();
    const dayOfWeek = targetTime.getDay();
    const weekOfYear = this.getWeekOfYear(targetTime);
    
    // Get historical data for these time components
    const hourlyData = this.seasonalPatterns.hourly.get(hour.toString()) || [];
    const dailyData = this.seasonalPatterns.daily.get(dayOfWeek.toString()) || [];
    
    // If we don't have enough data, return null
    if (hourlyData.length < this.config.minDataPoints) {
      return null;
    }
    
    // Calculate base prediction from historical averages
    const hourlyAvgCPU = this.calculateAverage(hourlyData.map(d => d.cpu));
    const hourlyAvgMemory = this.calculateAverage(hourlyData.map(d => d.memory));
    const hourlyAvgRequests = this.calculateAverage(hourlyData.map(d => d.requestRate));
    
    const dailyAvgCPU = dailyData.length > 0 ? this.calculateAverage(dailyData.map(d => d.cpu)) : hourlyAvgCPU;
    const dailyAvgMemory = dailyData.length > 0 ? this.calculateAverage(dailyData.map(d => d.memory)) : hourlyAvgMemory;
    const dailyAvgRequests = dailyData.length > 0 ? this.calculateAverage(dailyData.map(d => d.requestRate)) : hourlyAvgRequests;
    
    // Weighted average of hourly and daily patterns
    const weightHourly = 0.7;
    const weightDaily = 0.3;
    
    let predictedCPU = (hourlyAvgCPU * weightHourly) + (dailyAvgCPU * weightDaily);
    let predictedMemory = (hourlyAvgMemory * weightHourly) + (dailyAvgMemory * weightDaily);
    let predictedRequests = (hourlyAvgRequests * weightHourly) + (dailyAvgRequests * weightDaily);
    
    // Apply trend adjustments
    if (this.config.trendDetection) {
      const minutesInFuture = (targetTime.getTime() - new Date().getTime()) / (60 * 1000);
      const hoursFactor = minutesInFuture / 60;
      
      if (this.trends.cpu.direction === 'increasing') {
        predictedCPU += this.trends.cpu.magnitude * hoursFactor;
      } else if (this.trends.cpu.direction === 'decreasing') {
        predictedCPU -= this.trends.cpu.magnitude * hoursFactor;
      }
      
      if (this.trends.memory.direction === 'increasing') {
        predictedMemory += this.trends.memory.magnitude * hoursFactor;
      } else if (this.trends.memory.direction === 'decreasing') {
        predictedMemory -= this.trends.memory.magnitude * hoursFactor;
      }
      
      if (this.trends.requestRate.direction === 'increasing') {
        predictedRequests += this.trends.requestRate.magnitude * hoursFactor;
      } else if (this.trends.requestRate.direction === 'decreasing') {
        predictedRequests -= this.trends.requestRate.magnitude * hoursFactor;
      }
    }
    
    // Apply exponential smoothing if available
    if (this.models.exponentialSmoothing.lastSmoothed) {
      const alpha = this.models.exponentialSmoothing.alpha;
      predictedCPU = (alpha * predictedCPU) + ((1 - alpha) * this.models.exponentialSmoothing.lastSmoothed.cpu);
      predictedMemory = (alpha * predictedMemory) + ((1 - alpha) * this.models.exponentialSmoothing.lastSmoothed.memory);
      predictedRequests = (alpha * predictedRequests) + ((1 - alpha) * this.models.exponentialSmoothing.lastSmoothed.requestRate);
    }
    
    // Apply linear regression for short-term predictions (next 2 hours)
    if (this.models.linearRegression.lastUpdated) {
      const minutesFromNow = (targetTime.getTime() - new Date().getTime()) / (60 * 1000);
      if (minutesFromNow <= 120) { // 2 hours
        const hoursFromNow = minutesFromNow / 60;
        const regressionCPU = this.models.linearRegression.intercept + (this.models.linearRegression.slope * hoursFromNow);
        
        // Blend regression with other predictions for short term
        const regressionWeight = Math.max(0, 1 - (minutesFromNow / 120)); // Weight decreases with time
        predictedCPU = (predictedCPU * (1 - regressionWeight)) + (regressionCPU * regressionWeight);
      }
    }
    
    // Ensure predictions are within valid ranges
    predictedCPU = Math.max(0, Math.min(100, predictedCPU));
    predictedMemory = Math.max(0, Math.min(100, predictedMemory));
    predictedRequests = Math.max(0, predictedRequests);
    
    // Calculate confidence based on data points and consistency
    const hourlyStdDevCPU = this.calculateStandardDeviation(hourlyData.map(d => d.cpu));
    const hourlyVarianceCPU = hourlyStdDevCPU / hourlyAvgCPU;
    
    let confidence = 100 - (hourlyVarianceCPU * 100);
    
    // Adjust confidence based on prediction distance
    const hoursDifference = (targetTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    confidence = confidence * Math.max(0.5, 1 - (hoursDifference / 24));
    
    // Adjust confidence based on data points
    confidence = confidence * Math.min(1, hourlyData.length / 20);
    
    // Ensure confidence is within valid range
    confidence = Math.max(0, Math.min(100, confidence));
    
    // Calculate predicted load (max of CPU and memory)
    const predictedLoad = Math.max(predictedCPU, predictedMemory);
    
    return {
      timestamp: targetTime.toISOString(),
      predictedLoad,
      predictedCPU,
      predictedMemory,
      predictedRequests,
      confidence,
      hour,
      dayOfWeek,
      dataPoints: {
        hourly: hourlyData.length,
        daily: dailyData.length
      }
    };
  }

  /**
   * Get predictions for the next time period
   * @param {number} minutes Minutes to look ahead
   */
  getPredictionsForNextPeriod(minutes = 15) {
    // Check if predictions are stale
    if (!this.lastPredictionTime || 
        (Date.now() - this.lastPredictionTime.getTime() > this.config.maxPredictionAge)) {
      this.generatePredictions();
    }
    
    const endTime = new Date(Date.now() + (minutes * 60 * 1000));
    
    return this.predictions.filter(p => {
      const predTime = new Date(p.timestamp);
      return predTime <= endTime;
    });
  }

  /**
   * Get scaling recommendation based on predictions
   */
  getScalingRecommendation(currentMetrics, currentReplicas, minReplicas, maxReplicas) {
    const predictions = this.getPredictionsForNextPeriod(15);
    
    if (predictions.length === 0) {
      return {
        action: 'none',
        reason: 'No predictions available',
        confidence: 0,
        targetReplicas: currentReplicas
      };
    }
    
    // Filter predictions with sufficient confidence
    const reliablePredictions = predictions.filter(
      p => p.confidence >= this.config.confidenceThreshold
    );
    
    if (reliablePredictions.length === 0) {
      return {
        action: 'none',
        reason: 'No predictions with sufficient confidence',
        confidence: 0,
        targetReplicas: currentReplicas
      };
    }
    
    // Get the maximum predicted load
    const maxPrediction = reliablePredictions.reduce(
      (max, p) => p.predictedLoad > max.predictedLoad ? p : max,
      reliablePredictions[0]
    );
    
    // Calculate target replicas based on predicted load
    // Assuming linear scaling with CPU/memory as the primary metric
    const targetLoad = 70; // Target load percentage
    const currentLoad = Math.max(currentMetrics.cpuUtilization, currentMetrics.memoryUtilization);
    
    let targetReplicas;
    
    if (currentLoad > 0) {
      // Scale based on current load and predicted load
      targetReplicas = Math.ceil((maxPrediction.predictedLoad / targetLoad) * currentReplicas);
    } else {
      // Fallback if current load is 0
      targetReplicas = maxPrediction.predictedLoad > 70 ? currentReplicas + 1 : currentReplicas;
    }
    
    // Ensure within limits
    targetReplicas = Math.max(minReplicas, Math.min(maxReplicas, targetReplicas));
    
    // Determine action
    let action = 'none';
    let reason = '';
    
    if (targetReplicas > currentReplicas) {
      action = 'scale_up';
      reason = `Predicted load increase to ${maxPrediction.predictedLoad.toFixed(1)}% at ${new Date(maxPrediction.timestamp).toLocaleTimeString()}`;
    } else if (targetReplicas < currentReplicas) {
      action = 'scale_down';
      reason = `Predicted load decrease to ${maxPrediction.predictedLoad.toFixed(1)}% for next period`;
    }
    
    return {
      action,
      reason,
      confidence: maxPrediction.confidence,
      targetReplicas,
      prediction: maxPrediction
    };
  }

  /**
   * Detect anomalies in metrics
   */
  detectAnomalies(dataPoint) {
    // Simple anomaly detection using Z-score
    const metrics = ['cpu', 'memory', 'requestRate'];
    const anomalies = [];
    
    metrics.forEach(metric => {
      const history = this.metricHistory[metric];
      
      if (history.length >= 10) {
        const values = history.slice(-10).map(h => h.value);
        const mean = this.calculateAverage(values);
        const stdDev = this.calculateStandardDeviation(values);
        
        if (stdDev > 0) {
          const zScore = Math.abs((dataPoint[metric] - mean) / stdDev);
          
          if (zScore > 3) { // More than 3 standard deviations
            anomalies.push({
              metric,
              value: dataPoint[metric],
              mean,
              stdDev,
              zScore,
              timestamp: dataPoint.timestamp
            });
          }
        }
      }
    });
    
    if (anomalies.length > 0) {
      this.anomalies.push(...anomalies);
      
      // Keep only recent anomalies
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      this.anomalies = this.anomalies.filter(
        a => new Date(a.timestamp) >= oneDayAgo
      );
      
      this.emit('anomalyDetected', {
        anomalies,
        timestamp: dataPoint.timestamp
      });
    }
    
    return anomalies;
  }

  /**
   * Update trend detection
   */
  updateTrends() {
    const metrics = ['cpu', 'memory', 'requestRate'];
    
    metrics.forEach(metric => {
      const history = this.metricHistory[metric];
      
      if (history.length >= 12) { // At least 12 data points (1 hour with 5-min intervals)
        const recentData = history.slice(-12);
        
        // Simple linear regression
        const xValues = Array.from({ length: recentData.length }, (_, i) => i);
        const yValues = recentData.map(d => d.value);
        
        const { slope, intercept } = this.linearRegression(xValues, yValues);
        
        // Determine trend direction and magnitude
        let direction = 'stable';
        if (slope > 0.5) {
          direction = 'increasing';
        } else if (slope < -0.5) {
          direction = 'decreasing';
        }
        
        this.trends[metric] = {
          direction,
          magnitude: Math.abs(slope),
          slope,
          intercept
        };
      }
    });
  }

  /**
   * Update statistical models
   */
  updateStatisticalModels(dataPoint) {
    // Update exponential smoothing
    if (!this.models.exponentialSmoothing.lastSmoothed) {
      this.models.exponentialSmoothing.lastSmoothed = {
        cpu: dataPoint.cpu,
        memory: dataPoint.memory,
        requestRate: dataPoint.requestRate
      };
    } else {
      const alpha = this.models.exponentialSmoothing.alpha;
      const last = this.models.exponentialSmoothing.lastSmoothed;
      
      this.models.exponentialSmoothing.lastSmoothed = {
        cpu: (alpha * dataPoint.cpu) + ((1 - alpha) * last.cpu),
        memory: (alpha * dataPoint.memory) + ((1 - alpha) * last.memory),
        requestRate: (alpha * dataPoint.requestRate) + ((1 - alpha) * last.requestRate)
      };
    }
    
    // Update linear regression model for CPU (most important metric)
    if (this.metricHistory.cpu.length >= 12) {
      const recentData = this.metricHistory.cpu.slice(-12);
      const xValues = Array.from({ length: recentData.length }, (_, i) => i);
      const yValues = recentData.map(d => d.value);
      
      const { slope, intercept } = this.linearRegression(xValues, yValues);
      
      this.models.linearRegression = {
        slope,
        intercept,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate linear regression
   */
  linearRegression(xValues, yValues) {
    const n = xValues.length;
    
    // Calculate means
    const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
    const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
      denominator += Math.pow(xValues[i] - xMean, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = yMean - (slope * xMean);
    
    return { slope, intercept };
  }

  /**
   * Calculate average of values
   */
  calculateAverage(values) {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  calculateStandardDeviation(values) {
    if (values.length <= 1) return 0;
    
    const avg = this.calculateAverage(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.calculateAverage(squareDiffs);
    
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Get week of year
   */
  getWeekOfYear(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }

  /**
   * Get recent anomalies
   */
  getRecentAnomalies() {
    return this.anomalies;
  }

  /**
   * Get current trends
   */
  getCurrentTrends() {
    return this.trends;
  }

  /**
   * Get engine status
   */
  getStatus() {
    return {
      initialized: this.lastPredictionTime !== null,
      dataPoints: {
        cpu: this.metricHistory.cpu.length,
        memory: this.metricHistory.memory.length,
        requestRate: this.metricHistory.requestRate.length
      },
      predictions: this.predictions.length,
      lastPredictionTime: this.lastPredictionTime ? this.lastPredictionTime.toISOString() : null,
      anomalies: this.anomalies.length,
      trends: this.trends,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { PredictiveScalingEngine };
