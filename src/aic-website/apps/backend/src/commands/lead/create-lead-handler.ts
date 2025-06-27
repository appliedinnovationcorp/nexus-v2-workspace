/**
 * Create Lead Command Handler
 * Handles the creation of new leads in the system
 */

import { v4 as uuidv4 } from 'uuid'
import { BaseCommandHandler, Command } from '../../infrastructure/command-bus'
import { EventBus, EventFactory } from '../../infrastructure/event-bus'
import { EventStore } from '../../infrastructure/event-store'

export interface CreateLeadData {
  email: string
  company?: string
  name?: string
  phone?: string
  message: string
  source?: string
  division?: 'smb' | 'enterprise' | 'general'
  metadata?: Record<string, any>
}

export class CreateLeadCommandHandler extends BaseCommandHandler {
  constructor(
    private eventBus: EventBus,
    private eventStore: EventStore
  ) {
    super()
  }

  async handle(command: Command): Promise<{ leadId: string }> {
    this.log('Creating new lead', command)

    // Validate required fields
    this.validateCommand(command, ['email', 'message'])

    const data: CreateLeadData = command.data
    const leadId = uuidv4()

    try {
      // Validate email format
      if (!this.isValidEmail(data.email)) {
        throw new Error('Invalid email format')
      }

      // Check for duplicate leads (simplified - in production, use proper deduplication)
      const existingLead = await this.checkForDuplicateLead(data.email)
      if (existingLead) {
        this.log('Duplicate lead detected, updating existing lead')
        // In a real system, you might want to update the existing lead or merge data
      }

      // Create lead created event
      const leadCreatedEvent = EventFactory.createEvent(
        'LeadCreated',
        leadId,
        'Lead',
        1,
        {
          leadId,
          email: data.email,
          company: data.company,
          name: data.name,
          phone: data.phone,
          message: data.message,
          source: data.source || 'website',
          division: data.division || 'general',
          status: 'new',
          createdAt: new Date().toISOString(),
          metadata: data.metadata || {}
        },
        {
          commandId: command.id,
          userId: command.metadata?.userId,
          ipAddress: command.metadata?.ipAddress,
          userAgent: command.metadata?.userAgent
        }
      )

      // Store event
      await this.eventStore.saveEvent(leadCreatedEvent)

      // Publish event
      await this.eventBus.publish(leadCreatedEvent)

      // Trigger AI lead scoring (async)
      const scoreLeadEvent = EventFactory.createEvent(
        'LeadScoringRequested',
        leadId,
        'Lead',
        2,
        {
          leadId,
          email: data.email,
          company: data.company,
          message: data.message,
          division: data.division
        }
      )

      await this.eventBus.publish(scoreLeadEvent)

      this.log(`Lead created successfully: ${leadId}`, command)

      return { leadId }
    } catch (error) {
      this.logError('Failed to create lead', error, command)
      throw error
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private async checkForDuplicateLead(email: string): Promise<boolean> {
    // In a real implementation, this would query the read model or database
    // For now, we'll return false (no duplicates)
    return false
  }
}
