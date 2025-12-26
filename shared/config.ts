import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
export function loadEnv(exampleDir?: string): void {
  // Try loading from example directory first
  if (exampleDir) {
    config({ path: resolve(exampleDir, '.env') });
  }

  // Then load from root (doesn't override existing)
  const __dirname = dirname(fileURLToPath(import.meta.url));
  config({ path: resolve(__dirname, '..', '.env') });
}

// Get required environment variable or throw
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Get optional environment variable with default
export function getEnv(name: string, defaultValue: string = ''): string {
  return process.env[name] || defaultValue;
}

// Azure configuration
export const azure = {
  get resourceGroup(): string {
    return getEnv('AZURE_RESOURCE_GROUP', 'rg-azure-js-services');
  },
  get location(): string {
    return getEnv('AZURE_LOCATION', 'eastus');
  },
};

// Pretty print for demos
export function log(message: string, data?: unknown): void {
  console.log(`\n${message}`);
  if (data !== undefined) {
    console.log(JSON.stringify(data, null, 2));
  }
}

export function logSuccess(message: string): void {
  console.log(`\n✅ ${message}`);
}

export function logError(message: string, error?: unknown): void {
  console.error(`\n❌ ${message}`);
  if (error instanceof Error) {
    console.error(`   ${error.message}`);
  }
}

export function logSection(title: string): void {
  console.log(`\n${'='.repeat(50)}`);
  console.log(title);
  console.log('='.repeat(50));
}
