#!/bin/bash

# Delete all Azure resources created by the examples
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"

echo "============================================"
echo "Azure JS Services - Cleanup"
echo "============================================"
echo ""
echo "This will delete resource group: $RESOURCE_GROUP"
echo "All resources in this group will be permanently deleted."
echo ""

read -p "Are you sure? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "Deleting resource group..."
az group delete \
    --name "$RESOURCE_GROUP" \
    --yes \
    --no-wait

echo ""
echo "Resource group deletion initiated."
echo "This may take a few minutes to complete."
