/**
 * AIC Backend Services
 * Main entry point for the backend application
 */

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import morgan from 'morgan'
import dotenv from 'dotenv'

import { EventBus } from './infrastructure/event-bus'
import { CommandBus } from './infrastructure/command-bus'
import { QueryBus } from './infrastructure/query-bus'
import { EventStore } from './infrastructure/event-store'
import { SagaOrchestrator } from './infrastructure/saga-orchestrator'
import { createAIGateway } from './services/ai-gateway'

// Import route handlers
import { healthRoutes } from './routes/health'
import { leadRoutes } from './routes/leads'
import { userRoutes } from './routes/users'
import { contentRoutes } from './routes/content'
import { aiRoutes } from './routes/ai'
import { analyticsRoutes } from './routes/analytics'

// Import command handlers
import { registerCommandHandlers } from './commands'
import { registerQueryHandlers } from './queries'
import { registerSagas } from './sagas'

// Load environment variables
dotenv.config()

const app = express()
const port = process.env.PORT || 3100

// Middleware
app.use(helmet())
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005',
    'https://aicorp.com',
    'https://smb.aicorp.com',
    'https://enterprise.aicorp.com',
    'https://nexus.aicorp.com',
    'https://investors.aicorp.com',
    'https://admin.aicorp.com',
  ],
  credentials: true
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Initialize infrastructure
const eventBus = new EventBus()
const commandBus = new CommandBus()
const queryBus = new QueryBus()
const eventStore = new EventStore()
const sagaOrchestrator = new SagaOrchestrator(eventBus)

// Initialize AI Gateway
const aiGateway = createAIGateway()

// Set up AI Gateway event listeners
aiGateway.on('health', (status) => {
  console.log('AI Services Health:', status)
})

aiGateway.on('contentGenerated', (data) => {
  console.log('Content generated via AI services:', data.response.word_count, 'words')
})

aiGateway.on('leadScored', (data) => {
  console.log('Lead scored via AI services:', data.response.score, data.response.category)
})

// Register handlers
registerCommandHandlers(commandBus, eventBus, eventStore)
registerQueryHandlers(queryBus)
registerSagas(sagaOrchestrator)

// Make infrastructure available to routes
app.locals.eventBus = eventBus
app.locals.commandBus = commandBus
app.locals.queryBus = queryBus
app.locals.eventStore = eventStore
app.locals.sagaOrchestrator = sagaOrchestrator
app.locals.aiGateway = aiGateway

// Routes
app.use('/api/health', healthRoutes)
app.use('/api/leads', leadRoutes)
app.use('/api/users', userRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/analytics', analyticsRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: err.message,
      details: err.details
    })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required'
    })
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  })
})

// 404 handler
app.use('*', (req: express.Request, res: express.Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...')
  
  // Close AI Gateway
  aiGateway.close()
  
  // Close event store connections
  await eventStore.close()
  
  // Stop saga orchestrator
  await sagaOrchestrator.stop()
  
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...')
  
  // Close AI Gateway
  aiGateway.close()
  
  // Close event store connections
  await eventStore.close()
  
  // Stop saga orchestrator
  await sagaOrchestrator.stop()
  
  process.exit(0)
})

// Start server
app.listen(port, () => {
  console.log(`🚀 AIC Backend Services running on port ${port}`)
  console.log(`📊 Health check: http://localhost:${port}/api/health`)
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
