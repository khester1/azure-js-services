#!/bin/bash

# Setup Azure Cosmos DB (NoSQL API)
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

COSMOS_ACCOUNT="cosmos-demo-$UNIQUE_SUFFIX"
DATABASE_NAME="demo-db"
CONTAINER_NAME="items"

echo "============================================"
echo "Azure Cosmos DB Setup"
echo "============================================"
echo ""
echo "Account: $COSMOS_ACCOUNT"
echo "Database: $DATABASE_NAME"
echo "Container: $CONTAINER_NAME"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Ensure resource group exists
echo "Ensuring resource group exists..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true

# Create Cosmos DB account (Serverless for cost efficiency)
echo "Creating Cosmos DB account (this takes 3-5 minutes)..."
az cosmosdb create \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --locations regionName="$LOCATION" \
    --capabilities EnableServerless \
    --default-consistency-level Session \
    --output none

# Create database
echo "Creating database..."
az cosmosdb sql database create \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --name "$DATABASE_NAME" \
    --output none

# Create container with partition key
echo "Creating container..."
az cosmosdb sql container create \
    --account-name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --database-name "$DATABASE_NAME" \
    --name "$CONTAINER_NAME" \
    --partition-key-path "/category" \
    --output none

# Get connection details
COSMOS_ENDPOINT=$(az cosmosdb show \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query "documentEndpoint" -o tsv)

COSMOS_KEY=$(az cosmosdb keys list \
    --name "$COSMOS_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query "primaryMasterKey" -o tsv)

# Save to .env
cat > .env << EOF
COSMOS_ENDPOINT=$COSMOS_ENDPOINT
COSMOS_KEY=$COSMOS_KEY
COSMOS_DATABASE=$DATABASE_NAME
COSMOS_CONTAINER=$CONTAINER_NAME
EOF

echo "$COSMOS_ACCOUNT" > .cosmos-name

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Endpoint: $COSMOS_ENDPOINT"
echo "Database: $DATABASE_NAME"
echo "Container: $CONTAINER_NAME"
echo ""
echo "Credentials saved to .env"
echo ""
echo "Run the demo:"
echo "  npm install"
echo "  npm run demo"
echo ""
echo "COST: Serverless tier - pay per request"
echo "  - First 25GB storage free"
echo "  - \$0.25 per 1 million RUs"
echo "  - Very low cost for learning!"
echo ""
echo "Cleanup:"
echo "  az cosmosdb delete --name $COSMOS_ACCOUNT --resource-group $RESOURCE_GROUP --yes"
