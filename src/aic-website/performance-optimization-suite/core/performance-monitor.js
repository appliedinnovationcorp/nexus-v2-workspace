/**
 * Performance Monitor - Performance Optimization Suite
 * Real-time performance monitoring and alerting system
 */

const EventEmitter = require('events');
const os = require('os');
const process = require('process');

class PerformanceMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      monitoringInterval: config.monitoringInterval || 5000, // 5 seconds
      alertThresholds: {
        responseTime: config.responseTimeThreshold || 200, // ms
        cpuUsage: config.cpuThreshold || 70, // %
        memoryUsage: config.memoryThreshold || 80, // %
        errorRate: config.errorRateThreshold || 0.1, // %
        throughput: config.throughputThreshold || 1000, // req/s
        ...config.alertThresholds
      },
      enableRealTimeMonitoring: config.enableRealTimeMonitoring !== false,
      enablePerformanceTracing: config.enablePerformanceTracing || false,
      enableResourceMonitoring: config.enableResourceMonitoring !== false,
      retentionPeriod: config.retentionPeriod || 24 * 60 * 60 * 1000, // 24 hours
      ...config
    };
    
    this.metrics = {
      requests: [],
      responses: [],
      errors: [],
      systemMetrics: [],
      customMetrics: new Map()
    };
    
    this.activeRequests = new Map();
    this.performanceBaseline = null;
    this.alertHistory = [];
    
    this.startTime = Date.now();
  }

  /**
   * Initialize the performance monitor
   */
  async initialize() {
    // Start system monitoring
    if (this.config.enableResourceMonitoring) {
      this.startSystemMonitoring();
    }
    
    // Start real-time monitoring
    if (this.config.enableRealTimeMonitoring) {
      this.startRealTimeMonitoring();
    }
    
    // Setup cleanup intervals
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // Every minute
    
    // Establish performance baseline
    setTimeout(() => {
      this.establishPerformanceBaseline();
    }, 60000); // After 1 minute
    
    this.emit('initialized', { 
      timestamp: new Date().toISOString(),
      config: this.config
    });
  }

  /**
   * Start system resource monitoring
   */
  startSystemMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.monitoringInterval);
  }

  /**
   * Start real-time performance monitoring
   */
  startRealTimeMonitoring() {
    setInterval(() => {
      this.analyzeRealTimePerformance();
    }, this.config.monitoringInterval);
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics() {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryUsage = this.getMemoryUsage();
      const networkStats = this.getNetworkStats();
      const diskStats = this.getDiskStats();
      
      const systemMetrics = {
        timestamp: new Date().toISOString(),
        cpu: cpuUsage,
        memory: memoryUsage,
        network: networkStats,
        disk: diskStats,
        uptime: process.uptime(),
        loadAverage: os.loadavg()
      };
      
      this.metrics.systemMetrics.push(systemMetrics);
      
      // Check for alerts
      this.checkSystemAlerts(systemMetrics);
      
      this.emit('systemMetricsCollected', systemMetrics);
      
    } catch (error) {
      this.emit('error', {
        type: 'SYSTEM_METRICS_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get CPU usage percentage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startMeasure = this.cpuAverage();
      
      setTimeout(() => {
        const endMeasure = this.cpuAverage();
        const idleDifference = endMeasure.idle - startMeasure.idle;
        const totalDifference = endMeasure.total - startMeasure.total;
        const percentageCPU = 100 - ~~(100 * idleDifference / totalDifference);
        
        resolve(percentageCPU);
      }, 100);
    });
  }

  /**
   * Calculate CPU average
   */
  cpuAverage() {
    const cpus = os.cpus();
    let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
    
    for (const cpu of cpus) {
      user += cpu.times.user;
      nice += cpu.times.nice;
      sys += cpu.times.sys;
      idle += cpu.times.idle;
      irq += cpu.times.irq;
    }
    
    const total = user + nice + sys + idle + irq;
    
    return {
      idle: idle,
      total: total
    };
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    const processMemory = process.memoryUsage();
    
    return {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      percentage: memoryUsagePercent,
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        external: processMemory.external,
        arrayBuffers: processMemory.arrayBuffers
      }
    };
  }

  /**
   * Get network statistics
   */
  getNetworkStats() {
    const networkInterfaces = os.networkInterfaces();
    const stats = {
      interfaces: Object.keys(networkInterfaces).length,
      activeConnections: 0 // Would be implemented with actual network monitoring
    };
    
    return stats;
  }

  /**
   * Get disk statistics
   */
  getDiskStats() {
    // Simplified disk stats - would use actual disk monitoring in production
    return {
      usage: 0, // Would be implemented with actual disk monitoring
      iops: 0,
      throughput: 0
    };
  }

  /**
   * Record request start
   */
  recordRequestStart(requestId, requestData) {
    const startTime = Date.now();
    
    this.activeRequests.set(requestId, {
      id: requestId,
      startTime,
      method: requestData.method,
      url: requestData.url,
      userAgent: requestData.userAgent,
      ip: requestData.ip,
      headers: requestData.headers
    });
    
    this.emit('requestStarted', {
      requestId,
      startTime,
      ...requestData
    });
  }

  /**
   * Record request end
   */
  recordRequestEnd(requestId, responseData) {
    const endTime = Date.now();
    const request = this.activeRequests.get(requestId);
    
    if (!request) {
      return;
    }
    
    const duration = endTime - request.startTime;
    
    const requestMetric = {
      id: requestId,
      startTime: request.startTime,
      endTime,
      duration,
      method: request.method,
      url: request.url,
      statusCode: responseData.statusCode,
      responseSize: responseData.responseSize,
      userAgent: request.userAgent,
      ip: request.ip,
      error: responseData.error
    };
    
    this.metrics.requests.push(requestMetric);
    this.activeRequests.delete(requestId);
    
    // Check for performance alerts
    this.checkRequestAlert(requestMetric);
    
    this.emit('requestCompleted', requestMetric);
    
    return requestMetric;
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      tags,
      timestamp: new Date().toISOString()
    };
    
    if (!this.metrics.customMetrics.has(name)) {
      this.metrics.customMetrics.set(name, []);
    }
    
    this.metrics.customMetrics.get(name).push(metric);
    
    this.emit('customMetricRecorded', metric);
  }

  /**
   * Analyze real-time performance
   */
  analyzeRealTimePerformance() {
    try {
      const now = Date.now();
      const timeWindow = 60000; // 1 minute
      const windowStart = now - timeWindow;
      
      // Analyze recent requests
      const recentRequests = this.metrics.requests.filter(
        req => req.endTime > windowStart
      );
      
      if (recentRequests.length === 0) {
        return;
      }
      
      // Calculate performance metrics
      const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length;
      const throughput = recentRequests.length / (timeWindow / 1000); // requests per second
      const errorRate = recentRequests.filter(req => req.statusCode >= 400).length / recentRequests.length;
      const p95ResponseTime = this.calculatePercentile(recentRequests.map(r => r.duration), 95);
      const p99ResponseTime = this.calculatePercentile(recentRequests.map(r => r.duration), 99);
      
      const performanceMetrics = {
        timestamp: new Date().toISOString(),
        avgResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        throughput,
        errorRate,
        requestCount: recentRequests.length,
        activeRequests: this.activeRequests.size
      };
      
      // Check for performance degradation
      this.checkPerformanceDegradation(performanceMetrics);
      
      this.emit('performanceAnalysis', performanceMetrics);
      
    } catch (error) {
      this.emit('error', {
        type: 'PERFORMANCE_ANALYSIS_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[index];
  }

  /**
   * Check system alerts
   */
  checkSystemAlerts(systemMetrics) {
    const alerts = [];
    
    // CPU usage alert
    if (systemMetrics.cpu > this.config.alertThresholds.cpuUsage) {
      alerts.push({
        type: 'HIGH_CPU_USAGE',
        severity: 'warning',
        value: systemMetrics.cpu,
        threshold: this.config.alertThresholds.cpuUsage,
        message: `CPU usage is ${systemMetrics.cpu}%, exceeding threshold of ${this.config.alertThresholds.cpuUsage}%`
      });
    }
    
    // Memory usage alert
    if (systemMetrics.memory.percentage > this.config.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'warning',
        value: systemMetrics.memory.percentage,
        threshold: this.config.alertThresholds.memoryUsage,
        message: `Memory usage is ${systemMetrics.memory.percentage.toFixed(1)}%, exceeding threshold of ${this.config.alertThresholds.memoryUsage}%`
      });
    }
    
    // Process alerts
    alerts.forEach(alert => this.processAlert(alert));
  }

  /**
   * Check request alerts
   */
  checkRequestAlert(requestMetric) {
    const alerts = [];
    
    // Response time alert
    if (requestMetric.duration > this.config.alertThresholds.responseTime) {
      alerts.push({
        type: 'HIGH_RESPONSE_TIME',
        severity: 'warning',
        value: requestMetric.duration,
        threshold: this.config.alertThresholds.responseTime,
        requestId: requestMetric.id,
        url: requestMetric.url,
        message: `Response time is ${requestMetric.duration}ms, exceeding threshold of ${this.config.alertThresholds.responseTime}ms`
      });
    }
    
    // Error alert
    if (requestMetric.statusCode >= 500) {
      alerts.push({
        type: 'SERVER_ERROR',
        severity: 'error',
        statusCode: requestMetric.statusCode,
        requestId: requestMetric.id,
        url: requestMetric.url,
        message: `Server error ${requestMetric.statusCode} for ${requestMetric.method} ${requestMetric.url}`
      });
    }
    
    // Process alerts
    alerts.forEach(alert => this.processAlert(alert));
  }

  /**
   * Check performance degradation
   */
  checkPerformanceDegradation(currentMetrics) {
    if (!this.performanceBaseline) {
      return;
    }
    
    const alerts = [];
    
    // Response time degradation
    const responseTimeDegradation = (currentMetrics.avgResponseTime - this.performanceBaseline.avgResponseTime) / this.performanceBaseline.avgResponseTime;
    if (responseTimeDegradation > 0.5) { // 50% degradation
      alerts.push({
        type: 'PERFORMANCE_DEGRADATION',
        metric: 'RESPONSE_TIME',
        severity: 'warning',
        degradation: responseTimeDegradation * 100,
        current: currentMetrics.avgResponseTime,
        baseline: this.performanceBaseline.avgResponseTime,
        message: `Response time degraded by ${(responseTimeDegradation * 100).toFixed(1)}%`
      });
    }
    
    // Throughput degradation
    const throughputDegradation = (this.performanceBaseline.throughput - currentMetrics.throughput) / this.performanceBaseline.throughput;
    if (throughputDegradation > 0.3) { // 30% degradation
      alerts.push({
        type: 'PERFORMANCE_DEGRADATION',
        metric: 'THROUGHPUT',
        severity: 'warning',
        degradation: throughputDegradation * 100,
        current: currentMetrics.throughput,
        baseline: this.performanceBaseline.throughput,
        message: `Throughput degraded by ${(throughputDegradation * 100).toFixed(1)}%`
      });
    }
    
    // Process alerts
    alerts.forEach(alert => this.processAlert(alert));
  }

  /**
   * Process alert
   */
  processAlert(alert) {
    const alertWithTimestamp = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString()
    };
    
    this.alertHistory.push(alertWithTimestamp);
    
    this.emit('performanceAlert', alertWithTimestamp);
  }

  /**
   * Establish performance baseline
   */
  establishPerformanceBaseline() {
    const now = Date.now();
    const timeWindow = 300000; // 5 minutes
    const windowStart = now - timeWindow;
    
    const baselineRequests = this.metrics.requests.filter(
      req => req.endTime > windowStart
    );
    
    if (baselineRequests.length < 10) {
      // Not enough data for baseline
      setTimeout(() => {
        this.establishPerformanceBaseline();
      }, 60000); // Try again in 1 minute
      return;
    }
    
    this.performanceBaseline = {
      avgResponseTime: baselineRequests.reduce((sum, req) => sum + req.duration, 0) / baselineRequests.length,
      throughput: baselineRequests.length / (timeWindow / 1000),
      errorRate: baselineRequests.filter(req => req.statusCode >= 400).length / baselineRequests.length,
      establishedAt: new Date().toISOString()
    };
    
    this.emit('baselineEstablished', this.performanceBaseline);
  }

  /**
   * Collect all metrics
   */
  async collectMetrics() {
    const now = Date.now();
    const timeWindow = 60000; // 1 minute
    const windowStart = now - timeWindow;
    
    // Recent requests
    const recentRequests = this.metrics.requests.filter(
      req => req.endTime > windowStart
    );
    
    // System metrics
    const latestSystemMetrics = this.metrics.systemMetrics[this.metrics.systemMetrics.length - 1];
    
    // Calculate performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      responseTime: recentRequests.length > 0 ? 
        recentRequests.reduce((sum, req) => sum + req.duration, 0) / recentRequests.length : 0,
      throughput: recentRequests.length / (timeWindow / 1000),
      errorRate: recentRequests.length > 0 ? 
        recentRequests.filter(req => req.statusCode >= 400).length / recentRequests.length : 0,
      cpuUsage: latestSystemMetrics?.cpu || 0,
      memoryUsage: latestSystemMetrics?.memory?.percentage || 0,
      activeRequests: this.activeRequests.size,
      totalRequests: this.metrics.requests.length,
      uptime: process.uptime()
    };
    
    return metrics;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindow = 3600000) { // 1 hour default
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const requests = this.metrics.requests.filter(
      req => req.endTime > windowStart
    );
    
    if (requests.length === 0) {
      return {
        requestCount: 0,
        avgResponseTime: 0,
        throughput: 0,
        errorRate: 0
      };
    }
    
    return {
      requestCount: requests.length,
      avgResponseTime: requests.reduce((sum, req) => sum + req.duration, 0) / requests.length,
      p95ResponseTime: this.calculatePercentile(requests.map(r => r.duration), 95),
      p99ResponseTime: this.calculatePercentile(requests.map(r => r.duration), 99),
      throughput: requests.length / (timeWindow / 1000),
      errorRate: requests.filter(req => req.statusCode >= 400).length / requests.length,
      slowestRequests: requests.sort((a, b) => b.duration - a.duration).slice(0, 10),
      errorRequests: requests.filter(req => req.statusCode >= 400)
    };
  }

  /**
   * Middleware for Express.js
   */
  middleware() {
    return (req, res, next) => {
      const requestId = crypto.randomUUID();
      const startTime = Date.now();
      
      // Record request start
      this.recordRequestStart(requestId, {
        method: req.method,
        url: req.originalUrl || req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        headers: req.headers
      });
      
      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = function(...args) {
        // Record request end
        this.recordRequestEnd(requestId, {
          statusCode: res.statusCode,
          responseSize: res.get('Content-Length') || 0
        });
        
        // Call original end method
        originalEnd.apply(res, args);
      }.bind(this);
      
      next();
    };
  }

  /**
   * Cleanup old metrics
   */
  cleanupOldMetrics() {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // Cleanup requests
    this.metrics.requests = this.metrics.requests.filter(
      req => req.endTime > cutoff
    );
    
    // Cleanup system metrics
    this.metrics.systemMetrics = this.metrics.systemMetrics.filter(
      metric => new Date(metric.timestamp).getTime() > cutoff
    );
    
    // Cleanup custom metrics
    for (const [name, metrics] of this.metrics.customMetrics) {
      this.metrics.customMetrics.set(name, 
        metrics.filter(metric => new Date(metric.timestamp).getTime() > cutoff)
      );
    }
    
    // Cleanup alert history
    this.alertHistory = this.alertHistory.filter(
      alert => new Date(alert.timestamp).getTime() > cutoff
    );
  }

  /**
   * Health check
   */
  async healthCheck() {
    const systemMetrics = await this.collectSystemMetrics();
    const performanceSummary = this.getPerformanceSummary();
    
    return {
      status: 'healthy',
      uptime: process.uptime(),
      metrics: {
        requests: this.metrics.requests.length,
        systemMetrics: this.metrics.systemMetrics.length,
        activeRequests: this.activeRequests.size,
        alerts: this.alertHistory.length
      },
      performance: performanceSummary,
      baseline: this.performanceBaseline,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { PerformanceMonitor };
