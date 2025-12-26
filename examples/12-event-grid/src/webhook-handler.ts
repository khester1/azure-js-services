import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON bodies
app.use(express.json());

// Event Grid webhook endpoint
app.post('/api/events', (req: Request, res: Response) => {
  const events = req.body;

  console.log('');
  console.log('='.repeat(50));
  console.log('Received Event Grid events');
  console.log('='.repeat(50));

  // Handle validation request (subscription handshake)
  if (events && events[0] && events[0].eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    const validationCode = events[0].data.validationCode;
    console.log('Subscription validation request received');
    console.log(`Validation code: ${validationCode}`);

    // Return validation response
    res.json({ validationResponse: validationCode });
    return;
  }

  // Process events
  for (const event of events) {
    console.log('');
    console.log(`Event Type: ${event.eventType}`);
    console.log(`Subject: ${event.subject}`);
    console.log(`ID: ${event.id}`);
    console.log(`Time: ${event.eventTime}`);
    console.log('Data:', JSON.stringify(event.data, null, 2));

    // Handle specific event types
    switch (event.eventType) {
      case 'Order.Created':
        handleOrderCreated(event.data);
        break;
      case 'Order.Shipped':
        handleOrderShipped(event.data);
        break;
      case 'Inventory.Restocked':
        handleInventoryRestocked(event.data);
        break;
      case 'Inventory.Depleted':
        handleInventoryDepleted(event.data);
        break;
      case 'User.Registered':
        handleUserRegistered(event.data);
        break;
      case 'Payment.Completed':
        handlePaymentCompleted(event.data);
        break;
      default:
        console.log(`  [Handler] Unknown event type: ${event.eventType}`);
    }
  }

  console.log('');
  console.log('='.repeat(50));

  // Always return 200 to acknowledge receipt
  res.status(200).send('OK');
});

// Event handlers
function handleOrderCreated(data: any) {
  console.log(`  [Handler] Processing new order: ${data.orderId}`);
  console.log(`  [Handler] Customer: ${data.customerId}, Total: $${data.total}`);
  // In real app: send confirmation email, update inventory, etc.
}

function handleOrderShipped(data: any) {
  console.log(`  [Handler] Order shipped: ${data.orderId}`);
  console.log(`  [Handler] Tracking: ${data.trackingNumber} via ${data.carrier}`);
  // In real app: send shipping notification
}

function handleInventoryRestocked(data: any) {
  console.log(`  [Handler] Inventory restocked: ${data.productId}`);
  console.log(`  [Handler] New quantity: ${data.quantity}`);
  // In real app: notify waiting customers
}

function handleInventoryDepleted(data: any) {
  console.log(`  [Handler] ALERT: Inventory depleted: ${data.productId}`);
  // In real app: trigger reorder, notify purchasing
}

function handleUserRegistered(data: any) {
  console.log(`  [Handler] New user registered: ${data.userId}`);
  console.log(`  [Handler] Email: ${data.email}`);
  // In real app: send welcome email, setup user preferences
}

function handlePaymentCompleted(data: any) {
  console.log(`  [Handler] Payment completed: ${data.paymentId}`);
  console.log(`  [Handler] Amount: $${data.amount} for order ${data.orderId}`);
  // In real app: update order status, send receipt
}

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Event Grid Webhook Handler');
  console.log('='.repeat(50));
  console.log('');
  console.log(`Listening on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/events`);
  console.log('');
  console.log('To receive events from Azure Event Grid:');
  console.log('1. Expose this endpoint publicly (e.g., using ngrok):');
  console.log('   ngrok http 3000');
  console.log('');
  console.log('2. Create an Event Grid subscription:');
  console.log('   az eventgrid event-subscription create \\');
  console.log('     --name local-webhook \\');
  console.log('     --source-resource-id <topic-resource-id> \\');
  console.log('     --endpoint https://<ngrok-url>/api/events');
  console.log('');
  console.log('3. Publish events: npm run publish');
  console.log('='.repeat(50));
  console.log('');
  console.log('Waiting for events...');
});
