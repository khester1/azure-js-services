# Azure Functions Triggers Example

Learn how to use Azure Functions with Timer, Queue, and Blob triggers for event-driven processing.

## What You'll Learn

- Timer triggers for scheduled jobs
- Queue triggers for processing Service Bus messages
- Blob triggers for reacting to file uploads
- Event-driven architecture patterns

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure Functions Core Tools (`npm install -g azure-functions-core-tools@4`)
- Service Bus from example 02 (for queue trigger)

## Setup

### 1. Create Azure Resources

```bash
chmod +x setup.sh
./setup.sh
```

This creates:
- Storage Account for blob triggers
- Blob container called "uploads"

### 2. Configure local.settings.json

```bash
cp local.settings.example.json local.settings.json
```

Update with values from setup output:
- `STORAGE_CONNECTION` - From setup.sh
- `SERVICE_BUS_CONNECTION` - From 02-service-bus/.env

### 3. Install Dependencies

```bash
npm install
```

## Run Locally

```bash
npm start
```

This starts the Azure Functions runtime with all triggers active.

## Triggers Explained

### Timer Trigger (`timerTrigger.ts`)

Runs on a schedule using CRON expressions.

```typescript
app.timer('timerTrigger', {
  schedule: '0 */5 * * * *',  // Every 5 minutes
  runOnStartup: true,
  handler: async (timer, context) => {
    // Scheduled work here
  },
});
```

**Common CRON expressions:**
| Expression | Description |
|------------|-------------|
| `0 * * * * *` | Every minute |
| `0 */5 * * * *` | Every 5 minutes |
| `0 0 * * * *` | Every hour |
| `0 0 9 * * 1-5` | 9am weekdays |

### Queue Trigger (`queueTrigger.ts`)

Automatically processes Service Bus messages.

```typescript
app.serviceBusQueue('queueTrigger', {
  connection: 'SERVICE_BUS_CONNECTION',
  queueName: 'demo-queue',
  handler: async (message, context) => {
    // Process message
    // Auto-completes on success
    // Throws to abandon/retry
  },
});
```

**Test it:**
```bash
# In another terminal, send messages
cd ../02-service-bus
npm run sender

# Watch this function process them
```

### Blob Trigger (`blobTrigger.ts`)

Reacts to files uploaded to blob storage.

```typescript
app.storageBlob('blobTrigger', {
  connection: 'STORAGE_CONNECTION',
  path: 'uploads/{name}',
  handler: async (blob, context) => {
    // blob is a Buffer
    // context.triggerMetadata has file info
  },
});
```

**Test it:**
```bash
# Upload a test file
az storage blob upload \
  --container-name uploads \
  --name test.json \
  --data '{"hello": "world"}' \
  --connection-string "$STORAGE_CONNECTION"

# Watch the function process it
```

## Code Structure

```
src/
├── index.ts         # Registers all triggers
├── timerTrigger.ts  # Scheduled execution
├── queueTrigger.ts  # Service Bus processing
└── blobTrigger.ts   # File processing
```

## Trigger Comparison

| Trigger | Use Case | Scaling |
|---------|----------|---------|
| **Timer** | Scheduled jobs, cron tasks | Single instance |
| **Queue** | Message processing, work queues | Based on queue depth |
| **Blob** | File processing, ETL | Based on blob events |

## Cleanup

```bash
# Delete storage account
az storage account delete \
  --name YOUR_STORAGE_NAME \
  --resource-group rg-azure-js-services \
  --yes
```

## Next Steps

- Try the [Authentication example](../04-authentication/)
- Add Application Insights for monitoring
- Deploy to Azure for production scaling
