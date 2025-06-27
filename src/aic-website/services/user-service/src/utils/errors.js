const { StatusCodes } = require('http-status-codes');

class CustomAPIError extends Error {
  constructor(message) {
    super(message);
  }
}

class BadRequestError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.BAD_REQUEST;
    this.name = 'BadRequestError';
  }
}

class NotFoundError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.NOT_FOUND;
    this.name = 'NotFoundError';
  }
}

class UnauthenticatedError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.UNAUTHORIZED;
    this.name = 'UnauthenticatedError';
  }
}

class ForbiddenError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.FORBIDDEN;
    this.name = 'ForbiddenError';
  }
}

class ConflictError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.CONFLICT;
    this.name = 'ConflictError';
  }
}

class TooManyRequestsError extends CustomAPIError {
  constructor(message) {
    super(message);
    this.statusCode = StatusCodes.TOO_MANY_REQUESTS;
    this.name = 'TooManyRequestsError';
  }
}

class InternalServerError extends CustomAPIError {
  constructor(message) {
    super(message || 'Internal server error');
    this.statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
    this.name = 'InternalServerError';
  }
}

module.exports = {
  CustomAPIError,
  BadRequestError,
  NotFoundError,
  UnauthenticatedError,
  ForbiddenError,
  ConflictError,
  TooManyRequestsError,
  InternalServerError,
};
