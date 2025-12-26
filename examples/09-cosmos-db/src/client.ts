import { CosmosClient, Container, Database } from '@azure/cosmos';
import dotenv from 'dotenv';

dotenv.config();

const endpoint = process.env.COSMOS_ENDPOINT!;
const key = process.env.COSMOS_KEY!;
const databaseId = process.env.COSMOS_DATABASE || 'demo-db';
const containerId = process.env.COSMOS_CONTAINER || 'items';

if (!endpoint || !key) {
  throw new Error('Missing COSMOS_ENDPOINT or COSMOS_KEY. Run ./setup.sh first.');
}

// Create Cosmos client (singleton pattern)
export const client = new CosmosClient({ endpoint, key });

// Get database reference
export async function getDatabase(): Promise<Database> {
  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  return database;
}

// Get container reference
export async function getContainer(): Promise<Container> {
  const database = await getDatabase();
  const { container } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ['/category'] },
  });
  return container;
}

// Configuration info
export const config = {
  endpoint,
  databaseId,
  containerId,
};
