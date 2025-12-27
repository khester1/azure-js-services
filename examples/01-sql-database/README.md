# Azure SQL Database Example

Learn how to connect to Azure SQL Database and perform CRUD operations using Node.js and TypeScript.

## What You'll Learn

- Create an Azure SQL Server and Database
- Connect using the `mssql` package with connection pooling
- Perform CRUD operations with parameterized queries (SQL injection prevention)
- Use transactions for atomic batch operations
- Proper connection management and cleanup

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure subscription

## Setup

### 1. Create Azure Resources

```bash
# Make the script executable (first time only)
chmod +x setup.sh

# Run the setup script
./setup.sh
```

The script will:

- Create an Azure SQL Server
- Create a database (Basic tier, ~$5/month)
- Configure firewall rules
- Output connection details

### 2. Configure Environment

Copy the output from the setup script to a `.env` file:

```bash
cp .env.example .env
# Edit .env with the values from setup.sh
```

### 3. Install Dependencies

```bash
npm install
```

## Run the Demo

```bash
npm run demo
```

This will:

1. Initialize the database schema
2. Create products (single and batch)
3. Query products (all, by ID, by category)
4. Update a product
5. Delete a product

## Code Structure

```text
src/
├── db.ts       # Connection pool and query helpers
├── crud.ts     # CRUD operations for Products table
└── index.ts    # Demo script
```

## Key Concepts

### Connection Pooling

```typescript
const poolConfig = {
  pool: {
    max: 10,     // Maximum connections
    min: 0,      // Minimum connections
    idleTimeoutMillis: 30000,  // Close idle after 30s
  },
};
```

### Parameterized Queries

```typescript
// Safe from SQL injection
const result = await query(
  'SELECT * FROM Products WHERE category = @category',
  { category: userInput }
);
```

### Transactions

```typescript
await transaction(async (trans) => {
  // All operations here are atomic
  await insertProduct(trans, product1);
  await insertProduct(trans, product2);
  // If any fails, all roll back
});
```

## Cleanup

Delete the Azure resources when done:

```bash
# Get the server name from .env
az sql server delete \
  --name YOUR_SERVER_NAME \
  --resource-group rg-azure-js-services \
  --yes
```

Or delete the entire resource group:

```bash
az group delete --name rg-azure-js-services --yes
```

## Cost

- **Basic tier**: ~$5/month
- Recommended for development/learning
- Delete when not in use to avoid charges

## Next Steps

- Try the [Service Bus example](../02-service-bus/)
- Add more complex queries (JOINs, aggregations)
- Implement stored procedures
- Add retry logic for transient failures
