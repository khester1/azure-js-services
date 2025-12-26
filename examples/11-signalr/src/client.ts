import * as signalR from '@microsoft/signalr';
import * as readline from 'readline';

// This is a CLI client for testing
// In production, you'd use the browser client

async function main() {
  console.log('='.repeat(50));
  console.log('Azure SignalR CLI Client');
  console.log('='.repeat(50));
  console.log('');
  console.log('Make sure the server is running: npm run server');
  console.log('');

  // Get connection info from server
  const response = await fetch('http://localhost:3000/negotiate', {
    method: 'POST',
  });

  if (!response.ok) {
    console.error('Failed to negotiate. Is the server running?');
    process.exit(1);
  }

  const { url, accessToken } = await response.json();

  console.log('Connecting to SignalR...');

  // Build connection
  const connection = new signalR.HubConnectionBuilder()
    .withUrl(url, {
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  // Handle incoming messages
  connection.on('newMessage', (user: string, message: string) => {
    console.log(`\n[${user}]: ${message}`);
    process.stdout.write('You: ');
  });

  connection.on('userJoined', (user: string) => {
    console.log(`\n[System] ${user} joined the chat`);
    process.stdout.write('You: ');
  });

  connection.onclose(() => {
    console.log('\nDisconnected from SignalR');
    process.exit(0);
  });

  // Start connection
  await connection.start();
  console.log('Connected!\n');
  console.log('Type a message and press Enter to send.');
  console.log('Type "quit" to exit.\n');

  // Setup readline for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askForMessage = () => {
    rl.question('You: ', async (message) => {
      if (message.toLowerCase() === 'quit') {
        await connection.stop();
        rl.close();
        return;
      }

      if (message.trim()) {
        // Send message via server API
        await fetch('http://localhost:3000/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        });
      }

      askForMessage();
    });
  };

  askForMessage();
}

main().catch(console.error);
