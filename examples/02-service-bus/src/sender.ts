/**
 * Azure Service Bus - Message Sender
 *
 * Demonstrates:
 * - Connecting to Service Bus
 * - Sending single messages
 * - Sending batch messages
 * - Message properties and scheduling
 */

import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';
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
  section('Azure Service Bus - Message Sender');

  // Create a client
  const sbClient = new ServiceBusClient(connectionString);

  // Create a sender for the queue
  const sender = sbClient.createSender(queueName);

  try {
    // Example 1: Send a single message
    section('Sending Single Message');

    const order1: OrderMessage = {
      orderId: 'ORD-001',
      customerId: 'CUST-123',
      items: [
        { productId: 'PROD-A', quantity: 2 },
        { productId: 'PROD-B', quantity: 1 },
      ],
      totalAmount: 99.99,
      createdAt: new Date().toISOString(),
    };

    const message1: ServiceBusMessage = {
      body: order1,
      contentType: 'application/json',
      subject: 'NewOrder',
      applicationProperties: {
        priority: 'high',
        region: 'US-WEST',
      },
    };

    await sender.sendMessages(message1);
    console.log(`Sent order: ${order1.orderId}`);

    // Example 2: Send a batch of messages
    section('Sending Batch Messages');

    const orders: OrderMessage[] = [
      {
        orderId: 'ORD-002',
        customerId: 'CUST-456',
        items: [{ productId: 'PROD-C', quantity: 5 }],
        totalAmount: 249.99,
        createdAt: new Date().toISOString(),
      },
      {
        orderId: 'ORD-003',
        customerId: 'CUST-789',
        items: [{ productId: 'PROD-D', quantity: 1 }],
        totalAmount: 599.99,
        createdAt: new Date().toISOString(),
      },
      {
        orderId: 'ORD-004',
        customerId: 'CUST-123',
        items: [
          { productId: 'PROD-A', quantity: 1 },
          { productId: 'PROD-E', quantity: 3 },
        ],
        totalAmount: 149.99,
        createdAt: new Date().toISOString(),
      },
    ];

    // Create a batch
    const batch = await sender.createMessageBatch();

    for (const order of orders) {
      const message: ServiceBusMessage = {
        body: order,
        contentType: 'application/json',
        subject: 'NewOrder',
        messageId: order.orderId,
        applicationProperties: {
          priority: order.totalAmount > 500 ? 'high' : 'normal',
        },
      };

      // Try to add the message to the batch
      if (!batch.tryAddMessage(message)) {
        // If batch is full, send it and create a new one
        await sender.sendMessages(batch);
        console.log(`Sent batch of ${batch.count} messages`);

        // Start a new batch with the current message
        const newBatch = await sender.createMessageBatch();
        if (!newBatch.tryAddMessage(message)) {
          throw new Error('Message too large for batch');
        }
      }
    }

    // Send remaining messages in batch
    if (batch.count > 0) {
      await sender.sendMessages(batch);
      console.log(`Sent batch of ${batch.count} messages`);
    }

    // Example 3: Send a scheduled message
    section('Sending Scheduled Message');

    const futureOrder: OrderMessage = {
      orderId: 'ORD-005-SCHEDULED',
      customerId: 'CUST-999',
      items: [{ productId: 'PROD-F', quantity: 1 }],
      totalAmount: 999.99,
      createdAt: new Date().toISOString(),
    };

    // Schedule for 30 seconds from now
    const scheduledTime = new Date(Date.now() + 30 * 1000);

    const scheduledMessage: ServiceBusMessage = {
      body: futureOrder,
      contentType: 'application/json',
      subject: 'ScheduledOrder',
      scheduledEnqueueTimeUtc: scheduledTime,
    };

    const sequenceNumbers = await sender.scheduleMessages(
      scheduledMessage,
      scheduledTime
    );
    console.log(`Scheduled order ${futureOrder.orderId} for ${scheduledTime.toISOString()}`);
    console.log(`Sequence number: ${sequenceNumbers[0]}`);

    // Summary
    section('Send Complete');
    console.log(`
Messages sent:
  - 1 single message (ORD-001)
  - ${orders.length} batch messages (ORD-002 to ORD-004)
  - 1 scheduled message (ORD-005-SCHEDULED, arriving in 30s)

Total: ${1 + orders.length + 1} messages

Run the receiver to process these messages:
  npm run receiver
`);

  } finally {
    await sender.close();
    await sbClient.close();
    console.log('Connection closed');
  }
}

main().catch(console.error);
