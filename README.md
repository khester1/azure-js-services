# Azure JavaScript Services

Learn Azure services with JavaScript/TypeScript through practical, focused examples.

## Examples

| # | Service | What You'll Learn |
|---|---------|-------------------|
| 01 | [SQL Database](./examples/01-sql-database/) | CRUD operations, connection pooling, parameterized queries |
| 02 | [Service Bus](./examples/02-service-bus/) | Message queues, pub/sub, dead-letter handling |

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure subscription

## Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/azure-js-services.git
cd azure-js-services

# Install dependencies
npm install

# Create shared resource group (optional)
./scripts/setup-resource-group.sh

# Navigate to an example
cd examples/01-sql-database

# Follow the example README
```

## Project Structure

```
azure-js-services/
├── examples/
│   ├── 01-sql-database/    # Azure SQL CRUD example
│   └── 02-service-bus/     # Message queues & topics
├── shared/                 # Shared utilities
├── scripts/                # Setup/cleanup scripts
└── package.json
```

## Each Example Includes

- **README.md** - Step-by-step guide
- **setup.sh** - Azure resource provisioning
- **src/** - TypeScript source code
- **.env.example** - Required environment variables

## Cleanup

To delete all Azure resources created by the examples:

```bash
./scripts/cleanup.sh
```

## Related

- [small-ai-apps](https://github.com/YOUR_USERNAME/small-ai-apps) - Azure AI services examples
