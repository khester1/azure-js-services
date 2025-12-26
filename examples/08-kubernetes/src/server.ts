import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint (required for Kubernetes)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Readiness check (for Kubernetes readiness probe)
app.get('/ready', (req: Request, res: Response) => {
  res.json({ ready: true });
});

// Main endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Hello from Azure Kubernetes Service!',
    hostname: process.env.HOSTNAME || 'unknown',
    podName: process.env.POD_NAME || 'unknown',
    nodeName: process.env.NODE_NAME || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// API endpoint
app.get('/api/info', (req: Request, res: Response) => {
  res.json({
    app: 'AKS Demo App',
    version: '1.0.0',
    kubernetes: {
      podName: process.env.POD_NAME || process.env.HOSTNAME,
      nodeName: process.env.NODE_NAME,
      namespace: process.env.POD_NAMESPACE || 'default',
    },
    environment: process.env.NODE_ENV || 'development',
  });
});

// Simulate work (for load testing)
app.get('/api/work', async (req: Request, res: Response) => {
  const duration = parseInt(req.query.ms as string) || 100;
  await new Promise((resolve) => setTimeout(resolve, duration));
  res.json({
    message: `Processed work for ${duration}ms`,
    pod: process.env.HOSTNAME,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Pod info: http://localhost:${PORT}/api/info`);
});
