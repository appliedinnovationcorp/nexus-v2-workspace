/**
 * Lead Processing Saga Handler
 * Orchestrates the complete lead processing workflow
 */

import { BaseSagaHandler, SagaInstance } from '../infrastructure/saga-orchestrator'
import { DomainEvent } from '../infrastructure/event-bus'
import { createAIGateway } from '../services/ai-gateway'

export class LeadProcessingSagaHandler extends BaseSagaHandler {
  private aiGateway = createAIGateway()

  canHandle(sagaType: string): boolean {
    return sagaType === 'lead-processing'
  }

  async handle(sagaInstance: SagaInstance, event: DomainEvent): Promise<void> {
    this.log(`Handling lead processing saga event: ${event.type}`, sagaInstance)

    try {
      switch (event.type) {
        case 'SagaStepExecuting':
          await this.handleStepExecution(sagaInstance, event)
          break
        case 'SagaStepCompensating':
          await this.handleStepCompensation(sagaInstance, event)
          break
        default:
          this.log(`Unhandled event type: ${event.type}`, sagaInstance)
      }
    } catch (error: any) {
      this.log(`Error in saga handler: ${error.message}`, sagaInstance)
      throw error
    }
  }

  private async handleStepExecution(sagaInstance: SagaInstance, event: DomainEvent): Promise<void> {
    const { stepId, command } = event.data

    switch (stepId) {
      case 'validate-lead':
        await this.validateLead(sagaInstance, command)
        break
      case 'score-lead':
        await this.scoreLead(sagaInstance, command)
        break
      case 'enrich-lead':
        await this.enrichLead(sagaInstance, command)
        break
      case 'assign-lead':
        await this.assignLead(sagaInstance, command)
        break
      case 'notify-team':
        await this.notifyTeam(sagaInstance, command)
        break
      default:
        throw new Error(`Unknown step: ${stepId}`)
    }
  }

  private async handleStepCompensation(sagaInstance: SagaInstance, event: DomainEvent): Promise<void> {
    const { stepId, compensationCommand } = event.data

    switch (stepId) {
      case 'validate-lead':
        await this.revertLeadValidation(sagaInstance, compensationCommand)
        break
      case 'score-lead':
        await this.revertLeadScoring(sagaInstance, compensationCommand)
        break
      case 'enrich-lead':
        await this.revertLeadEnrichment(sagaInstance, compensationCommand)
        break
      case 'assign-lead':
        await this.unassignLead(sagaInstance, compensationCommand)
        break
      default:
        this.log(`No compensation needed for step: ${stepId}`, sagaInstance)
    }
  }

  private async validateLead(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Validating lead data', sagaInstance)

    const leadData = sagaInstance.context.leadData
    if (!leadData) {
      throw new Error('Lead data not found in saga context')
    }

    // Validate required fields
    const requiredFields = ['email', 'message']
    for (const field of requiredFields) {
      if (!leadData[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(leadData.email)) {
      throw new Error('Invalid email format')
    }

    // Store validation result
    sagaInstance.context.validationResult = {
      isValid: true,
      validatedAt: new Date().toISOString()
    }

    this.log('Lead validation completed successfully', sagaInstance)
  }

  private async scoreLead(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Scoring lead with AI', sagaInstance)

    const leadData = sagaInstance.context.leadData
    
    try {
      // Use AI Gateway to score the lead
      const scoringResult = await this.aiGateway.scoreLead({
        email: leadData.email,
        company: leadData.company,
        name: leadData.name,
        phone: leadData.phone,
        message: leadData.message,
        source: leadData.source,
        division: leadData.division,
        metadata: leadData.metadata
      })

      // Store scoring result in saga context
      sagaInstance.context.scoringResult = {
        score: scoringResult.score,
        category: scoringResult.category,
        reasoning: scoringResult.reasoning,
        nextActions: scoringResult.next_actions,
        confidence: scoringResult.confidence,
        factors: scoringResult.factors,
        scoredAt: new Date().toISOString()
      }

      this.log(`Lead scored: ${scoringResult.score} (${scoringResult.category})`, sagaInstance)

    } catch (error: any) {
      this.log(`AI scoring failed, using fallback: ${error.message}`, sagaInstance)
      
      // Fallback scoring logic
      sagaInstance.context.scoringResult = {
        score: 50,
        category: 'warm',
        reasoning: 'Fallback scoring used due to AI service unavailability',
        nextActions: ['Manual review required'],
        confidence: 0.3,
        factors: {},
        scoredAt: new Date().toISOString()
      }
    }
  }

  private async enrichLead(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Enriching lead data', sagaInstance)

    const leadData = sagaInstance.context.leadData
    const scoringResult = sagaInstance.context.scoringResult

    // Simulate lead enrichment (in production, this would call external APIs)
    const enrichmentData = {
      companySize: this.estimateCompanySize(leadData.company),
      industry: this.detectIndustry(leadData.message),
      location: this.extractLocation(leadData),
      socialProfiles: this.findSocialProfiles(leadData.email),
      enrichedAt: new Date().toISOString()
    }

    sagaInstance.context.enrichmentData = enrichmentData
    this.log('Lead enrichment completed', sagaInstance)
  }

  private async assignLead(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Assigning lead to sales rep', sagaInstance)

    const scoringResult = sagaInstance.context.scoringResult
    const enrichmentData = sagaInstance.context.enrichmentData

    // Determine assignment based on score and division
    let assignedTo: string
    let priority: string

    if (scoringResult.score >= 80) {
      assignedTo = 'senior-sales-rep'
      priority = 'high'
    } else if (scoringResult.score >= 60) {
      assignedTo = 'sales-rep'
      priority = 'medium'
    } else {
      assignedTo = 'marketing-team'
      priority = 'low'
    }

    const assignmentData = {
      assignedTo,
      priority,
      assignedAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    }

    sagaInstance.context.assignmentData = assignmentData
    this.log(`Lead assigned to: ${assignedTo} (${priority} priority)`, sagaInstance)
  }

  private async notifyTeam(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Notifying sales team', sagaInstance)

    const leadData = sagaInstance.context.leadData
    const scoringResult = sagaInstance.context.scoringResult
    const assignmentData = sagaInstance.context.assignmentData

    // Simulate notification (in production, this would send emails/Slack messages)
    const notification = {
      type: 'new-lead-assignment',
      recipient: assignmentData.assignedTo,
      subject: `New ${assignmentData.priority} priority lead: ${leadData.company || leadData.email}`,
      message: `Lead Score: ${scoringResult.score} (${scoringResult.category})\nNext Actions: ${scoringResult.nextActions.join(', ')}`,
      sentAt: new Date().toISOString()
    }

    sagaInstance.context.notificationData = notification
    this.log('Team notification sent successfully', sagaInstance)
  }

  // Compensation methods
  private async revertLeadValidation(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Reverting lead validation', sagaInstance)
    delete sagaInstance.context.validationResult
  }

  private async revertLeadScoring(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Reverting lead scoring', sagaInstance)
    delete sagaInstance.context.scoringResult
  }

  private async revertLeadEnrichment(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Reverting lead enrichment', sagaInstance)
    delete sagaInstance.context.enrichmentData
  }

  private async unassignLead(sagaInstance: SagaInstance, command: any): Promise<void> {
    this.log('Unassigning lead', sagaInstance)
    delete sagaInstance.context.assignmentData
  }

  // Helper methods
  private estimateCompanySize(company?: string): string {
    if (!company) return 'unknown'
    
    const companyLower = company.toLowerCase()
    if (companyLower.includes('inc') || companyLower.includes('corp') || companyLower.includes('ltd')) {
      return 'medium-large'
    }
    return 'small-medium'
  }

  private detectIndustry(message: string): string {
    const messageLower = message.toLowerCase()
    
    if (messageLower.includes('healthcare') || messageLower.includes('medical')) return 'healthcare'
    if (messageLower.includes('finance') || messageLower.includes('bank')) return 'financial'
    if (messageLower.includes('tech') || messageLower.includes('software')) return 'technology'
    if (messageLower.includes('retail') || messageLower.includes('ecommerce')) return 'retail'
    if (messageLower.includes('manufacturing') || messageLower.includes('factory')) return 'manufacturing'
    
    return 'general'
  }

  private extractLocation(leadData: any): string {
    // In production, this would use IP geolocation or other methods
    return 'unknown'
  }

  private findSocialProfiles(email: string): string[] {
    // In production, this would search social networks
    return []
  }
}
