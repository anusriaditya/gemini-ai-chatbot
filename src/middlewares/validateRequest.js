const { ValidationError } = require('../utils/errors');

/**
 * Middleware to validate incoming chat request payloads
 */
function validateChatRequest(req, res, next) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return next(
      new ValidationError(
        'Invalid request body. Expected a JSON object with a "prompt" property.'
      )
    );
  }

  const { prompt, conversationHistory, timeoutMs, model, systemInstruction } = req.body;

  // Validate prompt existence
  if (prompt === undefined || prompt === null) {
    return next(new ValidationError('Missing required field: "prompt".'));
  }

  // Validate prompt type
  if (typeof prompt !== 'string') {
    return next(new ValidationError('Field "prompt" must be a string.'));
  }

  // Validate non-empty string
  const trimmedPrompt = prompt.trim();
  if (trimmedPrompt.length === 0) {
    return next(new ValidationError('Field "prompt" cannot be empty or whitespace only.'));
  }

  // Validate length limit (30,000 characters)
  if (trimmedPrompt.length > 30000) {
    return next(
      new ValidationError(
        'Field "prompt" is too long. Maximum allowed length is 30,000 characters.'
      )
    );
  }

  // Validate optional conversationHistory
  if (conversationHistory !== undefined && !Array.isArray(conversationHistory)) {
    return next(
      new ValidationError(
        'Field "conversationHistory", if provided, must be an array of message objects.'
      )
    );
  }

  // Validate optional timeoutMs
  if (timeoutMs !== undefined) {
    const parsedTimeout = Number(timeoutMs);
    if (!Number.isInteger(parsedTimeout) || parsedTimeout <= 0 || parsedTimeout > 120000) {
      return next(
        new ValidationError(
          'Field "timeoutMs", if provided, must be a positive integer up to 120,000 milliseconds (2 minutes).'
        )
      );
    }
  }

  // Sanitize req.body.prompt to trimmed version
  req.body.prompt = trimmedPrompt;

  next();
}

module.exports = {
  validateChatRequest,
};
