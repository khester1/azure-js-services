import { query, transaction, getPool } from './db.js';
import sql from 'mssql';

// Type definitions
export interface Product {
  id?: number;
  name: string;
  price: number;
  category: string;
  createdAt?: Date;
}

/**
 * Initialize the database schema
 */
export async function initializeSchema(): Promise<void> {
  await query(`
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Products')
    BEGIN
      CREATE TABLE Products (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        category NVARCHAR(50) NOT NULL,
        createdAt DATETIME2 DEFAULT GETUTCDATE()
      );

      CREATE INDEX IX_Products_Category ON Products(category);
    END
  `);
  console.log('Schema initialized');
}

/**
 * CREATE - Insert a new product
 */
export async function createProduct(product: Product): Promise<number> {
  const result = await query<{ id: number }>(
    `INSERT INTO Products (name, price, category)
     OUTPUT INSERTED.id
     VALUES (@name, @price, @category)`,
    {
      name: product.name,
      price: product.price,
      category: product.category,
    }
  );

  return result.recordset[0].id;
}

/**
 * READ - Get all products
 */
export async function getAllProducts(): Promise<Product[]> {
  const result = await query<Product>(
    'SELECT id, name, price, category, createdAt FROM Products ORDER BY createdAt DESC'
  );
  return result.recordset;
}

/**
 * READ - Get product by ID
 */
export async function getProductById(id: number): Promise<Product | null> {
  const result = await query<Product>(
    'SELECT id, name, price, category, createdAt FROM Products WHERE id = @id',
    { id }
  );
  return result.recordset[0] || null;
}

/**
 * READ - Get products by category
 */
export async function getProductsByCategory(category: string): Promise<Product[]> {
  const result = await query<Product>(
    'SELECT id, name, price, category, createdAt FROM Products WHERE category = @category',
    { category }
  );
  return result.recordset;
}

/**
 * UPDATE - Update a product
 */
export async function updateProduct(
  id: number,
  updates: Partial<Omit<Product, 'id' | 'createdAt'>>
): Promise<boolean> {
  const setClauses: string[] = [];
  const params: Record<string, unknown> = { id };

  if (updates.name !== undefined) {
    setClauses.push('name = @name');
    params.name = updates.name;
  }
  if (updates.price !== undefined) {
    setClauses.push('price = @price');
    params.price = updates.price;
  }
  if (updates.category !== undefined) {
    setClauses.push('category = @category');
    params.category = updates.category;
  }

  if (setClauses.length === 0) return false;

  const result = await query(
    `UPDATE Products SET ${setClauses.join(', ')} WHERE id = @id`,
    params
  );

  return result.rowsAffected[0] > 0;
}

/**
 * DELETE - Delete a product
 */
export async function deleteProduct(id: number): Promise<boolean> {
  const result = await query('DELETE FROM Products WHERE id = @id', { id });
  return result.rowsAffected[0] > 0;
}

/**
 * Batch insert using transaction
 */
export async function batchInsertProducts(products: Product[]): Promise<number[]> {
  const ids: number[] = [];

  await transaction(async (trans) => {
    for (const product of products) {
      const request = new sql.Request(trans);
      request.input('name', product.name);
      request.input('price', product.price);
      request.input('category', product.category);

      const result = await request.query<{ id: number }>(
        `INSERT INTO Products (name, price, category)
         OUTPUT INSERTED.id
         VALUES (@name, @price, @category)`
      );

      ids.push(result.recordset[0].id);
    }
  });

  return ids;
}

/**
 * Clear all products (for testing)
 */
export async function clearProducts(): Promise<void> {
  await query('DELETE FROM Products');
}
