const cron = require('node-cron');
const { logger } = require('../utils/logger');
const { leadScoreUpdateJob } = require('./lead-score-update');
const { leadFollowupReminderJob } = require('./lead-followup-reminder');
const { inactiveLeadJob } = require('./inactive-lead');

/**
 * Start all scheduled jobs
 */
const startScheduledJobs = () => {
  try {
    // Update lead scores daily at 1:00 AM
    cron.schedule('0 1 * * *', async () => {
      logger.info('Running lead score update job');
      try {
        await leadScoreUpdateJob();
        logger.info('Lead score update job completed successfully');
      } catch (error) {
        logger.error(`Lead score update job failed: ${error.message}`, { error });
      }
    });
    
    // Send followup reminders daily at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
      logger.info('Running lead followup reminder job');
      try {
        await leadFollowupReminderJob();
        logger.info('Lead followup reminder job completed successfully');
      } catch (error) {
        logger.error(`Lead followup reminder job failed: ${error.message}`, { error });
      }
    });
    
    // Check for inactive leads weekly on Monday at 2:00 AM
    cron.schedule('0 2 * * 1', async () => {
      logger.info('Running inactive lead job');
      try {
        await inactiveLeadJob();
        logger.info('Inactive lead job completed successfully');
      } catch (error) {
        logger.error(`Inactive lead job failed: ${error.message}`, { error });
      }
    });
    
    logger.info('All scheduled jobs started');
  } catch (error) {
    logger.error(`Error starting scheduled jobs: ${error.message}`, { error });
  }
};

module.exports = {
  startScheduledJobs,
};
