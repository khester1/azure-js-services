# Azure Blob Storage Example

Learn how to use Azure Blob Storage for file storage with JavaScript/TypeScript.

## What You'll Learn

- Creating storage accounts and containers
- Uploading files (strings, buffers, streams)
- Downloading and reading blobs
- Listing blobs (flat and hierarchical)
- Working with metadata
- Generating SAS tokens for temporary access

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)

## Project Structure

```text
10-blob-storage/
├── src/
│   ├── client.ts      # Storage client setup
│   ├── index.ts       # Basic demo
│   ├── upload.ts      # Upload examples
│   ├── download.ts    # Download examples
│   └── list.ts        # List blobs examples
├── setup.sh           # Provision storage account
└── .env.example       # Environment template
```

## Quick Start

### 1. Create Azure Resources

```bash
./setup.sh
```

Creates:

- Storage account (Standard LRS)
- Blob container

### 2. Install and Run

```bash
npm install
npm run demo
```

## Available Scripts

| Script | Description |
| -------- | ------------- |
| `npm run demo` | Basic upload/download test |
| `npm run upload` | Various upload methods |
| `npm run download` | Download and SAS examples |
| `npm run list` | List blobs and containers |

## Key Concepts

### Storage Hierarchy

```text
Storage Account
└── Container (like a folder)
    ├── blob1.txt
    ├── images/photo.jpg    (virtual folder)
    └── data/file.json
```

### Upload Methods

```typescript
const container = getContainerClient();
const blob = container.getBlockBlobClient('myfile.txt');

// Upload string
await blob.upload('Hello World', 11);

// Upload with content type
await blob.upload(data, data.length, {
  blobHTTPHeaders: { blobContentType: 'application/json' }
});

// Upload buffer
await blob.uploadData(buffer);

// Upload stream
await blob.uploadStream(readableStream);
```

### Download Methods

```typescript
// Download to stream
const response = await blob.download();
const content = await streamToString(response.readableStreamBody!);

// Download to buffer
const buffer = await blob.downloadToBuffer();

// Get properties only
const props = await blob.getProperties();
console.log(props.contentLength, props.contentType);
```

### Working with Metadata

```typescript
// Upload with metadata
await blob.upload(content, content.length, {
  metadata: {
    author: 'system',
    version: '1.0'
  }
});

// Read metadata
const props = await blob.getProperties();
console.log(props.metadata);  // { author: 'system', version: '1.0' }

// Update metadata
await blob.setMetadata({ updated: 'true' });
```

### Listing Blobs

```typescript
// List all blobs (flat)
for await (const blob of container.listBlobsFlat()) {
  console.log(blob.name);
}

// List by folder hierarchy
for await (const item of container.listBlobsByHierarchy('/')) {
  if (item.kind === 'prefix') {
    console.log('Folder:', item.name);
  } else {
    console.log('File:', item.name);
  }
}

// List with prefix filter
for await (const blob of container.listBlobsFlat({ prefix: 'images/' })) {
  console.log(blob.name);
}
```

### SAS Tokens (Temporary Access)

```typescript
import { BlobSASPermissions, generateBlobSASQueryParameters } from '@azure/storage-blob';

const sasToken = generateBlobSASQueryParameters({
  containerName: 'my-container',
  blobName: 'file.txt',
  permissions: BlobSASPermissions.parse('r'),  // read only
  expiresOn: new Date(Date.now() + 3600 * 1000)  // 1 hour
}, sharedKeyCredential).toString();

const sasUrl = `${blob.url}?${sasToken}`;
```

## Storage Tiers

| Tier | Access | Cost | Use Case |
| ------ | -------- | ------ | ---------- |
| **Hot** | Frequent | $0.0184/GB | Active data |
| Cool | Infrequent | $0.01/GB | 30+ day storage |
| Cold | Rare | $0.0036/GB | 90+ day storage |
| Archive | Rare | $0.00099/GB | Years of storage |

## Pricing

| Item | Cost |
| ------ | ------ |
| Storage (Hot) | $0.0184/GB/month |
| Read ops | $0.0043/10,000 |
| Write ops | $0.054/10,000 |
| Data transfer | Free within Azure |

**Very low cost for learning!**

## Access Control

```typescript
// Container access levels
await container.setAccessPolicy('blob');  // Public read for blobs only
await container.setAccessPolicy('container');  // Public list + read
await container.setAccessPolicy('private');  // No public access (default)
```

## Cleanup

```bash
az storage account delete \
  --name $(cat .storage-name) \
  --resource-group rg-azure-js-services --yes
```

## Blob Storage vs Other Options

| Feature | Blob Storage | Azure Files | Data Lake |
| --------- | ------------- | ------------- | ----------- |
| **Type** | Object storage | SMB file share | Big data analytics |
| **Access** | REST API, SDK | SMB protocol | REST + analytics |
| **Best for** | Images, backups, static files | Legacy apps, file shares | Data lake, analytics |
| **Cost** | Lowest | Higher | Higher |

## Next Steps

- Try different storage tiers
- Implement versioning
- Set up lifecycle management
- Add Azure CDN for global distribution
