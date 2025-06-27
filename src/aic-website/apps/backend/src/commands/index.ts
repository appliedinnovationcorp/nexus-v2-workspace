/**
 * Command Handlers Registration
 * Registers all command handlers with the command bus
 */

import { CommandBus, ValidationMiddleware, LoggingMiddleware } from '../infrastructure/command-bus'
import { EventBus } from '../infrastructure/event-bus'
import { EventStore } from '../infrastructure/event-store'

// Import command handlers
import { CreateLeadCommandHandler } from './lead/create-lead-handler'
import { UpdateLeadCommandHandler } from './lead/update-lead-handler'
import { ScoreLeadCommandHandler } from './lead/score-lead-handler'
import { CreateUserCommandHandler } from './user/create-user-handler'
import { UpdateUserCommandHandler } from './user/update-user-handler'
import { CreateContentCommandHandler } from './content/create-content-handler'
import { UpdateContentCommandHandler } from './content/update-content-handler'
import { GenerateContentCommandHandler } from './content/generate-content-handler'

export function registerCommandHandlers(
  commandBus: CommandBus,
  eventBus: EventBus,
  eventStore: EventStore
): void {
  console.log('📝 Registering command handlers...')

  // Add middleware
  commandBus.use(new ValidationMiddleware())
  commandBus.use(new LoggingMiddleware())

  // Lead command handlers
  commandBus.register('CreateLead', new CreateLeadCommandHandler(eventBus, eventStore))
  commandBus.register('UpdateLead', new UpdateLeadCommandHandler(eventBus, eventStore))
  commandBus.register('ScoreLead', new ScoreLeadCommandHandler(eventBus, eventStore))

  // User command handlers
  commandBus.register('CreateUser', new CreateUserCommandHandler(eventBus, eventStore))
  commandBus.register('UpdateUser', new UpdateUserCommandHandler(eventBus, eventStore))

  // Content command handlers
  commandBus.register('CreateContent', new CreateContentCommandHandler(eventBus, eventStore))
  commandBus.register('UpdateContent', new UpdateContentCommandHandler(eventBus, eventStore))
  commandBus.register('GenerateContent', new GenerateContentCommandHandler(eventBus, eventStore))

  console.log(`✅ Registered ${commandBus.getRegisteredCommands().length} command handlers`)
}
