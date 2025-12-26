#!/bin/bash

# Setup Azure App Service
# Creates App Service Plan and Web App
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

PLAN_NAME="asp-demo-$UNIQUE_SUFFIX"
APP_NAME="app-demo-$UNIQUE_SUFFIX"

echo "============================================"
echo "Azure App Service Setup"
echo "============================================"
echo ""
echo "App Service Plan: $PLAN_NAME"
echo "Web App:          $APP_NAME"
echo "Location:         $LOCATION"
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

# Create App Service Plan (Free tier for learning)
echo "Creating App Service Plan (Free tier)..."
az appservice plan create \
    --name "$PLAN_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku F1 \
    --is-linux \
    --output none

# Create Web App
echo "Creating Web App..."
az webapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --plan "$PLAN_NAME" \
    --runtime "NODE:20-lts" \
    --output none

# Configure app settings
echo "Configuring app settings..."
az webapp config appsettings set \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --settings \
        NODE_ENV=production \
        FEATURE_NEW=true \
        FEATURE_BETA=false \
    --output none

# Enable logging
az webapp log config \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --web-server-logging filesystem \
    --output none

# Get app URL
APP_URL="https://$APP_NAME.azurewebsites.net"

# Save deployment info
echo "$APP_NAME" > .app-name

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Web App URL: $APP_URL"
echo ""
echo "Next steps:"
echo "  1. npm install && npm run build"
echo "  2. ./deploy.sh"
echo ""
echo "Or deploy with Azure CLI:"
echo "  az webapp deploy --name $APP_NAME --resource-group $RESOURCE_GROUP --src-path dist.zip --type zip"
echo ""
echo "View logs:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "Cleanup:"
echo "  az webapp delete --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo "  az appservice plan delete --name $PLAN_NAME --resource-group $RESOURCE_GROUP --yes"
echo ""
echo "Cost: Free tier (F1) - no charge, limited to 60 CPU minutes/day"
