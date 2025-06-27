/**
 * Type definitions for the Analytics Engine
 */

export interface AnalyticsEvent {
  id: string;
  event: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, any>;
}

export interface MetricDefinition {
  id: string;
  name: string;
  description: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
  filters?: Record<string, any>;
  dimensions?: string[];
}

export interface MetricValue {
  metric: string;
  value: number;
  timestamp: Date;
  dimensions?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface TimeRange {
  start: Date;
  end: Date;
}

export interface QueryOptions {
  timeRange: TimeRange;
  groupBy?: string[];
  filters?: Record<string, any>;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface InsightItem {
  id: string;
  type: 'trend' | 'anomaly' | 'correlation' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  data: Record<string, any>;
  recommendations?: string[];
  timestamp: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: Widget[];
  layout: DashboardLayout;
  filters?: DashboardFilter[];
  permissions?: Permission[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text' | 'image';
  title: string;
  description?: string;
  config: WidgetConfig;
  position: WidgetPosition;
  dataSource: string;
  refreshInterval?: number;
}

export interface WidgetConfig {
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap';
  metrics: string[];
  dimensions?: string[];
  filters?: Record<string, any>;
  timeRange: string;
  aggregation?: string;
  colors?: string[];
  showLegend?: boolean;
  showTooltip?: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DashboardLayout {
  type: 'grid' | 'flex' | 'absolute';
  columns?: number;
  gap?: number;
  padding?: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'text';
  options?: FilterOption[];
  defaultValue?: any;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface Permission {
  userId: string;
  role: 'viewer' | 'editor' | 'admin';
  permissions: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  metric: string;
  condition: AlertCondition;
  threshold: number;
  timeWindow: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: AlertChannel[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne';
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  groupBy?: string[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, any>;
}

export interface Alert {
  id: string;
  ruleId: string;
  metric: string;
  value: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'resolved' | 'acknowledged';
  triggeredAt: Date;
  resolvedAt?: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream';
  config: DataSourceConfig;
  schema?: DataSourceSchema;
  status: 'active' | 'inactive' | 'error';
  lastSync?: Date;
}

export interface DataSourceConfig {
  connectionString?: string;
  apiKey?: string;
  endpoint?: string;
  credentials?: Record<string, any>;
  options?: Record<string, any>;
}

export interface DataSourceSchema {
  tables: TableSchema[];
}

export interface TableSchema {
  name: string;
  columns: ColumnSchema[];
}

export interface ColumnSchema {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  nullable?: boolean;
  primaryKey?: boolean;
  foreignKey?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AnalyticsConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  redis: RedisConfig;
  kafka?: KafkaConfig;
  ai: AIConfig;
  security: SecurityConfig;
  monitoring: MonitoringConfig;
}

export interface ServerConfig {
  port: number;
  host: string;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
}

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
  methods: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

export interface DatabaseConfig {
  mongodb: MongoConfig;
  influxdb: InfluxConfig;
}

export interface MongoConfig {
  uri: string;
  database: string;
  options?: Record<string, any>;
}

export interface InfluxConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
}

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  groupId: string;
  topics: string[];
}

export interface AIConfig {
  openai?: {
    apiKey: string;
    model: string;
  };
  anthropic?: {
    apiKey: string;
    model: string;
  };
  enabled: boolean;
}

export interface SecurityConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  apiKeys: string[];
}

export interface MonitoringConfig {
  prometheus: {
    enabled: boolean;
    port: number;
  };
  logging: {
    level: string;
    format: string;
  };
  apm: {
    enabled: boolean;
    serviceName: string;
  };
}

// Utility types
export type EventHandler<T = any> = (data: T) => void | Promise<void>;
export type MetricAggregation = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';
export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'heatmap' | 'funnel';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type UserRole = 'admin' | 'user' | 'viewer';
export type DataSourceType = 'database' | 'api' | 'file' | 'stream';
export type WidgetType = 'metric' | 'chart' | 'table' | 'text' | 'image';

// Error types
export class AnalyticsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class ValidationError extends AnalyticsError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AnalyticsError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AnalyticsError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AnalyticsError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AnalyticsError {
  constructor(message: string) {
    super(message, 'CONFLICT_ERROR', 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AnalyticsError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}
