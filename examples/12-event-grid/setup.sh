#!/bin/bash

# Setup Azure Event Grid Topic
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

TOPIC_NAME="eventgrid-demo-$UNIQUE_SUFFIX"

echo "============================================"
echo "Azure Event Grid Setup"
echo "============================================"
echo ""
echo "Topic: $TOPIC_NAME"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Register Event Grid provider if needed
echo "Ensuring Event Grid provider is registered..."
az provider register --namespace Microsoft.EventGrid --wait 2>/dev/null || true

# Ensure resource group exists
echo "Ensuring resource group exists..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true

# Create Event Grid Topic
echo "Creating Event Grid Topic..."
az eventgrid topic create \
    --name "$TOPIC_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# Get topic endpoint and key
TOPIC_ENDPOINT=$(az eventgrid topic show \
    --name "$TOPIC_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "endpoint" -o tsv)

TOPIC_KEY=$(az eventgrid topic key list \
    --name "$TOPIC_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "key1" -o tsv)

# Save to .env
cat > .env << EOF
EVENT_GRID_TOPIC_ENDPOINT=$TOPIC_ENDPOINT
EVENT_GRID_TOPIC_KEY=$TOPIC_KEY
EOF

echo "$TOPIC_NAME" > .topic-name

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Topic: $TOPIC_NAME"
echo "Endpoint: $TOPIC_ENDPOINT"
echo ""
echo "Credentials saved to .env"
echo ""
echo "Publish events:"
echo "  npm install"
echo "  npm run publish"
echo ""
echo "Start webhook handler (for receiving events):"
echo "  npm run webhook"
echo ""
echo "COST: Very low!"
echo "  - First 100,000 operations/month FREE"
echo "  - \$0.60 per million operations after"
echo ""
echo "Create a subscription (e.g., to webhook):"
echo "  az eventgrid event-subscription create \\"
echo "    --name my-subscription \\"
echo "    --source-resource-id /subscriptions/{sub}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$TOPIC_NAME \\"
echo "    --endpoint https://your-webhook-url/api/events"
echo ""
echo "Cleanup:"
echo "  az eventgrid topic delete --name $TOPIC_NAME --resource-group $RESOURCE_GROUP --yes"
