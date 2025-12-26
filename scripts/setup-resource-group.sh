#!/bin/bash

# Create shared resource group for Azure JS Services examples
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-eastus}"

echo "============================================"
echo "Azure JS Services - Resource Group Setup"
echo "============================================"
echo ""
echo "Resource Group: $RESOURCE_GROUP"
echo "Location:       $LOCATION"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Create resource group
echo "Creating resource group..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

echo ""
echo "Resource group created: $RESOURCE_GROUP"
echo ""
echo "Next steps:"
echo "  1. cd examples/01-sql-database"
echo "  2. ./setup.sh"
echo "  3. Follow the README"
