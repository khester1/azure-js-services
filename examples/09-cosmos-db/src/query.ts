import { getContainer, config } from './client.js';

interface Product {
  id: string;
  category: string;
  name: string;
  price: number;
  inStock: boolean;
  quantity: number;
  tags: string[];
  createdAt: string;
}

async function runQueryDemo() {
  console.log('='.repeat(50));
  console.log('Cosmos DB Query Examples');
  console.log('='.repeat(50));
  console.log('');

  const container = await getContainer();

  // Seed sample data
  console.log('Seeding sample data...');

  const products: Omit<Product, 'id' | 'createdAt'>[] = [
    { category: 'electronics', name: 'Laptop Pro', price: 1299, inStock: true, quantity: 15, tags: ['computer', 'work'] },
    { category: 'electronics', name: 'Wireless Mouse', price: 49, inStock: true, quantity: 100, tags: ['accessory'] },
    { category: 'electronics', name: 'USB-C Hub', price: 79, inStock: false, quantity: 0, tags: ['accessory', 'cable'] },
    { category: 'clothing', name: 'Tech Hoodie', price: 89, inStock: true, quantity: 50, tags: ['apparel', 'casual'] },
    { category: 'clothing', name: 'Running Shoes', price: 129, inStock: true, quantity: 25, tags: ['footwear', 'sport'] },
    { category: 'books', name: 'Cosmos DB Guide', price: 45, inStock: true, quantity: 200, tags: ['tech', 'database'] },
  ];

  const createdProducts: Product[] = [];

  for (const product of products) {
    const newProduct: Product = {
      ...product,
      id: `${product.category}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };
    const { resource } = await container.items.create(newProduct);
    createdProducts.push(resource as Product);
  }

  console.log(`Created ${createdProducts.length} products\n`);

  // Query 1: Basic filter
  console.log('--- Query 1: Items in stock ---');
  const { resources: inStock, requestCharge: rc1 } = await container.items
    .query<Product>('SELECT c.name, c.price, c.quantity FROM c WHERE c.inStock = true')
    .fetchAll();

  inStock.forEach((p) => console.log(`  ${p.name}: $${p.price} (${p.quantity} in stock)`));
  console.log(`  RU charge: ${rc1}\n`);

  // Query 2: Range query with ORDER BY
  console.log('--- Query 2: Products under $100, sorted by price ---');
  const { resources: affordable, requestCharge: rc2 } = await container.items
    .query<Product>({
      query: 'SELECT c.name, c.category, c.price FROM c WHERE c.price < @maxPrice ORDER BY c.price',
      parameters: [{ name: '@maxPrice', value: 100 }],
    })
    .fetchAll();

  affordable.forEach((p) => console.log(`  ${p.name} (${p.category}): $${p.price}`));
  console.log(`  RU charge: ${rc2}\n`);

  // Query 3: Aggregation
  console.log('--- Query 3: Category statistics ---');
  const { resources: stats, requestCharge: rc3 } = await container.items
    .query<{ category: string; count: number; avgPrice: number; totalQuantity: number }>(`
      SELECT
        c.category,
        COUNT(1) as count,
        AVG(c.price) as avgPrice,
        SUM(c.quantity) as totalQuantity
      FROM c
      GROUP BY c.category
    `)
    .fetchAll();

  stats.forEach((s) =>
    console.log(`  ${s.category}: ${s.count} items, avg $${s.avgPrice.toFixed(2)}, ${s.totalQuantity} total qty`)
  );
  console.log(`  RU charge: ${rc3}\n`);

  // Query 4: Array contains
  console.log('--- Query 4: Products with "tech" tag ---');
  const { resources: techItems, requestCharge: rc4 } = await container.items
    .query<Product>('SELECT c.name, c.tags FROM c WHERE ARRAY_CONTAINS(c.tags, "tech")')
    .fetchAll();

  techItems.forEach((p) => console.log(`  ${p.name}: [${p.tags.join(', ')}]`));
  console.log(`  RU charge: ${rc4}\n`);

  // Query 5: Pagination
  console.log('--- Query 5: Paginated results (2 per page) ---');
  const queryIterator = container.items.query<Product>('SELECT c.name, c.price FROM c ORDER BY c.name', {
    maxItemCount: 2,
  });

  let pageNum = 1;
  while (queryIterator.hasMoreResults()) {
    const { resources: page, requestCharge } = await queryIterator.fetchNext();
    if (page.length === 0) break;

    console.log(`  Page ${pageNum} (RU: ${requestCharge}):`);
    page.forEach((p) => console.log(`    - ${p.name}: $${p.price}`));
    pageNum++;
  }
  console.log('');

  // Cleanup
  console.log('Cleaning up...');
  for (const product of createdProducts) {
    await container.item(product.id, product.category).delete();
  }

  console.log('Query demo complete!');
}

runQueryDemo().catch(console.error);
