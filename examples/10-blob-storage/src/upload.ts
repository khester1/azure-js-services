import { ensureContainer } from './client.js';
import { Readable } from 'stream';

async function uploadDemo() {
  console.log('='.repeat(50));
  console.log('Blob Storage Upload Examples');
  console.log('='.repeat(50));
  console.log('');

  const container = await ensureContainer();

  // 1. Upload string content
  console.log('--- Upload String ---');
  const textBlob = container.getBlockBlobClient('hello.txt');
  await textBlob.upload('Hello, Azure Blob Storage!', 26);
  console.log(`Uploaded: ${textBlob.name}`);
  console.log(`URL: ${textBlob.url}\n`);

  // 2. Upload JSON
  console.log('--- Upload JSON ---');
  const jsonData = {
    name: 'Demo Data',
    items: [1, 2, 3],
    timestamp: new Date().toISOString(),
  };
  const jsonBlob = container.getBlockBlobClient('data/sample.json');
  await jsonBlob.upload(JSON.stringify(jsonData, null, 2), Buffer.byteLength(JSON.stringify(jsonData, null, 2)), {
    blobHTTPHeaders: { blobContentType: 'application/json' },
  });
  console.log(`Uploaded: ${jsonBlob.name}`);
  console.log(`URL: ${jsonBlob.url}\n`);

  // 3. Upload with metadata
  console.log('--- Upload with Metadata ---');
  const metaBlob = container.getBlockBlobClient('documents/report.txt');
  const reportContent = 'Quarterly Report - Q4 2024\n\nSummary: All systems operational.';
  await metaBlob.upload(reportContent, Buffer.byteLength(reportContent), {
    metadata: {
      author: 'system',
      department: 'engineering',
      quarter: 'q4-2024',
    },
    blobHTTPHeaders: { blobContentType: 'text/plain' },
  });
  console.log(`Uploaded: ${metaBlob.name}`);
  console.log('Metadata: author=system, department=engineering\n');

  // 4. Upload from buffer (simulating file upload)
  console.log('--- Upload Buffer (simulated file) ---');
  const imageBuffer = Buffer.from('FAKE_IMAGE_DATA_' + 'X'.repeat(1000));
  const imageBlob = container.getBlockBlobClient('images/sample.png');
  await imageBlob.uploadData(imageBuffer, {
    blobHTTPHeaders: { blobContentType: 'image/png' },
  });
  console.log(`Uploaded: ${imageBlob.name} (${imageBuffer.length} bytes)\n`);

  // 5. Upload from stream
  console.log('--- Upload Stream ---');
  const streamContent = 'Line 1\nLine 2\nLine 3\n';
  const stream = Readable.from([streamContent]);
  const streamBlob = container.getBlockBlobClient('logs/stream.log');
  await streamBlob.uploadStream(stream, undefined, undefined, {
    blobHTTPHeaders: { blobContentType: 'text/plain' },
  });
  console.log(`Uploaded: ${streamBlob.name}\n`);

  console.log('='.repeat(50));
  console.log('Upload demo complete!');
  console.log('');
  console.log('Run: npm run list    - to see uploaded blobs');
  console.log('Run: npm run download - to download blobs');
  console.log('='.repeat(50));
}

uploadDemo().catch(console.error);
