const geminiService = require('../services/geminiService');
const config = require('../config/env');

/**
 * Controller for Chat API routes
 */
class ChatController {
  /**
   * Handle incoming user prompt and return Gemini AI response
   */
  async handleChat(req, res, next) {
    try {
      const {
        prompt,
        conversationHistory = [],
        systemInstruction,
        model,
        timeoutMs,
      } = req.body;

      const startTime = Date.now();

      const result = await geminiService.generateResponse({
        prompt,
        conversationHistory,
        systemInstruction,
        model,
        timeoutMs,
      });

      const latencyMs = Date.now() - startTime;

      return res.status(200).json({
        success: true,
        data: {
          prompt,
          response: result.text,
          model: result.model,
          finishReason: result.finishReason,
          usage: result.usage,
          latencyMs,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Health check and configuration status endpoint
   */
  getHealth(req, res) {
    return res.status(200).json({
      success: true,
      data: {
        status: 'online',
        service: 'Google Gemini Chatbot API',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        apiKeyConfigured: config.isApiKeyConfigured(),
        defaultModel: config.geminiModel,
        timeoutMs: config.geminiTimeoutMs,
        help: config.isApiKeyConfigured()
          ? 'API key is configured and ready.'
          : 'Please set your GEMINI_API_KEY in the .env file. Visit https://aistudio.google.com/app/apikey to get one.',
      },
    });
  }
}

module.exports = new ChatController();
