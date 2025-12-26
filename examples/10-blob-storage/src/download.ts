import { getContainerClient } from './client.js';

async function downloadDemo() {
  console.log('='.repeat(50));
  console.log('Blob Storage Download Examples');
  console.log('='.repeat(50));
  console.log('');

  const container = getContainerClient();

  // 1. Download to string
  console.log('--- Download to String ---');
  const textBlob = container.getBlockBlobClient('hello.txt');
  try {
    const downloadResponse = await textBlob.download();
    const content = await streamToString(downloadResponse.readableStreamBody!);
    console.log(`File: ${textBlob.name}`);
    console.log(`Content: ${content}\n`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log('File not found. Run: npm run upload first\n');
    } else throw error;
  }

  // 2. Download JSON and parse
  console.log('--- Download JSON ---');
  const jsonBlob = container.getBlockBlobClient('data/sample.json');
  try {
    const jsonResponse = await jsonBlob.download();
    const jsonString = await streamToString(jsonResponse.readableStreamBody!);
    const data = JSON.parse(jsonString);
    console.log(`File: ${jsonBlob.name}`);
    console.log(`Parsed:`, data);
    console.log('');
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log('File not found.\n');
    } else throw error;
  }

  // 3. Download with metadata
  console.log('--- Download with Metadata ---');
  const metaBlob = container.getBlockBlobClient('documents/report.txt');
  try {
    const properties = await metaBlob.getProperties();
    console.log(`File: ${metaBlob.name}`);
    console.log(`Content-Type: ${properties.contentType}`);
    console.log(`Size: ${properties.contentLength} bytes`);
    console.log(`Created: ${properties.createdOn}`);
    console.log(`Metadata:`, properties.metadata);
    console.log('');
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log('File not found.\n');
    } else throw error;
  }

  // 4. Download to buffer
  console.log('--- Download to Buffer ---');
  const imageBlob = container.getBlockBlobClient('images/sample.png');
  try {
    const buffer = await imageBlob.downloadToBuffer();
    console.log(`File: ${imageBlob.name}`);
    console.log(`Buffer size: ${buffer.length} bytes\n`);
  } catch (error: any) {
    if (error.statusCode === 404) {
      console.log('File not found.\n');
    } else throw error;
  }

  // 5. Generate SAS URL for temporary access
  console.log('--- Generate SAS URL ---');
  try {
    const sasUrl = await generateSasUrl(textBlob.name);
    console.log(`Temporary access URL (valid 1 hour):`);
    console.log(`${sasUrl.substring(0, 80)}...`);
    console.log('');
  } catch (error: any) {
    console.log('SAS generation requires storage account key.\n');
  }

  console.log('='.repeat(50));
  console.log('Download demo complete!');
  console.log('='.repeat(50));
}

// Helper: stream to string
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// Helper: generate SAS URL
async function generateSasUrl(blobName: string): Promise<string> {
  const { BlobSASPermissions, generateBlobSASQueryParameters, StorageSharedKeyCredential } = await import(
    '@azure/storage-blob'
  );

  // Parse connection string for account name and key
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
  const accountName = connStr.match(/AccountName=([^;]+)/)?.[1];
  const accountKey = connStr.match(/AccountKey=([^;]+)/)?.[1];

  if (!accountName || !accountKey) {
    throw new Error('Cannot parse connection string');
  }

  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);
  const container = getContainerClient();
  const blobClient = container.getBlockBlobClient(blobName);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: container.containerName,
      blobName: blobName,
      permissions: BlobSASPermissions.parse('r'), // read only
      expiresOn: new Date(Date.now() + 3600 * 1000), // 1 hour
    },
    sharedKeyCredential
  ).toString();

  return `${blobClient.url}?${sasToken}`;
}

downloadDemo().catch(console.error);
