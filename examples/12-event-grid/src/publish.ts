import { publisherClient, config } from './client.js';

interface OrderEvent {
  orderId: string;
  customerId: string;
  items: { productId: string; quantity: number }[];
  total: number;
}

interface InventoryEvent {
  productId: string;
  action: 'restock' | 'depleted';
  quantity: number;
}

async function publishEvents() {
  console.log('='.repeat(50));
  console.log('Azure Event Grid Publisher Demo');
  console.log('='.repeat(50));
  console.log('');
  console.log(`Endpoint: ${config.endpoint}`);
  console.log('');

  // 1. Publish single event
  console.log('--- Publishing Single Event ---');

  const orderEvent = {
    id: `order-${Date.now()}`,
    eventType: 'Order.Created',
    subject: '/orders/new',
    dataVersion: '1.0',
    eventTime: new Date(),
    data: {
      orderId: `ORD-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      customerId: 'CUST-001',
      items: [
        { productId: 'PROD-A', quantity: 2 },
        { productId: 'PROD-B', quantity: 1 },
      ],
      total: 149.99,
    } as OrderEvent,
  };

  await publisherClient.send([orderEvent]);
  console.log(`Published: ${orderEvent.eventType}`);
  console.log(`  ID: ${orderEvent.id}`);
  console.log(`  Order ID: ${orderEvent.data.orderId}`);
  console.log('');

  // 2. Publish multiple events (batch)
  console.log('--- Publishing Batch Events ---');

  const batchEvents = [
    {
      id: `inv-${Date.now()}-1`,
      eventType: 'Inventory.Restocked',
      subject: '/inventory/PROD-A',
      dataVersion: '1.0',
      eventTime: new Date(),
      data: {
        productId: 'PROD-A',
        action: 'restock',
        quantity: 100,
      } as InventoryEvent,
    },
    {
      id: `inv-${Date.now()}-2`,
      eventType: 'Inventory.Depleted',
      subject: '/inventory/PROD-C',
      dataVersion: '1.0',
      eventTime: new Date(),
      data: {
        productId: 'PROD-C',
        action: 'depleted',
        quantity: 0,
      } as InventoryEvent,
    },
    {
      id: `order-${Date.now()}-2`,
      eventType: 'Order.Shipped',
      subject: '/orders/shipped',
      dataVersion: '1.0',
      eventTime: new Date(),
      data: {
        orderId: 'ORD-PREV-001',
        trackingNumber: 'TRK-123456789',
        carrier: 'FastShip',
      },
    },
  ];

  await publisherClient.send(batchEvents);
  console.log(`Published ${batchEvents.length} events:`);
  batchEvents.forEach((e) => {
    console.log(`  - ${e.eventType} (${e.subject})`);
  });
  console.log('');

  // 3. Publish with different event types
  console.log('--- Publishing Domain Events ---');

  const domainEvents = [
    {
      id: `user-${Date.now()}`,
      eventType: 'User.Registered',
      subject: '/users/new',
      dataVersion: '1.0',
      eventTime: new Date(),
      data: {
        userId: 'USER-999',
        email: 'demo@example.com',
        registeredAt: new Date().toISOString(),
      },
    },
    {
      id: `payment-${Date.now()}`,
      eventType: 'Payment.Completed',
      subject: '/payments/completed',
      dataVersion: '1.0',
      eventTime: new Date(),
      data: {
        paymentId: 'PAY-456',
        orderId: orderEvent.data.orderId,
        amount: 149.99,
        method: 'credit_card',
      },
    },
  ];

  await publisherClient.send(domainEvents);
  console.log(`Published ${domainEvents.length} domain events`);
  console.log('');

  console.log('='.repeat(50));
  console.log('Events published successfully!');
  console.log('');
  console.log('To receive events, create a subscription:');
  console.log('  1. Use Azure Portal > Event Grid Topic > Event Subscriptions');
  console.log('  2. Or use Azure Functions with Event Grid trigger');
  console.log('  3. Or run: npm run webhook (for local testing with ngrok)');
  console.log('='.repeat(50));
}

publishEvents().catch(console.error);
