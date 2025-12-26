/**
 * Service Bus Queue Trigger Function
 *
 * Automatically processes messages from a Service Bus queue.
 * Replaces manual receiver code with declarative trigger.
 *
 * Benefits over manual receiver:
 * - Automatic scaling based on queue depth
 * - Built-in retry with dead-letter support
 * - No need to manage connections
 * - Pay only for execution time
 */

import { app, InvocationContext } from '@azure/functions';

interface OrderMessage {
  orderId: string;
  customerId: string;
  items: Array<{ productId: string; quantity: number }>;
  totalAmount: number;
  createdAt: string;
}

// Queue trigger - processes messages from Service Bus queue
app.serviceBusQueue('queueTrigger', {
  // Connection string from local.settings.json
  connection: 'SERVICE_BUS_CONNECTION',
  // Queue name (from 02-service-bus example)
  queueName: 'demo-queue',
  handler: async (message: unknown, context: InvocationContext) => {
    const order = message as OrderMessage;

    context.log(`Processing order: ${order.orderId}`);
    context.log(`  Customer: ${order.customerId}`);
    context.log(`  Items: ${order.items.length}`);
    context.log(`  Total: $${order.totalAmount}`);

    try {
      // Process the order
      await processOrder(order, context);

      context.log(`Order ${order.orderId} processed successfully`);

      // Message is auto-completed on successful return
      // No need to call completeMessage() like in manual receiver

    } catch (error) {
      context.error(`Failed to process order ${order.orderId}:`, error);

      // Throwing an error will:
      // 1. Abandon the message (return to queue)
      // 2. After max retries, move to dead-letter queue
      throw error;
    }
  },
});

async function processOrder(
  order: OrderMessage,
  context: InvocationContext
): Promise<void> {
  // Simulate order processing
  context.log('Validating order...');
  await new Promise((resolve) => setTimeout(resolve, 100));

  context.log('Updating inventory...');
  await new Promise((resolve) => setTimeout(resolve, 100));

  context.log('Sending confirmation email...');
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate occasional failures for testing dead-letter
  if (order.orderId.includes('FAIL')) {
    throw new Error('Simulated processing failure');
  }
}

/*
 * To test this trigger:
 *
 * 1. Ensure 02-service-bus is set up with a queue
 * 2. Add SERVICE_BUS_CONNECTION to local.settings.json
 * 3. Run: npm start
 * 4. Send messages using 02-service-bus sender:
 *    cd ../02-service-bus && npm run sender
 * 5. Watch this function process them automatically
 *
 * Message flow:
 * Sender → Queue → This Function (auto-triggered)
 *                       ↓
 *              Success: Message completed
 *              Failure: Message abandoned → Retry → Dead-letter
 */
