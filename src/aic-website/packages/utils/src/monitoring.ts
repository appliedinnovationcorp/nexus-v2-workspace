/**
 * Application monitoring and metrics utilities
 */

import { logger } from './logger'

// Metric types
type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

interface MetricOptions {
  name: string
  help: string
  type: MetricType
  labelNames?: string[]
}

interface MetricValue {
  value: number
  labels?: Record<string, string | number>
}

// In-memory metrics storage for development
const metrics: Record<string, { options: MetricOptions; values: MetricValue[] }> = {}

/**
 * Initialize monitoring service
 * In production, this would connect to a service like Prometheus, Datadog, etc.
 */
export function initMonitoring(endpoint?: string): void {
  if (process.env.NODE_ENV === 'production' && endpoint) {
    logger.info('Initializing monitoring service', {
      data: { endpoint },
    })
    
    // Example: Initialize Prometheus client
    // const client = require('prom-client')
    // const register = client.register
    // register.setContentType(client.Registry.CONTENT_TYPE_JSON)
    
    // Setup HTTP server for metrics endpoint
    // const server = http.createServer(async (req, res) => {
    //   if (req.url === '/metrics') {
    //     res.setHeader('Content-Type', register.contentType)
    //     res.end(await register.metrics())
    //   }
    // })
    // server.listen(endpoint)
  } else {
    logger.debug('Monitoring disabled or no endpoint provided')
  }
}

/**
 * Register a new metric
 */
export function registerMetric(options: MetricOptions): void {
  if (metrics[options.name]) {
    logger.warn(`Metric ${options.name} already registered`)
    return
  }
  
  metrics[options.name] = {
    options,
    values: [],
  }
  
  logger.debug(`Registered metric: ${options.name}`, {
    data: { options },
  })
  
  // In production, register with monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Register with Prometheus
    // const client = require('prom-client')
    // switch (options.type) {
    //   case 'counter':
    //     new client.Counter({
    //       name: options.name,
    //       help: options.help,
    //       labelNames: options.labelNames || [],
    //     })
    //     break
    //   case 'gauge':
    //     new client.Gauge({
    //       name: options.name,
    //       help: options.help,
    //       labelNames: options.labelNames || [],
    //     })
    //     break
    //   case 'histogram':
    //     new client.Histogram({
    //       name: options.name,
    //       help: options.help,
    //       labelNames: options.labelNames || [],
    //     })
    //     break
    //   case 'summary':
    //     new client.Summary({
    //       name: options.name,
    //       help: options.help,
    //       labelNames: options.labelNames || [],
    //     })
    //     break
    // }
  }
}

/**
 * Record a metric value
 */
export function recordMetric(name: string, value: number, labels?: Record<string, string | number>): void {
  if (!metrics[name]) {
    logger.warn(`Metric ${name} not registered`)
    return
  }
  
  metrics[name].values.push({
    value,
    labels,
  })
  
  logger.debug(`Recorded metric: ${name}`, {
    data: { value, labels },
  })
  
  // In production, record with monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Example: Record with Prometheus
    // const client = require('prom-client')
    // const metric = client.register.getSingleMetric(name)
    // if (!metric) return
    // 
    // switch (metrics[name].options.type) {
    //   case 'counter':
    //     if (labels) {
    //       metric.inc(labels, value)
    //     } else {
    //       metric.inc(value)
    //     }
    //     break
    //   case 'gauge':
    //     if (labels) {
    //       metric.set(labels, value)
    //     } else {
    //       metric.set(value)
    //     }
    //     break
    //   case 'histogram':
    //   case 'summary':
    //     if (labels) {
    //       metric.observe(labels, value)
    //     } else {
    //       metric.observe(value)
    //     }
    //     break
    // }
  }
}

/**
 * Measure execution time of a function
 */
export function measureExecutionTime<T>(
  name: string,
  fn: () => T,
  labels?: Record<string, string | number>
): T {
  const start = performance.now()
  const result = fn()
  const duration = performance.now() - start
  
  // Record the execution time
  recordMetric(`${name}_duration_ms`, duration, labels)
  
  return result
}

/**
 * Measure execution time of an async function
 */
export async function measureAsyncExecutionTime<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string | number>
): Promise<T> {
  const start = performance.now()
  const result = await fn()
  const duration = performance.now() - start
  
  // Record the execution time
  recordMetric(`${name}_duration_ms`, duration, labels)
  
  return result
}

/**
 * Get all registered metrics
 */
export function getMetrics(): Record<string, { options: MetricOptions; values: MetricValue[] }> {
  return metrics
}
