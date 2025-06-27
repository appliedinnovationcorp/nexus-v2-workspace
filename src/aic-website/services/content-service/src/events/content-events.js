const { publishMessage } = require('./kafka');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Publish content-related events to Kafka
 * @param {string} event - Event type
 * @param {object} data - Event data
 * @returns {Promise<boolean>} - Success status
 */
const publishContentEvent = async (event, data) => {
  try {
    const message = {
      id: uuidv4(),
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'content-service',
    };
    
    return await publishMessage('content-events', message);
  } catch (error) {
    logger.error(`Error publishing content event: ${error.message}`, { error, event, data });
    return false;
  }
};

module.exports = {
  publishContentEvent,
};
