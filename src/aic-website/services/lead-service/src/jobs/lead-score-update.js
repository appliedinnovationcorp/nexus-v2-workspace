const Lead = require('../models/lead');
const { logger } = require('../utils/logger');
const { publishLeadEvent } = require('../events/lead-events');

/**
 * Job to update lead scores based on various factors
 */
const leadScoreUpdateJob = async () => {
  try {
    // Get all active leads
    const leads = await Lead.find({
      status: { $nin: ['won', 'lost', 'inactive'] }
    });
    
    logger.info(`Updating scores for ${leads.length} leads`);
    
    let updatedCount = 0;
    
    // Process each lead
    for (const lead of leads) {
      // The pre-save hook in the Lead model will recalculate the score
      // We just need to save the lead to trigger it
      
      // Add a small random factor to simulate changing conditions
      // This is just for demonstration purposes
      const randomFactor = Math.floor(Math.random() * 5) - 2; // -2 to +2
      
      // Store old score for comparison
      const oldScore = lead.score;
      
      // Save lead to trigger score recalculation
      await lead.save();
      
      // If score changed significantly, publish event
      if (Math.abs(lead.score - oldScore) >= 5) {
        await publishLeadEvent('lead.score-changed', {
          leadId: lead._id.toString(),
          email: lead.email,
          oldScore,
          newScore: lead.score,
        });
        
        updatedCount++;
      }
    }
    
    logger.info(`Updated scores for ${updatedCount} leads with significant changes`);
    
  } catch (error) {
    logger.error(`Error in lead score update job: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  leadScoreUpdateJob,
};
