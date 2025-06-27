const { publishMessage } = require('./kafka');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Publish user-related events to Kafka
 * @param {string} event - Event type
 * @param {object} data - Event data
 * @returns {Promise<boolean>} - Success status
 */
const publishUserEvent = async (event, data) => {
  try {
    const message = {
      id: uuidv4(),
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'user-service',
    };
    
    return await publishMessage('user-events', message);
  } catch (error) {
    logger.error(`Error publishing user event: ${error.message}`, { error, event, data });
    return false;
  }
};

module.exports = {
  publishUserEvent,
};
