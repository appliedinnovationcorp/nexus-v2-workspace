const { StatusCodes } = require('http-status-codes');
const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let customError = {
    // Set default
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, please try again later',
  };

  // Log error
  logger.error(`${err.name}: ${err.message}`, { 
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.userId || 'unauthenticated'
  });

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    customError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ');
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle Mongoose duplicate key error
  if (err.code && err.code === 11000) {
    customError.msg = `Duplicate value entered for ${Object.keys(
      err.keyValue
    )} field, please choose another value`;
    customError.statusCode = StatusCodes.BAD_REQUEST;
  }

  // Handle Mongoose cast error
  if (err.name === 'CastError') {
    customError.msg = `No item found with id: ${err.value}`;
    customError.statusCode = StatusCodes.NOT_FOUND;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    customError.msg = 'Invalid token. Please log in again.';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  if (err.name === 'TokenExpiredError') {
    customError.msg = 'Your token has expired. Please log in again.';
    customError.statusCode = StatusCodes.UNAUTHORIZED;
  }

  return res.status(customError.statusCode).json({ msg: customError.msg });
};

module.exports = { errorHandler };
