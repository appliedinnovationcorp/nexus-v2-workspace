const Lead = require('../models/lead');
const { logger } = require('../utils/logger');
const { sendLeadAssignmentEmail } = require('../services/email-service');
const moment = require('moment');

/**
 * Job to send reminders for leads that need followup
 */
const leadFollowupReminderJob = async () => {
  try {
    // Get current date
    const now = new Date();
    
    // Find leads that need followup today
    const leadsNeedingFollowup = await Lead.find({
      nextContactDate: {
        $gte: moment(now).startOf('day').toDate(),
        $lte: moment(now).endOf('day').toDate(),
      },
      status: { $nin: ['won', 'lost', 'inactive'] },
      assignedTo: { $ne: null },
    }).populate('assignedTo', 'firstName lastName email');
    
    logger.info(`Found ${leadsNeedingFollowup.length} leads needing followup today`);
    
    // Send reminders for each lead
    for (const lead of leadsNeedingFollowup) {
      if (lead.assignedTo && lead.assignedTo.email) {
        await sendLeadAssignmentEmail({
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadEmail: lead.email,
          assigneeName: lead.assignedTo.firstName,
          assigneeEmail: lead.assignedTo.email,
        });
        
        logger.info(`Sent followup reminder for lead ${lead._id} to ${lead.assignedTo.email}`);
      }
    }
    
    // Find leads that haven't been contacted in 7 days
    const sevenDaysAgo = moment(now).subtract(7, 'days').toDate();
    
    const neglectedLeads = await Lead.find({
      lastContactDate: { $lt: sevenDaysAgo },
      status: { $nin: ['won', 'lost', 'inactive'] },
      assignedTo: { $ne: null },
    }).populate('assignedTo', 'firstName lastName email');
    
    logger.info(`Found ${neglectedLeads.length} neglected leads (no contact in 7+ days)`);
    
    // Send reminders for neglected leads
    for (const lead of neglectedLeads) {
      if (lead.assignedTo && lead.assignedTo.email) {
        await sendLeadAssignmentEmail({
          leadName: `${lead.firstName} ${lead.lastName}`,
          leadEmail: lead.email,
          assigneeName: lead.assignedTo.firstName,
          assigneeEmail: lead.assignedTo.email,
        });
        
        logger.info(`Sent neglected lead reminder for lead ${lead._id} to ${lead.assignedTo.email}`);
      }
    }
    
  } catch (error) {
    logger.error(`Error in lead followup reminder job: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  leadFollowupReminderJob,
};
