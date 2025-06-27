import { BaseCommandHandler, Command } from '../../infrastructure/command-bus'
import { EventBus, EventFactory } from '../../infrastructure/event-bus'
import { EventStore } from '../../infrastructure/event-store'

export class ScoreLeadCommandHandler extends BaseCommandHandler {
  constructor(
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {
    super()
  }

  async handle(command: Command): Promise<any> {
    this.log('Scoring lead', command)
    
    const { leadId } = command.data
    
    // Mock scoring logic
    const score = Math.floor(Math.random() * 100)
    const category = score >= 80 ? 'hot' : score >= 60 ? 'warm' : 'cold'
    
    const event = EventFactory.createEvent(
      'LeadScored',
      leadId,
      'Lead',
      1,
      { leadId, score, category, scoredAt: new Date().toISOString() }
    )
    
    await this.eventStore.saveEvent(event)
    await this.eventBus.publish(event)
    
    return { leadId, score, category }
  }
}
