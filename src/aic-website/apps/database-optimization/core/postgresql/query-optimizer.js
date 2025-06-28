/**
 * PostgreSQL Query Optimizer
 * 
 * Advanced query optimization for PostgreSQL databases with automatic
 * query analysis, index recommendations, and performance tuning.
 */

const { Pool } = require('pg');
const { performance } = require('perf_hooks');
const { logger } = require('../utils/logger');
const { QueryAnalyzer } = require('./query-analyzer');
const { IndexRecommender } = require('./index-recommender');
const { QueryCache } = require('../cache/query-cache');

class PostgreSQLQueryOptimizer {
  /**
   * Create a new PostgreSQL Query Optimizer
   * @param {Object} config - Configuration options
   * @param {string} config.connectionString - PostgreSQL connection string
   * @param {number} config.minPoolSize - Minimum pool size (default: 5)
   * @param {number} config.maxPoolSize - Maximum pool size (default: 20)
   * @param {number} config.idleTimeoutMillis - Connection idle timeout (default: 30000)
   * @param {boolean} config.enableQueryCache - Enable query caching (default: true)
   * @param {number} config.queryCacheTTL - Query cache TTL in ms (default: 60000)
   */
  constructor(config) {
    this.config = {
      minPoolSize: 5,
      maxPoolSize: 20,
      idleTimeoutMillis: 30000,
      enableQueryCache: true,
      queryCacheTTL: 60000,
      ...config
    };

    this.pool = new Pool({
      connectionString: this.config.connectionString,
      min: this.config.minPoolSize,
      max: this.config.maxPoolSize,
      idleTimeoutMillis: this.config.idleTimeoutMillis,
      ssl: this.config.ssl || false
    });

    this.queryAnalyzer = new QueryAnalyzer();
    this.indexRecommender = new IndexRecommender();
    this.queryCache = new QueryCache({
      enabled: this.config.enableQueryCache,
      ttl: this.config.queryCacheTTL
    });

    this.setupEventHandlers();
    
    logger.info('PostgreSQL Query Optimizer initialized');
  }

  /**
   * Set up event handlers for the connection pool
   */
  setupEventHandlers() {
    this.pool.on('connect', (client) => {
      logger.debug('New PostgreSQL client connected');
    });

    this.pool.on('error', (err, client) => {
      logger.error('PostgreSQL pool error:', err);
    });

    this.pool.on('acquire', (client) => {
      logger.debug('PostgreSQL client acquired from pool');
    });

    this.pool.on('remove', (client) => {
      logger.debug('PostgreSQL client removed from pool');
    });
  }

  /**
   * Execute an optimized query
   * @param {string} query - SQL query to execute
   * @param {Array} params - Query parameters
   * @param {Object} options - Query options
   * @param {boolean} options.useCache - Use query cache (default: true)
   * @param {boolean} options.analyze - Analyze query (default: true)
   * @param {boolean} options.recommend - Recommend indexes (default: true)
   * @returns {Promise<Object>} Query results and performance metrics
   */
  async executeOptimizedQuery(query, params = [], options = {}) {
    const opts = {
      useCache: true,
      analyze: true,
      recommend: true,
      ...options
    };

    const startTime = performance.now();
    let result;
    let queryPlan;
    let indexRecommendations = [];
    let cacheHit = false;

    try {
      // Check cache if enabled
      if (opts.useCache && this.config.enableQueryCache) {
        const cachedResult = await this.queryCache.get(query, params);
        if (cachedResult) {
          result = cachedResult;
          cacheHit = true;
          logger.debug('Query cache hit');
        }
      }

      // Execute query if not in cache
      if (!result) {
        // Analyze query if enabled
        if (opts.analyze) {
          queryPlan = await this.analyzeQuery(query, params);
        }

        // Execute the actual query
        const client = await this.pool.connect();
        try {
          result = await client.query(query, params);
          
          // Cache the result if caching is enabled
          if (opts.useCache && this.config.enableQueryCache) {
            await this.queryCache.set(query, params, result);
          }
        } finally {
          client.release();
        }

        // Generate index recommendations if enabled
        if (opts.recommend) {
          indexRecommendations = await this.recommendIndexes(query, queryPlan);
        }
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      // Log slow queries
      if (executionTime > 1000) {
        logger.warn(`Slow query detected (${executionTime.toFixed(2)}ms): ${query}`);
      }

      return {
        result,
        performance: {
          executionTime,
          cacheHit,
          queryPlan: queryPlan || null,
        },
        recommendations: indexRecommendations,
      };
    } catch (error) {
      logger.error('Error executing optimized query:', error);
      throw error;
    }
  }

  /**
   * Analyze a query to get execution plan
   * @param {string} query - SQL query to analyze
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query execution plan
   */
  async analyzeQuery(query, params = []) {
    try {
      const client = await this.pool.connect();
      try {
        // Use EXPLAIN ANALYZE to get query plan
        const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
        const explainResult = await client.query(explainQuery, params);
        const queryPlan = explainResult.rows[0]['QUERY PLAN'][0];
        
        // Analyze the query plan
        const analysis = this.queryAnalyzer.analyze(queryPlan);
        
        return {
          plan: queryPlan,
          analysis
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error analyzing query:', error);
      return null;
    }
  }

  /**
   * Get index recommendations for a query
   * @param {string} query - SQL query
   * @param {Object} queryPlan - Query execution plan
   * @returns {Promise<Array>} Index recommendations
   */
  async recommendIndexes(query, queryPlan) {
    if (!queryPlan) return [];
    
    try {
      return this.indexRecommender.recommend(query, queryPlan);
    } catch (error) {
      logger.error('Error recommending indexes:', error);
      return [];
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getDatabaseStats() {
    try {
      const client = await this.pool.connect();
      try {
        // Get table statistics
        const tableStatsQuery = `
          SELECT
            schemaname,
            relname as table_name,
            n_live_tup as row_count,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_autovacuum,
            last_analyze,
            last_autoanalyze
          FROM pg_stat_user_tables
          ORDER BY n_live_tup DESC;
        `;
        const tableStats = await client.query(tableStatsQuery);
        
        // Get index statistics
        const indexStatsQuery = `
          SELECT
            schemaname,
            relname as table_name,
            indexrelname as index_name,
            idx_scan as index_scans,
            idx_tup_read as tuples_read,
            idx_tup_fetch as tuples_fetched
          FROM pg_stat_user_indexes
          ORDER BY idx_scan DESC;
        `;
        const indexStats = await client.query(indexStatsQuery);
        
        // Get database size
        const dbSizeQuery = `
          SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
        `;
        const dbSize = await client.query(dbSizeQuery);
        
        // Get connection stats
        const connectionStatsQuery = `
          SELECT 
            max_conn,
            used,
            res_for_super,
            max_conn - used - res_for_super as available
          FROM 
            (SELECT count(*) used FROM pg_stat_activity) t1,
            (SELECT setting::int res_for_super FROM pg_settings WHERE name='superuser_reserved_connections') t2,
            (SELECT setting::int max_conn FROM pg_settings WHERE name='max_connections') t3;
        `;
        const connectionStats = await client.query(connectionStatsQuery);
        
        return {
          tables: tableStats.rows,
          indexes: indexStats.rows,
          dbSize: dbSize.rows[0].db_size,
          connections: connectionStats.rows[0],
          timestamp: new Date().toISOString()
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error getting database stats:', error);
      throw error;
    }
  }

  /**
   * Optimize a specific table
   * @param {string} tableName - Table name to optimize
   * @returns {Promise<Object>} Optimization results
   */
  async optimizeTable(tableName) {
    try {
      const client = await this.pool.connect();
      try {
        // Run VACUUM ANALYZE on the table
        await client.query(`VACUUM ANALYZE ${tableName};`);
        
        // Get table statistics before and after
        const tableStatsQuery = `
          SELECT
            n_live_tup as row_count,
            n_dead_tup as dead_tuples,
            last_vacuum,
            last_analyze
          FROM pg_stat_user_tables
          WHERE relname = $1;
        `;
        const tableStats = await client.query(tableStatsQuery, [tableName]);
        
        // Get unused indexes
        const unusedIndexesQuery = `
          SELECT
            indexrelname as index_name,
            idx_scan as index_scans,
            pg_size_pretty(pg_relation_size(indexrelid)) as index_size
          FROM pg_stat_user_indexes
          WHERE relname = $1 AND idx_scan = 0
          ORDER BY pg_relation_size(indexrelid) DESC;
        `;
        const unusedIndexes = await client.query(unusedIndexesQuery, [tableName]);
        
        return {
          table: tableName,
          stats: tableStats.rows[0],
          unusedIndexes: unusedIndexes.rows,
          optimizationTime: new Date().toISOString(),
          recommendations: unusedIndexes.rows.length > 0 ? 
            'Consider dropping unused indexes to improve write performance and reduce storage' : 
            'No unused indexes found'
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`Error optimizing table ${tableName}:`, error);
      throw error;
    }
  }

  /**
   * Create an index based on recommendations
   * @param {string} tableName - Table name
   * @param {string} columnName - Column name
   * @param {string} indexType - Index type (btree, hash, gin, gist)
   * @returns {Promise<Object>} Result of index creation
   */
  async createRecommendedIndex(tableName, columnName, indexType = 'btree') {
    try {
      const client = await this.pool.connect();
      try {
        const indexName = `idx_${tableName}_${columnName}`;
        const createIndexQuery = `CREATE INDEX ${indexName} ON ${tableName} USING ${indexType} (${columnName});`;
        
        // Measure time to create index
        const startTime = performance.now();
        await client.query(createIndexQuery);
        const endTime = performance.now();
        
        return {
          success: true,
          tableName,
          columnName,
          indexName,
          indexType,
          creationTime: endTime - startTime,
          timestamp: new Date().toISOString()
        };
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error(`Error creating index on ${tableName}(${columnName}):`, error);
      throw error;
    }
  }

  /**
   * Close the connection pool
   */
  async close() {
    try {
      await this.pool.end();
      logger.info('PostgreSQL connection pool closed');
    } catch (error) {
      logger.error('Error closing PostgreSQL connection pool:', error);
      throw error;
    }
  }
}

module.exports = { PostgreSQLQueryOptimizer };
