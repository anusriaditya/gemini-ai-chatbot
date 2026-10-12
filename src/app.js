const path = require('path');
const express = require('express');
const cors = require('cors');
const chatRoutes = require('./routes/chatRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Enable Cross-Origin Resource Sharing (CORS) for API usage
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '5mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Lightweight request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.startsWith('/widget/') && !req.path.endsWith('.css') && !req.path.endsWith('.js')) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Serve static demonstration assets and chat widget
const publicDir = path.resolve(__dirname, '../public');
app.use(express.static(publicDir));

// Mount API routes
app.use('/api', chatRoutes);

// Handle 404 routes
app.use(notFoundHandler);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
