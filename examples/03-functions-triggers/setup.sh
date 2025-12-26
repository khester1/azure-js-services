#!/bin/bash

# Setup Azure Functions with Triggers
# Creates Storage Account for blob triggers and uses existing Service Bus for queue triggers
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

STORAGE_NAME="fntriggers$UNIQUE_SUFFIX"
CONTAINER_NAME="uploads"

echo "============================================"
echo "Azure Functions Triggers Setup"
echo "============================================"
echo ""
echo "Storage Account: $STORAGE_NAME"
echo "Blob Container:  $CONTAINER_NAME"
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

# Create Storage Account for blob triggers
echo "Creating Storage Account..."
az storage account create \
    --name "$STORAGE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --output none

# Get connection string
STORAGE_CONNECTION=$(az storage account show-connection-string \
    --name "$STORAGE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query connectionString \
    --output tsv)

# Create blob container
echo "Creating blob container..."
az storage container create \
    --name "$CONTAINER_NAME" \
    --connection-string "$STORAGE_CONNECTION" \
    --output none

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Add these to your local.settings.json:"
echo ""
echo "{"
echo "  \"IsEncrypted\": false,"
echo "  \"Values\": {"
echo "    \"AzureWebJobsStorage\": \"$STORAGE_CONNECTION\","
echo "    \"FUNCTIONS_WORKER_RUNTIME\": \"node\","
echo "    \"STORAGE_CONNECTION\": \"$STORAGE_CONNECTION\","
echo "    \"SERVICE_BUS_CONNECTION\": \"<from 02-service-bus/.env>\""
echo "  }"
echo "}"
echo ""
echo "Prerequisites:"
echo "  - Azure Functions Core Tools: npm install -g azure-functions-core-tools@4"
echo "  - Service Bus from example 02 (for queue triggers)"
echo ""
echo "Next steps:"
echo "  1. Update local.settings.json with the values above"
echo "  2. npm install"
echo "  3. npm start"
echo ""
echo "Delete when done:"
echo "  az storage account delete --name $STORAGE_NAME --resource-group $RESOURCE_GROUP --yes"
