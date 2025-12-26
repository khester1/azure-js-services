import { getContainerClient, blobServiceClient } from './client.js';

async function listDemo() {
  console.log('='.repeat(50));
  console.log('Blob Storage List Examples');
  console.log('='.repeat(50));
  console.log('');

  // 1. List all containers
  console.log('--- List Containers ---');
  for await (const container of blobServiceClient.listContainers()) {
    console.log(`  Container: ${container.name}`);
  }
  console.log('');

  const container = getContainerClient();

  // 2. List all blobs (flat)
  console.log('--- List All Blobs (flat) ---');
  let count = 0;
  for await (const blob of container.listBlobsFlat()) {
    console.log(`  ${blob.name} (${blob.properties.contentLength} bytes)`);
    count++;
  }
  if (count === 0) {
    console.log('  No blobs found. Run: npm run upload');
  }
  console.log('');

  // 3. List blobs by hierarchy (folders)
  console.log('--- List Blobs by Hierarchy ---');
  console.log('Root level:');
  for await (const item of container.listBlobsByHierarchy('/')) {
    if (item.kind === 'prefix') {
      console.log(`  [folder] ${item.name}`);
    } else {
      console.log(`  [file] ${item.name}`);
    }
  }
  console.log('');

  // 4. List blobs in specific folder
  console.log('--- List Blobs in "data/" folder ---');
  for await (const blob of container.listBlobsFlat({ prefix: 'data/' })) {
    console.log(`  ${blob.name}`);
  }
  console.log('');

  // 5. List with metadata
  console.log('--- List with Metadata ---');
  for await (const blob of container.listBlobsFlat({ includeMetadata: true })) {
    const metadata = blob.metadata || {};
    const metaStr = Object.keys(metadata).length > 0 ? JSON.stringify(metadata) : 'none';
    console.log(`  ${blob.name}: ${metaStr}`);
  }
  console.log('');

  // 6. Paginated listing
  console.log('--- Paginated Listing (2 per page) ---');
  const iterator = container.listBlobsFlat().byPage({ maxPageSize: 2 });
  let pageNum = 1;
  for await (const page of iterator) {
    if (page.segment.blobItems.length === 0) break;
    console.log(`  Page ${pageNum}:`);
    for (const blob of page.segment.blobItems) {
      console.log(`    - ${blob.name}`);
    }
    pageNum++;
    if (pageNum > 3) {
      console.log('  ... (truncated)');
      break;
    }
  }
  console.log('');

  console.log('='.repeat(50));
  console.log('List demo complete!');
  console.log('='.repeat(50));
}

listDemo().catch(console.error);
