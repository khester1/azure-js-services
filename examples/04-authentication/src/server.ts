/**
 * Azure AD Authentication Demo Server
 *
 * Demonstrates:
 * - OAuth 2.0 Authorization Code Flow
 * - Token acquisition and validation
 * - Protected API endpoints
 * - User info retrieval
 */

import express from 'express';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { config } from 'dotenv';
import { msalConfig, scopes, REDIRECT_URI } from './authConfig.js';
import { requireAuth, optionalAuth } from './authMiddleware.js';

config();

const app = express();
const port = process.env.PORT || 3000;

// Create MSAL client
const msalClient = new ConfidentialClientApplication(msalConfig);

// Session storage (in production, use Redis or database)
const sessions = new Map<string, { accessToken: string; idToken: string; user: any }>();

app.use(express.json());

// Home page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Azure AD Auth Demo</title>
      <style>
        body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
        h1 { color: #0078d4; }
        a { display: inline-block; margin: 10px 0; padding: 10px 20px;
            background: #0078d4; color: white; text-decoration: none; border-radius: 4px; }
        a:hover { background: #106ebe; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto; }
        .info { color: #666; margin: 20px 0; }
      </style>
    </head>
    <body>
      <h1>Azure AD Authentication Demo</h1>
      <p class="info">Click the button below to sign in with your Microsoft account.</p>
      <a href="/auth/login">Sign In with Microsoft</a>

      <h2>API Endpoints</h2>
      <pre>
GET /auth/login     - Start login flow
GET /auth/callback  - OAuth callback (automatic)
GET /auth/logout    - Sign out
GET /api/public     - Public endpoint (no auth)
GET /api/protected  - Protected endpoint (requires auth)
GET /api/me         - Get current user info
      </pre>

      <h2>Test After Login</h2>
      <pre>
curl http://localhost:3000/api/protected \\
  -H "Authorization: Bearer YOUR_TOKEN"
      </pre>
    </body>
    </html>
  `);
});

// Start OAuth login flow
app.get('/auth/login', async (req, res) => {
  try {
    const authUrl = await msalClient.getAuthCodeUrl({
      scopes,
      redirectUri: REDIRECT_URI,
      responseMode: 'query',
    });
    res.redirect(authUrl);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to start login' });
  }
});

// OAuth callback - exchange code for tokens
app.get('/auth/callback', async (req, res) => {
  const { code, error, error_description } = req.query;

  if (error) {
    res.status(400).send(`
      <h1>Authentication Error</h1>
      <p>${error}: ${error_description}</p>
      <a href="/">Try Again</a>
    `);
    return;
  }

  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  try {
    // Exchange code for tokens
    const result = await msalClient.acquireTokenByCode({
      code: code as string,
      scopes,
      redirectUri: REDIRECT_URI,
    });

    // Generate session ID
    const sessionId = Math.random().toString(36).substring(2);

    // Store session (in production, use proper session store)
    sessions.set(sessionId, {
      accessToken: result.accessToken,
      idToken: result.idToken || '',
      user: result.account,
    });

    // Return success page with token info
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Login Success</title>
        <style>
          body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
          h1 { color: #107c10; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 4px; overflow-x: auto;
                white-space: pre-wrap; word-break: break-all; }
          .token { font-size: 12px; max-height: 200px; overflow-y: auto; }
          a { color: #0078d4; }
        </style>
      </head>
      <body>
        <h1>✅ Login Successful!</h1>

        <h2>User Info</h2>
        <pre>${JSON.stringify(result.account, null, 2)}</pre>

        <h2>Access Token (for API calls)</h2>
        <pre class="token">${result.accessToken}</pre>

        <h2>Test Protected API</h2>
        <pre>
curl http://localhost:3000/api/protected \\
  -H "Authorization: Bearer ${result.accessToken}"
        </pre>

        <h2>Test User Info API</h2>
        <pre>
curl http://localhost:3000/api/me \\
  -H "Authorization: Bearer ${result.accessToken}"
        </pre>

        <p><a href="/">Back to Home</a> | <a href="/auth/logout">Sign Out</a></p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).send(`
      <h1>Token Exchange Failed</h1>
      <pre>${error}</pre>
      <a href="/">Try Again</a>
    `);
  }
});

// Logout
app.get('/auth/logout', (req, res) => {
  // In production, also revoke tokens and clear session
  res.send(`
    <h1>Signed Out</h1>
    <p>You have been signed out.</p>
    <a href="/">Back to Home</a>
  `);
});

// Public API endpoint - no authentication required
app.get('/api/public', (req, res) => {
  res.json({
    message: 'This is a public endpoint',
    timestamp: new Date().toISOString(),
  });
});

// Protected API endpoint - requires valid token
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({
    message: 'This is a protected endpoint',
    user: req.user,
    timestamp: new Date().toISOString(),
  });
});

// Get current user info
app.get('/api/me', requireAuth, (req, res) => {
  res.json({
    authenticated: true,
    user: req.user,
  });
});

// Optional auth example - works with or without token
app.get('/api/greeting', optionalAuth, (req, res) => {
  if (req.user) {
    res.json({ message: `Hello, ${req.user.name || req.user.email}!` });
  } else {
    res.json({ message: 'Hello, anonymous user!' });
  }
});

// Start server
app.listen(port, () => {
  console.log('');
  console.log('============================================');
  console.log('Azure AD Authentication Demo');
  console.log('============================================');
  console.log('');
  console.log(`Server running at http://localhost:${port}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  GET /              - Home page');
  console.log('  GET /auth/login    - Start login');
  console.log('  GET /auth/callback - OAuth callback');
  console.log('  GET /auth/logout   - Sign out');
  console.log('  GET /api/public    - Public API');
  console.log('  GET /api/protected - Protected API');
  console.log('  GET /api/me        - User info');
  console.log('');
});
