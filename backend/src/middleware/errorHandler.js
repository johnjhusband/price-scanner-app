const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTH_ERROR') {
    super(message, 401, code);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

// Error response formatter
const formatErrorResponse = (error, includeStack = false) => {
  const response = {
    error: error.message || 'An error occurred',
    code: error.code || 'INTERNAL_ERROR',
    timestamp: new Date().toISOString(),
  };

  if (error.details) {
    response.details = error.details;
  }

  if (error.retryAfter) {
    response.retryAfter = error.retryAfter;
  }

  if (includeStack && error.stack) {
    response.stack = error.stack.split('\n').map(line => line.trim());
  }

  return response;
};

// Main error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let error = err;
  
  // Log error
  logger.error({
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code,
      statusCode: err.statusCode,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      params: req.params,
      query: req.query,
      body: req.body,
      headers: {
        'user-agent': req.get('user-agent'),
        'x-forwarded-for': req.get('x-forwarded-for'),
      },
    },
    user: req.user?.id,
    ip: req.ip,
  });

  // Handle specific error types
  if (err.name === 'ValidationError' && err.errors) {
    // Mongoose validation error
    const details = Object.keys(err.errors).reduce((acc, key) => {
      acc[key] = err.errors[key].message;
      return acc;
    }, {});
    error = new ValidationError('Validation failed', details);
  } else if (err.name === 'MongoError' && err.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(err.keyPattern)[0];
    error = new ValidationError(`${field} already exists`);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token', 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
  } else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new ValidationError('File too large');
    } else {
      error = new ValidationError(`Upload error: ${err.message}`);
    }
  } else if (err.code === 'ECONNREFUSED') {
    error = new AppError('Service temporarily unavailable', 503, 'SERVICE_UNAVAILABLE');
  }

  // Ensure error has statusCode
  const statusCode = error.statusCode || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Send error response
  res.status(statusCode).json(
    formatErrorResponse(
      error,
      !isProduction && !error.isOperational
    )
  );
};

// 404 handler
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Endpoint');
  next(error);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error monitoring integration
const initializeErrorMonitoring = () => {
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app: require('express')() }),
      ],
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      beforeSend(event, hint) {
        // Filter out expected errors
        if (event.exception) {
          const error = hint.originalException;
          if (error && error.isOperational) {
            return null; // Don't send operational errors to Sentry
          }
        }
        return event;
      },
    });

    return Sentry;
  }
  
  return null;
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
  initializeErrorMonitoring,
};