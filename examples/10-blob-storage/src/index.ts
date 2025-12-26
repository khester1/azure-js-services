import { ensureContainer, config, blobServiceClient } from './client.js';

async function main() {
  console.log('='.repeat(50));
  console.log('Azure Blob Storage Demo');
  console.log('='.repeat(50));
  console.log('');

  try {
    // Get account info
    const accountInfo = await blobServiceClient.getAccountInfo();
    console.log(`Account SKU: ${accountInfo.skuName}`);
    console.log(`Account Kind: ${accountInfo.accountKind}`);
    console.log(`Container: ${config.containerName}`);
    console.log('');

    // Ensure container exists
    console.log('Ensuring container exists...');
    const container = await ensureContainer();
    console.log('Container ready!\n');

    // Upload a test blob
    const testContent = `Hello from Blob Storage! Time: ${new Date().toISOString()}`;
    const blobName = `test-${Date.now()}.txt`;

    console.log('Uploading test blob...');
    const blockBlob = container.getBlockBlobClient(blobName);
    await blockBlob.upload(testContent, Buffer.byteLength(testContent));
    console.log(`Uploaded: ${blobName}`);
    console.log(`URL: ${blockBlob.url}\n`);

    // Download and verify
    console.log('Downloading blob...');
    const downloadResponse = await blockBlob.download();
    const downloaded = await streamToString(downloadResponse.readableStreamBody!);
    console.log(`Content: ${downloaded}\n`);

    // Get properties
    console.log('Getting properties...');
    const properties = await blockBlob.getProperties();
    console.log(`Content-Type: ${properties.contentType}`);
    console.log(`Size: ${properties.contentLength} bytes`);
    console.log(`ETag: ${properties.etag}\n`);

    // Delete test blob
    console.log('Cleaning up...');
    await blockBlob.delete();
    console.log(`Deleted: ${blobName}\n`);

    console.log('='.repeat(50));
    console.log('Demo complete!');
    console.log('');
    console.log('Try the other scripts:');
    console.log('  npm run upload   - Upload examples');
    console.log('  npm run download - Download examples');
    console.log('  npm run list     - List blobs');
    console.log('='.repeat(50));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Helper: stream to string
async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

main();
