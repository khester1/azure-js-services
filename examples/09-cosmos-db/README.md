# Azure Cosmos DB Example

Learn how to use Azure Cosmos DB (NoSQL API) with JavaScript/TypeScript.

## What You'll Learn

- Creating a Cosmos DB account (Serverless tier)
- CRUD operations with the Cosmos SDK
- Partition keys and data modeling
- Advanced queries with SQL syntax
- Understanding Request Units (RUs)
- Pagination and result sets

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)

## Project Structure

```
09-cosmos-db/
├── src/
│   ├── client.ts      # Cosmos client singleton
│   ├── index.ts       # Basic demo
│   ├── crud.ts        # CRUD operations
│   └── query.ts       # Advanced queries
├── setup.sh           # Provision Cosmos DB
└── .env.example       # Environment template
```

## Quick Start

### 1. Create Azure Resources

```bash
./setup.sh
```

This creates:
- Cosmos DB account (Serverless tier)
- Database and container
- Saves credentials to `.env`

### 2. Install and Run

```bash
npm install
npm run demo
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run demo` | Basic connection test |
| `npm run crud` | Full CRUD operations |
| `npm run query` | Advanced query examples |

## Key Concepts

### Partition Keys

Every container needs a partition key for horizontal scaling:

```typescript
// Container with partition key
await database.containers.createIfNotExists({
  id: 'items',
  partitionKey: { paths: ['/category'] }
});

// Item must include partition key
const item = {
  id: 'item-1',
  category: 'electronics',  // partition key
  name: 'Laptop'
};
```

### CRUD Operations

```typescript
const container = await getContainer();

// Create
const { resource } = await container.items.create(item);

// Read (requires partition key value)
const { resource } = await container.item(id, 'electronics').read();

// Update
const { resource } = await container.item(id, 'electronics').replace(updatedItem);

// Delete
await container.item(id, 'electronics').delete();
```

### Queries

```typescript
// Simple query
const { resources } = await container.items
  .query('SELECT * FROM c WHERE c.price < 100')
  .fetchAll();

// Parameterized query (recommended)
const { resources } = await container.items
  .query({
    query: 'SELECT * FROM c WHERE c.category = @cat',
    parameters: [{ name: '@cat', value: 'electronics' }]
  })
  .fetchAll();

// Aggregation
const { resources } = await container.items
  .query(`
    SELECT c.category, COUNT(1) as count, AVG(c.price) as avgPrice
    FROM c
    GROUP BY c.category
  `)
  .fetchAll();
```

### Request Units (RUs)

Every operation returns its RU cost:

```typescript
const { resource, requestCharge } = await container.items.create(item);
console.log(`Operation cost: ${requestCharge} RUs`);
```

Typical RU costs:
- Read 1KB item: ~1 RU
- Create 1KB item: ~5 RUs
- Query (varies): 2-1000+ RUs

## Pricing

| Tier | Cost | Best For |
|------|------|----------|
| **Serverless** | Pay per RU | Development, low traffic |
| Provisioned | $24+/month | Consistent workloads |
| Free Tier | 1000 RU/s free | First Cosmos account |

**Serverless pricing:**
- $0.25 per 1 million RUs
- First 25GB storage free
- $0.25/GB/month after

## Data Modeling Tips

```typescript
// Good: Embed related data
const order = {
  id: 'order-1',
  customerId: 'cust-123',  // partition key
  items: [
    { productId: 'prod-1', quantity: 2 },
    { productId: 'prod-2', quantity: 1 }
  ],
  total: 199.99
};

// Good: Denormalize for read performance
const product = {
  id: 'prod-1',
  category: 'electronics',  // partition key
  name: 'Laptop',
  // Include frequently accessed data
  brand: { id: 'brand-1', name: 'TechCo' }
};
```

## Cleanup

```bash
az cosmosdb delete \
  --name $(cat .cosmos-name) \
  --resource-group rg-azure-js-services --yes
```

## Cosmos DB vs SQL Database

| Feature | Cosmos DB | Azure SQL |
|---------|-----------|-----------|
| **Type** | NoSQL (document) | Relational |
| **Schema** | Flexible | Fixed |
| **Scaling** | Horizontal (partitions) | Vertical + read replicas |
| **Queries** | SQL-like subset | Full T-SQL |
| **Best for** | High scale, flexible data | Complex joins, transactions |

## Next Steps

- Try different partition key strategies
- Explore change feed for real-time updates
- Add secondary indexes for query optimization
- Implement bulk operations for large datasets
