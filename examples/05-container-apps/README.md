# Azure Container Apps Example

Learn how to containerize and deploy applications to Azure Container Apps.

## What You'll Learn

- Creating a production-ready Dockerfile
- Health checks for container orchestration
- Graceful shutdown handling
- Azure Container Registry
- Container Apps deployment and scaling
- Cost optimization with scale-to-zero

## Prerequisites

- Node.js 20+
- Docker Desktop
- Azure CLI (`az login`)

## Local Development

### Run without Docker

```bash
npm install
npm run dev
```

### Run with Docker

```bash
# Build image
npm run docker:build

# Run container
npm run docker:run

# Open http://localhost:3000
```

## Deploy to Azure

```bash
chmod +x setup.sh
./setup.sh
```

This will:

1. Create Azure Container Registry
2. Build and push Docker image
3. Create Container Apps Environment
4. Deploy the container app
5. Configure auto-scaling (0-3 replicas)

## API Endpoints

| Endpoint | Description |
| ---------- | ------------- |
| `GET /` | Welcome message with container info |
| `GET /health` | Liveness probe (is the app running?) |
| `GET /ready` | Readiness probe (can it receive traffic?) |
| `GET /info` | Detailed container environment info |
| `POST /echo` | Echo back request body and headers |
| `GET /work?ms=100` | Simulate work (for testing scaling) |

## Code Structure

```text
├── Dockerfile         # Multi-stage build
├── src/
│   └── server.ts      # Express server with health checks
├── package.json
└── tsconfig.json
```

## Key Concepts

### Health Checks

Container Apps uses health probes to manage containers:

```typescript
// Liveness - Is the container alive?
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Readiness - Can it receive traffic?
app.get('/ready', (req, res) => {
  if (isShuttingDown) {
    res.status(503).json({ status: 'not ready' });
    return;
  }
  res.json({ status: 'ready' });
});
```

### Graceful Shutdown

Handle termination signals properly:

```typescript
process.on('SIGTERM', () => {
  isShuttingDown = true;
  server.close(() => process.exit(0));
});
```

### Multi-stage Dockerfile

```dockerfile
# Build stage - includes dev dependencies
FROM node:20-alpine AS builder
RUN npm install
RUN npm run build

# Production stage - minimal image
FROM node:20-alpine
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
```

## Scaling

Container Apps automatically scales based on:

- HTTP traffic
- CPU/memory usage
- Custom rules (KEDA scalers)

```bash
# Manual scaling
az containerapp update \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services \
  --min-replicas 1 \
  --max-replicas 10

# Scale to zero (cost savings)
az containerapp update \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services \
  --min-replicas 0
```

## Monitoring

```bash
# View logs
az containerapp logs show \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services \
  --follow

# View metrics in Azure Portal
# Container Apps > Your App > Metrics
```

## Cost

Container Apps has a generous free tier:

| Resource | Free per Month |
| ---------- | ---------------- |
| vCPU | 180,000 seconds |
| Memory | 360,000 GiB-seconds |
| Requests | 2 million |

With `min-replicas=0`, containers stop when idle = **$0 cost**.

## Cleanup

```bash
# Delete app
az containerapp delete \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services --yes

# Delete environment
az containerapp env delete \
  --name YOUR_ENV_NAME \
  --resource-group rg-azure-js-services --yes

# Delete container registry
az acr delete \
  --name YOUR_REGISTRY \
  --resource-group rg-azure-js-services --yes
```

## Next Steps

- Add environment variables and secrets
- Implement Dapr sidecars for service-to-service communication
- Set up CI/CD with GitHub Actions
- Add custom domain and SSL
