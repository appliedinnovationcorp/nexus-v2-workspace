/**
 * PostgreSQL Index Recommender
 * 
 * Analyzes query execution plans and recommends optimal indexes
 * to improve query performance.
 */

const { logger } = require('../utils/logger');

class IndexRecommender {
  /**
   * Create a new Index Recommender
   */
  constructor() {
    this.indexTypes = {
      equality: 'btree',
      range: 'btree',
      like: 'btree',
      fullText: 'gin',
      jsonb: 'gin',
      array: 'gin',
      spatial: 'gist',
      hash: 'hash'
    };
    
    logger.info('PostgreSQL Index Recommender initialized');
  }

  /**
   * Recommend indexes based on query and execution plan
   * @param {string} query - SQL query
   * @param {Object} queryPlan - Query execution plan
   * @returns {Array} Index recommendations
   */
  recommend(query, queryPlan) {
    if (!queryPlan || !queryPlan.plan) {
      return [];
    }

    try {
      const recommendations = [];
      
      // Extract tables and conditions from the query plan
      const tables = this.extractTables(queryPlan.plan);
      const scanNodes = this.findScanNodes(queryPlan.plan);
      
      // Analyze each scan node
      for (const node of scanNodes) {
        const tableName = node.relation_name || '';
        
        if (!tableName) continue;
        
        // Check if this is a sequential scan (potential for optimization)
        if (node.node_type === 'Seq Scan') {
          // Extract filter conditions
          const filterConditions = this.extractFilterConditions(node);
          
          // Generate recommendations based on filter conditions
          for (const condition of filterConditions) {
            const columnName = condition.column;
            const operationType = condition.operation;
            const indexType = this.determineIndexType(operationType);
            
            // Check if this is a good candidate for indexing
            if (this.isGoodIndexCandidate(node, condition)) {
              recommendations.push({
                tableName,
                columnName,
                indexType,
                operation: operationType,
                estimatedImprovement: this.estimateImprovement(node),
                reason: `Sequential scan on ${tableName} with filter on ${columnName} could benefit from a ${indexType} index`,
                priority: this.calculatePriority(node)
              });
            }
          }
        }
        
        // Check for inefficient joins
        if (node.node_type === 'Hash Join' || node.node_type === 'Nested Loop') {
          const joinConditions = this.extractJoinConditions(node);
          
          for (const condition of joinConditions) {
            recommendations.push({
              tableName: condition.rightTable,
              columnName: condition.rightColumn,
              indexType: 'btree',
              operation: 'join',
              estimatedImprovement: this.estimateImprovement(node),
              reason: `Join between ${condition.leftTable} and ${condition.rightTable} could benefit from an index on ${condition.rightTable}.${condition.rightColumn}`,
              priority: this.calculatePriority(node)
            });
          }
        }
        
        // Check for sort operations
        if (node.node_type === 'Sort') {
          const sortKeys = this.extractSortKeys(node);
          
          for (const key of sortKeys) {
            recommendations.push({
              tableName: key.table,
              columnName: key.column,
              indexType: 'btree',
              operation: 'sort',
              estimatedImprovement: this.estimateImprovement(node),
              reason: `Sort operation on ${key.table}.${key.column} could benefit from an index`,
              priority: this.calculatePriority(node)
            });
          }
        }
      }
      
      // Remove duplicates and sort by priority
      return this.prioritizeRecommendations(recommendations);
    } catch (error) {
      logger.error('Error generating index recommendations:', error);
      return [];
    }
  }

  /**
   * Extract tables from query plan
   * @param {Object} plan - Query plan
   * @returns {Array} Tables
   */
  extractTables(plan) {
    const tables = [];
    
    const traverse = (node) => {
      if (node.relation_name && !tables.includes(node.relation_name)) {
        tables.push(node.relation_name);
      }
      
      if (node.plans) {
        for (const childNode of node.plans) {
          traverse(childNode);
        }
      }
    };
    
    traverse(plan);
    return tables;
  }

  /**
   * Find all scan nodes in the query plan
   * @param {Object} plan - Query plan
   * @returns {Array} Scan nodes
   */
  findScanNodes(plan) {
    const scanNodes = [];
    
    const traverse = (node) => {
      if (node.node_type && (
        node.node_type.includes('Scan') || 
        node.node_type.includes('Join') || 
        node.node_type === 'Sort'
      )) {
        scanNodes.push(node);
      }
      
      if (node.plans) {
        for (const childNode of node.plans) {
          traverse(childNode);
        }
      }
    };
    
    traverse(plan);
    return scanNodes;
  }

  /**
   * Extract filter conditions from a scan node
   * @param {Object} node - Scan node
   * @returns {Array} Filter conditions
   */
  extractFilterConditions(node) {
    const conditions = [];
    
    if (node.filter) {
      // Parse filter expression
      const filterExpr = node.filter;
      
      // Simple parsing for common filter patterns
      // In a real implementation, this would use a proper SQL parser
      const columnMatches = filterExpr.match(/\b(\w+)\s*(=|>|<|>=|<=|LIKE|IN)\s*/g);
      
      if (columnMatches) {
        for (const match of columnMatches) {
          const parts = match.trim().split(/\s+/);
          if (parts.length >= 2) {
            conditions.push({
              column: parts[0],
              operation: parts[1]
            });
          }
        }
      }
    }
    
    return conditions;
  }

  /**
   * Extract join conditions from a join node
   * @param {Object} node - Join node
   * @returns {Array} Join conditions
   */
  extractJoinConditions(node) {
    const conditions = [];
    
    if (node.hash_cond || node.join_cond) {
      const joinCond = node.hash_cond || node.join_cond;
      
      // Simple parsing for join conditions
      // In a real implementation, this would use a proper SQL parser
      const matches = joinCond.match(/\((\w+)\.(\w+)\) = \((\w+)\.(\w+)\)/);
      
      if (matches && matches.length === 5) {
        conditions.push({
          leftTable: matches[1],
          leftColumn: matches[2],
          rightTable: matches[3],
          rightColumn: matches[4]
        });
      }
    }
    
    return conditions;
  }

  /**
   * Extract sort keys from a sort node
   * @param {Object} node - Sort node
   * @returns {Array} Sort keys
   */
  extractSortKeys(node) {
    const sortKeys = [];
    
    if (node.sort_key) {
      for (const key of node.sort_key) {
        // In a real implementation, we would need to trace back to find the table
        // This is a simplified version
        const tableName = this.guessTableFromSortKey(key, node);
        
        sortKeys.push({
          table: tableName,
          column: key
        });
      }
    }
    
    return sortKeys;
  }

  /**
   * Guess table name from sort key
   * @param {string} key - Sort key
   * @param {Object} node - Sort node
   * @returns {string} Table name
   */
  guessTableFromSortKey(key, node) {
    // This is a simplified implementation
    // In a real system, we would trace back through the plan
    
    // Check child nodes for table names
    if (node.plans && node.plans.length > 0) {
      for (const childNode of node.plans) {
        if (childNode.relation_name) {
          return childNode.relation_name;
        }
      }
    }
    
    return 'unknown_table';
  }

  /**
   * Determine the appropriate index type based on operation
   * @param {string} operation - SQL operation
   * @returns {string} Index type
   */
  determineIndexType(operation) {
    switch (operation) {
      case '=':
        return this.indexTypes.equality;
      case '>':
      case '<':
      case '>=':
      case '<=':
        return this.indexTypes.range;
      case 'LIKE':
        return this.indexTypes.like;
      case 'IN':
        return this.indexTypes.equality;
      default:
        return this.indexTypes.equality;
    }
  }

  /**
   * Check if a column is a good candidate for indexing
   * @param {Object} node - Scan node
   * @param {Object} condition - Filter condition
   * @returns {boolean} Is good candidate
   */
  isGoodIndexCandidate(node, condition) {
    // Check if the scan is expensive enough to warrant an index
    const isExpensiveScan = node.total_cost > 1000 || node.rows > 1000;
    
    // Check if the filter has good selectivity
    // In a real implementation, we would use table statistics
    const hasGoodSelectivity = true;
    
    return isExpensiveScan && hasGoodSelectivity;
  }

  /**
   * Estimate the improvement from adding an index
   * @param {Object} node - Scan node
   * @returns {number} Estimated improvement percentage
   */
  estimateImprovement(node) {
    // In a real implementation, this would use a cost model
    // This is a simplified version
    
    if (node.node_type === 'Seq Scan') {
      // Sequential scans can often be improved by 90%+ with proper indexing
      return 90;
    } else if (node.node_type === 'Hash Join' || node.node_type === 'Nested Loop') {
      // Joins can often be improved by 50-80%
      return 70;
    } else if (node.node_type === 'Sort') {
      // Sorts can often be improved by 40-60%
      return 50;
    }
    
    return 30; // Default improvement estimate
  }

  /**
   * Calculate priority for a recommendation
   * @param {Object} node - Scan node
   * @returns {number} Priority (1-10, 10 being highest)
   */
  calculatePriority(node) {
    // In a real implementation, this would use a more sophisticated model
    // This is a simplified version
    
    const cost = node.total_cost || 0;
    const rows = node.rows || 0;
    
    if (cost > 10000 || rows > 100000) {
      return 10; // Highest priority
    } else if (cost > 1000 || rows > 10000) {
      return 8;
    } else if (cost > 100 || rows > 1000) {
      return 5;
    }
    
    return 3; // Lower priority
  }

  /**
   * Prioritize and deduplicate recommendations
   * @param {Array} recommendations - Index recommendations
   * @returns {Array} Prioritized recommendations
   */
  prioritizeRecommendations(recommendations) {
    // Remove duplicates
    const uniqueRecommendations = [];
    const seen = new Set();
    
    for (const rec of recommendations) {
      const key = `${rec.tableName}:${rec.columnName}:${rec.indexType}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRecommendations.push(rec);
      }
    }
    
    // Sort by priority (descending)
    return uniqueRecommendations.sort((a, b) => b.priority - a.priority);
  }
}

module.exports = { IndexRecommender };
