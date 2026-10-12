const express = require('express');
const chatController = require('../controllers/chatController');
const { validateChatRequest } = require('../middlewares/validateRequest');

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Get API health status and configuration info
 * @access  Public
 */
router.get('/health', (req, res) => chatController.getHealth(req, res));

/**
 * @route   POST /api/chat
 * @desc    Accept user prompt and return Gemini AI response
 * @access  Public
 */
router.post('/chat', validateChatRequest, (req, res, next) =>
  chatController.handleChat(req, res, next)
);

module.exports = router;
