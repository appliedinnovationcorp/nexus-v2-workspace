const Lead = require('../models/lead');
const { logger } = require('../utils/logger');
const { publishLeadEvent } = require('../events/lead-events');
const moment = require('moment');

/**
 * Job to mark leads as inactive if they haven't been contacted in a long time
 */
const inactiveLeadJob = async () => {
  try {
    // Get date 30 days ago
    const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
    
    // Find leads that haven't been contacted in 30+ days and aren't already inactive, won, or lost
    const inactiveLeads = await Lead.find({
      lastContactDate: { $lt: thirtyDaysAgo },
      status: { $nin: ['inactive', 'won', 'lost'] },
    });
    
    logger.info(`Found ${inactiveLeads.length} leads to mark as inactive`);
    
    // Mark each lead as inactive
    for (const lead of inactiveLeads) {
      // Store original status for event
      const originalStatus = lead.status;
      
      // Update status to inactive
      lead.status = 'inactive';
      await lead.save();
      
      // Publish event
      await publishLeadEvent('lead.marked-inactive', {
        leadId: lead._id.toString(),
        email: lead.email,
        previousStatus: originalStatus,
        daysSinceLastContact: moment().diff(moment(lead.lastContactDate), 'days'),
      });
      
      logger.info(`Marked lead ${lead._id} as inactive (previous status: ${originalStatus})`);
    }
    
  } catch (error) {
    logger.error(`Error in inactive lead job: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  inactiveLeadJob,
};
