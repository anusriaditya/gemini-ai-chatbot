const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  geminiApiKey: process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.trim() : '',
  geminiModel: process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.trim() : 'gemini-2.5-flash',
  geminiTimeoutMs: parseInt(process.env.GEMINI_TIMEOUT_MS, 10) || 25000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isApiKeyConfigured() {
    return Boolean(this.geminiApiKey && this.geminiApiKey !== 'your_gemini_api_key_here');
  }
};

module.exports = config;
