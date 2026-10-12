/**
 * Automated Test Runner for Gemini Chatbot REST API
 * Tests validation, health check, 404, error handling, and live prompts
 */

const http = require('http');
const config = require('./src/config/env');

const PORT = config.port || 3000;
const BASE_URL = `http://localhost:${PORT}`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ FAIL: ${message}`);
  }
}

async function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(path, BASE_URL);
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        ...headers,
      },
    };

    if (postData) {
      reqOptions.headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(reqOptions, (res) => {
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(rawData);
        } catch (e) {
          json = rawData;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: json,
        });
      });
    });

    req.on('error', (e) => reject(e));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n============================================================');
  console.log('   Starting Test Suite for Gemini Chatbot REST API');
  console.log('============================================================\n');

  try {
    // Test 1: Health Check Endpoint
    console.log('[Suite 1: Health Check]');
    const healthRes = await makeRequest('/api/health');
    assert(healthRes.statusCode === 200, 'GET /api/health returns HTTP 200');
    assert(healthRes.data?.success === true, 'Response contains success: true');
    assert(healthRes.data?.data?.status === 'online', 'Service status is "online"');
    assert('apiKeyConfigured' in (healthRes.data?.data || {}), 'Includes apiKeyConfigured boolean flag');

    // Test 2: 404 Route Not Found
    console.log('\n[Suite 2: Route Not Found (404)]');
    const notFoundRes = await makeRequest('/api/invalid-endpoint-path');
    assert(notFoundRes.statusCode === 404, 'Unknown endpoint returns HTTP 404');
    assert(notFoundRes.data?.error?.code === 'ROUTE_NOT_FOUND', 'Error code is ROUTE_NOT_FOUND');

    // Test 3: Validation Error - Missing Body
    console.log('\n[Suite 3: Validation Error Handling (400)]');
    const emptyBodyRes = await makeRequest('/api/chat', 'POST', {});
    assert(emptyBodyRes.statusCode === 400, 'Missing prompt returns HTTP 400');
    assert(emptyBodyRes.data?.error?.code === 'VALIDATION_ERROR', 'Error code is VALIDATION_ERROR');

    // Test 4: Validation Error - Empty String Prompt
    const emptyStringRes = await makeRequest('/api/chat', 'POST', { prompt: '   ' });
    assert(emptyStringRes.statusCode === 400, 'Whitespace prompt returns HTTP 400');
    assert(emptyStringRes.data?.error?.code === 'VALIDATION_ERROR', 'Error code is VALIDATION_ERROR');

    // Test 5: Validation Error - Non-string Prompt
    const numberPromptRes = await makeRequest('/api/chat', 'POST', { prompt: 12345 });
    assert(numberPromptRes.statusCode === 400, 'Number prompt returns HTTP 400');

    // Test 6: Validation Error - Malformed JSON Syntax
    const malformedJsonRes = await makeRequest(
      '/api/chat',
      'POST',
      '{"prompt": "unclosed json...',
      { 'Content-Type': 'application/json' }
    );
    assert(malformedJsonRes.statusCode === 400, 'Malformed JSON returns HTTP 400');
    assert(malformedJsonRes.data?.error?.code === 'MALFORMED_JSON', 'Error code is MALFORMED_JSON');

    // Test 7: Static Files Serving
    console.log('\n[Suite 4: Static File & Widget Serving]');
    const indexHtmlRes = await makeRequest('/');
    assert(indexHtmlRes.statusCode === 200, 'GET / serves HTML portfolio page');
    const widgetJsRes = await makeRequest('/widget/chat-widget.js');
    assert(widgetJsRes.statusCode === 200, 'GET /widget/chat-widget.js serves widget script');
    const widgetCssRes = await makeRequest('/widget/chat-widget.css');
    assert(widgetCssRes.statusCode === 200, 'GET /widget/chat-widget.css serves widget stylesheet');

    // Test 8: Chat endpoint behavior
    console.log('\n[Suite 5: Chat Prompt Execution]');
    const chatRes = await makeRequest('/api/chat', 'POST', {
      prompt: 'Hello! Please respond with "SYSTEM TEST OK".',
    });

    if (config.isApiKeyConfigured()) {
      assert(chatRes.statusCode === 200, 'Live API prompt returns HTTP 200 OK');
      assert(chatRes.data?.success === true, 'Response contains success: true');
      assert(typeof chatRes.data?.data?.response === 'string', 'AI response text received');
      assert(typeof chatRes.data?.data?.latencyMs === 'number', 'Latency in milliseconds reported');
      console.log(`  ℹ️ AI Model: ${chatRes.data?.data?.model}`);
      console.log(`  ℹ️ Latency: ${chatRes.data?.data?.latencyMs}ms`);
    } else {
      assert(chatRes.statusCode === 401, 'Unconfigured API key gracefully returns HTTP 401 Unauthorized');
      assert(chatRes.data?.error?.code === 'AUTHENTICATION_ERROR', 'Error code is AUTHENTICATION_ERROR');
      console.log('  ℹ️ Note: GEMINI_API_KEY is not yet set in .env. Once you paste your free key, this will return 200 with live Gemini responses!');
    }

    console.log('\n============================================================');
    console.log(`   Test Results: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log('============================================================\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
