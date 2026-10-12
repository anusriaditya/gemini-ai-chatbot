const config = require('../config/env');
const { AppError } = require('../utils/errors');

/**
 * Centralized error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Catch bad JSON syntax errors from body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MALFORMED_JSON',
        message: 'Invalid JSON format in request body. Please check for syntax errors like missing quotes or commas.',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Handle known AppError subclasses
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Unexpected / unhandled errors
  console.error('[UNHANDLED_ERROR]', err);

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected internal server error occurred.',
      details: config.nodeEnv === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * 404 Route Not Found middleware
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested endpoint '${req.method} ${req.originalUrl}' does not exist.`,
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = {
  errorHandler,
  notFoundHandler,
};
