/**
 * Real-Time Analytics Engine
 * Enterprise-grade analytics platform with AI-powered insights
 */

export { AnalyticsEngine } from './core/analytics-engine';
export { EventTracker } from './tracking/event-tracker';
export { MetricsCalculator } from './metrics/metrics-calculator';
export { InsightsGenerator } from './ai/insights-generator';
export { DashboardManager } from './dashboard/dashboard-manager';
export { DataConnector } from './connectors/data-connector';
export { RealtimeProcessor } from './processing/realtime-processor';
export { AlertManager } from './alerts/alert-manager';

// Types and interfaces
export * from './types';
export * from './interfaces';

// Configuration
export { AnalyticsConfig } from './config/analytics-config';

// Utilities
export * from './utils';

// Version
export const VERSION = '1.0.0';

// Default export
export { AnalyticsEngine as default } from './core/analytics-engine';
