# Azure Service Bus Example

Learn how to build messaging applications with Azure Service Bus using Node.js and TypeScript.

## What You'll Learn

- Create a Service Bus namespace and queue
- Send single and batch messages
- Receive and process messages
- Handle message completion, abandonment, and dead-lettering
- Schedule messages for future delivery
- (Advanced) Pub/sub with topics and subscriptions

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure subscription

## Setup

### 1. Create Azure Resources

```bash
# Make the script executable (first time only)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The script will:

- Create a Service Bus namespace (Basic tier, ~$0.05/million ops)
- Create a queue
- Output the connection string

### 2. Configure Environment

Copy the output from the setup script to a `.env` file:

```bash
cp .env.example .env
# Edit .env with the connection string from setup.sh
```

### 3. Install Dependencies

```bash
npm install
```

## Run the Demo

### Send Messages

```bash
npm run sender
```

This sends:

- 1 single message
- 3 batch messages
- 1 scheduled message (arrives in 30 seconds)

### Receive Messages

```bash
npm run receiver
```

This will:

- Peek at messages in queue
- Receive and process messages
- Check the dead-letter queue

### Run Both

```bash
npm run demo
```

## Code Structure

```text
src/
├── sender.ts     # Send messages to queue
├── receiver.ts   # Receive and process messages
└── pubsub.ts     # Topics/subscriptions (requires Standard tier)
```

## Key Concepts

### Message Lifecycle

```text
Sender → Queue → Receiver locks message
                    ↓
              complete() → Message removed ✅
              abandon()  → Message returns to queue (retry) ⚠️
              deadLetter() → Goes to DLQ ❌
              (timeout) → Auto-abandon
```

### Sending Messages

```typescript
const sender = sbClient.createSender(queueName);

// Single message
await sender.sendMessages({
  body: { orderId: '123' },
  contentType: 'application/json',
  subject: 'NewOrder',
});

// Batch messages
const batch = await sender.createMessageBatch();
batch.tryAddMessage(msg1);
batch.tryAddMessage(msg2);
await sender.sendMessages(batch);
```

### Receiving Messages

```typescript
const receiver = sbClient.createReceiver(queueName);

// Receive batch
const messages = await receiver.receiveMessages(10, {
  maxWaitTimeInMs: 5000,
});

for (const msg of messages) {
  // Process message
  await receiver.completeMessage(msg);  // Remove from queue
}
```

### Dead-Letter Queue

Messages go to DLQ when:

- Max delivery count exceeded
- Explicitly dead-lettered
- Message expired

```typescript
// Read from DLQ
const dlqReceiver = sbClient.createReceiver(queueName, {
  subQueueType: 'deadLetter',
});
```

## Cleanup

Delete the Service Bus namespace when done:

```bash
# Get namespace name from setup output
az servicebus namespace delete \
  --name YOUR_NAMESPACE_NAME \
  --resource-group rg-azure-js-services \
  --yes
```

## Cost

| Tier | Cost | Features |
| ------ | ------ | ---------- |
| Basic | ~$0.05/million ops | Queues only |
| Standard | ~$10/month | + Topics, subscriptions, sessions |
| Premium | ~$668/month | + Dedicated resources, VNet |

Basic tier is perfect for learning and low-volume workloads.

## Topics and Subscriptions

For pub/sub patterns with message filtering, see `src/pubsub.ts`.

Requires upgrading to Standard tier:

```bash
az servicebus namespace create \
  --name sb-demo-standard \
  --resource-group rg-azure-js-services \
  --sku Standard
```

## Next Steps

- Try the [SQL Database example](../01-sql-database/)
- Implement message sessions for ordered processing
- Add retry policies and circuit breakers
- Build a worker service with continuous message processing
