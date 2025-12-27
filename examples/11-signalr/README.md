# Azure SignalR Service Example

Learn how to build real-time web applications with Azure SignalR Service.

## What You'll Learn

- Setting up Azure SignalR Service
- Real-time messaging between clients
- SignalR negotiate pattern
- Broadcasting messages to all clients
- Handling connection lifecycle events

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)

## Project Structure

```text
11-signalr/
├── src/
│   ├── server.ts      # Express server + SignalR hub
│   └── client.ts      # CLI client for testing
├── setup.sh           # Provision SignalR Service
└── .env.example       # Environment template
```

## Quick Start

### 1. Create Azure Resources

```bash
./setup.sh
```

Creates SignalR Service (Free tier).

### 2. Install and Run

```bash
npm install
npm run server
```

### 3. Open in Browser

Open <http://localhost:3000> in multiple browser tabs to see real-time messaging.

## How It Works

```text
┌─────────────┐     ┌──────────────────┐     ┌─────────────┐
│   Browser   │────▶│  Express Server  │────▶│   Azure     │
│   Client    │◀────│   (negotiate)    │◀────│  SignalR    │
└─────────────┘     └──────────────────┘     └─────────────┘
       │                                            │
       └────────────── WebSocket ──────────────────┘
```

1. Client calls `/negotiate` to get connection URL + token
2. Client connects directly to Azure SignalR via WebSocket
3. Server broadcasts messages via SignalR REST API
4. All connected clients receive messages in real-time

## Key Concepts

### Negotiate Endpoint

Clients need a URL and access token to connect:

```typescript
app.post('/negotiate', (req, res) => {
  const hubUrl = `${endpoint}/client/?hub=${hubName}`;
  const accessToken = generateAccessToken(hubUrl, userId);

  res.json({ url: hubUrl, accessToken });
});
```

### Client Connection

```javascript
// Get connection info
const { url, accessToken } = await fetch('/negotiate').then(r => r.json());

// Build connection
const connection = new signalR.HubConnectionBuilder()
  .withUrl(url, { accessTokenFactory: () => accessToken })
  .withAutomaticReconnect()
  .build();

// Handle messages
connection.on('newMessage', (user, message) => {
  console.log(`${user}: ${message}`);
});

// Connect
await connection.start();
```

### Broadcasting Messages

```typescript
// Use SignalR REST API
const response = await fetch(`${endpoint}/api/v1/hubs/${hubName}`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    target: 'newMessage',
    arguments: ['user', 'Hello!']
  })
});
```

### Connection Events

```javascript
connection.onclose(() => {
  console.log('Disconnected');
});

connection.onreconnecting(() => {
  console.log('Reconnecting...');
});

connection.onreconnected(() => {
  console.log('Reconnected!');
});
```

## Service Modes

| Mode | Description | Use Case |
| ------ | ------------- | ---------- |
| **Default** | Server manages connections | Traditional hub pattern |
| Serverless | Azure Functions integration | Event-driven, no server |
| Classic | Legacy mode | Migration from older versions |

## Pricing

| Tier | Connections | Messages/Day | Cost |
| ------ | ------------- | -------------- | ------ |
| **Free** | 20 | 20,000 | $0 |
| Standard | 1,000+ | Unlimited | ~$50/mo |

**Free tier is perfect for learning!**

## Use Cases

- **Chat applications** - Real-time messaging
- **Live dashboards** - Streaming data updates
- **Notifications** - Push alerts to users
- **Collaborative editing** - Shared document updates
- **Gaming** - Multiplayer game state sync
- **IoT** - Device telemetry streaming

## Cleanup

```bash
az signalr delete \
  --name $(cat .signalr-name) \
  --resource-group rg-azure-js-services --yes
```

## SignalR vs Other Real-time Options

| Feature | SignalR | WebSockets | Polling |
| --------- | --------- | ------------ | --------- |
| **Fallback** | Auto (WS → SSE → LP) | None | N/A |
| **Scaling** | Azure managed | DIY | DIY |
| **Protocol** | Higher-level RPC | Raw messages | HTTP |
| **Reconnect** | Automatic | Manual | N/A |

## Next Steps

- Try serverless mode with Azure Functions
- Implement user groups for targeted messaging
- Add authentication with Azure AD
- Build a collaborative whiteboard app
