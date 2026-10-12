const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.port, () => {
  const isKeyReady = config.isApiKeyConfigured();

  console.log('\n============================================================');
  console.log('       Google Gemini AI Chatbot Integration Server         ');
  console.log('============================================================');
  console.log(` Status:            ONLINE`);
  console.log(` Server URL:        http://localhost:${config.port}`);
  console.log(` Web Demo & Widget: http://localhost:${config.port}/`);
  console.log(` REST Endpoint:     POST http://localhost:${config.port}/api/chat`);
  console.log(` Health Check:      GET  http://localhost:${config.port}/api/health`);
  console.log(` Default Model:     ${config.geminiModel}`);
  console.log(` Request Timeout:   ${config.geminiTimeoutMs}ms`);
  console.log(` Gemini API Key:    ${isKeyReady ? 'Configured [OK]' : 'NOT CONFIGURED [ACTION REQUIRED]'}`);

  if (!isKeyReady) {
    console.log('\n >> Quick Step to Activate Gemini:');
    console.log(' 1. Get a free API key at: https://aistudio.google.com/app/apikey');
    console.log(' 2. Open the .env file and set: GEMINI_API_KEY=your_key_here');
    console.log(' 3. Restart or send a request!');
  }
  console.log('============================================================\n');
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed successfully. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
