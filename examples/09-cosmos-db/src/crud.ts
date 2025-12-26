import { getContainer, config } from './client.js';

// Define item interface
interface Item {
  id: string;
  category: string;
  name: string;
  description?: string;
  price?: number;
  tags?: string[];
  createdAt: string;
}

async function runCrudDemo() {
  console.log('='.repeat(50));
  console.log('Cosmos DB CRUD Operations Demo');
  console.log('='.repeat(50));
  console.log(`Database: ${config.databaseId}`);
  console.log(`Container: ${config.containerId}`);
  console.log('');

  const container = await getContainer();

  // CREATE - Insert items
  console.log('--- CREATE ---');

  const items: Omit<Item, 'id' | 'createdAt'>[] = [
    { category: 'electronics', name: 'Laptop', price: 999.99, tags: ['computer', 'portable'] },
    { category: 'electronics', name: 'Phone', price: 699.99, tags: ['mobile', 'smart'] },
    { category: 'books', name: 'TypeScript Guide', price: 39.99, tags: ['programming', 'tech'] },
    { category: 'books', name: 'Azure Handbook', price: 49.99, tags: ['cloud', 'tech'] },
  ];

  const createdItems: Item[] = [];

  for (const item of items) {
    const newItem: Item = {
      ...item,
      id: `${item.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    const { resource } = await container.items.create(newItem);
    createdItems.push(resource as Item);
    console.log(`Created: ${newItem.name} (id: ${newItem.id})`);
  }

  console.log('');

  // READ - Get single item (requires partition key)
  console.log('--- READ ---');

  const firstItem = createdItems[0];
  const { resource: readItem } = await container.item(firstItem.id, firstItem.category).read<Item>();
  console.log(`Read item: ${readItem?.name}, Price: $${readItem?.price}`);
  console.log('');

  // UPDATE - Replace item
  console.log('--- UPDATE ---');

  if (readItem) {
    readItem.price = 899.99;
    readItem.description = 'Updated with discount!';

    const { resource: updatedItem } = await container
      .item(readItem.id, readItem.category)
      .replace(readItem);

    console.log(`Updated: ${updatedItem?.name}, New price: $${updatedItem?.price}`);
  }
  console.log('');

  // QUERY - Find items
  console.log('--- QUERY ---');

  // Query within a partition
  const { resources: electronics } = await container.items
    .query<Item>({
      query: 'SELECT * FROM c WHERE c.category = @category',
      parameters: [{ name: '@category', value: 'electronics' }],
    })
    .fetchAll();

  console.log(`Electronics items: ${electronics.length}`);
  electronics.forEach((item) => console.log(`  - ${item.name}: $${item.price}`));
  console.log('');

  // Cross-partition query
  const { resources: allItems } = await container.items
    .query<Item>('SELECT c.id, c.name, c.category, c.price FROM c ORDER BY c.price DESC')
    .fetchAll();

  console.log('All items by price:');
  allItems.forEach((item) => console.log(`  - ${item.name} (${item.category}): $${item.price}`));
  console.log('');

  // DELETE - Remove items
  console.log('--- DELETE ---');

  for (const item of createdItems) {
    await container.item(item.id, item.category).delete();
    console.log(`Deleted: ${item.name}`);
  }

  console.log('');
  console.log('CRUD demo complete!');
}

runCrudDemo().catch(console.error);
