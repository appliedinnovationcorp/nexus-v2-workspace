/**
 * Centralized logging utility for consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogOptions {
  context?: string
  timestamp?: boolean
  data?: Record<string, any>
  tags?: string[]
}

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: string
  data?: Record<string, any>
  tags?: string[]
}

// Environment-based configuration
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const minLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (isDevelopment ? 'debug' : 'info')

// Log level priorities
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

/**
 * Determines if a log level should be displayed based on the minimum level setting
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[minLevel]
}

/**
 * Format a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context, data, tags } = entry
  
  let formattedMessage = `[${timestamp}] [${level.toUpperCase()}]`
  
  if (context) {
    formattedMessage += ` [${context}]`
  }
  
  formattedMessage += `: ${message}`
  
  if (tags && tags.length > 0) {
    formattedMessage += ` (${tags.join(', ')})`
  }
  
  if (data) {
    try {
      formattedMessage += `\n${JSON.stringify(data, null, 2)}`
    } catch (e) {
      formattedMessage += '\n[Error serializing data]'
    }
  }
  
  return formattedMessage
}

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  options: LogOptions = {}
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: options.context,
    data: options.data,
    tags: options.tags,
  }
}

/**
 * Log to the appropriate output based on environment
 */
function outputLog(entry: LogEntry): void {
  const formattedMessage = formatLogEntry(entry)
  
  // In test environment, don't output logs
  if (isTest) return
  
  // Use appropriate console method based on level
  switch (entry.level) {
    case 'debug':
      console.debug(formattedMessage)
      break
    case 'info':
      console.info(formattedMessage)
      break
    case 'warn':
      console.warn(formattedMessage)
      break
    case 'error':
      console.error(formattedMessage)
      break
  }
  
  // In production, we could send logs to a service like CloudWatch, Datadog, etc.
  if (process.env.NODE_ENV === 'production') {
    // Example: send to external logging service
    // sendToLoggingService(entry)
  }
}

/**
 * Logger factory that creates a logger with a specific context
 */
export function createLogger(defaultContext?: string) {
  return {
    debug(message: string, options: Omit<LogOptions, 'context'> = {}) {
      if (!shouldLog('debug')) return
      
      const entry = createLogEntry('debug', message, {
        ...options,
        context: options.context || defaultContext,
      })
      
      outputLog(entry)
    },
    
    info(message: string, options: Omit<LogOptions, 'context'> = {}) {
      if (!shouldLog('info')) return
      
      const entry = createLogEntry('info', message, {
        ...options,
        context: options.context || defaultContext,
      })
      
      outputLog(entry)
    },
    
    warn(message: string, options: Omit<LogOptions, 'context'> = {}) {
      if (!shouldLog('warn')) return
      
      const entry = createLogEntry('warn', message, {
        ...options,
        context: options.context || defaultContext,
      })
      
      outputLog(entry)
    },
    
    error(message: string, options: Omit<LogOptions, 'context'> = {}) {
      if (!shouldLog('error')) return
      
      const entry = createLogEntry('error', message, {
        ...options,
        context: options.context || defaultContext,
      })
      
      outputLog(entry)
    },
    
    // Log and return an error object (useful for error handling)
    logError(error: Error, message?: string, options: Omit<LogOptions, 'context'> = {}) {
      if (!shouldLog('error')) return error
      
      const errorMessage = message || error.message
      const errorData = {
        ...options.data,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }
      
      const entry = createLogEntry('error', errorMessage, {
        ...options,
        context: options.context || defaultContext,
        data: errorData,
      })
      
      outputLog(entry)
      return error
    },
  }
}

// Default logger instance
export const logger = createLogger('app')
