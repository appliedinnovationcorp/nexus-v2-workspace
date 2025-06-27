import { BaseCommandHandler, Command } from '../../infrastructure/command-bus'
import { EventBus } from '../../infrastructure/event-bus'
import { EventStore } from '../../infrastructure/event-store'

export class GenerateContentCommandHandler extends BaseCommandHandler {
  constructor(private eventBus: EventBus, private eventStore: EventStore) { super() }
  async handle(command: Command): Promise<any> {
    return { contentId: 'generated-content-123', generated: true }
  }
}
