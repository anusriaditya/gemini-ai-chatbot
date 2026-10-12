/**
 * Custom application error classes for standardized error responses
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Gemini API key is invalid or not configured.', details = null) {
    super(message, 401, 'AUTHENTICATION_ERROR', details);
  }
}

class TimeoutError extends AppError {
  constructor(message = 'AI service request timed out.', details = null) {
    super(message, 504, 'GATEWAY_TIMEOUT', details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Google Gemini API rate limit or quota exceeded.', details = null) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', details);
  }
}

class ServiceUnavailableError extends AppError {
  constructor(message = 'Google Gemini API is currently unavailable.', details = null) {
    super(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  TimeoutError,
  RateLimitError,
  ServiceUnavailableError,
};
