const sharp = require('sharp');
const { logger } = require('../utils/logger');

/**
 * Process image - resize, optimize, and create thumbnail
 * @param {Buffer} buffer - Image buffer
 * @returns {Promise<object>} - Processed image data
 */
const processImage = async (buffer) => {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    // Determine if image needs resizing
    const maxWidth = 2000;
    const maxHeight = 2000;
    
    let width = metadata.width;
    let height = metadata.height;
    let resizedBuffer = buffer;
    
    // Resize if image is too large
    if (width > maxWidth || height > maxHeight) {
      const resizeOptions = {};
      
      if (width > height) {
        resizeOptions.width = maxWidth;
      } else {
        resizeOptions.height = maxHeight;
      }
      
      resizedBuffer = await sharp(buffer)
        .resize(resizeOptions)
        .withMetadata()
        .toBuffer();
      
      // Update dimensions
      const resizedMetadata = await sharp(resizedBuffer).metadata();
      width = resizedMetadata.width;
      height = resizedMetadata.height;
      
      logger.info(`Image resized from ${metadata.width}x${metadata.height} to ${width}x${height}`);
    }
    
    // Create thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize({
        width: 300,
        height: 300,
        fit: 'inside',
      })
      .withMetadata()
      .toBuffer();
    
    return {
      buffer: resizedBuffer,
      width,
      height,
      format: metadata.format,
      thumbnailBuffer,
    };
  } catch (error) {
    logger.error(`Error processing image: ${error.message}`, { error });
    throw error;
  }
};

module.exports = {
  processImage,
};
