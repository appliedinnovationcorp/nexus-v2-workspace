const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Send notification email about new contact form submission
 * @param {Object} options - Email options
 * @param {string} options.subject - Email subject
 * @param {string} options.name - Contact name
 * @param {string} options.email - Contact email
 * @param {string} options.message - Contact message
 * @param {string} options.service - Requested service
 * @returns {Promise<void>}
 */
const sendNotificationEmail = async ({ subject, name, email, message, service }) => {
  // In a real implementation, this would connect to an email service
  // For now, we'll just log the email details and make a mock API call
  
  // Email content
  const emailContent = `
    <h1>New Contact Form Submission</h1>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Service:</strong> ${service || 'Not specified'}</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <h2>Message:</h2>
    <p>${message}</p>
  `;
  
  try {
    // In production, replace with actual email service integration
    if (process.env.EMAIL_SERVICE_URL) {
      await axios.post(process.env.EMAIL_SERVICE_URL, {
        to: process.env.NOTIFICATION_EMAIL || 'admin@example.com',
        subject: `New Contact: ${subject}`,
        html: emailContent,
      });
      logger.info(`Notification email sent about contact from ${email}`);
    } else {
      // Mock email sending for development
      logger.info(`[MOCK EMAIL] Notification email about contact from: ${email}`);
      logger.info(`[MOCK EMAIL] Subject: ${subject}`);
    }
  } catch (error) {
    logger.error(`Error sending notification email: ${error.message}`, { error });
    // Don't throw error to prevent contact form submission failure
    // In production, consider implementing a retry mechanism or queue
  }
};

/**
 * Send lead assignment notification
 * @param {Object} options - Email options
 * @param {string} options.leadName - Lead name
 * @param {string} options.leadEmail - Lead email
 * @param {string} options.assigneeName - Assignee name
 * @param {string} options.assigneeEmail - Assignee email
 * @returns {Promise<void>}
 */
const sendLeadAssignmentEmail = async ({ leadName, leadEmail, assigneeName, assigneeEmail }) => {
  // In a real implementation, this would connect to an email service
  // For now, we'll just log the email details and make a mock API call
  
  // Email content
  const emailContent = `
    <h1>New Lead Assigned to You</h1>
    <p>Hello ${assigneeName},</p>
    <p>A new lead has been assigned to you:</p>
    <p><strong>Name:</strong> ${leadName}</p>
    <p><strong>Email:</strong> ${leadEmail}</p>
    <p>Please follow up with this lead as soon as possible.</p>
  `;
  
  try {
    // In production, replace with actual email service integration
    if (process.env.EMAIL_SERVICE_URL) {
      await axios.post(process.env.EMAIL_SERVICE_URL, {
        to: assigneeEmail,
        subject: `New Lead Assigned: ${leadName}`,
        html: emailContent,
      });
      logger.info(`Lead assignment email sent to ${assigneeEmail}`);
    } else {
      // Mock email sending for development
      logger.info(`[MOCK EMAIL] Lead assignment email to: ${assigneeEmail}`);
      logger.info(`[MOCK EMAIL] Lead: ${leadName} (${leadEmail})`);
    }
  } catch (error) {
    logger.error(`Error sending lead assignment email: ${error.message}`, { error });
    // Don't throw error to prevent lead assignment failure
    // In production, consider implementing a retry mechanism or queue
  }
};

module.exports = {
  sendNotificationEmail,
  sendLeadAssignmentEmail,
};
