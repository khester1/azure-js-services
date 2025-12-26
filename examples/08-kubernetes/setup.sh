#!/bin/bash

# Setup Azure Kubernetes Service (AKS)
# IMPORTANT: AKS costs ~$70+/month even at minimum config
# This script creates resources but you can delete them after testing
set -e

RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"
LOCATION="${AZURE_LOCATION:-westus2}"
UNIQUE_SUFFIX=$RANDOM

AKS_CLUSTER_NAME="aks-demo-$UNIQUE_SUFFIX"
ACR_NAME="acraksdem0$UNIQUE_SUFFIX"

echo "============================================"
echo "Azure Kubernetes Service (AKS) Setup"
echo "============================================"
echo ""
echo "WARNING: AKS costs approximately \$70+/month!"
echo "Delete resources after testing to avoid charges."
echo ""
echo "Cluster: $AKS_CLUSTER_NAME"
echo "Container Registry: $ACR_NAME"
echo ""

# Check if logged in
if ! az account show &> /dev/null; then
    echo "Please login to Azure first: az login"
    exit 1
fi

# Check for required tools
if ! command -v docker &> /dev/null; then
    echo "Docker is required. Please install Docker Desktop."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "kubectl is required. Install with: az aks install-cli"
    exit 1
fi

# Ensure resource group exists
echo "Ensuring resource group exists..."
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --output none 2>/dev/null || true

# Create Azure Container Registry
echo "Creating Azure Container Registry..."
az acr create \
    --name "$ACR_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --sku Basic \
    --output none

# Create AKS cluster (minimal config for learning)
echo "Creating AKS cluster (this takes 5-10 minutes)..."
az aks create \
    --name "$AKS_CLUSTER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --node-count 1 \
    --node-vm-size Standard_B2s \
    --enable-managed-identity \
    --attach-acr "$ACR_NAME" \
    --generate-ssh-keys \
    --output none

# Get credentials
echo "Getting cluster credentials..."
az aks get-credentials \
    --name "$AKS_CLUSTER_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --overwrite-existing

# Save names for later use
echo "$AKS_CLUSTER_NAME" > .aks-name
echo "$ACR_NAME" > .acr-name

echo ""
echo "============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Cluster: $AKS_CLUSTER_NAME"
echo "Registry: $ACR_NAME.azurecr.io"
echo ""
echo "Verify cluster:"
echo "  kubectl get nodes"
echo ""
echo "Deploy the app:"
echo "  ./deploy.sh"
echo ""
echo "CLEANUP (to stop charges):"
echo "  az aks delete --name $AKS_CLUSTER_NAME --resource-group $RESOURCE_GROUP --yes"
echo "  az acr delete --name $ACR_NAME --resource-group $RESOURCE_GROUP --yes"
echo ""
echo "ESTIMATED COST: ~\$70+/month for this minimal cluster"
echo "Delete when done learning!"
