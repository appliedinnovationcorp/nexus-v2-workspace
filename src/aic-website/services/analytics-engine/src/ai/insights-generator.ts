/**
 * AI-Powered Insights Generator
 * Generates intelligent business insights using AI/ML models
 */

import { EventEmitter } from 'events';
import { Logger } from 'winston';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { 
  InsightItem, 
  AnalyticsConfig,
  AnalyticsError,
  MetricValue 
} from '../types';
import { DataAnalyzer } from './data-analyzer';
import { PatternDetector } from './pattern-detector';
import { AnomalyDetector } from './anomaly-detector';
import { PredictionEngine } from './prediction-engine';
import { InsightCache } from '../utils/insight-cache';

export class InsightsGenerator extends EventEmitter {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private dataAnalyzer: DataAnalyzer;
  private patternDetector: PatternDetector;
  private anomalyDetector: AnomalyDetector;
  private predictionEngine: PredictionEngine;
  private insightCache: InsightCache;
  private isRunning: boolean = false;
  private generationQueue: Array<{
    id: string;
    dataSource: string;
    options: any;
    resolve: (insights: InsightItem[]) => void;
    reject: (error: Error) => void;
  }> = [];
  private processingInterval: NodeJS.Timeout;
  private stats = {
    generated: 0,
    cached: 0,
    errors: 0,
    avgGenerationTime: 0
  };

  constructor(
    private config: AnalyticsConfig,
    private logger: Logger
  ) {
    super();
    this.initializeAIProviders();
    this.initializeComponents();
  }

  /**
   * Initialize AI providers
   */
  private initializeAIProviders(): void {
    if (this.config.ai.enabled) {
      if (this.config.ai.openai?.apiKey) {
        this.openai = new OpenAI({
          apiKey: this.config.ai.openai.apiKey
        });
      }

      if (this.config.ai.anthropic?.apiKey) {
        this.anthropic = new Anthropic({
          apiKey: this.config.ai.anthropic.apiKey
        });
      }
    }
  }

  /**
   * Initialize components
   */
  private initializeComponents(): void {
    this.dataAnalyzer = new DataAnalyzer(this.config, this.logger);
    this.patternDetector = new PatternDetector(this.config, this.logger);
    this.anomalyDetector = new AnomalyDetector(this.config, this.logger);
    this.predictionEngine = new PredictionEngine(this.config, this.logger);
    this.insightCache = new InsightCache({
      maxSize: 1000,
      ttl: 3600000 // 1 hour
    });
  }

  /**
   * Start the insights generator
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Insights generator is already running');
      return;
    }

    try {
      this.logger.info('Starting insights generator...');

      // Start components
      await this.dataAnalyzer.start();
      await this.patternDetector.start();
      await this.anomalyDetector.start();
      await this.predictionEngine.start();

      // Set up processing interval
      this.processingInterval = setInterval(() => {
        this.processGenerationQueue();
      }, 1000);

      this.isRunning = true;
      this.logger.info('Insights generator started successfully');
    } catch (error) {
      this.logger.error('Failed to start insights generator', { error: error.message });
      throw new AnalyticsError('Insights generator start failed', 'START_ERROR');
    }
  }

  /**
   * Stop the insights generator
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Insights generator is not running');
      return;
    }

    try {
      this.logger.info('Stopping insights generator...');

      // Clear processing interval
      if (this.processingInterval) {
        clearInterval(this.processingInterval);
      }

      // Process remaining queue items
      await this.processGenerationQueue();

      // Stop components
      await this.predictionEngine.stop();
      await this.anomalyDetector.stop();
      await this.patternDetector.stop();
      await this.dataAnalyzer.stop();

      this.isRunning = false;
      this.logger.info('Insights generator stopped successfully');
    } catch (error) {
      this.logger.error('Failed to stop insights generator', { error: error.message });
      throw new AnalyticsError('Insights generator stop failed', 'STOP_ERROR');
    }
  }

  /**
   * Generate insights for a data source
   */
  async generateInsights(
    dataSource: string,
    options: {
      timeRange: string;
      metrics?: string[];
      includeRecommendations?: boolean;
      analysisType?: 'summary' | 'trend' | 'prediction' | 'anomaly';
      priority?: 'low' | 'normal' | 'high';
    }
  ): Promise<InsightItem[]> {
    if (!this.isRunning) {
      throw new AnalyticsError('Insights generator is not running', 'NOT_RUNNING');
    }

    const cacheKey = this.generateCacheKey(dataSource, options);
    
    // Check cache first
    const cachedInsights = this.insightCache.get(cacheKey);
    if (cachedInsights) {
      this.stats.cached++;
      this.logger.debug('Insights served from cache', { dataSource, cacheKey });
      return cachedInsights;
    }

    // Add to generation queue
    return new Promise((resolve, reject) => {
      const queueItem = {
        id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dataSource,
        options,
        resolve,
        reject
      };

      // Insert based on priority
      if (options.priority === 'high') {
        this.generationQueue.unshift(queueItem);
      } else {
        this.generationQueue.push(queueItem);
      }

      this.logger.debug('Insight generation queued', { 
        id: queueItem.id,
        dataSource,
        queueSize: this.generationQueue.length 
      });
    });
  }

  /**
   * Process the generation queue
   */
  private async processGenerationQueue(): Promise<void> {
    if (this.generationQueue.length === 0) {
      return;
    }

    const item = this.generationQueue.shift();
    if (!item) return;

    const startTime = Date.now();

    try {
      const insights = await this.performInsightGeneration(item.dataSource, item.options);
      
      // Cache the results
      const cacheKey = this.generateCacheKey(item.dataSource, item.options);
      this.insightCache.set(cacheKey, insights);

      // Update stats
      this.stats.generated++;
      this.stats.avgGenerationTime = (this.stats.avgGenerationTime + (Date.now() - startTime)) / 2;

      // Emit insights
      insights.forEach(insight => this.emit('insight', insight));

      item.resolve(insights);

      this.logger.info('Insights generated successfully', {
        id: item.id,
        dataSource: item.dataSource,
        count: insights.length,
        generationTime: Date.now() - startTime
      });
    } catch (error) {
      this.stats.errors++;
      this.logger.error('Failed to generate insights', {
        id: item.id,
        error: error.message
      });
      item.reject(error);
    }
  }

  /**
   * Perform the actual insight generation
   */
  private async performInsightGeneration(
    dataSource: string,
    options: any
  ): Promise<InsightItem[]> {
    const insights: InsightItem[] = [];

    try {
      // 1. Analyze data
      const dataAnalysis = await this.dataAnalyzer.analyze(dataSource, options);

      // 2. Detect patterns
      const patterns = await this.patternDetector.detectPatterns(dataAnalysis);
      insights.push(...this.convertPatternsToInsights(patterns));

      // 3. Detect anomalies
      if (options.analysisType === 'anomaly' || !options.analysisType) {
        const anomalies = await this.anomalyDetector.detectAnomalies(dataAnalysis);
        insights.push(...this.convertAnomaliesToInsights(anomalies));
      }

      // 4. Generate predictions
      if (options.analysisType === 'prediction' || !options.analysisType) {
        const predictions = await this.predictionEngine.generatePredictions(dataAnalysis);
        insights.push(...this.convertPredictionsToInsights(predictions));
      }

      // 5. Generate AI-powered insights
      if (this.config.ai.enabled && (this.openai || this.anthropic)) {
        const aiInsights = await this.generateAIInsights(dataAnalysis, options);
        insights.push(...aiInsights);
      }

      // 6. Generate recommendations if requested
      if (options.includeRecommendations) {
        const recommendations = await this.generateRecommendations(insights, dataAnalysis);
        insights.push(...recommendations);
      }

      // Sort by impact and confidence
      insights.sort((a, b) => {
        const impactWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const aScore = impactWeight[a.impact] * a.confidence;
        const bScore = impactWeight[b.impact] * b.confidence;
        return bScore - aScore;
      });

      return insights.slice(0, 10); // Return top 10 insights
    } catch (error) {
      this.logger.error('Insight generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate AI-powered insights using LLM
   */
  private async generateAIInsights(
    dataAnalysis: any,
    options: any
  ): Promise<InsightItem[]> {
    try {
      const prompt = this.buildInsightPrompt(dataAnalysis, options);
      let response: string;

      if (this.openai) {
        const completion = await this.openai.chat.completions.create({
          model: this.config.ai.openai?.model || 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert business analyst specializing in data insights and recommendations. Provide actionable, specific insights based on the data provided.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 2000
        });
        response = completion.choices[0]?.message?.content || '';
      } else if (this.anthropic) {
        const completion = await this.anthropic.messages.create({
          model: this.config.ai.anthropic?.model || 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          temperature: 0.3,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ]
        });
        response = completion.content[0]?.type === 'text' ? completion.content[0].text : '';
      } else {
        return [];
      }

      return this.parseAIInsights(response);
    } catch (error) {
      this.logger.error('AI insight generation failed', { error: error.message });
      return [];
    }
  }

  /**
   * Build prompt for AI insight generation
   */
  private buildInsightPrompt(dataAnalysis: any, options: any): string {
    return `
Analyze the following business data and provide key insights:

Data Source: ${options.dataSource || 'Unknown'}
Time Range: ${options.timeRange}
Analysis Type: ${options.analysisType || 'comprehensive'}

Data Summary:
${JSON.stringify(dataAnalysis.summary, null, 2)}

Key Metrics:
${JSON.stringify(dataAnalysis.metrics, null, 2)}

Trends:
${JSON.stringify(dataAnalysis.trends, null, 2)}

Please provide 3-5 key business insights in the following format:
1. **Insight Title**: Brief description of what the data shows
   - Impact: [High/Medium/Low]
   - Confidence: [0.0-1.0]
   - Recommendation: Specific action to take

Focus on:
- Actionable insights that can drive business decisions
- Trends and patterns that indicate opportunities or risks
- Specific recommendations with clear next steps
- Quantifiable impacts where possible
`;
  }

  /**
   * Parse AI-generated insights
   */
  private parseAIInsights(response: string): InsightItem[] {
    const insights: InsightItem[] = [];
    const sections = response.split(/\d+\.\s*\*\*/).slice(1);

    sections.forEach((section, index) => {
      try {
        const lines = section.split('\n').filter(line => line.trim());
        if (lines.length === 0) return;

        const titleMatch = lines[0].match(/^([^*]+)\*\*:\s*(.+)$/);
        if (!titleMatch) return;

        const title = titleMatch[1].trim();
        const description = titleMatch[2].trim();

        let impact = 'medium';
        let confidence = 0.7;
        let recommendation = '';

        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('- Impact:')) {
            const impactMatch = trimmed.match(/Impact:\s*\[?([^\]]+)\]?/i);
            if (impactMatch) {
              impact = impactMatch[1].toLowerCase();
            }
          } else if (trimmed.startsWith('- Confidence:')) {
            const confidenceMatch = trimmed.match(/Confidence:\s*\[?([0-9.]+)\]?/);
            if (confidenceMatch) {
              confidence = parseFloat(confidenceMatch[1]);
            }
          } else if (trimmed.startsWith('- Recommendation:')) {
            recommendation = trimmed.replace(/^- Recommendation:\s*/, '');
          }
        });

        insights.push({
          id: `ai_insight_${Date.now()}_${index}`,
          type: 'recommendation',
          title,
          description,
          confidence: Math.min(Math.max(confidence, 0), 1),
          impact: ['low', 'medium', 'high', 'critical'].includes(impact) ? impact as any : 'medium',
          category: 'ai_generated',
          data: { source: 'ai_analysis' },
          recommendations: recommendation ? [recommendation] : [],
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.warn('Failed to parse AI insight section', { error: error.message });
      }
    });

    return insights;
  }

  /**
   * Convert patterns to insights
   */
  private convertPatternsToInsights(patterns: any[]): InsightItem[] {
    return patterns.map(pattern => ({
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'trend',
      title: `Pattern Detected: ${pattern.name}`,
      description: pattern.description,
      confidence: pattern.confidence,
      impact: pattern.significance > 0.8 ? 'high' : pattern.significance > 0.5 ? 'medium' : 'low',
      category: 'pattern_analysis',
      data: pattern.data,
      timestamp: new Date()
    }));
  }

  /**
   * Convert anomalies to insights
   */
  private convertAnomaliesToInsights(anomalies: any[]): InsightItem[] {
    return anomalies.map(anomaly => ({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'anomaly',
      title: `Anomaly Detected: ${anomaly.metric}`,
      description: `Unusual ${anomaly.direction} in ${anomaly.metric}: ${anomaly.description}`,
      confidence: anomaly.confidence,
      impact: anomaly.severity === 'critical' ? 'critical' : anomaly.severity === 'high' ? 'high' : 'medium',
      category: 'anomaly_detection',
      data: anomaly.data,
      recommendations: anomaly.recommendations || [],
      timestamp: new Date()
    }));
  }

  /**
   * Convert predictions to insights
   */
  private convertPredictionsToInsights(predictions: any[]): InsightItem[] {
    return predictions.map(prediction => ({
      id: `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'prediction',
      title: `Prediction: ${prediction.metric}`,
      description: prediction.description,
      confidence: prediction.confidence,
      impact: prediction.impact,
      category: 'predictive_analysis',
      data: prediction.data,
      recommendations: prediction.recommendations || [],
      timestamp: new Date()
    }));
  }

  /**
   * Generate recommendations based on insights
   */
  private async generateRecommendations(
    insights: InsightItem[],
    dataAnalysis: any
  ): Promise<InsightItem[]> {
    const recommendations: InsightItem[] = [];

    // High-impact insights get priority recommendations
    const highImpactInsights = insights.filter(i => i.impact === 'high' || i.impact === 'critical');

    for (const insight of highImpactInsights) {
      if (insight.type === 'anomaly') {
        recommendations.push({
          id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'recommendation',
          title: `Action Required: Address ${insight.title}`,
          description: `Based on the detected anomaly, immediate action is recommended to prevent potential issues.`,
          confidence: 0.8,
          impact: 'high',
          category: 'automated_recommendation',
          data: { sourceInsight: insight.id },
          recommendations: [
            'Investigate the root cause of the anomaly',
            'Set up monitoring alerts for similar patterns',
            'Review related processes and systems'
          ],
          timestamp: new Date()
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate cache key for insights
   */
  private generateCacheKey(dataSource: string, options: any): string {
    const keyData = {
      dataSource,
      timeRange: options.timeRange,
      metrics: options.metrics?.sort(),
      analysisType: options.analysisType
    };
    return `insights_${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Get generator statistics
   */
  getStats(): {
    generated: number;
    cached: number;
    errors: number;
    avgGenerationTime: number;
    queueSize: number;
  } {
    return {
      ...this.stats,
      queueSize: this.generationQueue.length
    };
  }

  /**
   * Check if generator is healthy
   */
  isHealthy(): boolean {
    return this.isRunning &&
           this.dataAnalyzer?.isHealthy() &&
           this.patternDetector?.isHealthy() &&
           this.anomalyDetector?.isHealthy() &&
           this.predictionEngine?.isHealthy();
  }

  /**
   * Clear insight cache
   */
  clearCache(): void {
    this.insightCache.clear();
    this.logger.info('Insight cache cleared');
  }

  /**
   * Get cached insights count
   */
  getCacheStats(): { size: number; hitRate: number } {
    return this.insightCache.getStats();
  }
}
