# Azure JavaScript Services

Learn Azure services with JavaScript/TypeScript through practical, focused examples.

## Examples

| # | Service | What You'll Learn |
|---|---------|-------------------|
| 01 | [SQL Database](./examples/01-sql-database/) | CRUD operations, connection pooling, parameterized queries |
| 02 | [Service Bus](./examples/02-service-bus/) | Message queues, pub/sub, dead-letter handling |
| 03 | [Functions Triggers](./examples/03-functions-triggers/) | Timer, queue, and blob triggers for event-driven apps |
| 04 | [Authentication](./examples/04-authentication/) | Azure AD, MSAL.js, OAuth 2.0, protected APIs |
| 05 | [Container Apps](./examples/05-container-apps/) | Docker, containerized deployment, auto-scaling |
| 06 | [App Service](./examples/06-app-service/) | Deploy Express apps, scaling, deployment slots |
| 07 | [Static Web Apps](./examples/07-static-web-apps/) | Frontend + serverless API, GitHub Actions CI/CD |
| 08 | [Kubernetes (AKS)](./examples/08-kubernetes/) | Container orchestration, deployments, services |
| 09 | [Cosmos DB](./examples/09-cosmos-db/) | NoSQL database, CRUD, queries, partition keys |
| 10 | [Blob Storage](./examples/10-blob-storage/) | File storage, upload/download, SAS tokens |
| 11 | [SignalR](./examples/11-signalr/) | Real-time messaging, WebSockets, chat apps |
| 12 | [Event Grid](./examples/12-event-grid/) | Event routing, pub/sub, webhooks, reactive events |

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure subscription

## Quick Start

```bash
# Clone the repo
git clone https://github.com/khester1/azure-js-services.git
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
│   ├── 01-sql-database/       # Azure SQL CRUD example
│   ├── 02-service-bus/        # Message queues & topics
│   ├── 03-functions-triggers/ # Timer, queue, blob triggers
│   ├── 04-authentication/     # Azure AD + MSAL
│   ├── 05-container-apps/     # Docker + Container Apps
│   ├── 06-app-service/        # Express on App Service
│   ├── 07-static-web-apps/    # Frontend + serverless API
│   ├── 08-kubernetes/         # AKS container orchestration
│   ├── 09-cosmos-db/          # NoSQL database
│   ├── 10-blob-storage/       # File storage
│   ├── 11-signalr/            # Real-time messaging
│   └── 12-event-grid/         # Event routing
├── shared/                    # Shared utilities
├── scripts/                   # Setup/cleanup scripts
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

- [small-ai-apps](https://github.com/khester1/small-ai-apps) - Azure AI services examples
