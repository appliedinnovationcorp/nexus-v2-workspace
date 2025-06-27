const redis = require('redis');
const { logger } = require('../utils/logger');

let redisClient;

const setupRedis = async () => {
  try {
    // Create Redis client
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    
    // Handle Redis errors
    redisClient.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`, { err });
    });
    
    // Handle Redis connection
    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });
    
    // Handle Redis reconnection
    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting');
    });
    
    // Handle Redis ready
    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });
    
    // Connect to Redis
    await redisClient.connect();
    
    // Handle process termination
    process.on('SIGINT', async () => {
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed due to app termination');
      }
    });
    
    return redisClient;
  } catch (error) {
    logger.error(`Error connecting to Redis: ${error.message}`, { error });
    throw error;
  }
};

const getRedisClient = () => {
  return redisClient;
};

module.exports = {
  setupRedis,
  getRedisClient,
};
