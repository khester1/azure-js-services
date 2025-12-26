#!/bin/bash

# Setup Azure Service Bus
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-eastus}"
UNIQUE_SUFFIX=$RANDOM

NAMESPACE_NAME="sb-demo-$UNIQUE_SUFFIX"
QUEUE_NAME="demo-queue"
TOPIC_NAME="demo-topic"
SUBSCRIPTION_NAME="demo-subscription"

echo "============================================"
echo "Azure Service Bus Setup"
echo "============================================"
echo ""
echo "Namespace:    $NAMESPACE_NAME"
echo "Queue:        $QUEUE_NAME"
echo "Topic:        $TOPIC_NAME"
echo "Subscription: $SUBSCRIPTION_NAME"
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

# Create Service Bus namespace (Basic tier - cheapest)
echo "Creating Service Bus namespace (Basic tier)..."
az servicebus namespace create \
    --name "$NAMESPACE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Basic \
    --output none

# Create a queue
echo "Creating queue..."
az servicebus queue create \
    --name "$QUEUE_NAME" \
    --namespace-name "$NAMESPACE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --output none

# Get connection string
CONNECTION_STRING=$(az servicebus namespace authorization-rule keys list \
    --name RootManageSharedAccessKey \
    --namespace-name "$NAMESPACE_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query primaryConnectionString \
    --output tsv)

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Add these to your .env file:"
echo ""
echo "SERVICE_BUS_CONNECTION_STRING=$CONNECTION_STRING"
echo "SERVICE_BUS_QUEUE_NAME=$QUEUE_NAME"
echo ""
echo "Next steps:"
echo "  1. Copy the above to .env"
echo "  2. npm install"
echo "  3. npm run sender    # Send messages"
echo "  4. npm run receiver  # Receive messages"
echo ""
echo "Note: Basic tier costs ~\$0.05/million operations."
echo "Delete when done:"
echo "  az servicebus namespace delete --name $NAMESPACE_NAME --resource-group $RESOURCE_GROUP --yes"
