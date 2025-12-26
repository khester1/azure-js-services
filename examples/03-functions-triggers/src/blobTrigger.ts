/**
 * Blob Storage Trigger Function
 *
 * Automatically processes files when they're uploaded to a container.
 * Common use cases:
 * - Image processing/resizing
 * - Document parsing
 * - Data import from CSV/JSON
 * - Virus scanning
 */

import { app, InvocationContext } from '@azure/functions';

// Blob trigger - processes files uploaded to 'uploads' container
app.storageBlob('blobTrigger', {
  // Connection string from local.settings.json
  connection: 'STORAGE_CONNECTION',
  // Container and path pattern
  // {name} captures the blob name for use in handler
  path: 'uploads/{name}',
  handler: async (blob: Buffer, context: InvocationContext) => {
    const blobName = context.triggerMetadata?.name as string;
    const blobUri = context.triggerMetadata?.uri as string;

    context.log(`Blob trigger activated!`);
    context.log(`  Name: ${blobName}`);
    context.log(`  Size: ${blob.length} bytes`);
    context.log(`  URI: ${blobUri}`);

    try {
      // Determine file type and process accordingly
      await processBlob(blobName, blob, context);

      context.log(`Blob ${blobName} processed successfully`);

    } catch (error) {
      context.error(`Failed to process blob ${blobName}:`, error);
      throw error;
    }
  },
});

async function processBlob(
  name: string,
  content: Buffer,
  context: InvocationContext
): Promise<void> {
  const extension = name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'json':
      await processJsonFile(name, content, context);
      break;
    case 'csv':
      await processCsvFile(name, content, context);
      break;
    case 'jpg':
    case 'jpeg':
    case 'png':
      await processImageFile(name, content, context);
      break;
    default:
      context.log(`Unknown file type: ${extension}, skipping processing`);
  }
}

async function processJsonFile(
  name: string,
  content: Buffer,
  context: InvocationContext
): Promise<void> {
  context.log('Processing JSON file...');

  const data = JSON.parse(content.toString());
  const recordCount = Array.isArray(data) ? data.length : 1;

  context.log(`  Parsed ${recordCount} record(s)`);

  // In real app: validate, transform, save to database, etc.
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function processCsvFile(
  name: string,
  content: Buffer,
  context: InvocationContext
): Promise<void> {
  context.log('Processing CSV file...');

  const lines = content.toString().split('\n');
  const recordCount = lines.length - 1; // Exclude header

  context.log(`  Found ${recordCount} row(s)`);

  // In real app: parse CSV, validate, import to database, etc.
  await new Promise((resolve) => setTimeout(resolve, 100));
}

async function processImageFile(
  name: string,
  content: Buffer,
  context: InvocationContext
): Promise<void> {
  context.log('Processing image file...');
  context.log(`  Size: ${content.length} bytes`);

  // In real app: resize, create thumbnails, extract metadata, etc.
  // Could use sharp library for image processing
  await new Promise((resolve) => setTimeout(resolve, 100));

  context.log('  Image processed (would create thumbnails in real app)');
}

/*
 * To test this trigger:
 *
 * 1. Run setup.sh to create storage account
 * 2. Add STORAGE_CONNECTION to local.settings.json
 * 3. Run: npm start
 * 4. Upload a file to the 'uploads' container:
 *
 *    az storage blob upload \
 *      --container-name uploads \
 *      --name test.json \
 *      --data '{"message": "Hello"}' \
 *      --connection-string "<your-connection-string>"
 *
 * 5. Watch this function process the file automatically
 *
 * Note: There can be a slight delay (up to 10 minutes) for blob triggers
 * in consumption plan. For faster processing, consider Event Grid trigger.
 */
