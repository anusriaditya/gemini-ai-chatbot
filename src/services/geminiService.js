const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const {
  AppError,
  AuthenticationError,
  TimeoutError,
  RateLimitError,
} = require('../utils/errors');

/**
 * Service to manage interactions with the Google Gemini API
 */
class GeminiService {
  constructor() {
    this.client = null;
  }

  /**
   * Lazily initialize Google Generative AI client
   */
  getClient() {
    if (!config.isApiKeyConfigured()) {
      throw new AuthenticationError(
        'Gemini API key is not configured. Please generate a free key at https://aistudio.google.com/app/apikey and set GEMINI_API_KEY in your .env file.'
      );
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return this.client;
  }

  /**
   * Helper to execute a promise with a timeout
   * @param {Promise} promise 
   * @param {number} timeoutMs 
   * @returns {Promise}
   */
  withTimeout(promise, timeoutMs = config.geminiTimeoutMs) {
    let timer;
    const timeoutPromise = new Promise((_, reject) => {
      timer = setTimeout(() => {
        reject(
          new TimeoutError(
            `Gemini API request timed out after ${timeoutMs}ms. Please try again.`
          )
        );
      }, timeoutMs);
      if (timer.unref) timer.unref();
    });

    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timer);
    });
  }

  /**
   * Format conversation history to Gemini-compatible structure
   * @param {Array} history - Array of { role: 'user' | 'model' | 'assistant', text: string }
   * @returns {Array}
   */
  formatHistory(history) {
    if (!Array.isArray(history)) return [];

    return history
      .filter((item) => item && (item.text || item.content))
      .map((item) => {
        const rawRole = (item.role || 'user').toLowerCase();
        // Gemini expects 'user' or 'model'
        const role = rawRole === 'assistant' || rawRole === 'bot' ? 'model' : 'user';
        const text = (item.text || item.content || '').trim();
        return {
          role,
          parts: [{ text }],
        };
      });
  }

  /**
   * Send a prompt (and optional history) to Gemini
   * @param {Object} options
   * @param {string} options.prompt - The user's input prompt
   * @param {Array} [options.conversationHistory] - Optional list of previous messages
   * @param {string} [options.systemInstruction] - Optional system instructions / persona
   * @param {string} [options.model] - Optional Gemini model name
   * @param {number} [options.timeoutMs] - Optional request timeout
   * @returns {Promise<Object>}
   */
  async generateResponse({
    prompt,
    conversationHistory = [],
    systemInstruction,
    model: requestedModel,
    timeoutMs,
  }) {
    const client = this.getClient();
    const modelName = requestedModel || config.geminiModel;

    const modelOptions = {
      model: modelName,
    };

    if (systemInstruction && typeof systemInstruction === 'string' && systemInstruction.trim()) {
      modelOptions.systemInstruction = systemInstruction.trim();
    }

    try {
      const model = client.getGenerativeModel(modelOptions);

      const apiCall = (async () => {
        const formattedHistory = this.formatHistory(conversationHistory);

        let result;
        if (formattedHistory.length > 0) {
          // Multi-turn chat
          const chat = model.startChat({
            history: formattedHistory,
          });
          result = await chat.sendMessage(prompt);
        } else {
          // Single turn request
          result = await model.generateContent(prompt);
        }

        const response = await result.response;
        const candidates = response.candidates || [];

        // Check for safety finish reason
        if (candidates.length > 0) {
          const firstCandidate = candidates[0];
          if (firstCandidate.finishReason === 'SAFETY') {
            return {
              text: 'I cannot provide a response to this query because it was flagged by safety guidelines.',
              finishReason: 'SAFETY',
              model: modelName,
              usage: null,
            };
          }
        }

        const responseText = response.text ? response.text() : '';
        const usageMetadata = response.usageMetadata || null;

        // Gracefully handle empty response
        const cleanText = responseText && responseText.trim().length > 0
          ? responseText.trim()
          : 'I received an empty response from the AI model. Please try refining your question.';

        return {
          text: cleanText,
          finishReason: candidates[0]?.finishReason || 'STOP',
          model: modelName,
          usage: usageMetadata
            ? {
                promptTokens: usageMetadata.promptTokenCount || 0,
                candidatesTokens: usageMetadata.candidatesTokenCount || 0,
                totalTokens: usageMetadata.totalTokenCount || 0,
              }
            : null,
        };
      })();

      return await this.withTimeout(apiCall, timeoutMs || config.geminiTimeoutMs);
    } catch (err) {
      this.handleGeminiError(err);
    }
  }

  /**
   * Maps Gemini SDK and network errors to standardized AppError subclasses
   * @param {Error} err 
   */
  handleGeminiError(err) {
    if (err instanceof AppError) {
      throw err;
    }

    const message = err.message || '';

    // Authentication / Invalid API key
    if (
      message.includes('API_KEY_INVALID') ||
      message.includes('API key not valid') ||
      message.includes('PERMISSION_DENIED')
    ) {
      throw new AuthenticationError(
        'Invalid Google Gemini API key. Please verify your GEMINI_API_KEY in the .env file.'
      );
    }

    // Rate limits / Quota exhaustion
    if (
      message.includes('RESOURCE_EXHAUSTED') ||
      message.includes('429') ||
      message.toLowerCase().includes('quota')
    ) {
      throw new RateLimitError(
        'Google Gemini rate limit or quota exceeded. Please wait a few moments before sending another prompt.'
      );
    }

    // Model not found or unsupported
    if (message.includes('models/') && message.includes('not found')) {
      throw new AppError(
        `Gemini model was not found: ${err.message}. Consider using '${config.geminiModel}'.`,
        404,
        'MODEL_NOT_FOUND'
      );
    }

    // Default error
    throw new AppError(
      `Gemini AI service error: ${message}`,
      err.status || 500,
      'AI_SERVICE_ERROR',
      err.stack && config.nodeEnv === 'development' ? err.stack : undefined
    );
  }
}

module.exports = new GeminiService();
