const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'lead-service',
  brokers: process.env.KAFKA_BROKERS ? process.env.KAFKA_BROKERS.split(',') : ['localhost:9092'],
  ssl: process.env.KAFKA_SSL === 'true',
  sasl: process.env.KAFKA_SASL === 'true' ? {
    mechanism: process.env.KAFKA_SASL_MECHANISM || 'plain',
    username: process.env.KAFKA_USERNAME || '',
    password: process.env.KAFKA_PASSWORD || '',
  } : undefined,
});

// Create producer
const producer = kafka.producer();

// Create consumer
const consumer = kafka.consumer({ 
  groupId: 'lead-service-group',
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

// Setup Kafka producer and consumer
const setupKafka = async () => {
  try {
    // Connect producer
    await producer.connect();
    logger.info('Kafka producer connected');
    
    // Connect consumer
    await consumer.connect();
    logger.info('Kafka consumer connected');
    
    // Subscribe to topics
    await consumer.subscribe({ 
      topics: ['user-events', 'lead-events', 'contact-events'],
      fromBeginning: false
    });
    
    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const messageValue = JSON.parse(message.value.toString());
          logger.info(`Received message from topic ${topic}:`, { messageValue });
          
          // Process message based on topic and event type
          switch (topic) {
            case 'user-events':
              await processUserEvent(messageValue);
              break;
            case 'lead-events':
              await processLeadEvent(messageValue);
              break;
            case 'contact-events':
              await processContactEvent(messageValue);
              break;
            default:
              logger.warn(`No handler for topic: ${topic}`);
          }
        } catch (error) {
          logger.error(`Error processing Kafka message: ${error.message}`, { error });
        }
      },
    });
    
    // Handle producer disconnects
    producer.on('producer.disconnect', async () => {
      logger.warn('Kafka producer disconnected');
      try {
        await producer.connect();
        logger.info('Kafka producer reconnected');
      } catch (error) {
        logger.error(`Failed to reconnect Kafka producer: ${error.message}`);
      }
    });
    
    // Handle consumer disconnects
    consumer.on('consumer.disconnect', async () => {
      logger.warn('Kafka consumer disconnected');
      try {
        await consumer.connect();
        await consumer.subscribe({ 
          topics: ['user-events', 'lead-events', 'contact-events'],
          fromBeginning: false
        });
        await consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            // Same implementation as above
          },
        });
        logger.info('Kafka consumer reconnected');
      } catch (error) {
        logger.error(`Failed to reconnect Kafka consumer: ${error.message}`);
      }
    });
    
  } catch (error) {
    logger.error(`Error setting up Kafka: ${error.message}`, { error });
    throw error;
  }
};

// Process user events
const processUserEvent = async (message) => {
  const { event, data } = message;
  
  switch (event) {
    case 'user.created':
      // Handle user creation - potentially create a lead
      logger.info(`Processing user created event for ${data.email}`);
      // Implementation here
      break;
    case 'user.deleted':
      // Handle user deletion - update related leads
      logger.info(`Processing user deleted event for ${data.email}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for user event: ${event}`);
  }
};

// Process lead events
const processLeadEvent = async (message) => {
  const { event, data } = message;
  
  switch (event) {
    case 'lead.assigned':
      // Handle lead assignment from another service
      logger.info(`Processing lead assignment for ${data.leadId}`);
      // Implementation here
      break;
    case 'lead.status-updated':
      // Handle lead status update from another service
      logger.info(`Processing lead status update for ${data.leadId}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for lead event: ${event}`);
  }
};

// Process contact events
const processContactEvent = async (message) => {
  const { event, data } = message;
  
  switch (event) {
    case 'contact.processed':
      // Handle contact processing from another service
      logger.info(`Processing contact processed event for ${data.contactId}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for contact event: ${event}`);
  }
};

// Publish message to Kafka
const publishMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        { 
          value: JSON.stringify(message),
          headers: {
            'source': 'lead-service',
            'timestamp': Date.now().toString(),
          }
        },
      ],
    });
    
    logger.info(`Message published to topic ${topic}`, { message });
    return true;
  } catch (error) {
    logger.error(`Error publishing message to Kafka: ${error.message}`, { error, topic, message });
    return false;
  }
};

module.exports = {
  setupKafka,
  publishMessage,
  kafka,
  producer,
  consumer,
};
