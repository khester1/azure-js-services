#!/bin/bash

# Setup Azure Container Apps
# Creates Container Apps Environment and deploys the app
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

ENVIRONMENT_NAME="aca-env-$UNIQUE_SUFFIX"
APP_NAME="aca-demo-$UNIQUE_SUFFIX"
REGISTRY_NAME="acrdemo$UNIQUE_SUFFIX"

echo "============================================"
echo "Azure Container Apps Setup"
echo "============================================"
echo ""
echo "Environment: $ENVIRONMENT_NAME"
echo "App Name:    $APP_NAME"
echo "Registry:    $REGISTRY_NAME"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Please start Docker first"
    exit 1
fi

# Ensure resource group exists
echo "Ensuring resource group exists..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true

# Create Azure Container Registry
echo "Creating Container Registry..."
az acr create \
    --name "$REGISTRY_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Basic \
    --admin-enabled true \
    --output none

# Get registry credentials
REGISTRY_SERVER="$REGISTRY_NAME.azurecr.io"
REGISTRY_USERNAME=$(az acr credential show --name "$REGISTRY_NAME" --query username -o tsv)
REGISTRY_PASSWORD=$(az acr credential show --name "$REGISTRY_NAME" --query "passwords[0].value" -o tsv)

# Build and push Docker image
echo "Building Docker image..."
docker build -t "$REGISTRY_SERVER/azure-container-demo:v1" .

echo "Logging in to Container Registry..."
echo "$REGISTRY_PASSWORD" | docker login "$REGISTRY_SERVER" -u "$REGISTRY_USERNAME" --password-stdin

echo "Pushing image to registry..."
docker push "$REGISTRY_SERVER/azure-container-demo:v1"

# Create Container Apps Environment
echo "Creating Container Apps Environment..."
az containerapp env create \
    --name "$ENVIRONMENT_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none

# Create Container App
echo "Creating Container App..."
az containerapp create \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$ENVIRONMENT_NAME" \
    --image "$REGISTRY_SERVER/azure-container-demo:v1" \
    --registry-server "$REGISTRY_SERVER" \
    --registry-username "$REGISTRY_USERNAME" \
    --registry-password "$REGISTRY_PASSWORD" \
    --target-port 3000 \
    --ingress external \
    --min-replicas 0 \
    --max-replicas 3 \
    --cpu 0.25 \
    --memory 0.5Gi \
    --output none

# Get app URL
APP_URL=$(az containerapp show \
    --name "$APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Container App URL: https://$APP_URL"
echo ""
echo "Test endpoints:"
echo "  curl https://$APP_URL"
echo "  curl https://$APP_URL/health"
echo "  curl https://$APP_URL/info"
echo ""
echo "View logs:"
echo "  az containerapp logs show --name $APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo ""
echo "Scale the app:"
echo "  az containerapp update --name $APP_NAME --resource-group $RESOURCE_GROUP --min-replicas 1 --max-replicas 5"
echo ""
echo "Cleanup (deletes all resources):"
echo "  az containerapp delete --name $APP_NAME --resource-group $RESOURCE_GROUP --yes"
echo "  az containerapp env delete --name $ENVIRONMENT_NAME --resource-group $RESOURCE_GROUP --yes"
echo "  az acr delete --name $REGISTRY_NAME --resource-group $RESOURCE_GROUP --yes"
echo ""
echo "Cost: Container Apps has a free tier:"
echo "  - First 180,000 vCPU-seconds free per month"
echo "  - First 360,000 GiB-seconds free per month"
echo "  - With min-replicas=0, you only pay when receiving requests"
