/**
 * Azure SQL Database CRUD Demo
 *
 * This example demonstrates:
 * - Connecting to Azure SQL with connection pooling
 * - CRUD operations with parameterized queries
 * - Transactions for batch operations
 * - Proper error handling and cleanup
 */

import { closePool } from './db.js';
import {
  initializeSchema,
  createProduct,
  getAllProducts,
  getProductById,
  getProductsByCategory,
  updateProduct,
  deleteProduct,
  batchInsertProducts,
  clearProducts,
  type Product,
} from './crud.js';

function log(message: string, data?: unknown): void {
  console.log(`\n${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function section(title: string): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
}

async function main(): Promise<void> {
  try {
    section('Azure SQL Database CRUD Demo');

    // Initialize schema
    log('Initializing database schema...');
    await initializeSchema();

    // Clear any existing data
    log('Clearing existing data...');
    await clearProducts();

    // CREATE - Single product
    section('CREATE - Insert Products');

    const laptopId = await createProduct({
      name: 'MacBook Pro 16"',
      price: 2499.99,
      category: 'Electronics',
    });
    log(`Created product with ID: ${laptopId}`);

    // CREATE - Batch insert with transaction
    const sampleProducts: Product[] = [
      { name: 'iPhone 15 Pro', price: 999.99, category: 'Electronics' },
      { name: 'AirPods Pro', price: 249.99, category: 'Electronics' },
      { name: 'Standing Desk', price: 599.99, category: 'Furniture' },
      { name: 'Ergonomic Chair', price: 449.99, category: 'Furniture' },
    ];

    const batchIds = await batchInsertProducts(sampleProducts);
    log(`Batch inserted ${batchIds.length} products with IDs:`, batchIds);

    // READ - Get all products
    section('READ - Query Products');

    const allProducts = await getAllProducts();
    log(`All products (${allProducts.length}):`, allProducts);

    // READ - Get by ID
    const laptop = await getProductById(laptopId);
    log('Product by ID:', laptop);

    // READ - Get by category
    const electronics = await getProductsByCategory('Electronics');
    log(`Electronics (${electronics.length}):`, electronics);

    const furniture = await getProductsByCategory('Furniture');
    log(`Furniture (${furniture.length}):`, furniture);

    // UPDATE - Modify a product
    section('UPDATE - Modify Product');

    const updated = await updateProduct(laptopId, {
      name: 'MacBook Pro 16" M3 Max',
      price: 3499.99,
    });
    log(`Update successful: ${updated}`);

    const updatedLaptop = await getProductById(laptopId);
    log('Updated product:', updatedLaptop);

    // DELETE - Remove a product
    section('DELETE - Remove Product');

    const deleted = await deleteProduct(batchIds[batchIds.length - 1]);
    log(`Delete successful: ${deleted}`);

    const remainingProducts = await getAllProducts();
    log(`Remaining products (${remainingProducts.length}):`, remainingProducts);

    // Summary
    section('Demo Complete');
    console.log(`
Operations performed:
  - Schema initialization
  - Single insert (CREATE)
  - Batch insert with transaction (CREATE)
  - Query all products (READ)
  - Query by ID (READ)
  - Query by category (READ)
  - Update product (UPDATE)
  - Delete product (DELETE)

Key concepts demonstrated:
  - Connection pooling for efficiency
  - Parameterized queries for SQL injection prevention
  - Transactions for atomic batch operations
  - Proper error handling
`);

  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await closePool();
  }
}

// Run the demo
main().catch(console.error);
