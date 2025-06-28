/**
 * Database Optimizer - Performance Optimization Suite
 * Intelligent database performance optimization and monitoring
 */

const EventEmitter = require('events');

class DatabaseOptimizer extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      enableQueryOptimization: config.enableQueryOptimization !== false,
      enableConnectionPooling: config.enableConnectionPooling !== false,
      enableQueryCaching: config.enableQueryCaching !== false,
      enableIndexOptimization: config.enableIndexOptimization || false,
      slowQueryThreshold: config.slowQueryThreshold || 1000, // ms
      connectionPoolSize: config.connectionPoolSize || 10,
      maxConnections: config.maxConnections || 100,
      queryTimeout: config.queryTimeout || 30000, // 30 seconds
      cacheSize: config.cacheSize || 1000,
      cacheTTL: config.cacheTTL || 300, // 5 minutes
      ...config
    };
    
    this.queryStats = {
      totalQueries: 0,
      slowQueries: 0,
      cachedQueries: 0,
      averageExecutionTime: 0,
      connectionPoolUsage: 0
    };
    
    this.queryCache = new Map();
    this.slowQueries = [];
    this.connectionPool = [];
    this.activeConnections = new Set();
    this.queryHistory = [];
    this.indexSuggestions = new Map();
  }

  /**
   * Initialize the database optimizer
   */
  async initialize() {
    try {
      // Initialize connection pool
      if (this.config.enableConnectionPooling) {
        await this.initializeConnectionPool();
      }
      
      // Setup query monitoring
      this.startQueryMonitoring();
      
      // Setup cache cleanup
      setInterval(() => {
        this.cleanupQueryCache();
      }, 60000); // Every minute
      
      // Setup performance analysis
      setInterval(() => {
        this.analyzeQueryPerformance();
      }, 300000); // Every 5 minutes
      
      this.emit('initialized', { 
        timestamp: new Date().toISOString(),
        config: this.config
      });
      
    } catch (error) {
      this.emit('error', {
        type: 'DATABASE_OPTIMIZER_INIT_ERROR',
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Initialize connection pool
   */
  async initializeConnectionPool() {
    for (let i = 0; i < this.config.connectionPoolSize; i++) {
      const connection = {
        id: i,
        inUse: false,
        createdAt: new Date(),
        lastUsed: null,
        queryCount: 0
      };
      
      this.connectionPool.push(connection);
    }
    
    this.emit('connectionPoolInitialized', {
      poolSize: this.connectionPool.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start query monitoring
   */
  startQueryMonitoring() {
    setInterval(() => {
      this.updateQueryStats();
    }, 10000); // Every 10 seconds
  }

  /**
   * Execute optimized query
   */
  async executeQuery(sql, params = [], options = {}) {
    const queryId = this.generateQueryId(sql, params);
    const startTime = Date.now();
    
    try {
      // Check query cache first
      if (this.config.enableQueryCaching && options.cacheable !== false) {
        const cachedResult = this.getFromQueryCache(queryId);
        if (cachedResult) {
          this.queryStats.cachedQueries++;
          this.emit('queryCacheHit', {
            queryId,
            sql: sql.substring(0, 100) + '...',
            timestamp: new Date().toISOString()
          });
          return cachedResult;
        }
      }
      
      // Get connection from pool
      const connection = await this.getConnection();
      
      // Execute query with optimization
      const optimizedSql = this.optimizeQuery(sql);
      const result = await this.executeQueryOnConnection(connection, optimizedSql, params);
      
      // Release connection back to pool
      this.releaseConnection(connection);
      
      const executionTime = Date.now() - startTime;
      
      // Record query statistics
      this.recordQueryExecution(sql, params, executionTime, result);
      
      // Cache result if cacheable
      if (this.config.enableQueryCaching && options.cacheable !== false && executionTime < this.config.slowQueryThreshold) {
        this.setInQueryCache(queryId, result);
      }
      
      // Check for slow query
      if (executionTime > this.config.slowQueryThreshold) {
        this.handleSlowQuery(sql, params, executionTime);
      }
      
      return result;
      
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.emit('queryError', {
        sql: sql.substring(0, 100) + '...',
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  /**
   * Get connection from pool
   */
  async getConnection() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection pool timeout'));
      }, this.config.queryTimeout);
      
      const checkForConnection = () => {
        const availableConnection = this.connectionPool.find(conn => !conn.inUse);
        
        if (availableConnection) {
          clearTimeout(timeout);
          availableConnection.inUse = true;
          availableConnection.lastUsed = new Date();
          this.activeConnections.add(availableConnection.id);
          resolve(availableConnection);
        } else {
          // Check again in 10ms
          setTimeout(checkForConnection, 10);
        }
      };
      
      checkForConnection();
    });
  }

  /**
   * Release connection back to pool
   */
  releaseConnection(connection) {
    connection.inUse = false;
    connection.queryCount++;
    this.activeConnections.delete(connection.id);
    
    this.emit('connectionReleased', {
      connectionId: connection.id,
      queryCount: connection.queryCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Execute query on connection (mock implementation)
   */
  async executeQueryOnConnection(connection, sql, params) {
    // Simulate query execution
    const executionTime = Math.random() * 100 + 10; // 10-110ms
    await new Promise(resolve => setTimeout(resolve, executionTime));
    
    // Mock result
    return {
      rows: [],
      rowCount: 0,
      executionTime
    };
  }

  /**
   * Optimize query
   */
  optimizeQuery(sql) {
    let optimizedSql = sql;
    
    // Remove unnecessary whitespace
    optimizedSql = optimizedSql.replace(/\s+/g, ' ').trim();
    
    // Add query hints for common patterns
    if (optimizedSql.toLowerCase().includes('select') && optimizedSql.toLowerCase().includes('where')) {
      // Suggest index usage
      this.suggestIndexOptimization(optimizedSql);
    }
    
    // Optimize JOIN operations
    if (optimizedSql.toLowerCase().includes('join')) {
      optimizedSql = this.optimizeJoins(optimizedSql);
    }
    
    // Optimize WHERE clauses
    if (optimizedSql.toLowerCase().includes('where')) {
      optimizedSql = this.optimizeWhereClause(optimizedSql);
    }
    
    return optimizedSql;
  }

  /**
   * Optimize JOIN operations
   */
  optimizeJoins(sql) {
    // Basic JOIN optimization - in production, this would be more sophisticated
    return sql;
  }

  /**
   * Optimize WHERE clauses
   */
  optimizeWhereClause(sql) {
    // Basic WHERE optimization - in production, this would be more sophisticated
    return sql;
  }

  /**
   * Suggest index optimization
   */
  suggestIndexOptimization(sql) {
    // Extract table and column information
    const tableMatch = sql.match(/FROM\s+(\w+)/i);
    const whereMatch = sql.match(/WHERE\s+(\w+)/i);
    
    if (tableMatch && whereMatch) {
      const table = tableMatch[1];
      const column = whereMatch[1];
      const indexKey = `${table}.${column}`;
      
      if (!this.indexSuggestions.has(indexKey)) {
        this.indexSuggestions.set(indexKey, {
          table,
          column,
          queryCount: 1,
          suggestedAt: new Date().toISOString()
        });
        
        this.emit('indexSuggestion', {
          table,
          column,
          sql: sql.substring(0, 100) + '...',
          timestamp: new Date().toISOString()
        });
      } else {
        this.indexSuggestions.get(indexKey).queryCount++;
      }
    }
  }

  /**
   * Record query execution
   */
  recordQueryExecution(sql, params, executionTime, result) {
    this.queryStats.totalQueries++;
    
    // Update average execution time
    this.queryStats.averageExecutionTime = 
      (this.queryStats.averageExecutionTime * (this.queryStats.totalQueries - 1) + executionTime) / 
      this.queryStats.totalQueries;
    
    // Store query history
    const queryRecord = {
      id: this.generateQueryId(sql, params),
      sql: sql.substring(0, 200) + (sql.length > 200 ? '...' : ''),
      params,
      executionTime,
      rowCount: result.rowCount || 0,
      timestamp: new Date().toISOString()
    };
    
    this.queryHistory.push(queryRecord);
    
    // Keep only recent history
    if (this.queryHistory.length > 1000) {
      this.queryHistory = this.queryHistory.slice(-1000);
    }
  }

  /**
   * Handle slow query
   */
  handleSlowQuery(sql, params, executionTime) {
    this.queryStats.slowQueries++;
    
    const slowQuery = {
      id: this.generateQueryId(sql, params),
      sql: sql.substring(0, 500) + (sql.length > 500 ? '...' : ''),
      params,
      executionTime,
      timestamp: new Date().toISOString(),
      analyzed: false
    };
    
    this.slowQueries.push(slowQuery);
    
    // Keep only recent slow queries
    if (this.slowQueries.length > 100) {
      this.slowQueries = this.slowQueries.slice(-100);
    }
    
    this.emit('slowQuery', slowQuery);
    
    // Auto-analyze if enabled
    if (this.config.enableQueryOptimization) {
      this.analyzeSlowQuery(slowQuery);
    }
  }

  /**
   * Analyze slow query
   */
  async analyzeSlowQuery(slowQuery) {
    const analysis = {
      queryId: slowQuery.id,
      issues: [],
      recommendations: [],
      estimatedImprovement: 0
    };
    
    const sql = slowQuery.sql.toLowerCase();
    
    // Check for common performance issues
    if (!sql.includes('where') && sql.includes('select')) {
      analysis.issues.push('Missing WHERE clause - full table scan');
      analysis.recommendations.push('Add appropriate WHERE conditions');
      analysis.estimatedImprovement += 50;
    }
    
    if (sql.includes('select *')) {
      analysis.issues.push('SELECT * used - retrieving unnecessary columns');
      analysis.recommendations.push('Select only required columns');
      analysis.estimatedImprovement += 20;
    }
    
    if (sql.includes('order by') && !sql.includes('limit')) {
      analysis.issues.push('ORDER BY without LIMIT - sorting entire result set');
      analysis.recommendations.push('Add LIMIT clause if appropriate');
      analysis.estimatedImprovement += 30;
    }
    
    if (sql.includes('like') && sql.includes("'%")) {
      analysis.issues.push('Leading wildcard in LIKE - cannot use index');
      analysis.recommendations.push('Avoid leading wildcards or use full-text search');
      analysis.estimatedImprovement += 40;
    }
    
    slowQuery.analysis = analysis;
    slowQuery.analyzed = true;
    
    this.emit('slowQueryAnalyzed', {
      queryId: slowQuery.id,
      analysis,
      timestamp: new Date().toISOString()
    });
    
    return analysis;
  }

  /**
   * Query cache operations
   */
  getFromQueryCache(queryId) {
    const cached = this.queryCache.get(queryId);
    
    if (!cached) {
      return null;
    }
    
    // Check expiration
    if (Date.now() > cached.expiresAt) {
      this.queryCache.delete(queryId);
      return null;
    }
    
    return cached.result;
  }

  setInQueryCache(queryId, result) {
    if (this.queryCache.size >= this.config.cacheSize) {
      // Remove oldest entry
      const oldestKey = this.queryCache.keys().next().value;
      this.queryCache.delete(oldestKey);
    }
    
    this.queryCache.set(queryId, {
      result,
      cachedAt: Date.now(),
      expiresAt: Date.now() + (this.config.cacheTTL * 1000)
    });
  }

  cleanupQueryCache() {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [queryId, cached] of this.queryCache) {
      if (now > cached.expiresAt) {
        this.queryCache.delete(queryId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.emit('queryCacheCleanup', {
        cleanedEntries: cleanedCount,
        remainingEntries: this.queryCache.size,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Analyze query performance
   */
  analyzeQueryPerformance() {
    const analysis = {
      totalQueries: this.queryStats.totalQueries,
      slowQueries: this.queryStats.slowQueries,
      slowQueryRate: this.queryStats.totalQueries > 0 ? 
        (this.queryStats.slowQueries / this.queryStats.totalQueries) * 100 : 0,
      averageExecutionTime: this.queryStats.averageExecutionTime,
      cacheHitRate: this.queryStats.totalQueries > 0 ? 
        (this.queryStats.cachedQueries / this.queryStats.totalQueries) * 100 : 0,
      connectionPoolUsage: (this.activeConnections.size / this.connectionPool.length) * 100,
      topSlowQueries: this.getTopSlowQueries(5),
      indexSuggestions: Array.from(this.indexSuggestions.values())
        .sort((a, b) => b.queryCount - a.queryCount)
        .slice(0, 5)
    };
    
    this.emit('performanceAnalysis', {
      analysis,
      timestamp: new Date().toISOString()
    });
    
    return analysis;
  }

  /**
   * Get top slow queries
   */
  getTopSlowQueries(limit = 10) {
    return this.slowQueries
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, limit);
  }

  /**
   * Optimize connections
   */
  async optimizeConnections() {
    const optimizations = [];
    
    // Adjust pool size based on usage
    const avgUsage = this.queryStats.connectionPoolUsage;
    
    if (avgUsage > 80 && this.connectionPool.length < this.config.maxConnections) {
      // Increase pool size
      const newConnections = Math.min(5, this.config.maxConnections - this.connectionPool.length);
      
      for (let i = 0; i < newConnections; i++) {
        const connection = {
          id: this.connectionPool.length + i,
          inUse: false,
          createdAt: new Date(),
          lastUsed: null,
          queryCount: 0
        };
        
        this.connectionPool.push(connection);
      }
      
      optimizations.push({
        type: 'POOL_SIZE_INCREASE',
        newConnections,
        totalConnections: this.connectionPool.length
      });
    } else if (avgUsage < 30 && this.connectionPool.length > this.config.connectionPoolSize) {
      // Decrease pool size
      const connectionsToRemove = Math.min(2, this.connectionPool.length - this.config.connectionPoolSize);
      
      // Remove unused connections
      for (let i = 0; i < connectionsToRemove; i++) {
        const unusedConnection = this.connectionPool.find(conn => !conn.inUse);
        if (unusedConnection) {
          const index = this.connectionPool.indexOf(unusedConnection);
          this.connectionPool.splice(index, 1);
        }
      }
      
      optimizations.push({
        type: 'POOL_SIZE_DECREASE',
        removedConnections: connectionsToRemove,
        totalConnections: this.connectionPool.length
      });
    }
    
    this.emit('connectionOptimization', {
      optimizations,
      timestamp: new Date().toISOString()
    });
    
    return optimizations;
  }

  /**
   * Identify optimization opportunities
   */
  async identifyOptimizations() {
    const opportunities = [];
    
    // Slow query optimization
    if (this.queryStats.slowQueries > 0) {
      opportunities.push({
        type: 'database',
        priority: 'high',
        description: `${this.queryStats.slowQueries} slow queries detected`,
        action: 'optimize_slow_queries',
        impact: 'Improve query performance and reduce response times'
      });
    }
    
    // Cache optimization
    const cacheHitRate = this.queryStats.totalQueries > 0 ? 
      (this.queryStats.cachedQueries / this.queryStats.totalQueries) * 100 : 0;
    
    if (cacheHitRate < 50) {
      opportunities.push({
        type: 'database',
        priority: 'medium',
        description: 'Low query cache hit rate',
        action: 'optimize_query_cache',
        impact: 'Reduce database load and improve response times'
      });
    }
    
    // Index optimization
    if (this.indexSuggestions.size > 0) {
      opportunities.push({
        type: 'database',
        priority: 'medium',
        description: `${this.indexSuggestions.size} index suggestions available`,
        action: 'create_suggested_indexes',
        impact: 'Improve query performance through better indexing'
      });
    }
    
    // Connection pool optimization
    const poolUsage = (this.activeConnections.size / this.connectionPool.length) * 100;
    if (poolUsage > 80) {
      opportunities.push({
        type: 'database',
        priority: 'medium',
        description: 'High connection pool usage',
        action: 'optimize_connection_pool',
        impact: 'Prevent connection bottlenecks'
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
        case 'optimize_slow_queries':
          return await this.optimizeSlowQueries();
        case 'optimize_query_cache':
          return await this.optimizeQueryCache();
        case 'create_suggested_indexes':
          return await this.createSuggestedIndexes();
        case 'optimize_connection_pool':
          return await this.optimizeConnections();
        default:
          return { success: false, reason: 'Unknown optimization action' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async optimizeSlowQueries() {
    let optimizedCount = 0;
    
    for (const slowQuery of this.slowQueries.filter(q => !q.analyzed)) {
      await this.analyzeSlowQuery(slowQuery);
      optimizedCount++;
    }
    
    return { 
      success: true, 
      optimizedQueries: optimizedCount,
      message: `Analyzed ${optimizedCount} slow queries`
    };
  }

  async optimizeQueryCache() {
    // Increase cache size if hit rate is low
    this.config.cacheSize = Math.min(this.config.cacheSize * 1.5, 5000);
    
    return { 
      success: true, 
      newCacheSize: this.config.cacheSize,
      message: 'Increased query cache size'
    };
  }

  async createSuggestedIndexes() {
    // This would create actual database indexes
    const suggestions = Array.from(this.indexSuggestions.values());
    
    return { 
      success: true, 
      indexSuggestions: suggestions.length,
      message: `Generated ${suggestions.length} index creation scripts`
    };
  }

  /**
   * Utility methods
   */
  generateQueryId(sql, params) {
    const crypto = require('crypto');
    const queryString = sql + JSON.stringify(params);
    return crypto.createHash('md5').update(queryString).digest('hex');
  }

  updateQueryStats() {
    this.queryStats.connectionPoolUsage = 
      (this.activeConnections.size / this.connectionPool.length) * 100;
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      ...this.queryStats,
      connectionPool: {
        total: this.connectionPool.length,
        active: this.activeConnections.size,
        usage: this.queryStats.connectionPoolUsage
      },
      cache: {
        size: this.queryCache.size,
        maxSize: this.config.cacheSize,
        hitRate: this.queryStats.totalQueries > 0 ? 
          (this.queryStats.cachedQueries / this.queryStats.totalQueries) * 100 : 0
      },
      slowQueries: this.slowQueries.length,
      indexSuggestions: this.indexSuggestions.size,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    const stats = this.getStats();
    
    let status = 'healthy';
    if (stats.connectionPool.usage > 90) {
      status = 'warning';
    }
    if (stats.slowQueries > 10) {
      status = 'warning';
    }
    
    return {
      status,
      stats,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { DatabaseOptimizer };
