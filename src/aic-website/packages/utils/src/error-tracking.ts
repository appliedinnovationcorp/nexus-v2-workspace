/**
 * Error tracking utility for capturing and reporting errors
 */

import { logger } from './logger'

interface ErrorContext {
  userId?: string
  requestId?: string
  url?: string
  tags?: Record<string, string>
  metadata?: Record<string, any>
}

/**
 * Initialize error tracking service
 * In production, this would connect to a service like Sentry, Bugsnag, etc.
 */
export function initErrorTracking(dsn?: string): void {
  if (process.env.NODE_ENV === 'production' && dsn) {
    logger.info('Initializing error tracking service', {
      data: { dsn: dsn.replace(/\/\/(.+)@/, '//***@') }, // Mask credentials in DSN
    })
    
    // Example: Initialize Sentry
    // Sentry.init({
    //   dsn,
    //   environment: process.env.NODE_ENV,
    //   release: process.env.APP_VERSION,
    // })
  } else {
    logger.debug('Error tracking disabled or no DSN provided')
  }
}

/**
 * Capture and report an error
 */
export function captureError(error: Error, context?: ErrorContext): void {
  // Log the error locally
  logger.error(`Error captured: ${error.message}`, {
    data: {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    },
  })
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to Sentry
    // Sentry.withScope((scope) => {
    //   if (context?.userId) scope.setUser({ id: context.userId })
    //   if (context?.requestId) scope.setTag('requestId', context.requestId)
    //   if (context?.url) scope.setTag('url', context.url)
    //   if (context?.tags) {
    //     Object.entries(context.tags).forEach(([key, value]) => {
    //       scope.setTag(key, value)
    //     })
    //   }
    //   if (context?.metadata) {
    //     Object.entries(context.metadata).forEach(([key, value]) => {
    //       scope.setExtra(key, value)
    //     })
    //   }
    //   Sentry.captureException(error)
    // })
  }
}

/**
 * Create an error boundary for React components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback: React.ReactNode,
  onError?: (error: Error, info: { componentStack: string }) => void
): React.ComponentType<P> {
  class ErrorBoundary extends React.Component<
    P,
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: P) {
      super(props)
      this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error }
    }

    componentDidCatch(error: Error, info: { componentStack: string }) {
      // Capture the error
      captureError(error, {
        metadata: {
          componentStack: info.componentStack,
        },
      })
      
      // Call custom error handler if provided
      if (onError) {
        onError(error, info)
      }
    }

    render() {
      if (this.state.hasError) {
        return fallback
      }
      
      return <Component {...this.props} />
    }
  }
  
  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component'
  ErrorBoundary.displayName = `withErrorBoundary(${displayName})`
  
  return ErrorBoundary
}
