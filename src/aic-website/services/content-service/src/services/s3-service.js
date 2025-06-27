const AWS = require('aws-sdk');
const { logger } = require('../utils/logger');

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Create S3 instance
const s3 = new AWS.S3();

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} key - S3 key (path)
 * @param {string} contentType - File MIME type
 * @returns {Promise<object>} - S3 upload result
 */
const uploadToS3 = async (fileBuffer, key, contentType) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read',
    };
    
    const result = await s3.upload(params).promise();
    logger.info(`File uploaded to S3: ${result.Location}`);
    
    return result;
  } catch (error) {
    logger.error(`Error uploading to S3: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 key (path)
 * @returns {Promise<object>} - S3 delete result
 */
const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };
    
    const result = await s3.deleteObject(params).promise();
    logger.info(`File deleted from S3: ${key}`);
    
    return result;
  } catch (error) {
    logger.error(`Error deleting from S3: ${error.message}`, { error });
    throw error;
  }
};

/**
 * Get signed URL for S3 object
 * @param {string} key - S3 key (path)
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {string} - Signed URL
 */
const getSignedUrl = (key, expiresIn = 60) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Expires: expiresIn,
    };
    
    const url = s3.getSignedUrl('getObject', params);
    return url;
  } catch (error) {
    logger.error(`Error generating signed URL: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedUrl,
};
