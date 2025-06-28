/**
 * PostgreSQL Query Analyzer
 * 
 * Analyzes SQL queries and execution plans to identify performance bottlenecks
 * and provide optimization recommendations.
 */

const { logger } = require('../utils/logger');
const { IndexRecommender } = require('./index-recommender');

class QueryAnalyzer {
  /**
   * Create a new Query Analyzer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      slowQueryThreshold: 100, // ms
      verySlowQueryThreshold: 1000, // ms
      ...options
    };
    
    this.indexRecommender = new IndexRecommender();
    logger.info('PostgreSQL Query Analyzer initialized');
  }

  /**
   * Analyze a query and its execution plan
   * @param {string} query - SQL query
   * @param {Object} executionPlan - Query execution plan
   * @param {number} executionTime - Query execution time in ms
   * @returns {Object} Analysis results
   */
  analyze(query, executionPlan, executionTime) {
    try {
      logger.debug('Analyzing query', { query, executionTime });
      
      // Basic query classification
      const queryType = this.classifyQuery(query);
      const complexity = this.assessComplexity(query, executionPlan);
      
      // Performance assessment
      const performanceCategory = this.categorizePerformance(executionTime);
      const bottlenecks = this.identifyBottlenecks(executionPlan);
      
      // Generate recommendations
      const indexRecommendations = this.indexRecommender.recommend(query, executionPlan);
      const queryRecommendations = this.generateQueryRecommendations(query, executionPlan, bottlenecks);
      const schemaRecommendations = this.generateSchemaRecommendations(query, executionPlan);
      
      return {
        queryType,
        complexity,
        performance: {
          executionTime,
          category: performanceCategory,
          bottlenecks
        },
        recommendations: {
          indexes: indexRecommendations,
          query: queryRecommendations,
          schema: schemaRecommendations
        },
        summary: this.generateSummary(
          queryType, 
          complexity, 
          performanceCategory, 
          bottlenecks, 
          indexRecommendations, 
          queryRecommendations, 
          schemaRecommendations
        )
      };
    } catch (error) {
      logger.error('Error analyzing query:', error);
      return {
        error: 'Failed to analyze query',
        details: error.message
      };
    }
  }

  /**
   * Classify the query type
   * @param {string} query - SQL query
   * @returns {string} Query type
   */
  classifyQuery(query) {
    const normalizedQuery = query.trim().toUpperCase();
    
    if (normalizedQuery.startsWith('SELECT')) {
      if (normalizedQuery.includes('JOIN')) {
        return 'SELECT_JOIN';
      } else {
        return 'SELECT';
      }
    } else if (normalizedQuery.startsWith('INSERT')) {
      return 'INSERT';
    } else if (normalizedQuery.startsWith('UPDATE')) {
      return 'UPDATE';
    } else if (normalizedQuery.startsWith('DELETE')) {
      return 'DELETE';
    } else {
      return 'OTHER';
    }
  }

  /**
   * Assess query complexity
   * @param {string} query - SQL query
   * @param {Object} executionPlan - Query execution plan
   * @returns {string} Complexity level
   */
  assessComplexity(query, executionPlan) {
    // Count joins
    const joinCount = (query.match(/JOIN/gi) || []).length;
    
    // Count tables
    const tableCount = (query.match(/FROM\s+\w+/gi) || []).length + joinCount;
    
    // Count conditions
    const whereConditions = (query.match(/WHERE/gi) || []).length;
    const andConditions = (query.match(/AND/gi) || []).length;
    const orConditions = (query.match(/OR/gi) || []).length;
    const conditionCount = whereConditions + andConditions + orConditions;
    
    // Count aggregations
    const aggregations = (query.match(/SUM|AVG|COUNT|MIN|MAX/gi) || []).length;
    
    // Count subqueries
    const subqueries = (query.match(/\(SELECT/gi) || []).length;
    
    // Calculate complexity score
    const complexityScore = 
      tableCount * 2 + 
      conditionCount * 1.5 + 
      aggregations * 2 + 
      subqueries * 3;
    
    // Determine complexity level
    if (complexityScore >= 15) {
      return 'HIGH';
    } else if (complexityScore >= 7) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  /**
   * Categorize query performance
   * @param {number} executionTime - Query execution time in ms
   * @returns {string} Performance category
   */
  categorizePerformance(executionTime) {
    if (executionTime >= this.options.verySlowQueryThreshold) {
      return 'VERY_SLOW';
    } else if (executionTime >= this.options.slowQueryThreshold) {
      return 'SLOW';
    } else {
      return 'ACCEPTABLE';
    }
  }

  /**
   * Identify bottlenecks in the execution plan
   * @param {Object} executionPlan - Query execution plan
   * @returns {Array} Identified bottlenecks
   */
  identifyBottlenecks(executionPlan) {
    const bottlenecks = [];
    
    if (!executionPlan || !executionPlan.plan) {
      return bottlenecks;
    }
    
    const plan = executionPlan.plan;
    
    // Check for sequential scans
    const seqScans = this.findNodesOfType(plan, 'Seq Scan');
    for (const scan of seqScans) {
      if (scan.rows > 1000) {
        bottlenecks.push({
          type: 'SEQUENTIAL_SCAN',
          table: scan.relation_name,
          cost: scan.total_cost,
          rows: scan.rows,
          impact: 'HIGH',
          description: `Sequential scan on table ${scan.relation_name} processing ${scan.rows} rows`
        });
      }
    }
    
    // Check for expensive sorts
    const sorts = this.findNodesOfType(plan, 'Sort');
    for (const sort of sorts) {
      if (sort.total_cost > 1000) {
        bottlenecks.push({
          type: 'EXPENSIVE_SORT',
          cost: sort.total_cost,
          rows: sort.rows,
          impact: 'MEDIUM',
          description: `Expensive sort operation processing ${sort.rows} rows`
        });
      }
    }
    
    // Check for hash joins with high costs
    const hashJoins = this.findNodesOfType(plan, 'Hash Join');
    for (const join of hashJoins) {
      if (join.total_cost > 5000) {
        bottlenecks.push({
          type: 'EXPENSIVE_HASH_JOIN',
          cost: join.total_cost,
          rows: join.rows,
          impact: 'HIGH',
          description: `Expensive hash join operation processing ${join.rows} rows`
        });
      }
    }
    
    // Check for nested loops with high iteration counts
    const nestedLoops = this.findNodesOfType(plan, 'Nested Loop');
    for (const loop of nestedLoops) {
      if (loop.rows > 10000) {
        bottlenecks.push({
          type: 'EXPENSIVE_NESTED_LOOP',
          cost: loop.total_cost,
          rows: loop.rows,
          impact: 'HIGH',
          description: `Expensive nested loop operation processing ${loop.rows} rows`
        });
      }
    }
    
    // Check for temporary file usage
    if (this.planUsesTemporaryFiles(plan)) {
      bottlenecks.push({
        type: 'TEMPORARY_FILES',
        impact: 'HIGH',
        description: 'Query is using temporary files for processing, indicating memory constraints'
      });
    }
    
    return bottlenecks;
  }

  /**
   * Find nodes of a specific type in the execution plan
   * @param {Object} plan - Execution plan
   * @param {string} nodeType - Node type to find
   * @returns {Array} Matching nodes
   */
  findNodesOfType(plan, nodeType) {
    const nodes = [];
    
    const traverse = (node) => {
      if (node.node_type === nodeType) {
        nodes.push(node);
      }
      
      if (node.plans) {
        for (const childNode of node.plans) {
          traverse(childNode);
        }
      }
    };
    
    traverse(plan);
    return nodes;
  }

  /**
   * Check if the plan uses temporary files
   * @param {Object} plan - Execution plan
   * @returns {boolean} True if temporary files are used
   */
  planUsesTemporaryFiles(plan) {
    // Look for indicators of temporary file usage
    let usesTemporaryFiles = false;
    
    const traverse = (node) => {
      // Check for explicit mentions of temporary files
      if (node.node_type && (
        node.node_type.includes('Materialize') ||
        node.node_type.includes('Sort') && node.sort_method === 'external'
      )) {
        usesTemporaryFiles = true;
      }
      
      // Check for other indicators in node properties
      if (node.sort_space_used || node.sort_space_memory) {
        usesTemporaryFiles = true;
      }
      
      if (node.plans) {
        for (const childNode of node.plans) {
          traverse(childNode);
        }
      }
    };
    
    traverse(plan);
    return usesTemporaryFiles;
  }

  /**
   * Generate query optimization recommendations
   * @param {string} query - SQL query
   * @param {Object} executionPlan - Query execution plan
   * @param {Array} bottlenecks - Identified bottlenecks
   * @returns {Array} Query recommendations
   */
  generateQueryRecommendations(query, executionPlan, bottlenecks) {
    const recommendations = [];
    
    // Check for DISTINCT that could be replaced with GROUP BY
    if (query.toUpperCase().includes('DISTINCT') && !query.toUpperCase().includes('GROUP BY')) {
      recommendations.push({
        type: 'REPLACE_DISTINCT',
        impact: 'MEDIUM',
        description: 'Consider replacing DISTINCT with GROUP BY for better performance',
        example: 'Replace "SELECT DISTINCT col1, col2 FROM table" with "SELECT col1, col2 FROM table GROUP BY col1, col2"'
      });
    }
    
    // Check for SELECT * usage
    if (query.toUpperCase().includes('SELECT *')) {
      recommendations.push({
        type: 'AVOID_SELECT_STAR',
        impact: 'LOW',
        description: 'Avoid using SELECT * and specify only needed columns',
        example: 'Replace "SELECT * FROM table" with "SELECT col1, col2 FROM table"'
      });
    }
    
    // Check for subqueries that could be joins
    if (query.toUpperCase().includes('WHERE') && query.toUpperCase().includes('(SELECT')) {
      recommendations.push({
        type: 'SUBQUERY_TO_JOIN',
        impact: 'HIGH',
        description: 'Consider replacing subqueries with JOINs for better performance',
        example: 'Replace "WHERE col IN (SELECT col FROM table2)" with "JOIN table2 ON table1.col = table2.col"'
      });
    }
    
    // Check for multiple conditions on the same column
    if ((query.match(/AND\s+(\w+)\s*=/gi) || []).length > 1) {
      recommendations.push({
        type: 'COMBINE_CONDITIONS',
        impact: 'LOW',
        description: 'Consider combining multiple conditions on the same column',
        example: 'Replace "WHERE col = 1 OR col = 2" with "WHERE col IN (1, 2)"'
      });
    }
    
    // Recommendations based on bottlenecks
    for (const bottleneck of bottlenecks) {
      if (bottleneck.type === 'SEQUENTIAL_SCAN') {
        recommendations.push({
          type: 'ADD_WHERE_CLAUSE',
          impact: 'HIGH',
          description: `Add WHERE clause to limit rows scanned on table ${bottleneck.table}`,
          example: 'Add appropriate WHERE conditions to filter rows early'
        });
      }
      
      if (bottleneck.type === 'EXPENSIVE_SORT') {
        recommendations.push({
          type: 'LIMIT_SORTED_ROWS',
          impact: 'MEDIUM',
          description: 'Add LIMIT clause to reduce the number of rows that need sorting',
          example: 'Add "LIMIT 100" to queries that don\'t need all results'
        });
      }
      
      if (bottleneck.type === 'TEMPORARY_FILES') {
        recommendations.push({
          type: 'SIMPLIFY_QUERY',
          impact: 'HIGH',
          description: 'Simplify query to reduce memory usage or split into smaller queries',
          example: 'Break complex query into multiple simpler queries'
        });
      }
    }
    
    return recommendations;
  }

  /**
   * Generate schema optimization recommendations
   * @param {string} query - SQL query
   * @param {Object} executionPlan - Query execution plan
   * @returns {Array} Schema recommendations
   */
  generateSchemaRecommendations(query, executionPlan) {
    const recommendations = [];
    
    // Check for potential denormalization opportunities
    if (query.toUpperCase().includes('JOIN') && 
        (query.toUpperCase().includes('GROUP BY') || query.toUpperCase().includes('SUM('))) {
      recommendations.push({
        type: 'CONSIDER_DENORMALIZATION',
        impact: 'MEDIUM',
        description: 'Consider denormalizing frequently joined tables for analytical queries',
        details: 'Create materialized views or summary tables for common analytical patterns'
      });
    }
    
    // Check for potential partitioning opportunities
    if (query.toUpperCase().includes('WHERE') && 
        (query.toUpperCase().includes('DATE') || query.toUpperCase().includes('TIMESTAMP'))) {
      recommendations.push({
        type: 'CONSIDER_PARTITIONING',
        impact: 'HIGH',
        description: 'Consider table partitioning for time-series data',
        details: 'Partition large tables by date ranges to improve query performance'
      });
    }
    
    // Check for potential materialized view opportunities
    if (query.toUpperCase().includes('GROUP BY') && query.toUpperCase().includes('JOIN')) {
      recommendations.push({
        type: 'CONSIDER_MATERIALIZED_VIEW',
        impact: 'HIGH',
        description: 'Consider creating a materialized view for this complex aggregation query',
        details: 'Precompute and store results of complex aggregations in materialized views'
      });
    }
    
    return recommendations;
  }

  /**
   * Generate a summary of the analysis
   * @param {string} queryType - Query type
   * @param {string} complexity - Query complexity
   * @param {string} performanceCategory - Performance category
   * @param {Array} bottlenecks - Identified bottlenecks
   * @param {Array} indexRecommendations - Index recommendations
   * @param {Array} queryRecommendations - Query recommendations
   * @param {Array} schemaRecommendations - Schema recommendations
   * @returns {string} Analysis summary
   */
  generateSummary(
    queryType, 
    complexity, 
    performanceCategory, 
    bottlenecks, 
    indexRecommendations, 
    queryRecommendations, 
    schemaRecommendations
  ) {
    let summary = `This is a ${complexity.toLowerCase()} complexity ${queryType.toLowerCase()} query with ${performanceCategory.toLowerCase()} performance. `;
    
    if (bottlenecks.length > 0) {
      summary += `Found ${bottlenecks.length} performance bottlenecks. `;
      
      const highImpactBottlenecks = bottlenecks.filter(b => b.impact === 'HIGH').length;
      if (highImpactBottlenecks > 0) {
        summary += `${highImpactBottlenecks} high-impact issues identified. `;
      }
    } else {
      summary += 'No significant bottlenecks identified. ';
    }
    
    const totalRecommendations = 
      indexRecommendations.length + 
      queryRecommendations.length + 
      schemaRecommendations.length;
    
    if (totalRecommendations > 0) {
      summary += `${totalRecommendations} optimization recommendations available: `;
      
      if (indexRecommendations.length > 0) {
        summary += `${indexRecommendations.length} index recommendations, `;
      }
      
      if (queryRecommendations.length > 0) {
        summary += `${queryRecommendations.length} query structure recommendations, `;
      }
      
      if (schemaRecommendations.length > 0) {
        summary += `${schemaRecommendations.length} schema recommendations, `;
      }
      
      // Remove trailing comma and space
      summary = summary.replace(/, $/, '. ');
    } else {
      summary += 'No specific optimization recommendations. ';
    }
    
    // Add estimated improvement if we have recommendations
    if (totalRecommendations > 0) {
      let estimatedImprovement = 0;
      
      if (indexRecommendations.length > 0) {
        const avgIndexImprovement = indexRecommendations.reduce(
          (sum, rec) => sum + (rec.estimatedImprovement || 0), 
          0
        ) / indexRecommendations.length;
        
        estimatedImprovement = Math.max(estimatedImprovement, avgIndexImprovement);
      }
      
      if (estimatedImprovement > 0) {
        summary += `Implementing these recommendations could improve performance by approximately ${Math.round(estimatedImprovement)}%.`;
      }
    }
    
    return summary;
  }
}

module.exports = { QueryAnalyzer };
