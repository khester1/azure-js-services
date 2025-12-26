import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = process.env.AZURE_STORAGE_CONTAINER || 'demo-container';

if (!connectionString) {
  throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING. Run ./setup.sh first.');
}

// Create blob service client
export const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);

// Get container client
export function getContainerClient(): ContainerClient {
  return blobServiceClient.getContainerClient(containerName);
}

// Ensure container exists
export async function ensureContainer(): Promise<ContainerClient> {
  const containerClient = getContainerClient();
  await containerClient.createIfNotExists();
  return containerClient;
}

export const config = {
  containerName,
};
