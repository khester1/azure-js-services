#!/bin/bash

# Setup Azure SQL Database
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-eastus}"
UNIQUE_SUFFIX=$RANDOM

SERVER_NAME="sql-demo-$UNIQUE_SUFFIX"
DATABASE_NAME="demo-db"
ADMIN_USER="sqladmin"
ADMIN_PASSWORD="P@ssw0rd$UNIQUE_SUFFIX!"

echo "============================================"
echo "Azure SQL Database Setup"
echo "============================================"
echo ""
echo "Server:   $SERVER_NAME"
echo "Database: $DATABASE_NAME"
echo "User:     $ADMIN_USER"
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

# Create SQL Server
echo "Creating SQL Server (this may take a few minutes)..."
az sql server create \
    --name "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --admin-user "$ADMIN_USER" \
    --admin-password "$ADMIN_PASSWORD" \
    --output none

# Configure firewall to allow Azure services and current IP
echo "Configuring firewall rules..."

# Allow Azure services
az sql server firewall-rule create \
    --server "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --name "AllowAzureServices" \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output none

# Allow current IP
MY_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
    --server "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --name "AllowMyIP" \
    --start-ip-address "$MY_IP" \
    --end-ip-address "$MY_IP" \
    --output none

echo "Allowed IP: $MY_IP"

# Create database (Basic tier - cheapest, ~$5/month)
echo "Creating database..."
az sql db create \
    --name "$DATABASE_NAME" \
    --server "$SERVER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --edition Basic \
    --capacity 5 \
    --max-size 2GB \
    --output none

# Get connection info
SERVER_FQDN="$SERVER_NAME.database.windows.net"

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Add these to your .env file:"
echo ""
echo "SQL_SERVER=$SERVER_FQDN"
echo "SQL_DATABASE=$DATABASE_NAME"
echo "SQL_USER=$ADMIN_USER"
echo "SQL_PASSWORD=$ADMIN_PASSWORD"
echo ""
echo "Next steps:"
echo "  1. Copy the above to .env"
echo "  2. npm install"
echo "  3. npm run demo"
echo ""
echo "Note: Basic tier costs ~\$5/month. Delete when done:"
echo "  az sql server delete --name $SERVER_NAME --resource-group $RESOURCE_GROUP --yes"
