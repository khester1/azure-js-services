# Azure Event Grid Example

Learn how to build event-driven architectures with Azure Event Grid.

## What You'll Learn

- Creating Event Grid topics
- Publishing custom events
- Event schema (Event Grid schema)
- Handling events via webhooks
- Event filtering and routing

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- (Optional) ngrok for local webhook testing

## Project Structure

```text
12-event-grid/
├── src/
│   ├── client.ts           # Event Grid publisher client
│   ├── publish.ts          # Publish events demo
│   └── webhook-handler.ts  # Webhook receiver
├── setup.sh                # Create Event Grid topic
└── .env.example            # Environment template
```

## Quick Start

### 1. Create Azure Resources

```bash
./setup.sh
```

Creates an Event Grid Topic.

### 2. Publish Events

```bash
npm install
npm run publish
```

### 3. (Optional) Receive Events Locally

```bash
# Terminal 1: Start webhook handler
npm run webhook

# Terminal 2: Expose with ngrok
ngrok http 3000

# Create subscription (use ngrok URL)
az eventgrid event-subscription create \
  --name local-test \
  --source-resource-id $(az eventgrid topic show -n $(cat .topic-name) -g rg-azure-js-services --query id -o tsv) \
  --endpoint https://your-ngrok-url/api/events
```

## Key Concepts

### Event Grid vs Service Bus

| Feature | Event Grid | Service Bus |
| --------- | ------------ | ------------- |
| **Pattern** | Reactive (push) | Messaging (pull) |
| **Delivery** | At-least-once | At-least-once or exactly-once |
| **Retention** | 24 hours retry | Days/weeks |
| **Best for** | Events, notifications | Commands, work items |
| **Ordering** | No guarantee | FIFO available |

### Event Schema

```typescript
const event = {
  id: 'unique-id',              // Event ID
  eventType: 'Order.Created',   // Event type for filtering
  subject: '/orders/123',       // Event subject for filtering
  dataVersion: '1.0',           // Schema version
  eventTime: new Date(),        // When event occurred
  data: {                       // Your custom payload
    orderId: 'ORD-123',
    total: 99.99
  }
};
```

### Publishing Events

```typescript
import { EventGridPublisherClient, AzureKeyCredential } from '@azure/eventgrid';

const client = new EventGridPublisherClient(
  endpoint,
  'EventGrid',
  new AzureKeyCredential(key)
);

// Single event
await client.send([event]);

// Batch of events
await client.send([event1, event2, event3]);
```

### Receiving Events (Webhook)

```typescript
app.post('/api/events', (req, res) => {
  // Handle validation handshake
  if (req.body[0]?.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    return res.json({
      validationResponse: req.body[0].data.validationCode
    });
  }

  // Process events
  for (const event of req.body) {
    console.log(event.eventType, event.data);
  }

  res.status(200).send('OK');
});
```

### Event Filtering

Create subscriptions with filters:

```bash
# Filter by event type
az eventgrid event-subscription create \
  --name orders-only \
  --endpoint https://my-handler/api/orders \
  --included-event-types Order.Created Order.Shipped

# Filter by subject prefix
az eventgrid event-subscription create \
  --name inventory-alerts \
  --endpoint https://my-handler/api/inventory \
  --subject-begins-with /inventory/
```

## Common Event Patterns

### Fan-out (One-to-Many)

```text
┌─────────┐     ┌────────────┐     ┌──────────────┐
│ Service │────▶│ Event Grid │────▶│ Handler A    │
└─────────┘     └────────────┘     ├──────────────┤
                      │            │ Handler B    │
                      │            ├──────────────┤
                      └───────────▶│ Handler C    │
                                   └──────────────┘
```

### Event-Driven Microservices

```text
Orders ─────▶ Order.Created ─────▶ Inventory Service
                    │
                    ├─────────────▶ Notification Service
                    │
                    └─────────────▶ Analytics Service
```

## Pricing

| Tier | Operations | Cost |
| ------ | ------------ | ------ |
| **Free** | First 100K/month | $0 |
| Standard | Per million | $0.60 |

**Very cost-effective for most use cases!**

## Built-in Event Sources

Event Grid integrates with Azure services:

| Source | Events |
| -------- | -------- |
| Blob Storage | Blob created, deleted |
| Resource Groups | Resource changes |
| Container Registry | Image pushed |
| IoT Hub | Device events |
| Service Bus | Queue messages |

## Cleanup

```bash
az eventgrid topic delete \
  --name $(cat .topic-name) \
  --resource-group rg-azure-js-services --yes
```

## Event Grid vs Other Messaging

| Need | Use |
| ------ | ----- |
| Reactive events, notifications | **Event Grid** |
| Reliable message queues | Service Bus |
| High-throughput streaming | Event Hubs |
| IoT device telemetry | IoT Hub + Event Grid |

## Next Steps

- Connect blob storage events to functions
- Implement dead-letter handling
- Add advanced filtering with CloudEvents
- Build a complete event-driven architecture
