# 🚀 Google Gemini AI Chatbot Integration

A complete, production-ready **Node.js & Express.js REST API** integrated with the **Google Gemini API** (`gemini-2.5-flash`), paired with a modular, embeddable **Chatbot Widget** designed to drop into any portfolio, blog, or web application.

---

## 📋 Table of Contents
1. [Key Features](#-key-features)
2. [Step-by-Step: Obtain a Free Google Gemini API Key](#-step-by-step-obtain-a-free-google-gemini-api-key)
3. [Quick Start & Installation](#-quick-start--installation)
4. [Project Architecture](#-project-architecture)
5. [REST API Documentation](#-rest-api-documentation)
6. [Error Handling & Reliability](#-error-handling--reliability)
7. [Testing with Postman](#-testing-with-postman)
8. [Embedding the Chat Widget into Any Web Project](#-embedding-the-chat-widget-into-any-web-project)
9. [Automated Test Suite](#-automated-test-suite)

---

## ✨ Key Features

- **Express.js REST API**: Clean route architecture with controllers, services, and middlewares.
- **Google Gen AI Integration**: Supports `gemini-2.5-flash` with fallback, single-turn prompts, multi-turn conversation context, and custom system instructions.
- **Robust Error Handling**:
  - Request validation (`400 Bad Request` for missing/empty prompts).
  - Configurable timeouts (`504 Gateway Timeout` using `AbortController` / `Promise.race`).
  - Graceful handling of missing/invalid API keys (`401 Unauthorized`).
  - Rate limits / quota handling (`429 Too Many Requests`).
  - AI safety filter blocks and empty response guards.
- **Zero-Dependency Chat Widget**: Embeddable floating chat widget (`chat-widget.js` + `chat-widget.css`) with markdown rendering, typing animation, conversation memory, and quick prompt pills.
- **Demonstration Showcase**: Live Developer Portfolio & Tech Blog website showcasing the widget in action with an integrated interactive API playground.
- **Ready-to-Import Postman Collection**: Complete `gemini-chatbot.postman_collection.json` with 7 pre-configured requests and automated test assertions.

---

## 🔑 Step-by-Step: Obtain a Free Google Gemini API Key

Google AI Studio provides a free tier for developers with no credit card required to get started.

1. **Visit Google AI Studio**: Go to [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
2. **Sign In**: Log in using your Google account.
3. **Generate Key**: Click the blue button labeled **"Create API key"** (or **"Get API key"**).
4. **Choose Project**: Select **"Create API key in new project"** (or choose an existing Google Cloud project).
5. **Copy Key**: Copy the generated string (starts with `AIzaSy...`).
6. **Configure in Project**: Open `.env` in the project root and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSyYourGeneratedKeyHere
   ```

---

## ⚡ Quick Start & Installation

### 1. Clone or Open the Workspace
Ensure you have **Node.js (v18+)** installed.

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env` (if not already created):
```bash
cp .env.example .env
```
Open `.env` and set your key:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TIMEOUT_MS=25000
```

### 4. Run the Server
- **Production mode**:
  ```bash
  npm start
  ```
- **Development mode (with auto-reload)**:
  ```bash
  npm run dev
  ```

### 5. Access the Demo & Services
- **Web Demo & Portfolio**: [http://localhost:3000](http://localhost:3000)
- **API Health Check**: [http://localhost:3000/api/health](http://localhost:3000/api/health)
- **REST Chat Endpoint**: `POST http://localhost:3000/api/chat`

---

## 🏗️ Project Architecture

```
AI chatbot intergration/
├── package.json                          # Dependencies & npm scripts
├── .env                                  # Environment variables (API keys, ports)
├── .env.example                          # Configuration template
├── .gitignore                            # Git exclusion rules
├── README.md                             # Comprehensive project documentation
├── gemini-chatbot.postman_collection.json # Exported Postman test collection v2.1
├── test-endpoints.js                     # Automated Node test runner
├── src/
│   ├── app.js                            # Express app, middleware, routes mount
│   ├── server.js                         # Server bootstrap & graceful shutdown
│   ├── config/
│   │   └── env.js                        # Environment config manager
│   ├── controllers/
│   │   └── chatController.js             # Request handler & JSON response formatter
│   ├── middlewares/
│   │   ├── errorHandler.js               # Centralized error handler & 404 handler
│   │   └── validateRequest.js            # Input validation middleware
│   ├── routes/
│   │   └── chatRoutes.js                 # API route definitions (/chat, /health)
│   ├── services/
│   │   └── geminiService.js              # Google Gemini API client & timeout logic
│   └── utils/
│       └── errors.js                     # Custom AppError classes
└── public/
    ├── index.html                        # Demo Developer Portfolio & Tech Blog site
    ├── styles.css                        # Portfolio page styling
    └── widget/
        ├── chat-widget.css               # Modular chat widget stylesheet
        └── chat-widget.js                # Embeddable vanilla JS chat widget
```

---

## 📡 REST API Documentation

### 1. Health Check
Checks server status and reports whether the Gemini API key is configured.

- **Method**: `GET`
- **URL**: `/api/health`
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "status": "online",
    "service": "Google Gemini Chatbot API",
    "uptimeSeconds": 142,
    "timestamp": "2026-10-12T18:30:00.000Z",
    "apiKeyConfigured": true,
    "defaultModel": "gemini-2.5-flash",
    "timeoutMs": 25000,
    "help": "API key is configured and ready."
  }
}
```

---

### 2. Chat Completion Endpoint
Accepts a prompt and returns the AI-generated response in a clean JSON format.

- **Method**: `POST`
- **URL**: `/api/chat`
- **Headers**: `Content-Type: application/json`

#### Request Body Parameters:
| Field | Type | Required | Description |
|---|---|---|---|
| `prompt` | `string` | **Yes** | The user's message/question (must not be empty, max 30,000 characters). |
| `conversationHistory` | `array` | No | Previous messages for multi-turn context: `[{"role":"user","text":"..."},{"role":"model","text":"..."}]`. |
| `systemInstruction` | `string` | No | Custom persona or system rules for the assistant. |
| `model` | `string` | No | Override default model (e.g., `gemini-2.5-flash`, `gemini-1.5-flash`). |
| `timeoutMs` | `number` | No | Custom timeout in milliseconds (max 120,000). |

#### Example Request:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms for a high school student."
  }'
```

#### Example Success Response (`200 OK`):
```json
{
  "success": true,
  "data": {
    "prompt": "Explain quantum computing in simple terms for a high school student.",
    "response": "Think of a regular computer like a light switch that can only be either ON or OFF (1 or 0)...",
    "model": "gemini-2.5-flash",
    "finishReason": "STOP",
    "usage": {
      "promptTokens": 14,
      "candidatesTokens": 112,
      "totalTokens": 126
    },
    "latencyMs": 842,
    "timestamp": "2026-10-12T18:31:00.123Z"
  }
}
```

---

## 🛡️ Error Handling & Reliability

Every error response follows a uniform JSON structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-friendly explanation.",
    "details": null,
    "timestamp": "2026-10-12T18:32:00.000Z"
  }
}
```

| HTTP Status | Error Code | Trigger Condition |
|---|---|---|
| `400 Bad Request` | `VALIDATION_ERROR` | Empty, whitespace-only, or missing `prompt`. |
| `400 Bad Request` | `MALFORMED_JSON` | Invalid JSON syntax sent by client. |
| `401 Unauthorized` | `AUTHENTICATION_ERROR` | Missing or invalid `GEMINI_API_KEY`. |
| `404 Not Found` | `ROUTE_NOT_FOUND` | Accessing an undefined endpoint path. |
| `429 Too Many Requests` | `RATE_LIMIT_EXCEEDED` | Google AI Studio rate limit or quota exceeded. |
| `504 Gateway Timeout` | `GATEWAY_TIMEOUT` | Upstream Gemini call exceeded `GEMINI_TIMEOUT_MS`. |
| `500 Server Error` | `INTERNAL_SERVER_ERROR` | Uncaught server exception. |

---

## 🧪 Testing with Postman

An exported Postman Collection v2.1 is located at [`gemini-chatbot.postman_collection.json`](./gemini-chatbot.postman_collection.json).

### How to Import & Run:
1. Open **Postman**.
2. Click **Import** (top left).
3. Drag & drop [`gemini-chatbot.postman_collection.json`](./gemini-chatbot.postman_collection.json).
4. The collection will appear in your sidebar with 7 pre-configured requests:
   - `1. Health Check`
   - `2. Simple Prompt - Quantum Computing`
   - `3. Coding Prompt - Express Middleware`
   - `4. Multi-turn Chat - Context Awareness`
   - `5. System Instruction / Persona`
   - `6. Error Test - Empty Prompt (Expect 400)`
   - `7. Error Test - Missing Prompt Field (Expect 400)`
5. Click **Run Collection** to automatically execute all test assertions.

---

## 🧩 Embedding the Chat Widget into Any Web Project

The chat widget is modular, zero-dependency, and isolated. You can add it to **any** website (such as an existing portfolio, blog, or documentation site) with 2 lines:

### 1. Add Widget Files to Your HTML:
```html
<!-- Inside <head> -->
<link rel="stylesheet" href="http://localhost:3000/widget/chat-widget.css">

<!-- Before </body> -->
<script src="http://localhost:3000/widget/chat-widget.js"></script>
```

### 2. Optional: Custom Configuration
You can customize the widget behavior by declaring `window.ChatbotWidgetConfig` before loading the script:

```html
<script>
  window.ChatbotWidgetConfig = {
    apiEndpoint: 'http://localhost:3000/api/chat',
    botName: 'My Portfolio Bot',
    botSubtitle: 'Powered by Gemini AI',
    welcomeMessage: 'Hi! Ask me anything about my experience or projects.',
    suggestions: [
      'What are your top skills?',
      'Show me your portfolio projects',
      'How can I contact you?'
    ],
    systemInstruction: 'You are a helpful assistant for Jane Doe, a frontend engineer.'
  };
</script>
<script src="http://localhost:3000/widget/chat-widget.js"></script>
```

---

## 🤖 Automated Test Suite

To verify all endpoints, validation logic, static file serving, and error responses automatically:

```bash
npm test
```

Expected output:
```
[Suite 1: Health Check]
  ✅ PASS: GET /api/health returns HTTP 200
  ✅ PASS: Response contains success: true
  ✅ PASS: Service status is "online"

[Suite 2: Route Not Found (404)]
  ✅ PASS: Unknown endpoint returns HTTP 404
  ✅ PASS: Error code is ROUTE_NOT_FOUND

[Suite 3: Validation Error Handling (400)]
  ✅ PASS: Missing prompt returns HTTP 400
  ✅ PASS: Whitespace prompt returns HTTP 400
  ✅ PASS: Number prompt returns HTTP 400
  ✅ PASS: Malformed JSON returns HTTP 400

[Suite 4: Static File & Widget Serving]
  ✅ PASS: GET / serves HTML portfolio page
  ✅ PASS: GET /widget/chat-widget.js serves widget script
  ✅ PASS: GET /widget/chat-widget.css serves widget stylesheet
```

---

## 📜 License
MIT License. Free to use in your personal or commercial web projects!
