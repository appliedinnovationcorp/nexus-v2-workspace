/**
 * Saga Registration
 * Registers all saga definitions and handlers
 */

import { SagaOrchestrator, SagaDefinition } from '../infrastructure/saga-orchestrator'

// Import saga handlers
import { LeadProcessingSagaHandler } from './lead-processing-saga'
import { ContentGenerationSagaHandler } from './content-generation-saga'
import { UserOnboardingSagaHandler } from './user-onboarding-saga'

export function registerSagas(sagaOrchestrator: SagaOrchestrator): void {
  console.log('🔄 Registering sagas...')

  // Register saga definitions
  registerLeadProcessingSaga(sagaOrchestrator)
  registerContentGenerationSaga(sagaOrchestrator)
  registerUserOnboardingSaga(sagaOrchestrator)

  // Register saga handlers
  sagaOrchestrator.registerHandler('lead-processing', new LeadProcessingSagaHandler())
  sagaOrchestrator.registerHandler('content-generation', new ContentGenerationSagaHandler())
  sagaOrchestrator.registerHandler('user-onboarding', new UserOnboardingSagaHandler())

  console.log('✅ Sagas registered successfully')
}

function registerLeadProcessingSaga(orchestrator: SagaOrchestrator): void {
  const leadProcessingSaga: SagaDefinition = {
    id: 'lead-processing',
    name: 'Lead Processing Saga',
    timeout: 300000, // 5 minutes
    steps: [
      {
        id: 'validate-lead',
        name: 'Validate Lead Data',
        command: { type: 'ValidateLead' },
        compensationCommand: { type: 'RevertLeadValidation' },
        timeout: 30000,
        retries: 2
      },
      {
        id: 'score-lead',
        name: 'Score Lead with AI',
        command: { type: 'ScoreLead' },
        compensationCommand: { type: 'RevertLeadScoring' },
        timeout: 60000,
        retries: 3
      },
      {
        id: 'enrich-lead',
        name: 'Enrich Lead Data',
        command: { type: 'EnrichLead' },
        compensationCommand: { type: 'RevertLeadEnrichment' },
        timeout: 45000,
        retries: 2
      },
      {
        id: 'assign-lead',
        name: 'Assign Lead to Sales Rep',
        command: { type: 'AssignLead' },
        compensationCommand: { type: 'UnassignLead' },
        timeout: 30000,
        retries: 1
      },
      {
        id: 'notify-team',
        name: 'Notify Sales Team',
        command: { type: 'NotifyTeam' },
        timeout: 15000,
        retries: 2
      }
    ]
  }

  orchestrator.registerSaga(leadProcessingSaga)
}

function registerContentGenerationSaga(orchestrator: SagaOrchestrator): void {
  const contentGenerationSaga: SagaDefinition = {
    id: 'content-generation',
    name: 'AI Content Generation Saga',
    timeout: 600000, // 10 minutes
    steps: [
      {
        id: 'validate-request',
        name: 'Validate Content Request',
        command: { type: 'ValidateContentRequest' },
        compensationCommand: { type: 'RevertContentValidation' },
        timeout: 15000,
        retries: 1
      },
      {
        id: 'generate-content',
        name: 'Generate Content with AI',
        command: { type: 'GenerateContent' },
        compensationCommand: { type: 'DeleteGeneratedContent' },
        timeout: 120000, // 2 minutes for AI generation
        retries: 2
      },
      {
        id: 'optimize-seo',
        name: 'Optimize Content for SEO',
        command: { type: 'OptimizeContentSEO' },
        compensationCommand: { type: 'RevertSEOOptimization' },
        timeout: 60000,
        retries: 2
      },
      {
        id: 'save-content',
        name: 'Save Content to CMS',
        command: { type: 'SaveContent' },
        compensationCommand: { type: 'DeleteSavedContent' },
        timeout: 30000,
        retries: 3
      },
      {
        id: 'index-content',
        name: 'Index Content for Search',
        command: { type: 'IndexContent' },
        compensationCommand: { type: 'RemoveFromIndex' },
        timeout: 45000,
        retries: 2
      }
    ]
  }

  orchestrator.registerSaga(contentGenerationSaga)
}

function registerUserOnboardingSaga(orchestrator: SagaOrchestrator): void {
  const userOnboardingSaga: SagaDefinition = {
    id: 'user-onboarding',
    name: 'User Onboarding Saga',
    timeout: 900000, // 15 minutes
    steps: [
      {
        id: 'create-user-account',
        name: 'Create User Account',
        command: { type: 'CreateUserAccount' },
        compensationCommand: { type: 'DeleteUserAccount' },
        timeout: 30000,
        retries: 2
      },
      {
        id: 'send-welcome-email',
        name: 'Send Welcome Email',
        command: { type: 'SendWelcomeEmail' },
        timeout: 30000,
        retries: 3
      },
      {
        id: 'create-user-profile',
        name: 'Create User Profile',
        command: { type: 'CreateUserProfile' },
        compensationCommand: { type: 'DeleteUserProfile' },
        timeout: 45000,
        retries: 2
      },
      {
        id: 'setup-preferences',
        name: 'Setup User Preferences',
        command: { type: 'SetupUserPreferences' },
        compensationCommand: { type: 'ResetUserPreferences' },
        timeout: 30000,
        retries: 1
      },
      {
        id: 'trigger-personalization',
        name: 'Initialize Personalization',
        command: { type: 'InitializePersonalization' },
        timeout: 60000,
        retries: 2
      }
    ]
  }

  orchestrator.registerSaga(userOnboardingSaga)
}
