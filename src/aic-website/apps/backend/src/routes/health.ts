/**
 * Health Check Routes
 * Comprehensive health monitoring for all backend services
 */

import { Router, Request, Response } from 'express'

const router = Router()

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  uptime: number
  version: string
  services: Record<string, any>
}

/**
 * Basic health check
 */
router.get('/', async (req: Request, res: Response) => {
  const healthResult: HealthCheckResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    services: {
      api: 'healthy',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      }
    }
  }

  res.json(healthResult)
})

/**
 * Detailed health check with all services
 */
router.get('/detailed', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now()
    
    // Get service instances
    const eventBus = req.app.locals.eventBus
    const commandBus = req.app.locals.commandBus
    const queryBus = req.app.locals.queryBus
    const eventStore = req.app.locals.eventStore
    const sagaOrchestrator = req.app.locals.sagaOrchestrator
    const aiGateway = req.app.locals.aiGateway

    // Check all services
    const services: Record<string, any> = {
      eventBus: {
        status: 'healthy',
        publishedEvents: eventBus?.getPublishedEvents()?.length || 0
      },
      commandBus: {
        status: 'healthy',
        registeredCommands: commandBus?.getRegisteredCommands()?.length || 0
      },
      queryBus: {
        status: 'healthy',
        registeredQueries: queryBus?.getRegisteredQueries()?.length || 0
      },
      eventStore: {
        status: eventStore ? 'healthy' : 'degraded'
      },
      sagaOrchestrator: {
        status: sagaOrchestrator ? 'healthy' : 'degraded',
        stats: sagaOrchestrator?.getStats() || {}
      },
      aiGateway: {
        status: aiGateway ? 'healthy' : 'degraded'
      }
    }

    const healthResult: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services
    }

    res.json(healthResult)

  } catch (error: any) {
    console.error('Health check failed:', error)
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: { error: error.message }
    })
  }
})

/**
 * Readiness probe (for Kubernetes)
 */
router.get('/ready', (req: Request, res: Response) => {
  res.json({
    status: 'ready',
    timestamp: new Date().toISOString()
  })
})

/**
 * Liveness probe (for Kubernetes)
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

export { router as healthRoutes }
