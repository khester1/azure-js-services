#!/bin/bash

# Deploy to Azure App Service
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"

# Read app name from setup
if [ -f .app-name ]; then
    APP_NAME=$(cat .app-name)
else
    echo "Error: Run setup.sh first to create the App Service"
    exit 1
fi

echo "============================================"
echo "Deploying to Azure App Service"
echo "============================================"
echo ""
echo "App Name: $APP_NAME"
echo ""

# Build the app
echo "Building TypeScript..."
npm run build

# Create deployment package
echo "Creating deployment package..."
# Include dist, node_modules, and package files
zip -r deploy.zip dist package.json package-lock.json node_modules -x "node_modules/.cache/*"

# Deploy using ZIP deploy
echo "Deploying to App Service..."
az webapp deploy \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --src-path deploy.zip \
    --type zip \
    --async true

# Clean up
rm deploy.zip

# Get app URL
APP_URL="https://$APP_NAME.azurewebsites.net"

echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "App URL: $APP_URL"
echo ""
echo "Note: Deployment may take 1-2 minutes to complete."
echo ""
echo "Check deployment status:"
echo "  az webapp log tail --name $APP_NAME --resource-group $RESOURCE_GROUP"
echo ""
echo "Test endpoints:"
echo "  curl $APP_URL/api/health"
echo "  curl $APP_URL/api/info"
