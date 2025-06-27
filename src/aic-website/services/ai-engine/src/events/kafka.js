const { Kafka } = require('kafkajs');
const { logger } = require('../utils/logger');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'ai-engine',
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
  groupId: 'ai-engine-group',
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
      topics: ['user-events', 'content-events', 'lead-events', 'ai-events'],
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
            case 'content-events':
              await processContentEvent(messageValue);
              break;
            case 'lead-events':
              await processLeadEvent(messageValue);
              break;
            case 'ai-events':
              await processAiEvent(messageValue);
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
          topics: ['user-events', 'content-events', 'lead-events', 'ai-events'],
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
      // Handle user creation - potentially create user embedding
      logger.info(`Processing user created event for ${data.email}`);
      // Implementation here
      break;
    case 'user.updated':
      // Handle user update - potentially update user embedding
      logger.info(`Processing user updated event for ${data.email}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for user event: ${event}`);
  }
};

// Process content events
const processContentEvent = async (message) => {
  const { event, data } = message;
  
  switch (event) {
    case 'article.created':
    case 'article.updated':
      // Handle article creation/update - potentially create/update content embedding
      logger.info(`Processing article event: ${event} for ${data.articleId}`);
      // Implementation here
      break;
    case 'page.created':
    case 'page.updated':
      // Handle page creation/update - potentially create/update content embedding
      logger.info(`Processing page event: ${event} for ${data.pageId}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for content event: ${event}`);
  }
};

// Process lead events
const processLeadEvent = async (message) => {
  const { event, data } = message;
  
  switch (event) {
    case 'lead.created':
      // Handle lead creation - potentially analyze lead
      logger.info(`Processing lead created event for ${data.leadId}`);
      // Implementation here
      break;
    case 'lead.updated':
      // Handle lead update - potentially update lead analysis
      logger.info(`Processing lead updated event for ${data.leadId}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for lead event: ${event}`);
  }
};

// Process AI events
const processAiEvent = async (message) => {
  const { event, data } = message;
  
  switch (event) {
    case 'ai.model-updated':
      // Handle AI model update
      logger.info(`Processing AI model update event for ${data.modelId}`);
      // Implementation here
      break;
    default:
      logger.info(`No handler for AI event: ${event}`);
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
            'source': 'ai-engine',
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
