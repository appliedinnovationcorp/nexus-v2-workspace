import { BaseCommandHandler, Command } from '../../infrastructure/command-bus'
import { EventBus, EventFactory } from '../../infrastructure/event-bus'
import { EventStore } from '../../infrastructure/event-store'

export class UpdateLeadCommandHandler extends BaseCommandHandler {
  constructor(
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {
    super()
  }

  async handle(command: Command): Promise<any> {
    this.log('Updating lead', command)
    
    const { leadId, ...updateData } = command.data
    
    const event = EventFactory.createEvent(
      'LeadUpdated',
      leadId,
      'Lead',
      1,
      { leadId, updateData, updatedAt: new Date().toISOString() }
    )
    
    await this.eventStore.saveEvent(event)
    await this.eventBus.publish(event)
    
    return { leadId, updated: true }
  }
}
