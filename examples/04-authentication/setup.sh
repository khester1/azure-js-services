#!/bin/bash

# Setup Azure AD App Registration for Authentication
# Creates an app registration for MSAL authentication
set -e

APP_NAME="azure-js-auth-demo"
REDIRECT_URI="http://localhost:3000/auth/callback"

echo "============================================"
echo "Azure AD Authentication Setup"
echo "============================================"
echo ""
echo "App Name:     $APP_NAME"
echo "Redirect URI: $REDIRECT_URI"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Get tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)
echo "Tenant ID: $TENANT_ID"
echo ""

# Create app registration
echo "Creating app registration..."
APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --sign-in-audience "AzureADMyOrg" \
    --web-redirect-uris "$REDIRECT_URI" \
    --enable-id-token-issuance true \
    --enable-access-token-issuance true \
    --query appId -o tsv)

echo "App ID (Client ID): $APP_ID"

# Create client secret
echo "Creating client secret..."
SECRET_RESULT=$(az ad app credential reset \
    --id "$APP_ID" \
    --display-name "demo-secret" \
    --years 1)

CLIENT_SECRET=$(echo "$SECRET_RESULT" | grep -o '"password": "[^"]*"' | cut -d'"' -f4)

# Add API permissions (Microsoft Graph - User.Read)
echo "Adding API permissions..."
az ad app permission add \
    --id "$APP_ID" \
    --api 00000003-0000-0000-c000-000000000000 \
    --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
    --output none 2>/dev/null || true

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Add these to your .env file:"
echo ""
echo "AZURE_TENANT_ID=$TENANT_ID"
echo "AZURE_CLIENT_ID=$APP_ID"
echo "AZURE_CLIENT_SECRET=$CLIENT_SECRET"
echo "REDIRECT_URI=$REDIRECT_URI"
echo ""
echo "Next steps:"
echo "  1. Copy the above to .env"
echo "  2. npm install"
echo "  3. npm run dev"
echo "  4. Open http://localhost:3000"
echo ""
echo "To delete when done:"
echo "  az ad app delete --id $APP_ID"
