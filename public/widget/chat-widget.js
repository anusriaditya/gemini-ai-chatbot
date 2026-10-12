/**
 * Google Gemini AI Chatbot Embeddable Widget
 * Zero-dependency, lightweight, vanilla JavaScript
 */
(function () {
  'use strict';

  // Config options (can be overridden by window.ChatbotWidgetConfig)
  const config = Object.assign(
    {
      apiEndpoint: '/api/chat',
      healthEndpoint: '/api/health',
      botName: 'AI Assistant',
      botSubtitle: 'Powered by Gemini 2.5 Flash',
      welcomeMessage:
        "👋 Hello there! I'm your interactive AI Assistant powered by Google Gemini. Ask me anything about this site, projects, skills, or general questions!",
      suggestions: [
        'Tell me about your featured projects 🚀',
        'What are your primary technical skills? 💻',
        'Explain how this Gemini integration works 🧠',
        'How can I get in touch with you? 📬',
      ],
      systemInstruction:
        'You are an intelligent, friendly AI assistant embedded on a developer portfolio and blog website. Provide helpful, concise, well-formatted markdown responses.',
    },
    window.ChatbotWidgetConfig || {}
  );

  let isOpen = false;
  let isLoading = false;
  let conversationHistory = [];

  // Minimal Markdown Formatter
  function formatMarkdown(text) {
    if (!text) return '';
    let escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Code blocks ```code```
    escaped = escaped.replace(/```([\s\S]*?)```/g, function (match, p1) {
      return '<pre><code>' + p1.trim() + '</code></pre>';
    });

    // Inline code `code`
    escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold **text**
    escaped = escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic *text*
    escaped = escaped.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Split paragraphs / linebreaks
    const lines = escaped.split('\n');
    let inList = false;
    let output = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          output += '<ul>';
          inList = true;
        }
        output += '<li>' + line.substring(2) + '</li>';
      } else if (/^\d+\.\s/.test(line)) {
        if (!inList) {
          output += '<ol>';
          inList = true;
        }
        output += '<li>' + line.replace(/^\d+\.\s/, '') + '</li>';
      } else {
        if (inList) {
          output += '</ul>';
          inList = false;
        }
        if (line.length > 0) {
          output += '<p>' + line + '</p>';
        }
      }
    }

    if (inList) output += '</ul>';
    return output;
  }

  // Create UI DOM elements
  function initWidget() {
    // 1. Launcher button
    const launcher = document.createElement('button');
    launcher.className = 'cw-launcher-button';
    launcher.setAttribute('aria-label', 'Open Gemini AI Chat');
    launcher.innerHTML = `
      <svg class="cw-launcher-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
      <span class="cw-launcher-badge"></span>
    `;

    // 2. Chat window container
    const container = document.createElement('div');
    container.className = 'cw-container';
    container.innerHTML = `
      <div class="cw-header">
        <div class="cw-header-info">
          <div class="cw-header-avatar">✨</div>
          <div>
            <h3 class="cw-header-title">${config.botName}</h3>
            <p class="cw-header-subtitle">
              <span class="cw-status-dot"></span>
              ${config.botSubtitle}
            </p>
          </div>
        </div>
        <div class="cw-header-actions">
          <button class="cw-header-btn cw-clear-btn" title="Clear conversation" aria-label="Clear chat">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button class="cw-header-btn cw-close-btn" title="Close chat" aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div class="cw-messages" id="cwMessagesList">
        <!-- Initial bot greeting -->
        <div class="cw-message cw-bot">
          <div class="cw-bubble-avatar">✨</div>
          <div class="cw-bubble-content">
            <p>${config.welcomeMessage}</p>
            <div class="cw-suggestions" id="cwSuggestionsBox">
              ${config.suggestions
                .map(
                  (text) =>
                    `<button class="cw-chip" data-prompt="${text}">${text} <span>→</span></button>`
                )
                .join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="cw-footer">
        <form class="cw-input-row" id="cwChatForm">
          <input
            type="text"
            class="cw-input"
            id="cwInputPrompt"
            placeholder="Ask anything or explore..."
            autocomplete="off"
            required
          />
          <button type="submit" class="cw-send-btn" id="cwSendBtn" aria-label="Send message">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div class="cw-disclaimer">
          ⚡ Powered by Gemini API • JSON REST Integration
        </div>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(container);

    // Elements
    const closeBtn = container.querySelector('.cw-close-btn');
    const clearBtn = container.querySelector('.cw-clear-btn');
    const form = container.querySelector('#cwChatForm');
    const input = container.querySelector('#cwInputPrompt');
    const sendBtn = container.querySelector('#cwSendBtn');
    const messagesList = container.querySelector('#cwMessagesList');
    const suggestionsBox = container.querySelector('#cwSuggestionsBox');

    // Toggle open/close
    function toggleChat(state) {
      isOpen = typeof state === 'boolean' ? state : !isOpen;
      if (isOpen) {
        container.classList.add('cw-open');
        input.focus();
      } else {
        container.classList.remove('cw-open');
      }
    }

    launcher.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    // Clear chat
    clearBtn.addEventListener('click', () => {
      conversationHistory = [];
      messagesList.innerHTML = `
        <div class="cw-message cw-bot">
          <div class="cw-bubble-avatar">✨</div>
          <div class="cw-bubble-content">
            <p>Chat history cleared! How can I assist you now?</p>
            <div class="cw-suggestions" id="cwSuggestionsBox">
              ${config.suggestions
                .map(
                  (text) =>
                    `<button class="cw-chip" data-prompt="${text}">${text} <span>→</span></button>`
                )
                .join('')}
            </div>
          </div>
        </div>
      `;
      bindSuggestions();
    });

    // Append user message
    function appendUserMessage(text) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'cw-message cw-user';
      msgDiv.innerHTML = `
        <div class="cw-bubble-content">
          ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
        </div>
      `;
      messagesList.appendChild(msgDiv);
      scrollToBottom();
    }

    // Append bot message
    function appendBotMessage(rawText) {
      const msgDiv = document.createElement('div');
      msgDiv.className = 'cw-message cw-bot';
      msgDiv.innerHTML = `
        <div class="cw-bubble-avatar">✨</div>
        <div class="cw-bubble-content">
          ${formatMarkdown(rawText)}
        </div>
      `;
      messagesList.appendChild(msgDiv);
      scrollToBottom();
    }

    // Append error alert
    function appendErrorAlert(message, isWarning = false) {
      const alertDiv = document.createElement('div');
      alertDiv.className = `cw-alert ${isWarning ? 'cw-alert-warning' : 'cw-alert-error'}`;
      alertDiv.innerHTML = `
        <span>⚠️</span>
        <div><strong>${isWarning ? 'Notice' : 'Error'}:</strong> ${message}</div>
      `;
      messagesList.appendChild(alertDiv);
      scrollToBottom();
    }

    // Show/hide typing indicator
    let typingIndicatorElem = null;
    function showTypingIndicator() {
      if (typingIndicatorElem) return;
      typingIndicatorElem = document.createElement('div');
      typingIndicatorElem.className = 'cw-message cw-bot';
      typingIndicatorElem.innerHTML = `
        <div class="cw-bubble-avatar">✨</div>
        <div class="cw-typing-indicator">
          <div class="cw-dot"></div>
          <div class="cw-dot"></div>
          <div class="cw-dot"></div>
        </div>
      `;
      messagesList.appendChild(typingIndicatorElem);
      scrollToBottom();
    }

    function hideTypingIndicator() {
      if (typingIndicatorElem) {
        typingIndicatorElem.remove();
        typingIndicatorElem = null;
      }
    }

    function scrollToBottom() {
      messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Send prompt to backend
    async function sendMessage(promptText) {
      if (!promptText || isLoading) return;
      isLoading = true;
      sendBtn.disabled = true;
      input.disabled = true;

      // Add to UI
      appendUserMessage(promptText);
      showTypingIndicator();

      try {
        const response = await fetch(config.apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: promptText,
            conversationHistory: conversationHistory,
            systemInstruction: config.systemInstruction,
          }),
        });

        const data = await response.json();
        hideTypingIndicator();

        if (response.ok && data.success && data.data) {
          const botReply = data.data.response;
          appendBotMessage(botReply);

          // Update conversation history
          conversationHistory.push({ role: 'user', text: promptText });
          conversationHistory.push({ role: 'model', text: botReply });
        } else {
          // Handled error from API
          const errorMsg =
            data.error?.message ||
            'Something went wrong while processing your request.';
          appendErrorAlert(errorMsg, response.status === 401);
        }
      } catch (err) {
        hideTypingIndicator();
        appendErrorAlert(
          'Could not connect to the chatbot server. Please ensure the Express server is running on ' +
            window.location.origin
        );
      } finally {
        isLoading = false;
        sendBtn.disabled = false;
        input.disabled = false;
        input.value = '';
        input.focus();
        scrollToBottom();
      }
    }

    // Form submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (text) {
        sendMessage(text);
      }
    });

    // Bind suggestion chips
    function bindSuggestions() {
      const chips = container.querySelectorAll('.cw-chip');
      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          const prompt = chip.getAttribute('data-prompt');
          if (prompt) {
            sendMessage(prompt);
          }
        });
      });
    }
    bindSuggestions();

    // Check health status on load
    fetch(config.healthEndpoint)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && !res.data.apiKeyConfigured) {
          console.warn(
            '[Gemini Chatbot] API Key is not yet configured in .env. Get a free key at https://aistudio.google.com/app/apikey'
          );
        }
      })
      .catch(() => {});
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
