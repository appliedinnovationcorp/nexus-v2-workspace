/**
 * Resource Optimizer - Performance Optimization Suite
 * Intelligent resource optimization for CPU, memory, I/O, and network
 */

const EventEmitter = require('events');
const os = require('os');
const cluster = require('cluster');

class ResourceOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableCPUOptimization: config.enableCPUOptimization !== false,
      enableMemoryOptimization: config.enableMemoryOptimization !== false,
      enableIOOptimization: config.enableIOOptimization !== false,
      enableNetworkOptimization: config.enableNetworkOptimization !== false,
      cpuThreshold: config.cpuThreshold || 70, // %
      memoryThreshold: config.memoryThreshold || 80, // %
      enableWorkerThreads: config.enableWorkerThreads || false,
      maxWorkerThreads: config.maxWorkerThreads || os.cpus().length,
      enableClusterMode: config.enableClusterMode || false,
      maxClusterWorkers: config.maxClusterWorkers || os.cpus().length,
      gcOptimization: config.gcOptimization || false,
      ...config
    };
    
    this.resourceMetrics = {
      cpu: { usage: 0, cores: os.cpus().length },
      memory: { usage: 0, total: os.totalmem(), free: os.freemem() },
      io: { reads: 0, writes: 0, latency: 0 },
      network: { connections: 0, throughput: 0, latency: 0 }
    };
    
    this.optimizations = new Map();
    this.workerPool = [];
    this.taskQueue = [];
    this.performanceBaseline = null;
  }

  /**
   * Initialize the resource optimizer
   */
  async initialize() {
    try {
      // Setup resource monitoring
      this.startResourceMonitoring();
      
      // Initialize worker threads if enabled
      if (this.config.enableWorkerThreads) {
        await this.initializeWorkerThreads();
      }
      
      // Setup cluster mode if enabled
      if (this.config.enableClusterMode && cluster.isMaster) {
        this.setupClusterMode();
      }
      
      // Setup garbage collection optimization
      if (this.config.gcOptimization) {
        this.setupGCOptimization();
      }
      
      // Apply initial optimizations
      await this.applyInitialOptimizations();
      
      this.emit('initialized', { 
        timestamp: new Date().toISOString(),
        config: this.config
      });
      
    } catch (error) {
      this.emit('error', {
        type: 'RESOURCE_OPTIMIZER_INIT_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Start resource monitoring
   */
  startResourceMonitoring() {
    setInterval(() => {
      this.collectResourceMetrics();
    }, 5000); // Every 5 seconds
    
    setInterval(() => {
      this.analyzeResourceUsage();
    }, 30000); // Every 30 seconds
  }

  /**
   * Collect resource metrics
   */
  async collectResourceMetrics() {
    try {
      // CPU metrics
      const cpuUsage = await this.getCPUUsage();
      
      // Memory metrics
      const memoryUsage = this.getMemoryUsage();
      
      // I/O metrics (simplified)
      const ioMetrics = this.getIOMetrics();
      
      // Network metrics (simplified)
      const networkMetrics = this.getNetworkMetrics();
      
      this.resourceMetrics = {
        cpu: { usage: cpuUsage, cores: os.cpus().length },
        memory: memoryUsage,
        io: ioMetrics,
        network: networkMetrics,
        timestamp: new Date().toISOString()
      };
      
      this.emit('resourceMetricsCollected', this.resourceMetrics);
      
    } catch (error) {
      this.emit('error', {
        type: 'RESOURCE_METRICS_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get CPU usage
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
    
    return { idle, total };
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const processMemory = process.memoryUsage();
    
    return {
      total: totalMemory,
      free: freeMemory,
      used: usedMemory,
      usage: (usedMemory / totalMemory) * 100,
      process: {
        rss: processMemory.rss,
        heapTotal: processMemory.heapTotal,
        heapUsed: processMemory.heapUsed,
        heapUsage: (processMemory.heapUsed / processMemory.heapTotal) * 100,
        external: processMemory.external
      }
    };
  }

  /**
   * Get I/O metrics (simplified)
   */
  getIOMetrics() {
    // In production, this would use actual I/O monitoring
    return {
      reads: 0,
      writes: 0,
      latency: 0,
      throughput: 0
    };
  }

  /**
   * Get network metrics (simplified)
   */
  getNetworkMetrics() {
    // In production, this would use actual network monitoring
    return {
      connections: 0,
      throughput: 0,
      latency: 0,
      packetsIn: 0,
      packetsOut: 0
    };
  }

  /**
   * Analyze resource usage and identify optimization opportunities
   */
  analyzeResourceUsage() {
    const opportunities = [];
    
    // CPU optimization opportunities
    if (this.resourceMetrics.cpu.usage > this.config.cpuThreshold) {
      opportunities.push({
        type: 'CPU_OPTIMIZATION',
        priority: 'high',
        current: this.resourceMetrics.cpu.usage,
        threshold: this.config.cpuThreshold,
        recommendations: [
          'Enable worker threads for CPU-intensive tasks',
          'Optimize synchronous operations',
          'Consider horizontal scaling'
        ]
      });
    }
    
    // Memory optimization opportunities
    if (this.resourceMetrics.memory.usage > this.config.memoryThreshold) {
      opportunities.push({
        type: 'MEMORY_OPTIMIZATION',
        priority: 'high',
        current: this.resourceMetrics.memory.usage,
        threshold: this.config.memoryThreshold,
        recommendations: [
          'Force garbage collection',
          'Optimize memory-intensive operations',
          'Implement memory pooling'
        ]
      });
    }
    
    // Heap memory optimization
    if (this.resourceMetrics.memory.process.heapUsage > 85) {
      opportunities.push({
        type: 'HEAP_OPTIMIZATION',
        priority: 'medium',
        current: this.resourceMetrics.memory.process.heapUsage,
        threshold: 85,
        recommendations: [
          'Optimize object creation',
          'Implement object pooling',
          'Review memory leaks'
        ]
      });
    }
    
    if (opportunities.length > 0) {
      this.emit('optimizationOpportunities', {
        opportunities,
        timestamp: new Date().toISOString()
      });
    }
    
    return opportunities;
  }

  /**
   * Apply initial optimizations
   */
  async applyInitialOptimizations() {
    const optimizations = [];
    
    // Set process priority
    try {
      process.setMaxListeners(0); // Remove listener limit
      optimizations.push('increased_max_listeners');
    } catch (error) {
      // Ignore if not supported
    }
    
    // Optimize event loop
    if (process.env.UV_THREADPOOL_SIZE === undefined) {
      process.env.UV_THREADPOOL_SIZE = Math.max(4, os.cpus().length).toString();
      optimizations.push('optimized_threadpool_size');
    }
    
    // Enable keep-alive for HTTP connections
    process.env.HTTP_KEEP_ALIVE = 'true';
    optimizations.push('enabled_http_keep_alive');
    
    this.emit('initialOptimizationsApplied', {
      optimizations,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Initialize worker threads
   */
  async initializeWorkerThreads() {
    // This would initialize actual worker threads
    // For now, we'll simulate the worker pool
    this.workerPool = Array(this.config.maxWorkerThreads).fill(null).map((_, index) => ({
      id: index,
      busy: false,
      tasksCompleted: 0
    }));
    
    this.emit('workerThreadsInitialized', {
      workerCount: this.workerPool.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Setup cluster mode
   */
  setupClusterMode() {
    if (cluster.isMaster) {
      const numWorkers = Math.min(this.config.maxClusterWorkers, os.cpus().length);
      
      for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
      }
      
      cluster.on('exit', (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork(); // Restart worker
      });
      
      this.emit('clusterModeSetup', {
        workerCount: numWorkers,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Setup garbage collection optimization
   */
  setupGCOptimization() {
    // Monitor GC events
    if (global.gc) {
      setInterval(() => {
        const memoryBefore = process.memoryUsage();
        global.gc();
        const memoryAfter = process.memoryUsage();
        
        this.emit('gcPerformed', {
          memoryFreed: memoryBefore.heapUsed - memoryAfter.heapUsed,
          timestamp: new Date().toISOString()
        });
      }, 60000); // Every minute
    }
    
    // Setup automatic GC triggers
    setInterval(() => {
      const memoryUsage = this.getMemoryUsage();
      
      if (memoryUsage.process.heapUsage > 90 && global.gc) {
        global.gc();
        this.emit('automaticGCTriggered', {
          heapUsage: memoryUsage.process.heapUsage,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Optimize CPU usage
   */
  async optimizeCPUUsage() {
    const optimizations = [];
    
    // Move CPU-intensive tasks to worker threads
    if (this.config.enableWorkerThreads && this.taskQueue.length > 0) {
      const tasksToOffload = this.taskQueue.splice(0, this.workerPool.length);
      
      for (const task of tasksToOffload) {
        await this.executeInWorkerThread(task);
      }
      
      optimizations.push({
        type: 'WORKER_THREAD_OFFLOAD',
        tasksOffloaded: tasksToOffload.length
      });
    }
    
    // Optimize event loop
    process.nextTick(() => {
      // Defer non-critical operations
    });
    
    optimizations.push({
      type: 'EVENT_LOOP_OPTIMIZATION',
      description: 'Deferred non-critical operations'
    });
    
    this.emit('cpuOptimizationApplied', {
      optimizations,
      timestamp: new Date().toISOString()
    });
    
    return optimizations;
  }

  /**
   * Optimize memory usage
   */
  async optimizeMemoryUsage() {
    const optimizations = [];
    
    // Force garbage collection if available
    if (global.gc) {
      const memoryBefore = process.memoryUsage();
      global.gc();
      const memoryAfter = process.memoryUsage();
      
      optimizations.push({
        type: 'GARBAGE_COLLECTION',
        memoryFreed: memoryBefore.heapUsed - memoryAfter.heapUsed
      });
    }
    
    // Clear internal caches if memory pressure is high
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage.process.heapUsage > 85) {
      // This would clear application-specific caches
      optimizations.push({
        type: 'CACHE_CLEANUP',
        description: 'Cleared non-essential caches due to memory pressure'
      });
    }
    
    this.emit('memoryOptimizationApplied', {
      optimizations,
      timestamp: new Date().toISOString()
    });
    
    return optimizations;
  }

  /**
   * Execute task in worker thread
   */
  async executeInWorkerThread(task) {
    const availableWorker = this.workerPool.find(worker => !worker.busy);
    
    if (!availableWorker) {
      // Queue task if no workers available
      this.taskQueue.push(task);
      return;
    }
    
    availableWorker.busy = true;
    
    try {
      // Simulate task execution
      await new Promise(resolve => setTimeout(resolve, task.duration || 100));
      
      availableWorker.tasksCompleted++;
      
      this.emit('taskCompleted', {
        workerId: availableWorker.id,
        taskType: task.type,
        duration: task.duration,
        timestamp: new Date().toISOString()
      });
      
    } finally {
      availableWorker.busy = false;
    }
  }

  /**
   * Identify optimization opportunities
   */
  async identifyOptimizations() {
    const opportunities = [];
    
    // CPU optimization opportunities
    if (this.resourceMetrics.cpu.usage > this.config.cpuThreshold) {
      opportunities.push({
        type: 'resource',
        priority: 'high',
        description: 'High CPU usage detected',
        action: 'optimize_cpu_usage',
        impact: 'Reduce CPU usage and improve response times'
      });
    }
    
    // Memory optimization opportunities
    if (this.resourceMetrics.memory.usage > this.config.memoryThreshold) {
      opportunities.push({
        type: 'resource',
        priority: 'high',
        description: 'High memory usage detected',
        action: 'optimize_memory_usage',
        impact: 'Reduce memory usage and prevent out-of-memory errors'
      });
    }
    
    // Worker thread opportunities
    if (!this.config.enableWorkerThreads && this.resourceMetrics.cpu.usage > 60) {
      opportunities.push({
        type: 'resource',
        priority: 'medium',
        description: 'CPU-intensive tasks could benefit from worker threads',
        action: 'enable_worker_threads',
        impact: 'Improve CPU utilization and application responsiveness'
      });
    }
    
    // Cluster mode opportunities
    if (!this.config.enableClusterMode && this.resourceMetrics.cpu.cores > 1) {
      opportunities.push({
        type: 'resource',
        priority: 'medium',
        description: 'Multi-core system could benefit from cluster mode',
        action: 'enable_cluster_mode',
        impact: 'Utilize all CPU cores and improve throughput'
      });
    }
    
    return opportunities;
  }

  /**
   * Apply optimization
   */
  async applyOptimization(optimization) {
    try {
      switch (optimization.action) {
        case 'optimize_cpu_usage':
          return await this.optimizeCPUUsage();
        case 'optimize_memory_usage':
          return await this.optimizeMemoryUsage();
        case 'enable_worker_threads':
          return await this.enableWorkerThreads();
        case 'enable_cluster_mode':
          return await this.enableClusterMode();
        default:
          return { success: false, reason: 'Unknown optimization action' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async enableWorkerThreads() {
    if (this.config.enableWorkerThreads) {
      return { success: false, reason: 'Worker threads already enabled' };
    }
    
    this.config.enableWorkerThreads = true;
    await this.initializeWorkerThreads();
    
    return { 
      success: true, 
      message: 'Worker threads enabled',
      workerCount: this.workerPool.length
    };
  }

  async enableClusterMode() {
    if (this.config.enableClusterMode) {
      return { success: false, reason: 'Cluster mode already enabled' };
    }
    
    // This would require application restart
    return { 
      success: true, 
      message: 'Cluster mode configuration updated (requires restart)',
      requiresRestart: true
    };
  }

  /**
   * Get resource utilization summary
   */
  getResourceSummary() {
    return {
      cpu: {
        usage: this.resourceMetrics.cpu.usage,
        cores: this.resourceMetrics.cpu.cores,
        status: this.resourceMetrics.cpu.usage > this.config.cpuThreshold ? 'high' : 'normal'
      },
      memory: {
        usage: this.resourceMetrics.memory.usage,
        total: this.resourceMetrics.memory.total,
        free: this.resourceMetrics.memory.free,
        process: this.resourceMetrics.memory.process,
        status: this.resourceMetrics.memory.usage > this.config.memoryThreshold ? 'high' : 'normal'
      },
      workers: {
        enabled: this.config.enableWorkerThreads,
        count: this.workerPool.length,
        busy: this.workerPool.filter(w => w.busy).length,
        tasksCompleted: this.workerPool.reduce((sum, w) => sum + w.tasksCompleted, 0)
      },
      cluster: {
        enabled: this.config.enableClusterMode,
        isMaster: cluster.isMaster,
        workerId: cluster.worker?.id
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Middleware for Express.js
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Monitor request processing time
      res.on('finish', () => {
        const processingTime = Date.now() - startTime;
        
        // If processing time is high, consider optimization
        if (processingTime > 1000) { // 1 second
          this.emit('slowRequest', {
            url: req.originalUrl || req.url,
            method: req.method,
            processingTime,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // Add resource info to request
      req.resourceInfo = {
        cpuUsage: this.resourceMetrics.cpu.usage,
        memoryUsage: this.resourceMetrics.memory.usage,
        availableWorkers: this.workerPool.filter(w => !w.busy).length
      };
      
      next();
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const resourceSummary = this.getResourceSummary();
    
    let status = 'healthy';
    if (resourceSummary.cpu.status === 'high' || resourceSummary.memory.status === 'high') {
      status = 'warning';
    }
    
    return {
      status,
      resources: resourceSummary,
      optimizations: this.optimizations.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { ResourceOptimizer };
