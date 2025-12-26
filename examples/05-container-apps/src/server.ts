/**
 * Azure Container Apps Demo Server
 *
 * A simple Express server designed for container deployment.
 * Demonstrates:
 * - Health checks for container orchestration
 * - Environment-based configuration
 * - Graceful shutdown
 * - Container-friendly logging
 */

import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Track server state
let isShuttingDown = false;
let requestCount = 0;
const startTime = Date.now();

// Middleware to track requests
app.use((req, res, next) => {
  if (isShuttingDown) {
    res.status(503).json({ error: 'Server is shutting down' });
    return;
  }
  requestCount++;
  next();
});

// JSON parsing
app.use(express.json());

// Health check endpoint - used by Container Apps for liveness/readiness probes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// Readiness check - indicates if the app is ready to receive traffic
app.get('/ready', (req: Request, res: Response) => {
  if (isShuttingDown) {
    res.status(503).json({ status: 'not ready', reason: 'shutting down' });
    return;
  }
  res.json({ status: 'ready' });
});

// Main endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from Azure Container Apps!',
    environment: process.env.NODE_ENV || 'development',
    hostname: process.env.HOSTNAME || 'unknown',
    revision: process.env.CONTAINER_APP_REVISION || 'local',
  });
});

// Info endpoint - shows container environment
app.get('/info', (req: Request, res: Response) => {
  res.json({
    app: {
      name: 'azure-container-demo',
      version: '1.0.0',
      nodeVersion: process.version,
    },
    container: {
      hostname: process.env.HOSTNAME,
      revision: process.env.CONTAINER_APP_REVISION,
      replicaName: process.env.CONTAINER_APP_REPLICA_NAME,
    },
    environment: process.env.NODE_ENV,
    stats: {
      uptime: Math.floor((Date.now() - startTime) / 1000),
      requestCount,
      memoryUsage: process.memoryUsage(),
    },
  });
});

// Echo endpoint - useful for testing
app.post('/echo', (req: Request, res: Response) => {
  res.json({
    received: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});

// Simulate work endpoint - for testing scaling
app.get('/work', async (req: Request, res: Response) => {
  const duration = parseInt(req.query.ms as string) || 100;
  const start = Date.now();

  // Simulate CPU work
  await new Promise((resolve) => setTimeout(resolve, duration));

  res.json({
    message: 'Work completed',
    requestedMs: duration,
    actualMs: Date.now() - start,
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(JSON.stringify({
    level: 'info',
    message: 'Server started',
    port,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  }));
});

// Graceful shutdown handling
function gracefulShutdown(signal: string): void {
  console.log(JSON.stringify({
    level: 'info',
    message: `Received ${signal}, starting graceful shutdown`,
    timestamp: new Date().toISOString(),
  }));

  isShuttingDown = true;

  // Stop accepting new connections
  server.close(() => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'Server closed, exiting',
      totalRequests: requestCount,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    }));
    process.exit(0);
  });

  // Force exit after 30 seconds
  setTimeout(() => {
    console.log(JSON.stringify({
      level: 'error',
      message: 'Forced shutdown after timeout',
      timestamp: new Date().toISOString(),
    }));
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
