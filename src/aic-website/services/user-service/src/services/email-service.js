const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Send verification email
 * @param {Object} options - Email options
 * @param {string} options.name - Recipient name
 * @param {string} options.email - Recipient email
 * @param {string} options.verificationToken - Verification token
 * @param {string} options.origin - Origin URL
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async ({ name, email, verificationToken, origin }) => {
  // In a real implementation, this would connect to an email service
  // For now, we'll just log the email details and make a mock API call
  
  const verificationUrl = `${origin}/verify-email?token=${verificationToken}&email=${email}`;
  
  // Email content
  const message = `
    <h1>Hello, ${name}</h1>
    <p>Please verify your email by clicking on the following link:</p>
    <a href="${verificationUrl}" target="_blank">Verify Email</a>
  `;
  
  try {
    // In production, replace with actual email service integration
    if (process.env.EMAIL_SERVICE_URL) {
      await axios.post(process.env.EMAIL_SERVICE_URL, {
        to: email,
        subject: 'Email Verification',
        html: message,
      });
      logger.info(`Verification email sent to ${email}`);
    } else {
      // Mock email sending for development
      logger.info(`[MOCK EMAIL] Verification email to: ${email}`);
      logger.info(`[MOCK EMAIL] Verification URL: ${verificationUrl}`);
    }
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`, { error });
    // Don't throw error to prevent registration failure
    // In production, consider implementing a retry mechanism or queue
  }
};

/**
 * Send reset password email
 * @param {Object} options - Email options
 * @param {string} options.name - Recipient name
 * @param {string} options.email - Recipient email
 * @param {string} options.token - Reset token
 * @param {string} options.origin - Origin URL
 * @returns {Promise<void>}
 */
const sendResetPasswordEmail = async ({ name, email, token, origin }) => {
  // In a real implementation, this would connect to an email service
  // For now, we'll just log the email details and make a mock API call
  
  const resetUrl = `${origin}/reset-password?token=${token}&email=${email}`;
  
  // Email content
  const message = `
    <h1>Hello, ${name}</h1>
    <p>Please reset your password by clicking on the following link:</p>
    <a href="${resetUrl}" target="_blank">Reset Password</a>
    <p>This link will expire in 10 minutes.</p>
  `;
  
  try {
    // In production, replace with actual email service integration
    if (process.env.EMAIL_SERVICE_URL) {
      await axios.post(process.env.EMAIL_SERVICE_URL, {
        to: email,
        subject: 'Password Reset',
        html: message,
      });
      logger.info(`Password reset email sent to ${email}`);
    } else {
      // Mock email sending for development
      logger.info(`[MOCK EMAIL] Password reset email to: ${email}`);
      logger.info(`[MOCK EMAIL] Reset URL: ${resetUrl}`);
    }
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`, { error });
    // Don't throw error to prevent reset failure
    // In production, consider implementing a retry mechanism or queue
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
