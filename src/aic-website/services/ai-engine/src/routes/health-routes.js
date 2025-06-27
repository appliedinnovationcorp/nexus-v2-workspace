const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { StatusCodes } = require('http-status-codes');
const { getRedisClient } = require('../config/redis');
const { checkMLModels } = require('../ml/model-loader');

// Health check endpoint
router.get('/', async (req, res) => {
  const healthcheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now()
  };
  
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      healthcheck.database = 'Connected';
    } else {
      healthcheck.database = 'Disconnected';
      healthcheck.message = 'WARNING';
    }
    
    // Check Redis connection
    const redisClient = getRedisClient();
    if (redisClient && redisClient.isReady) {
      healthcheck.redis = 'Connected';
    } else {
      healthcheck.redis = 'Disconnected';
      healthcheck.message = 'WARNING';
    }
    
    // Check ML models
    const modelsStatus = await checkMLModels();
    healthcheck.mlModels = modelsStatus;
    if (!modelsStatus.allLoaded) {
      healthcheck.message = 'WARNING';
    }
    
    res.status(StatusCodes.OK).json(healthcheck);
  } catch (error) {
    healthcheck.message = error.message;
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json(healthcheck);
  }
});

// Readiness probe endpoint
router.get('/ready', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    if (dbState !== 1) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: 'NOT_READY',
        database: 'Disconnected'
      });
    }
    
    // Check Redis connection
    const redisClient = getRedisClient();
    if (!redisClient || !redisClient.isReady) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: 'NOT_READY',
        redis: 'Disconnected'
      });
    }
    
    // Check ML models
    const modelsStatus = await checkMLModels();
    if (!modelsStatus.allLoaded) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        status: 'NOT_READY',
        mlModels: modelsStatus
      });
    }
    
    res.status(StatusCodes.OK).json({
      status: 'READY',
      database: 'Connected',
      redis: 'Connected',
      mlModels: modelsStatus
    });
  } catch (error) {
    res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      status: 'NOT_READY',
      error: error.message
    });
  }
});

// Liveness probe endpoint
router.get('/live', (req, res) => {
  res.status(StatusCodes.OK).json({
    status: 'ALIVE',
    timestamp: Date.now()
  });
});

module.exports = router;
