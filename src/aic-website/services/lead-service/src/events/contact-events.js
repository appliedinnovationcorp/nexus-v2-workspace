const { publishMessage } = require('./kafka');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Publish contact-related events to Kafka
 * @param {string} event - Event type
 * @param {object} data - Event data
 * @returns {Promise<boolean>} - Success status
 */
const publishContactEvent = async (event, data) => {
  try {
    const message = {
      id: uuidv4(),
      event,
      data,
      timestamp: new Date().toISOString(),
      source: 'lead-service',
    };
    
    return await publishMessage('contact-events', message);
  } catch (error) {
    logger.error(`Error publishing contact event: ${error.message}`, { error, event, data });
    return false;
  }
};

module.exports = {
  publishContactEvent,
};
