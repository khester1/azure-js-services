#!/bin/bash

# Setup Azure Static Web Apps
# Note: SWA is typically deployed via GitHub integration
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

SWA_NAME="swa-demo-$UNIQUE_SUFFIX"

echo "============================================"
echo "Azure Static Web Apps Setup"
echo "============================================"
echo ""
echo "Static Web App: $SWA_NAME"
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

# Create Static Web App
echo "Creating Static Web App..."
az staticwebapp create \
    --name "$SWA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Free \
    --output none

# Get deployment token
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$SWA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv)

# Get hostname
SWA_HOSTNAME=$(az staticwebapp show \
    --name "$SWA_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "defaultHostname" -o tsv)

# Save for later use
echo "$SWA_NAME" > .swa-name
echo "$DEPLOYMENT_TOKEN" > .deployment-token

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Static Web App URL: https://$SWA_HOSTNAME"
echo ""
echo "Deployment Token saved to .deployment-token"
echo ""
echo "Option 1: Local Development"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "Option 2: Deploy with SWA CLI"
echo "  npm install"
echo "  npm run build:api"
echo "  npx swa deploy frontend --api-location api --deployment-token \$(cat .deployment-token)"
echo ""
echo "Option 3: GitHub Actions (Recommended)"
echo "  1. Push this code to a GitHub repo"
echo "  2. Go to Azure Portal > Static Web App > Deployment"
echo "  3. Connect to your GitHub repo"
echo "  4. Azure creates a GitHub Action workflow automatically"
echo ""
echo "Cleanup:"
echo "  az staticwebapp delete --name $SWA_NAME --resource-group $RESOURCE_GROUP --yes"
echo ""
echo "Cost: Free tier - no charge"
echo "  - 100 GB bandwidth/month"
echo "  - 2 custom domains"
echo "  - Built-in authentication"
