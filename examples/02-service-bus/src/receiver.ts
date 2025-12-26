/**
 * Azure Service Bus - Message Receiver
 *
 * Demonstrates:
 * - Receiving messages from a queue
 * - Message completion and abandonment
 * - Dead-letter handling
 * - Peek without receiving
 */

import {
  ServiceBusClient,
  ServiceBusReceivedMessage,
  ProcessErrorArgs,
} from '@azure/service-bus';
import { config } from 'dotenv';

config();

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
const queueName = process.env.SERVICE_BUS_QUEUE_NAME || 'demo-queue';

interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
  createdAt: string;
}

function section(title: string): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
}

async function main(): Promise<void> {
  section('Azure Service Bus - Message Receiver');

  const sbClient = new ServiceBusClient(connectionString);

  // Example 1: Peek at messages without removing them
  section('Peeking Messages');

  const receiver = sbClient.createReceiver(queueName);

  try {
    const peekedMessages = await receiver.peekMessages(5);
    console.log(`Found ${peekedMessages.length} messages in queue:`);

    for (const msg of peekedMessages) {
      const order = msg.body as OrderMessage;
      console.log(`  - ${order.orderId}: $${order.totalAmount} (${msg.subject})`);
    }

    if (peekedMessages.length === 0) {
      console.log('No messages in queue. Run the sender first:');
      console.log('  npm run sender');
      await receiver.close();
      await sbClient.close();
      return;
    }

    // Example 2: Receive and process messages
    section('Processing Messages');

    let processedCount = 0;
    const maxMessages = 10;

    // Receive messages in a batch
    const messages = await receiver.receiveMessages(maxMessages, {
      maxWaitTimeInMs: 5000, // Wait up to 5 seconds
    });

    console.log(`Received ${messages.length} messages\n`);

    for (const message of messages) {
      try {
        const order = message.body as OrderMessage;

        console.log(`Processing order: ${order.orderId}`);
        console.log(`  Customer: ${order.customerId}`);
        console.log(`  Items: ${order.items.length}`);
        console.log(`  Total: $${order.totalAmount}`);
        console.log(`  Priority: ${message.applicationProperties?.priority || 'normal'}`);
        console.log(`  Subject: ${message.subject}`);

        // Simulate processing
        await simulateProcessing(order);

        // Complete the message (remove from queue)
        await receiver.completeMessage(message);
        console.log(`  ✅ Completed\n`);
        processedCount++;

      } catch (error) {
        console.error(`  ❌ Processing failed: ${error}`);

        // Abandon the message (return to queue for retry)
        // After max delivery count, goes to dead-letter queue
        await receiver.abandonMessage(message, {
          processingError: String(error),
        });
        console.log(`  ⚠️ Abandoned (will retry)\n`);
      }
    }

    // Example 3: Check for dead-letter messages
    section('Checking Dead-Letter Queue');

    const dlqReceiver = sbClient.createReceiver(queueName, {
      subQueueType: 'deadLetter',
    });

    const deadLetterMessages = await dlqReceiver.peekMessages(5);

    if (deadLetterMessages.length > 0) {
      console.log(`Found ${deadLetterMessages.length} dead-letter messages:`);
      for (const msg of deadLetterMessages) {
        const order = msg.body as OrderMessage;
        console.log(`  - ${order.orderId}: ${msg.deadLetterReason || 'Unknown reason'}`);
      }
    } else {
      console.log('No dead-letter messages (good!)');
    }

    await dlqReceiver.close();

    // Summary
    section('Receive Complete');
    console.log(`
Summary:
  - Peeked: ${peekedMessages.length} messages
  - Received: ${messages.length} messages
  - Processed: ${processedCount} messages
  - Dead-lettered: ${deadLetterMessages.length} messages

Message lifecycle:
  1. Sender → Queue
  2. Receiver gets message (locked)
  3. complete() → Message removed
     OR abandon() → Message returns to queue
     OR deadLetter() → Message goes to DLQ
  4. After max retries → Auto dead-letter
`);

  } finally {
    await receiver.close();
    await sbClient.close();
    console.log('Connection closed');
  }
}

// Simulate order processing
async function simulateProcessing(order: OrderMessage): Promise<void> {
  // Simulate some work
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate occasional failures for demo
  if (order.orderId.includes('FAIL')) {
    throw new Error('Simulated processing failure');
  }
}

main().catch(console.error);
