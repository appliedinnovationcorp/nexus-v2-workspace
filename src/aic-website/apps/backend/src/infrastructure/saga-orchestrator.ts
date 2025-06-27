/**
 * Saga Orchestrator Implementation
 * Handles distributed transaction orchestration using the Saga pattern
 */

import { EventEmitter } from 'events'
import { v4 as uuidv4 } from 'uuid'
import { EventBus, DomainEvent, BaseEventHandler } from './event-bus'

export interface SagaStep {
  id: string
  name: string
  command: any
  compensationCommand?: any
  timeout?: number
  retries?: number
}

export interface SagaDefinition {
  id: string
  name: string
  steps: SagaStep[]
  timeout?: number
}

export interface SagaInstance {
  id: string
  sagaId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'compensating' | 'compensated'
  currentStep: number
  completedSteps: string[]
  failedSteps: string[]
  compensatedSteps: string[]
  startedAt: Date
  completedAt?: Date
  error?: string
  context: Record<string, any>
}

export interface SagaHandler {
  canHandle(sagaType: string): boolean
  handle(sagaInstance: SagaInstance, event: DomainEvent): Promise<void>
}

export class SagaOrchestrator extends EventEmitter {
  private eventBus: EventBus
  private sagaDefinitions: Map<string, SagaDefinition>
  private sagaInstances: Map<string, SagaInstance>
  private sagaHandlers: Map<string, SagaHandler>
  private timeouts: Map<string, NodeJS.Timeout>

  constructor(eventBus: EventBus) {
    super()
    this.eventBus = eventBus
    this.sagaDefinitions = new Map()
    this.sagaInstances = new Map()
    this.sagaHandlers = new Map()
    this.timeouts = new Map()

    this.setupEventHandlers()
  }

  private setupEventHandlers(): void {
    // Listen for saga-related events
    this.eventBus.subscribe('SagaStartRequested', new SagaStartHandler(this))
    this.eventBus.subscribe('SagaStepCompleted', new SagaStepCompletedHandler(this))
    this.eventBus.subscribe('SagaStepFailed', new SagaStepFailedHandler(this))
    this.eventBus.subscribe('SagaCompensationCompleted', new SagaCompensationHandler(this))
  }

  /**
   * Register a saga definition
   */
  registerSaga(definition: SagaDefinition): void {
    this.sagaDefinitions.set(definition.id, definition)
    console.log(`🔄 Saga registered: ${definition.name} (${definition.id})`)
  }

  /**
   * Register a saga handler
   */
  registerHandler(sagaType: string, handler: SagaHandler): void {
    this.sagaHandlers.set(sagaType, handler)
    console.log(`🔄 Saga handler registered: ${sagaType}`)
  }

  /**
   * Start a new saga instance
   */
  async startSaga(sagaId: string, context: Record<string, any> = {}): Promise<string> {
    const definition = this.sagaDefinitions.get(sagaId)
    if (!definition) {
      throw new Error(`Saga definition not found: ${sagaId}`)
    }

    const instanceId = uuidv4()
    const sagaInstance: SagaInstance = {
      id: instanceId,
      sagaId,
      status: 'pending',
      currentStep: 0,
      completedSteps: [],
      failedSteps: [],
      compensatedSteps: [],
      startedAt: new Date(),
      context
    }

    this.sagaInstances.set(instanceId, sagaInstance)

    // Publish saga start event
    await this.eventBus.publish({
      id: uuidv4(),
      type: 'SagaStartRequested',
      aggregateId: instanceId,
      aggregateType: 'Saga',
      version: 1,
      timestamp: new Date(),
      data: {
        sagaInstanceId: instanceId,
        sagaId,
        context
      }
    })

    console.log(`🔄 Saga started: ${definition.name} (${instanceId})`)
    return instanceId
  }

  /**
   * Execute the next step in a saga
   */
  async executeNextStep(instanceId: string): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)
    if (!instance) {
      throw new Error(`Saga instance not found: ${instanceId}`)
    }

    const definition = this.sagaDefinitions.get(instance.sagaId)
    if (!definition) {
      throw new Error(`Saga definition not found: ${instance.sagaId}`)
    }

    if (instance.currentStep >= definition.steps.length) {
      // Saga completed
      await this.completeSaga(instanceId)
      return
    }

    const step = definition.steps[instance.currentStep]
    instance.status = 'running'

    try {
      console.log(`🔄 Executing saga step: ${step.name} (${instanceId})`)

      // Set timeout for step if specified
      if (step.timeout) {
        this.setStepTimeout(instanceId, step.id, step.timeout)
      }

      // Execute the step command
      await this.executeStepCommand(instance, step)

    } catch (error: any) {
      console.error(`❌ Saga step failed: ${step.name} (${instanceId})`, error)
      await this.handleStepFailure(instanceId, step.id, error.message)
    }
  }

  /**
   * Execute a step command
   */
  private async executeStepCommand(instance: SagaInstance, step: SagaStep): Promise<void> {
    // In a real implementation, this would dispatch commands to appropriate handlers
    // For now, we'll simulate command execution
    
    const handler = this.sagaHandlers.get(instance.sagaId)
    if (handler) {
      const event: DomainEvent = {
        id: uuidv4(),
        type: 'SagaStepExecuting',
        aggregateId: instance.id,
        aggregateType: 'Saga',
        version: instance.currentStep + 1,
        timestamp: new Date(),
        data: {
          sagaInstanceId: instance.id,
          stepId: step.id,
          stepName: step.name,
          command: step.command,
          context: instance.context
        }
      }

      await handler.handle(instance, event)
    } else {
      // Default behavior - simulate step completion
      setTimeout(async () => {
        await this.completeStep(instance.id, step.id)
      }, 100)
    }
  }

  /**
   * Complete a saga step
   */
  async completeStep(instanceId: string, stepId: string, result?: any): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)
    if (!instance) return

    instance.completedSteps.push(stepId)
    instance.currentStep++

    // Clear timeout if set
    this.clearStepTimeout(instanceId, stepId)

    // Update context with step result
    if (result) {
      instance.context[`step_${stepId}_result`] = result
    }

    // Publish step completed event
    await this.eventBus.publish({
      id: uuidv4(),
      type: 'SagaStepCompleted',
      aggregateId: instanceId,
      aggregateType: 'Saga',
      version: instance.currentStep,
      timestamp: new Date(),
      data: {
        sagaInstanceId: instanceId,
        stepId,
        result,
        context: instance.context
      }
    })

    console.log(`✅ Saga step completed: ${stepId} (${instanceId})`)

    // Execute next step
    await this.executeNextStep(instanceId)
  }

  /**
   * Handle step failure
   */
  async handleStepFailure(instanceId: string, stepId: string, error: string): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)
    if (!instance) return

    instance.failedSteps.push(stepId)
    instance.status = 'failed'
    instance.error = error

    // Clear timeout if set
    this.clearStepTimeout(instanceId, stepId)

    // Publish step failed event
    await this.eventBus.publish({
      id: uuidv4(),
      type: 'SagaStepFailed',
      aggregateId: instanceId,
      aggregateType: 'Saga',
      version: instance.currentStep + 1,
      timestamp: new Date(),
      data: {
        sagaInstanceId: instanceId,
        stepId,
        error,
        context: instance.context
      }
    })

    console.log(`❌ Saga step failed: ${stepId} (${instanceId}) - ${error}`)

    // Start compensation
    await this.startCompensation(instanceId)
  }

  /**
   * Start compensation process
   */
  async startCompensation(instanceId: string): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)
    if (!instance) return

    const definition = this.sagaDefinitions.get(instance.sagaId)
    if (!definition) return

    instance.status = 'compensating'

    console.log(`🔄 Starting compensation for saga: ${instanceId}`)

    // Compensate completed steps in reverse order
    const completedSteps = [...instance.completedSteps].reverse()
    
    for (const stepId of completedSteps) {
      const step = definition.steps.find(s => s.id === stepId)
      if (step && step.compensationCommand) {
        try {
          await this.executeCompensation(instance, step)
          instance.compensatedSteps.push(stepId)
        } catch (error: any) {
          console.error(`❌ Compensation failed for step: ${stepId}`, error)
          // Continue with other compensations
        }
      }
    }

    instance.status = 'compensated'
    instance.completedAt = new Date()

    // Publish saga compensated event
    await this.eventBus.publish({
      id: uuidv4(),
      type: 'SagaCompensated',
      aggregateId: instanceId,
      aggregateType: 'Saga',
      version: instance.currentStep + 1,
      timestamp: new Date(),
      data: {
        sagaInstanceId: instanceId,
        compensatedSteps: instance.compensatedSteps,
        context: instance.context
      }
    })

    console.log(`🔄 Saga compensation completed: ${instanceId}`)
  }

  /**
   * Execute compensation for a step
   */
  private async executeCompensation(instance: SagaInstance, step: SagaStep): Promise<void> {
    console.log(`🔄 Compensating step: ${step.name} (${instance.id})`)

    const handler = this.sagaHandlers.get(instance.sagaId)
    if (handler) {
      const event: DomainEvent = {
        id: uuidv4(),
        type: 'SagaStepCompensating',
        aggregateId: instance.id,
        aggregateType: 'Saga',
        version: instance.currentStep + 1,
        timestamp: new Date(),
        data: {
          sagaInstanceId: instance.id,
          stepId: step.id,
          stepName: step.name,
          compensationCommand: step.compensationCommand,
          context: instance.context
        }
      }

      await handler.handle(instance, event)
    }
  }

  /**
   * Complete a saga
   */
  async completeSaga(instanceId: string): Promise<void> {
    const instance = this.sagaInstances.get(instanceId)
    if (!instance) return

    instance.status = 'completed'
    instance.completedAt = new Date()

    // Publish saga completed event
    await this.eventBus.publish({
      id: uuidv4(),
      type: 'SagaCompleted',
      aggregateId: instanceId,
      aggregateType: 'Saga',
      version: instance.currentStep + 1,
      timestamp: new Date(),
      data: {
        sagaInstanceId: instanceId,
        completedSteps: instance.completedSteps,
        context: instance.context,
        duration: instance.completedAt.getTime() - instance.startedAt.getTime()
      }
    })

    console.log(`✅ Saga completed: ${instanceId}`)
    this.emit('sagaCompleted', instance)
  }

  /**
   * Set timeout for a step
   */
  private setStepTimeout(instanceId: string, stepId: string, timeout: number): void {
    const timeoutKey = `${instanceId}:${stepId}`
    
    const timeoutId = setTimeout(async () => {
      console.log(`⏰ Saga step timeout: ${stepId} (${instanceId})`)
      await this.handleStepFailure(instanceId, stepId, `Step timeout after ${timeout}ms`)
    }, timeout)

    this.timeouts.set(timeoutKey, timeoutId)
  }

  /**
   * Clear timeout for a step
   */
  private clearStepTimeout(instanceId: string, stepId: string): void {
    const timeoutKey = `${instanceId}:${stepId}`
    const timeoutId = this.timeouts.get(timeoutKey)
    
    if (timeoutId) {
      clearTimeout(timeoutId)
      this.timeouts.delete(timeoutKey)
    }
  }

  /**
   * Get saga instance
   */
  getSagaInstance(instanceId: string): SagaInstance | undefined {
    return this.sagaInstances.get(instanceId)
  }

  /**
   * Get all saga instances
   */
  getAllSagaInstances(): SagaInstance[] {
    return Array.from(this.sagaInstances.values())
  }

  /**
   * Get saga statistics
   */
  getStats(): any {
    const instances = Array.from(this.sagaInstances.values())
    
    return {
      totalSagas: instances.length,
      pending: instances.filter(i => i.status === 'pending').length,
      running: instances.filter(i => i.status === 'running').length,
      completed: instances.filter(i => i.status === 'completed').length,
      failed: instances.filter(i => i.status === 'failed').length,
      compensating: instances.filter(i => i.status === 'compensating').length,
      compensated: instances.filter(i => i.status === 'compensated').length,
      registeredSagas: this.sagaDefinitions.size,
      registeredHandlers: this.sagaHandlers.size
    }
  }

  /**
   * Stop the saga orchestrator
   */
  async stop(): Promise<void> {
    // Clear all timeouts
    for (const timeoutId of this.timeouts.values()) {
      clearTimeout(timeoutId)
    }
    this.timeouts.clear()

    // Remove all listeners
    this.removeAllListeners()

    console.log('🔄 Saga orchestrator stopped')
  }
}

/**
 * Base saga handler class
 */
export abstract class BaseSagaHandler implements SagaHandler {
  abstract canHandle(sagaType: string): boolean
  abstract handle(sagaInstance: SagaInstance, event: DomainEvent): Promise<void>

  protected log(message: string, sagaInstance?: SagaInstance): void {
    const sagaInfo = sagaInstance ? ` (${sagaInstance.sagaId}:${sagaInstance.id})` : ''
    console.log(`🔄 ${this.constructor.name}: ${message}${sagaInfo}`)
  }
}

/**
 * Event handlers for saga orchestration
 */
class SagaStartHandler extends BaseEventHandler {
  constructor(private orchestrator: SagaOrchestrator) {
    super()
  }

  async handle(event: DomainEvent): Promise<void> {
    const { sagaInstanceId } = event.data
    await this.orchestrator.executeNextStep(sagaInstanceId)
  }
}

class SagaStepCompletedHandler extends BaseEventHandler {
  constructor(private orchestrator: SagaOrchestrator) {
    super()
  }

  async handle(event: DomainEvent): Promise<void> {
    // Step completion is already handled by the orchestrator
    this.log('Saga step completed event processed', event)
  }
}

class SagaStepFailedHandler extends BaseEventHandler {
  constructor(private orchestrator: SagaOrchestrator) {
    super()
  }

  async handle(event: DomainEvent): Promise<void> {
    // Step failure is already handled by the orchestrator
    this.log('Saga step failed event processed', event)
  }
}

class SagaCompensationHandler extends BaseEventHandler {
  constructor(private orchestrator: SagaOrchestrator) {
    super()
  }

  async handle(event: DomainEvent): Promise<void> {
    // Compensation is already handled by the orchestrator
    this.log('Saga compensation event processed', event)
  }
}
