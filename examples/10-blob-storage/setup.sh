#!/bin/bash

# Setup Azure Blob Storage
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

STORAGE_ACCOUNT="stblob${UNIQUE_SUFFIX}"
CONTAINER_NAME="demo-container"

echo "============================================"
echo "Azure Blob Storage Setup"
echo "============================================"
echo ""
echo "Storage Account: $STORAGE_ACCOUNT"
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

# Create storage account
echo "Creating storage account..."
az storage account create \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    --output none

# Get connection string
CONNECTION_STRING=$(az storage account show-connection-string \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --query "connectionString" -o tsv)

# Create container
echo "Creating blob container..."
az storage container create \
    --name "$CONTAINER_NAME" \
    --connection-string "$CONNECTION_STRING" \
    --output none

# Save to .env
cat > .env << EOF
AZURE_STORAGE_CONNECTION_STRING=$CONNECTION_STRING
AZURE_STORAGE_CONTAINER=$CONTAINER_NAME
EOF

echo "$STORAGE_ACCOUNT" > .storage-name

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Storage Account: $STORAGE_ACCOUNT"
echo "Container: $CONTAINER_NAME"
echo ""
echo "Credentials saved to .env"
echo ""
echo "Run the demo:"
echo "  npm install"
echo "  npm run demo"
echo ""
echo "COST: Very low!"
echo "  - \$0.0184/GB/month (Hot tier)"
echo "  - \$0.0043 per 10,000 operations"
echo "  - First 5GB often covered by free credits"
echo ""
echo "Cleanup:"
echo "  az storage account delete --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --yes"
