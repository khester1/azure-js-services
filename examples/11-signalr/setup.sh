#!/bin/bash

# Setup Azure SignalR Service
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

SIGNALR_NAME="signalr-demo-$UNIQUE_SUFFIX"

echo "============================================"
echo "Azure SignalR Service Setup"
echo "============================================"
echo ""
echo "SignalR Service: $SIGNALR_NAME"
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

# Create SignalR Service (Free tier)
echo "Creating SignalR Service (Free tier)..."
az signalr create \
    --name "$SIGNALR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --sku Free_F1 \
    --unit-count 1 \
    --service-mode Default \
    --output none

# Get connection string
CONNECTION_STRING=$(az signalr key list \
    --name "$SIGNALR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "primaryConnectionString" -o tsv)

# Save to .env
cat > .env << EOF
SIGNALR_CONNECTION_STRING=$CONNECTION_STRING
EOF

echo "$SIGNALR_NAME" > .signalr-name

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "SignalR Service: $SIGNALR_NAME"
echo ""
echo "Connection string saved to .env"
echo ""
echo "Run the demo:"
echo "  npm install"
echo "  npm run server   # Start the server"
echo "  # Open http://localhost:3000 in browser"
echo ""
echo "COST: Free tier!"
echo "  - 20 concurrent connections"
echo "  - 20,000 messages/day"
echo "  - Perfect for learning"
echo ""
echo "Cleanup:"
echo "  az signalr delete --name $SIGNALR_NAME --resource-group $RESOURCE_GROUP --yes"
