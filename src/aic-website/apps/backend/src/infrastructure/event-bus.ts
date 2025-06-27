/**
 * Event Bus Implementation
 * Handles event publishing and subscription for the CQRS architecture
 */

import { EventEmitter } from 'eventemitter3'
import { v4 as uuidv4 } from 'uuid'

export interface DomainEvent {
  id: string
  type: string
  aggregateId: string
  aggregateType: string
  version: number
  timestamp: Date
  data: any
  metadata?: Record<string, any>
}

export interface EventHandler {
  handle(event: DomainEvent): Promise<void>
}

export class EventBus {
  private emitter: EventEmitter
  private handlers: Map<string, EventHandler[]>
  private publishedEvents: DomainEvent[]

  constructor() {
    this.emitter = new EventEmitter()
    this.handlers = new Map()
    this.publishedEvents = []
  }

  /**
   * Subscribe to events of a specific type
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, [])
    }
    
    this.handlers.get(eventType)!.push(handler)
    
    // Set up EventEmitter listener
    this.emitter.on(eventType, async (event: DomainEvent) => {
      try {
        await handler.handle(event)
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error)
        // In production, you might want to implement retry logic or dead letter queues
      }
    })
  }

  /**
   * Publish a single event
   */
  async publish(event: DomainEvent): Promise<void> {
    // Ensure event has required fields
    if (!event.id) {
      event.id = uuidv4()
    }
    
    if (!event.timestamp) {
      event.timestamp = new Date()
    }

    // Store event for potential replay
    this.publishedEvents.push(event)

    // Emit event to all subscribers
    this.emitter.emit(event.type, event)
    
    console.log(`📡 Event published: ${event.type} (${event.id})`)
  }

  /**
   * Publish multiple events
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }

  /**
   * Get all published events (useful for testing and debugging)
   */
  getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents]
  }

  /**
   * Clear published events history
   */
  clearHistory(): void {
    this.publishedEvents = []
  }

  /**
   * Get event handlers for a specific event type
   */
  getHandlers(eventType: string): EventHandler[] {
    return this.handlers.get(eventType) || []
  }

  /**
   * Remove all handlers for an event type
   */
  unsubscribe(eventType: string): void {
    this.handlers.delete(eventType)
    this.emitter.removeAllListeners(eventType)
  }

  /**
   * Remove all handlers and clear history
   */
  clear(): void {
    this.handlers.clear()
    this.emitter.removeAllListeners()
    this.publishedEvents = []
  }
}

/**
 * Event factory for creating domain events
 */
export class EventFactory {
  static createEvent(
    type: string,
    aggregateId: string,
    aggregateType: string,
    version: number,
    data: any,
    metadata?: Record<string, any>
  ): DomainEvent {
    return {
      id: uuidv4(),
      type,
      aggregateId,
      aggregateType,
      version,
      timestamp: new Date(),
      data,
      metadata: metadata || {}
    }
  }
}

/**
 * Base class for event handlers
 */
export abstract class BaseEventHandler implements EventHandler {
  abstract handle(event: DomainEvent): Promise<void>

  protected log(message: string, event?: DomainEvent): void {
    const eventInfo = event ? ` (${event.type}:${event.id})` : ''
    console.log(`🔄 ${this.constructor.name}: ${message}${eventInfo}`)
  }

  protected logError(message: string, error: any, event?: DomainEvent): void {
    const eventInfo = event ? ` (${event.type}:${event.id})` : ''
    console.error(`❌ ${this.constructor.name}: ${message}${eventInfo}`, error)
  }
}
