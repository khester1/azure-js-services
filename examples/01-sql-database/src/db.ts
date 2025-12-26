import sql from 'mssql';
import { config } from 'dotenv';

// Load environment variables
config();

// Connection pool configuration
const poolConfig: sql.config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USER || '',
  password: process.env.SQL_PASSWORD || '',
  options: {
    encrypt: true, // Required for Azure SQL
    trustServerCertificate: false,
  },
  pool: {
    max: 10, // Maximum connections in pool
    min: 0, // Minimum connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30s
  },
};

// Singleton connection pool
let pool: sql.ConnectionPool | null = null;

/**
 * Get the connection pool (creates if doesn't exist)
 */
export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(poolConfig);
    console.log('Connected to Azure SQL Database');
  }
  return pool;
}

/**
 * Close the connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('Connection pool closed');
  }
}

/**
 * Execute a query with parameters
 */
export async function query<T>(
  sqlText: string,
  params?: Record<string, unknown>
): Promise<sql.IResult<T>> {
  const pool = await getPool();
  const request = pool.request();

  // Add parameters if provided
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }

  return request.query<T>(sqlText);
}

/**
 * Execute within a transaction
 */
export async function transaction<T>(
  operations: (transaction: sql.Transaction) => Promise<T>
): Promise<T> {
  const pool = await getPool();
  const trans = new sql.Transaction(pool);

  try {
    await trans.begin();
    const result = await operations(trans);
    await trans.commit();
    return result;
  } catch (error) {
    await trans.rollback();
    throw error;
  }
}
