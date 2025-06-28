/**
 * Performance Analytics - Performance Optimization Suite
 * Advanced analytics and insights for performance optimization
 */

const EventEmitter = require('events');

class PerformanceAnalytics extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableTrendAnalysis: config.enableTrendAnalysis !== false,
      enableAnomalyDetection: config.enableAnomalyDetection !== false,
      enablePredictiveAnalytics: config.enablePredictiveAnalytics || false,
      enableBottleneckDetection: config.enableBottleneckDetection !== false,
      dataRetentionPeriod: config.dataRetentionPeriod || 30 * 24 * 60 * 60 * 1000, // 30 days
      analysisInterval: config.analysisInterval || 300000, // 5 minutes
      anomalyThreshold: config.anomalyThreshold || 2.5, // Standard deviations
      ...config
    };
    
    this.performanceData = [];
    this.trends = new Map();
    this.anomalies = [];
    this.bottlenecks = [];
    this.insights = [];
    this.predictions = [];
    
    this.baselineMetrics = null;
    this.performanceScore = 100;
  }

  /**
   * Initialize performance analytics
   */
  async initialize() {
    try {
      // Setup analysis intervals
      setInterval(() => {
        this.performAnalysis();
      }, this.config.analysisInterval);
      
      // Setup data cleanup
      setInterval(() => {
        this.cleanupOldData();
      }, 60 * 60 * 1000); // Every hour
      
      // Establish baseline after initial data collection
      setTimeout(() => {
        this.establishBaseline();
      }, 10 * 60 * 1000); // After 10 minutes
      
      this.emit('initialized', { 
        timestamp: new Date().toISOString(),
        config: this.config
      });
      
    } catch (error) {
      this.emit('error', {
        type: 'ANALYTICS_INIT_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Record performance data point
   */
  recordPerformanceData(metrics) {
    const dataPoint = {
      ...metrics,
      timestamp: new Date().toISOString(),
      timestampMs: Date.now()
    };
    
    this.performanceData.push(dataPoint);
    
    // Keep data within retention period
    const cutoff = Date.now() - this.config.dataRetentionPeriod;
    this.performanceData = this.performanceData.filter(
      point => point.timestampMs > cutoff
    );
    
    this.emit('dataRecorded', dataPoint);
  }

  /**
   * Perform comprehensive performance analysis
   */
  async performAnalysis() {
    try {
      if (this.performanceData.length < 10) {
        return; // Not enough data for analysis
      }
      
      const analysis = {
        timestamp: new Date().toISOString(),
        trends: {},
        anomalies: [],
        bottlenecks: [],
        insights: [],
        performanceScore: 0
      };
      
      // Trend analysis
      if (this.config.enableTrendAnalysis) {
        analysis.trends = this.analyzeTrends();
      }
      
      // Anomaly detection
      if (this.config.enableAnomalyDetection) {
        analysis.anomalies = this.detectAnomalies();
      }
      
      // Bottleneck detection
      if (this.config.enableBottleneckDetection) {
        analysis.bottlenecks = this.detectBottlenecks();
      }
      
      // Generate insights
      analysis.insights = this.generateInsights(analysis);
      
      // Calculate performance score
      analysis.performanceScore = this.calculatePerformanceScore();
      
      // Update internal state
      this.trends = new Map(Object.entries(analysis.trends));
      this.anomalies = analysis.anomalies;
      this.bottlenecks = analysis.bottlenecks;
      this.insights = analysis.insights;
      this.performanceScore = analysis.performanceScore;
      
      this.emit('analysisCompleted', analysis);
      
      return analysis;
      
    } catch (error) {
      this.emit('error', {
        type: 'ANALYSIS_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    const trends = {};
    const timeWindows = [
      { name: '1hour', duration: 60 * 60 * 1000 },
      { name: '6hours', duration: 6 * 60 * 60 * 1000 },
      { name: '24hours', duration: 24 * 60 * 60 * 1000 },
      { name: '7days', duration: 7 * 24 * 60 * 60 * 1000 }
    ];
    
    const metrics = ['responseTime', 'throughput', 'cpuUsage', 'memoryUsage', 'errorRate'];
    
    for (const window of timeWindows) {
      const cutoff = Date.now() - window.duration;
      const windowData = this.performanceData.filter(
        point => point.timestampMs > cutoff
      );
      
      if (windowData.length < 2) continue;
      
      trends[window.name] = {};
      
      for (const metric of metrics) {
        const values = windowData.map(point => point[metric]).filter(v => v !== undefined);
        
        if (values.length < 2) continue;
        
        const trend = this.calculateTrend(values);
        trends[window.name][metric] = {
          direction: trend.direction,
          slope: trend.slope,
          correlation: trend.correlation,
          current: values[values.length - 1],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      }
    }
    
    return trends;
  }

  /**
   * Calculate trend for a series of values
   */
  calculateTrend(values) {
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    // Linear regression
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Correlation coefficient
    const meanX = sumX / n;
    const meanY = sumY / n;
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + (xi - meanX) ** 2, 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + (yi - meanY) ** 2, 0));
    const correlation = numerator / (denomX * denomY);
    
    return {
      slope,
      intercept,
      correlation,
      direction: slope > 0.1 ? 'increasing' : slope < -0.1 ? 'decreasing' : 'stable'
    };
  }

  /**
   * Detect performance anomalies
   */
  detectAnomalies() {
    const anomalies = [];
    const recentData = this.performanceData.slice(-100); // Last 100 data points
    
    if (recentData.length < 10) return anomalies;
    
    const metrics = ['responseTime', 'throughput', 'cpuUsage', 'memoryUsage', 'errorRate'];
    
    for (const metric of metrics) {
      const values = recentData.map(point => point[metric]).filter(v => v !== undefined);
      
      if (values.length < 10) continue;
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Check recent values for anomalies
      const recentValues = values.slice(-5);
      
      for (let i = 0; i < recentValues.length; i++) {
        const value = recentValues[i];
        const zScore = Math.abs((value - mean) / stdDev);
        
        if (zScore > this.config.anomalyThreshold) {
          anomalies.push({
            metric,
            value,
            mean,
            stdDev,
            zScore,
            severity: zScore > 3 ? 'high' : 'medium',
            timestamp: recentData[recentData.length - 5 + i].timestamp,
            description: `${metric} value ${value.toFixed(2)} is ${zScore.toFixed(2)} standard deviations from mean ${mean.toFixed(2)}`
          });
        }
      }
    }
    
    return anomalies;
  }

  /**
   * Detect performance bottlenecks
   */
  detectBottlenecks() {
    const bottlenecks = [];
    const recentData = this.performanceData.slice(-20); // Last 20 data points
    
    if (recentData.length < 5) return bottlenecks;
    
    // CPU bottleneck
    const avgCPU = recentData.reduce((sum, point) => sum + (point.cpuUsage || 0), 0) / recentData.length;
    if (avgCPU > 80) {
      bottlenecks.push({
        type: 'CPU',
        severity: avgCPU > 90 ? 'critical' : 'high',
        value: avgCPU,
        threshold: 80,
        description: `High CPU usage: ${avgCPU.toFixed(1)}%`,
        recommendations: [
          'Scale horizontally to distribute load',
          'Optimize CPU-intensive operations',
          'Enable CPU-based auto-scaling'
        ]
      });
    }
    
    // Memory bottleneck
    const avgMemory = recentData.reduce((sum, point) => sum + (point.memoryUsage || 0), 0) / recentData.length;
    if (avgMemory > 85) {
      bottlenecks.push({
        type: 'Memory',
        severity: avgMemory > 95 ? 'critical' : 'high',
        value: avgMemory,
        threshold: 85,
        description: `High memory usage: ${avgMemory.toFixed(1)}%`,
        recommendations: [
          'Optimize memory usage patterns',
          'Implement memory pooling',
          'Scale vertically or horizontally'
        ]
      });
    }
    
    // Response time bottleneck
    const avgResponseTime = recentData.reduce((sum, point) => sum + (point.responseTime || 0), 0) / recentData.length;
    if (avgResponseTime > 1000) {
      bottlenecks.push({
        type: 'Response Time',
        severity: avgResponseTime > 2000 ? 'critical' : 'high',
        value: avgResponseTime,
        threshold: 1000,
        description: `High response time: ${avgResponseTime.toFixed(0)}ms`,
        recommendations: [
          'Optimize database queries',
          'Implement caching strategies',
          'Review application bottlenecks'
        ]
      });
    }
    
    // Throughput bottleneck
    const avgThroughput = recentData.reduce((sum, point) => sum + (point.throughput || 0), 0) / recentData.length;
    if (this.baselineMetrics && avgThroughput < this.baselineMetrics.throughput * 0.7) {
      bottlenecks.push({
        type: 'Throughput',
        severity: 'medium',
        value: avgThroughput,
        baseline: this.baselineMetrics.throughput,
        description: `Low throughput: ${avgThroughput.toFixed(1)} req/s (baseline: ${this.baselineMetrics.throughput.toFixed(1)})`,
        recommendations: [
          'Investigate performance degradation',
          'Check for resource constraints',
          'Review recent changes'
        ]
      });
    }
    
    return bottlenecks;
  }

  /**
   * Generate performance insights
   */
  generateInsights(analysis) {
    const insights = [];
    
    // Trend-based insights
    if (analysis.trends['24hours']) {
      const dayTrends = analysis.trends['24hours'];
      
      if (dayTrends.responseTime && dayTrends.responseTime.direction === 'increasing') {
        insights.push({
          type: 'trend',
          category: 'performance_degradation',
          severity: 'medium',
          title: 'Response Time Increasing',
          description: `Response time has been increasing over the last 24 hours (${dayTrends.responseTime.slope.toFixed(2)}ms/hour trend)`,
          recommendation: 'Investigate recent changes and consider performance optimization',
          impact: 'User experience may be degrading'
        });
      }
      
      if (dayTrends.errorRate && dayTrends.errorRate.direction === 'increasing') {
        insights.push({
          type: 'trend',
          category: 'reliability',
          severity: 'high',
          title: 'Error Rate Increasing',
          description: `Error rate has been increasing over the last 24 hours`,
          recommendation: 'Investigate error logs and fix underlying issues',
          impact: 'Application reliability is decreasing'
        });
      }
    }
    
    // Anomaly-based insights
    const criticalAnomalies = analysis.anomalies.filter(a => a.severity === 'high');
    if (criticalAnomalies.length > 0) {
      insights.push({
        type: 'anomaly',
        category: 'performance_spike',
        severity: 'high',
        title: 'Performance Anomalies Detected',
        description: `${criticalAnomalies.length} critical performance anomalies detected`,
        recommendation: 'Investigate anomalous behavior and identify root causes',
        impact: 'Performance may be unstable'
      });
    }
    
    // Bottleneck-based insights
    const criticalBottlenecks = analysis.bottlenecks.filter(b => b.severity === 'critical');
    if (criticalBottlenecks.length > 0) {
      insights.push({
        type: 'bottleneck',
        category: 'resource_constraint',
        severity: 'critical',
        title: 'Critical Resource Bottlenecks',
        description: `Critical bottlenecks detected: ${criticalBottlenecks.map(b => b.type).join(', ')}`,
        recommendation: 'Immediate action required to resolve resource constraints',
        impact: 'System performance is severely impacted'
      });
    }
    
    // Performance score insights
    if (this.performanceScore < 70) {
      insights.push({
        type: 'score',
        category: 'overall_performance',
        severity: this.performanceScore < 50 ? 'critical' : 'high',
        title: 'Low Performance Score',
        description: `Overall performance score is ${this.performanceScore}/100`,
        recommendation: 'Comprehensive performance optimization needed',
        impact: 'Overall system performance is below acceptable levels'
      });
    }
    
    return insights;
  }

  /**
   * Calculate overall performance score
   */
  calculatePerformanceScore() {
    if (this.performanceData.length === 0) return 100;
    
    const recentData = this.performanceData.slice(-10);
    let score = 100;
    
    // Response time score (30% weight)
    const avgResponseTime = recentData.reduce((sum, point) => sum + (point.responseTime || 0), 0) / recentData.length;
    const responseTimeScore = Math.max(0, 100 - (avgResponseTime / 10)); // 1000ms = 0 points
    score -= (100 - responseTimeScore) * 0.3;
    
    // Error rate score (25% weight)
    const avgErrorRate = recentData.reduce((sum, point) => sum + (point.errorRate || 0), 0) / recentData.length;
    const errorRateScore = Math.max(0, 100 - (avgErrorRate * 20)); // 5% error rate = 0 points
    score -= (100 - errorRateScore) * 0.25;
    
    // CPU usage score (20% weight)
    const avgCPU = recentData.reduce((sum, point) => sum + (point.cpuUsage || 0), 0) / recentData.length;
    const cpuScore = Math.max(0, 100 - Math.max(0, avgCPU - 70) * 2); // 70% CPU = 100 points, 100% = 40 points
    score -= (100 - cpuScore) * 0.2;
    
    // Memory usage score (15% weight)
    const avgMemory = recentData.reduce((sum, point) => sum + (point.memoryUsage || 0), 0) / recentData.length;
    const memoryScore = Math.max(0, 100 - Math.max(0, avgMemory - 80) * 3); // 80% memory = 100 points
    score -= (100 - memoryScore) * 0.15;
    
    // Throughput score (10% weight)
    const avgThroughput = recentData.reduce((sum, point) => sum + (point.throughput || 0), 0) / recentData.length;
    const throughputScore = this.baselineMetrics ? 
      Math.min(100, (avgThroughput / this.baselineMetrics.throughput) * 100) : 100;
    score -= (100 - throughputScore) * 0.1;
    
    return Math.max(0, Math.round(score));
  }

  /**
   * Establish performance baseline
   */
  establishBaseline() {
    if (this.performanceData.length < 20) {
      // Not enough data, try again later
      setTimeout(() => this.establishBaseline(), 5 * 60 * 1000);
      return;
    }
    
    const baselineData = this.performanceData.slice(-50); // Use last 50 data points
    
    this.baselineMetrics = {
      responseTime: this.calculatePercentile(baselineData.map(d => d.responseTime || 0), 50),
      throughput: baselineData.reduce((sum, d) => sum + (d.throughput || 0), 0) / baselineData.length,
      cpuUsage: baselineData.reduce((sum, d) => sum + (d.cpuUsage || 0), 0) / baselineData.length,
      memoryUsage: baselineData.reduce((sum, d) => sum + (d.memoryUsage || 0), 0) / baselineData.length,
      errorRate: baselineData.reduce((sum, d) => sum + (d.errorRate || 0), 0) / baselineData.length,
      establishedAt: new Date().toISOString()
    };
    
    this.emit('baselineEstablished', this.baselineMetrics);
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)];
  }

  /**
   * Analyze performance for specific time period
   */
  analyzePerformance(metrics) {
    // Record the metrics
    this.recordPerformanceData(metrics);
    
    // Return current analysis state
    return {
      performanceScore: this.performanceScore,
      trends: Object.fromEntries(this.trends),
      anomalies: this.anomalies,
      bottlenecks: this.bottlenecks,
      insights: this.insights,
      baseline: this.baselineMetrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Record cache miss for analysis
   */
  recordCacheMiss(data) {
    // This would be used to analyze cache performance
    this.emit('cacheMissRecorded', {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record slow query for analysis
   */
  recordSlowQuery(query) {
    // This would be used to analyze database performance
    this.emit('slowQueryRecorded', {
      ...query,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      performanceScore: this.performanceScore,
      dataPoints: this.performanceData.length,
      trends: Object.fromEntries(this.trends),
      anomalies: this.anomalies.length,
      bottlenecks: this.bottlenecks.length,
      insights: this.insights.length,
      baseline: this.baselineMetrics,
      lastAnalysis: this.performanceData.length > 0 ? 
        this.performanceData[this.performanceData.length - 1].timestamp : null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Cleanup old data
   */
  cleanupOldData() {
    const cutoff = Date.now() - this.config.dataRetentionPeriod;
    
    const initialCount = this.performanceData.length;
    this.performanceData = this.performanceData.filter(
      point => point.timestampMs > cutoff
    );
    
    const cleanedCount = initialCount - this.performanceData.length;
    
    if (cleanedCount > 0) {
      this.emit('dataCleanup', {
        cleanedPoints: cleanedCount,
        remainingPoints: this.performanceData.length,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    return {
      status: 'healthy',
      performanceScore: this.performanceScore,
      dataPoints: this.performanceData.length,
      baseline: !!this.baselineMetrics,
      activeAnomalies: this.anomalies.length,
      activeBottlenecks: this.bottlenecks.length,
      insights: this.insights.length,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { PerformanceAnalytics };
