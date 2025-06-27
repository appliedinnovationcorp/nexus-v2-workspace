/**
 * Command Bus Implementation
 * Handles command dispatching in the CQRS architecture
 */

import { v4 as uuidv4 } from 'uuid'

export interface Command {
  id: string
  type: string
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

export interface CommandHandler {
  handle(command: Command): Promise<any>
}

export interface CommandResult {
  success: boolean
  data?: any
  error?: string
  events?: any[]
}

export class CommandBus {
  private handlers: Map<string, CommandHandler>
  private middleware: CommandMiddleware[]

  constructor() {
    this.handlers = new Map()
    this.middleware = []
  }

  /**
   * Register a command handler
   */
  register(commandType: string, handler: CommandHandler): void {
    if (this.handlers.has(commandType)) {
      throw new Error(`Command handler for ${commandType} is already registered`)
    }
    
    this.handlers.set(commandType, handler)
    console.log(`📝 Command handler registered: ${commandType}`)
  }

  /**
   * Execute a command
   */
  async execute(command: Command): Promise<CommandResult> {
    // Ensure command has required fields
    if (!command.id) {
      command.id = uuidv4()
    }
    
    if (!command.timestamp) {
      command.timestamp = new Date()
    }

    console.log(`⚡ Executing command: ${command.type} (${command.id})`)

    try {
      // Run middleware before execution
      for (const middleware of this.middleware) {
        await middleware.before(command)
      }

      // Find and execute handler
      const handler = this.handlers.get(command.type)
      if (!handler) {
        throw new Error(`No handler registered for command type: ${command.type}`)
      }

      const result = await handler.handle(command)

      // Run middleware after execution
      for (const middleware of this.middleware) {
        await middleware.after(command, result)
      }

      console.log(`✅ Command executed successfully: ${command.type} (${command.id})`)

      return {
        success: true,
        data: result
      }
    } catch (error: any) {
      console.error(`❌ Command execution failed: ${command.type} (${command.id})`, error)

      // Run middleware on error
      for (const middleware of this.middleware) {
        if (middleware.onError) {
          await middleware.onError(command, error)
        }
      }

      return {
        success: false,
        error: error.message || 'Command execution failed'
      }
    }
  }

  /**
   * Add middleware to the command pipeline
   */
  use(middleware: CommandMiddleware): void {
    this.middleware.push(middleware)
  }

  /**
   * Get registered command types
   */
  getRegisteredCommands(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Check if a command handler is registered
   */
  hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType)
  }
}

/**
 * Command middleware interface
 */
export interface CommandMiddleware {
  before?(command: Command): Promise<void>
  after?(command: Command, result: any): Promise<void>
  onError?(command: Command, error: any): Promise<void>
}

/**
 * Command factory for creating commands
 */
export class CommandFactory {
  static createCommand(
    type: string,
    data: any,
    metadata?: Record<string, any>
  ): Command {
    return {
      id: uuidv4(),
      type,
      timestamp: new Date(),
      data,
      metadata: metadata || {}
    }
  }
}

/**
 * Base class for command handlers
 */
export abstract class BaseCommandHandler implements CommandHandler {
  abstract handle(command: Command): Promise<any>

  protected log(message: string, command?: Command): void {
    const commandInfo = command ? ` (${command.type}:${command.id})` : ''
    console.log(`🔧 ${this.constructor.name}: ${message}${commandInfo}`)
  }

  protected logError(message: string, error: any, command?: Command): void {
    const commandInfo = command ? ` (${command.type}:${command.id})` : ''
    console.error(`❌ ${this.constructor.name}: ${message}${commandInfo}`, error)
  }

  protected validateCommand(command: Command, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!command.data[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }
  }
}

/**
 * Validation middleware
 */
export class ValidationMiddleware implements CommandMiddleware {
  async before(command: Command): Promise<void> {
    // Basic validation - can be extended with schema validation
    if (!command.type) {
      throw new Error('Command type is required')
    }
    
    if (!command.data) {
      throw new Error('Command data is required')
    }
  }
}

/**
 * Logging middleware
 */
export class LoggingMiddleware implements CommandMiddleware {
  async before(command: Command): Promise<void> {
    console.log(`📥 Command received: ${command.type}`, {
      id: command.id,
      timestamp: command.timestamp,
      dataKeys: Object.keys(command.data || {})
    })
  }

  async after(command: Command, result: any): Promise<void> {
    console.log(`📤 Command completed: ${command.type}`, {
      id: command.id,
      success: true,
      resultType: typeof result
    })
  }

  async onError(command: Command, error: any): Promise<void> {
    console.error(`💥 Command failed: ${command.type}`, {
      id: command.id,
      error: error.message,
      stack: error.stack
    })
  }
}
