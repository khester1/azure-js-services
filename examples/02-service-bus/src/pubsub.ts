/**
 * Azure Service Bus - Pub/Sub with Topics
 *
 * NOTE: Topics/Subscriptions require Standard tier or higher.
 * Basic tier only supports queues.
 *
 * To use this example:
 * 1. Upgrade to Standard tier (~$10/month)
 * 2. Create topic and subscriptions (see commands below)
 *
 * Demonstrates:
 * - Publishing to topics
 * - Subscribing with filters
 * - Fan-out message patterns
 */

import {
  ServiceBusClient,
  ServiceBusMessage,
} from '@azure/service-bus';
import { config } from 'dotenv';

config();

const connectionString = process.env.SERVICE_BUS_CONNECTION_STRING!;
const topicName = process.env.SERVICE_BUS_TOPIC_NAME || 'demo-topic';

interface NotificationMessage {
  type: 'order' | 'inventory' | 'shipping';
  eventId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

function section(title: string): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
}

/*
 * SETUP COMMANDS (requires Standard tier):
 *
 * # Upgrade namespace to Standard (or create new one)
 * az servicebus namespace create \
 *   --name sb-demo-standard \
 *   --resource-group rg-azure-js-services \
 *   --location eastus \
 *   --sku Standard
 *
 * # Create topic
 * az servicebus topic create \
 *   --name demo-topic \
 *   --namespace-name sb-demo-standard \
 *   --resource-group rg-azure-js-services
 *
 * # Create subscriptions with filters
 * az servicebus topic subscription create \
 *   --name orders-sub \
 *   --topic-name demo-topic \
 *   --namespace-name sb-demo-standard \
 *   --resource-group rg-azure-js-services
 *
 * az servicebus topic subscription create \
 *   --name inventory-sub \
 *   --topic-name demo-topic \
 *   --namespace-name sb-demo-standard \
 *   --resource-group rg-azure-js-services
 *
 * # Add filters (using SQL-like syntax)
 * az servicebus topic subscription rule create \
 *   --name OrdersOnly \
 *   --subscription-name orders-sub \
 *   --topic-name demo-topic \
 *   --namespace-name sb-demo-standard \
 *   --resource-group rg-azure-js-services \
 *   --filter-sql-expression "type = 'order'"
 */

async function publishNotifications(): Promise<void> {
  section('Publishing Notifications to Topic');

  const sbClient = new ServiceBusClient(connectionString);
  const sender = sbClient.createSender(topicName);

  try {
    const notifications: NotificationMessage[] = [
      {
        type: 'order',
        eventId: 'EVT-001',
        data: { orderId: 'ORD-100', status: 'created' },
        timestamp: new Date().toISOString(),
      },
      {
        type: 'inventory',
        eventId: 'EVT-002',
        data: { productId: 'PROD-A', quantity: -5 },
        timestamp: new Date().toISOString(),
      },
      {
        type: 'shipping',
        eventId: 'EVT-003',
        data: { orderId: 'ORD-100', carrier: 'FedEx' },
        timestamp: new Date().toISOString(),
      },
      {
        type: 'order',
        eventId: 'EVT-004',
        data: { orderId: 'ORD-100', status: 'shipped' },
        timestamp: new Date().toISOString(),
      },
    ];

    for (const notification of notifications) {
      const message: ServiceBusMessage = {
        body: notification,
        contentType: 'application/json',
        subject: notification.type,
        applicationProperties: {
          type: notification.type, // Used for filtering
          eventId: notification.eventId,
        },
      };

      await sender.sendMessages(message);
      console.log(`Published: ${notification.type} - ${notification.eventId}`);
    }

    console.log(`\nPublished ${notifications.length} notifications`);

  } finally {
    await sender.close();
    await sbClient.close();
  }
}

async function subscribeToOrders(): Promise<void> {
  section('Subscribing to Orders (filtered)');

  const sbClient = new ServiceBusClient(connectionString);
  const receiver = sbClient.createReceiver(topicName, 'orders-sub');

  try {
    console.log('Waiting for order notifications...\n');

    const messages = await receiver.receiveMessages(10, {
      maxWaitTimeInMs: 5000,
    });

    if (messages.length === 0) {
      console.log('No order notifications found');
    } else {
      for (const message of messages) {
        const notification = message.body as NotificationMessage;
        console.log(`Order event: ${notification.eventId}`);
        console.log(`  Data: ${JSON.stringify(notification.data)}`);

        await receiver.completeMessage(message);
      }
    }

  } finally {
    await receiver.close();
    await sbClient.close();
  }
}

async function main(): Promise<void> {
  section('Azure Service Bus - Pub/Sub Demo');

  console.log(`
NOTE: This example requires Standard tier Service Bus.
Basic tier (~$0.05/million ops) only supports queues.
Standard tier (~$10/month) adds topics/subscriptions.

To run this demo:
1. Create a Standard tier namespace
2. Run the setup commands in this file
3. Update SERVICE_BUS_CONNECTION_STRING in .env

Pub/Sub Pattern:
  Publisher → Topic → [Subscription A] → Consumer A
                   → [Subscription B] → Consumer B
                   → [Subscription C] → Consumer C

Benefits:
  - Decoupled publishers and subscribers
  - Filtered subscriptions (only get relevant messages)
  - Fan-out to multiple consumers
  - Independent scaling
`);

  // Uncomment to run after setup:
  // await publishNotifications();
  // await subscribeToOrders();

  console.log('\nUncomment the function calls to run after setup.');
}

main().catch(console.error);
