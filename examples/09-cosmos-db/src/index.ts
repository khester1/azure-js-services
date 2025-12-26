import { getContainer, config, client } from './client.js';

async function main() {
  console.log('='.repeat(50));
  console.log('Azure Cosmos DB Demo');
  console.log('='.repeat(50));
  console.log('');
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Database: ${config.databaseId}`);
  console.log(`Container: ${config.containerId}`);
  console.log('');

  try {
    // Get container
    console.log('Connecting to Cosmos DB...');
    const container = await getContainer();
    console.log('Connected successfully!\n');

    // Create a sample item
    const item = {
      id: `demo-${Date.now()}`,
      category: 'demo',
      name: 'Hello Cosmos DB',
      message: 'This is a test item',
      createdAt: new Date().toISOString(),
    };

    console.log('Creating item...');
    const { resource: created, requestCharge: createCharge } = await container.items.create(item);
    console.log(`Created: ${created?.name}`);
    console.log(`Request charge: ${createCharge} RUs\n`);

    // Read it back
    console.log('Reading item...');
    const { resource: read, requestCharge: readCharge } = await container.item(item.id, item.category).read();
    console.log(`Read: ${read?.name}`);
    console.log(`Message: ${read?.message}`);
    console.log(`Request charge: ${readCharge} RUs\n`);

    // Query all items
    console.log('Querying items...');
    const { resources: items, requestCharge: queryCharge } = await container.items
      .query('SELECT * FROM c WHERE c.category = "demo"')
      .fetchAll();
    console.log(`Found ${items.length} item(s)`);
    console.log(`Request charge: ${queryCharge} RUs\n`);

    // Delete the item
    console.log('Deleting item...');
    const { requestCharge: deleteCharge } = await container.item(item.id, item.category).delete();
    console.log(`Deleted: ${item.id}`);
    console.log(`Request charge: ${deleteCharge} RUs\n`);

    console.log('='.repeat(50));
    console.log('Demo complete!');
    console.log('');
    console.log('Try the other demos:');
    console.log('  npm run crud   - Full CRUD operations');
    console.log('  npm run query  - Advanced query examples');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
