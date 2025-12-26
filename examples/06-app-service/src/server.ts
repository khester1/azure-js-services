/**
 * Azure App Service Demo Application
 *
 * A simple Express app designed for Azure App Service deployment.
 * Demonstrates:
 * - Environment-based configuration
 * - Health endpoints for monitoring
 * - Deployment slot detection
 * - Application settings usage
 */

import express, { Request, Response } from 'express';

const app = express();
// App Service sets PORT environment variable
const port = process.env.PORT || 3000;

// Track app stats
const startTime = Date.now();
let requestCount = 0;

app.use((req, res, next) => {
  requestCount++;
  next();
});

app.use(express.json());

// Home page
app.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Azure App Service Demo</title>
      <style>
        body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { color: #0078d4; }
        .card { background: #f4f4f4; padding: 20px; border-radius: 8px; margin: 20px 0; }
        code { background: #e0e0e0; padding: 2px 6px; border-radius: 4px; }
        a { color: #0078d4; }
      </style>
    </head>
    <body>
      <h1>🚀 Azure App Service Demo</h1>

      <div class="card">
        <h3>Environment Info</h3>
        <p><strong>Hostname:</strong> ${process.env.WEBSITE_HOSTNAME || 'localhost'}</p>
        <p><strong>Instance ID:</strong> ${process.env.WEBSITE_INSTANCE_ID || 'local'}</p>
        <p><strong>Slot:</strong> ${process.env.WEBSITE_SLOT_NAME || 'production'}</p>
        <p><strong>Node Version:</strong> ${process.version}</p>
      </div>

      <div class="card">
        <h3>API Endpoints</h3>
        <ul>
          <li><a href="/api/health">/api/health</a> - Health check</li>
          <li><a href="/api/info">/api/info</a> - App info & environment</li>
          <li><a href="/api/config">/api/config</a> - Configuration settings</li>
          <li><code>POST /api/echo</code> - Echo request body</li>
        </ul>
      </div>

      <div class="card">
        <h3>App Service Features</h3>
        <ul>
          <li>✅ Auto-scaling based on load</li>
          <li>✅ Deployment slots for zero-downtime deploys</li>
          <li>✅ Built-in authentication (Easy Auth)</li>
          <li>✅ Custom domains and SSL</li>
          <li>✅ Application Insights integration</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// App info and environment
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    app: {
      name: 'azure-app-service-demo',
      version: '1.0.0',
      nodeVersion: process.version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      requestCount,
    },
    appService: {
      // These are set by App Service
      hostname: process.env.WEBSITE_HOSTNAME,
      siteName: process.env.WEBSITE_SITE_NAME,
      instanceId: process.env.WEBSITE_INSTANCE_ID,
      slotName: process.env.WEBSITE_SLOT_NAME || 'production',
      sku: process.env.WEBSITE_SKU,
      resourceGroup: process.env.WEBSITE_RESOURCE_GROUP,
    },
    runtime: {
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
    },
  });
});

// Configuration endpoint - shows app settings (without secrets)
app.get('/api/config', (req: Request, res: Response) => {
  // Example of reading app settings
  const config = {
    environment: process.env.NODE_ENV || 'development',
    // Custom app settings you might configure
    featureFlags: {
      newFeature: process.env.FEATURE_NEW === 'true',
      betaMode: process.env.FEATURE_BETA === 'true',
    },
    // Database connection (show only that it's configured, not the value)
    database: {
      configured: !!process.env.DATABASE_URL,
    },
    // Show which slot we're in
    deploymentSlot: process.env.WEBSITE_SLOT_NAME || 'production',
  };

  res.json(config);
});

// Echo endpoint for testing
app.post('/api/echo', (req: Request, res: Response) => {
  res.json({
    received: req.body,
    timestamp: new Date().toISOString(),
    processedBy: process.env.WEBSITE_INSTANCE_ID || 'local',
  });
});

// Simulate slow endpoint (for testing scaling)
app.get('/api/slow', async (req: Request, res: Response) => {
  const delay = parseInt(req.query.ms as string) || 1000;
  await new Promise(resolve => setTimeout(resolve, delay));
  res.json({ message: 'Slow response', delayMs: delay });
});

// Start server
app.listen(port, () => {
  console.log(`
============================================
Azure App Service Demo
============================================

Server running on port ${port}

Environment:
  NODE_ENV: ${process.env.NODE_ENV || 'development'}
  WEBSITE_HOSTNAME: ${process.env.WEBSITE_HOSTNAME || 'localhost'}
  WEBSITE_SLOT_NAME: ${process.env.WEBSITE_SLOT_NAME || 'N/A'}

Endpoints:
  GET  /              - Home page
  GET  /api/health    - Health check
  GET  /api/info      - App info
  GET  /api/config    - Configuration
  POST /api/echo      - Echo request
  GET  /api/slow?ms=N - Slow response (testing)
`);
});
