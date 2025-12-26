import express from 'express';
import { createServer } from 'http';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Parse SignalR connection string
const connectionString = process.env.SIGNALR_CONNECTION_STRING;
if (!connectionString) {
  console.error('Missing SIGNALR_CONNECTION_STRING. Run ./setup.sh first.');
  process.exit(1);
}

const endpoint = connectionString.match(/Endpoint=([^;]+)/)?.[1];
const accessKey = connectionString.match(/AccessKey=([^;]+)/)?.[1];

if (!endpoint || !accessKey) {
  console.error('Invalid connection string format');
  process.exit(1);
}

const hubName = 'chat';

// Generate access token for clients
function generateAccessToken(hubUrl: string, userId?: string): string {
  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  const audience = hubUrl;
  const payload: Record<string, any> = {
    aud: audience,
    exp: expiry,
  };

  if (userId) {
    payload['nameid'] = userId;
  }

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', accessKey!).update(`${header}.${body}`).digest('base64url');

  return `${header}.${body}.${signature}`;
}

// Negotiate endpoint - returns connection info for clients
app.post('/negotiate', (req, res) => {
  const userId = `user-${Math.random().toString(36).slice(2, 8)}`;
  const hubUrl = `${endpoint}/client/?hub=${hubName}`;
  const accessToken = generateAccessToken(hubUrl, userId);

  res.json({
    url: hubUrl,
    accessToken: accessToken,
  });
});

// Serve static HTML for demo
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Azure SignalR Chat Demo</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
    #messages { height: 300px; border: 1px solid #ccc; overflow-y: auto; padding: 10px; margin-bottom: 10px; }
    .message { padding: 5px 0; border-bottom: 1px solid #eee; }
    .system { color: #666; font-style: italic; }
    input[type="text"] { width: 70%; padding: 10px; }
    button { padding: 10px 20px; background: #0078d4; color: white; border: none; cursor: pointer; }
    button:hover { background: #005a9e; }
    .status { padding: 10px; margin-bottom: 10px; border-radius: 4px; }
    .connected { background: #d4edda; color: #155724; }
    .disconnected { background: #f8d7da; color: #721c24; }
  </style>
</head>
<body>
  <h1>Azure SignalR Chat Demo</h1>

  <div id="status" class="status disconnected">Disconnected</div>

  <div id="messages"></div>

  <div>
    <input type="text" id="messageInput" placeholder="Type a message..." />
    <button onclick="sendMessage()">Send</button>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.0/signalr.min.js"></script>
  <script>
    let connection;
    const messagesDiv = document.getElementById('messages');
    const statusDiv = document.getElementById('status');
    const messageInput = document.getElementById('messageInput');

    function addMessage(text, isSystem = false) {
      const div = document.createElement('div');
      div.className = 'message' + (isSystem ? ' system' : '');
      div.textContent = text;
      messagesDiv.appendChild(div);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    async function connect() {
      // Get connection info from server
      const response = await fetch('/negotiate', { method: 'POST' });
      const { url, accessToken } = await response.json();

      // Build SignalR connection
      connection = new signalR.HubConnectionBuilder()
        .withUrl(url, { accessTokenFactory: () => accessToken })
        .withAutomaticReconnect()
        .build();

      // Handle incoming messages
      connection.on('newMessage', (user, message) => {
        addMessage(user + ': ' + message);
      });

      connection.on('userJoined', (user) => {
        addMessage(user + ' joined the chat', true);
      });

      connection.onclose(() => {
        statusDiv.className = 'status disconnected';
        statusDiv.textContent = 'Disconnected';
      });

      connection.onreconnecting(() => {
        statusDiv.className = 'status disconnected';
        statusDiv.textContent = 'Reconnecting...';
      });

      connection.onreconnected(() => {
        statusDiv.className = 'status connected';
        statusDiv.textContent = 'Connected (reconnected)';
      });

      // Start connection
      await connection.start();
      statusDiv.className = 'status connected';
      statusDiv.textContent = 'Connected to Azure SignalR';
      addMessage('Connected to chat!', true);
    }

    async function sendMessage() {
      const message = messageInput.value.trim();
      if (!message) return;

      try {
        // Send via REST API to broadcast to all clients
        await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message })
        });
        messageInput.value = '';
      } catch (err) {
        addMessage('Error sending message: ' + err.message, true);
      }
    }

    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    connect().catch(err => {
      addMessage('Connection error: ' + err.message, true);
    });
  </script>
</body>
</html>
  `);
});

// API to broadcast message to all clients
app.use(express.json());

app.post('/api/broadcast', async (req, res) => {
  const { message } = req.body;
  const user = 'Anonymous';

  try {
    // Use SignalR REST API to broadcast
    const url = `${endpoint}/api/v1/hubs/${hubName}`;
    const token = generateAccessToken(`${endpoint}/api/v1/hubs/${hubName}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        target: 'newMessage',
        arguments: [user, message],
      }),
    });

    if (!response.ok) {
      throw new Error(`SignalR API error: ${response.status}`);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Broadcast error:', error);
    res.status(500).json({ error: 'Failed to broadcast' });
  }
});

server.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('Azure SignalR Demo Server');
  console.log('='.repeat(50));
  console.log('');
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`SignalR Endpoint: ${endpoint}`);
  console.log('');
  console.log('Open http://localhost:3000 in your browser');
  console.log('Open multiple tabs to see real-time messaging!');
  console.log('='.repeat(50));
});
