/**
 * Lead Routes - Express.js routes for lead management
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'

const router = Router()

const CreateLeadSchema = z.object({
  email: z.string().email(),
  company: z.string().optional(),
  name: z.string().optional(),
  phone: z.string().optional(),
  message: z.string().min(1),
  source: z.string().optional(),
  division: z.enum(['smb', 'enterprise', 'general']).optional(),
  metadata: z.record(z.any()).optional()
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateLeadSchema.parse(req.body)
    const commandBus = req.app.locals.commandBus
    const sagaOrchestrator = req.app.locals.sagaOrchestrator
    
    // Execute create lead command
    const commandResult = await commandBus.execute({
      id: 'cmd-' + Date.now(),
      type: 'CreateLead',
      timestamp: new Date(),
      data: validatedData
    })
    
    if (!commandResult.success) {
      return res.status(400).json({
        success: false,
        error: commandResult.error
      })
    }
    
    // Start lead processing saga
    const sagaInstanceId = await sagaOrchestrator.startSaga('lead-processing', {
      leadData: validatedData,
      leadId: commandResult.data.leadId
    })
    
    res.status(201).json({
      success: true,
      data: {
        leadId: commandResult.data.leadId,
        sagaInstanceId,
        status: 'processing'
      }
    })
    
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.errors
      })
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

router.get('/', async (req: Request, res: Response) => {
  try {
    const queryBus = req.app.locals.queryBus
    
    const queryResult = await queryBus.execute({
      id: 'query-' + Date.now(),
      type: 'GetLeads',
      timestamp: new Date(),
      data: req.query
    })
    
    res.json({
      success: true,
      data: queryResult.data
    })
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export { router as leadRoutes }
