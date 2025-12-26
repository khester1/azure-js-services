#!/bin/bash

# Deploy app to AKS
set -e

# Load saved names
if [ ! -f .acr-name ] || [ ! -f .aks-name ]; then
    echo "Run ./setup.sh first to create the AKS cluster"
    exit 1
fi

ACR_NAME=$(cat .acr-name)
AKS_NAME=$(cat .aks-name)
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-rg-azure-js-services}"

echo "============================================"
echo "Deploying to AKS"
echo "============================================"
echo ""
echo "Registry: $ACR_NAME.azurecr.io"
echo "Cluster: $AKS_NAME"
echo ""

# Login to ACR
echo "Logging into Container Registry..."
az acr login --name "$ACR_NAME"

# Build and push image
echo "Building Docker image..."
docker build -t "$ACR_NAME.azurecr.io/aks-demo-app:latest" .

echo "Pushing to Container Registry..."
docker push "$ACR_NAME.azurecr.io/aks-demo-app:latest"

# Update deployment manifest with ACR name
echo "Preparing Kubernetes manifests..."
sed "s/\${ACR_NAME}/$ACR_NAME/g" k8s/deployment.yaml > k8s/deployment-resolved.yaml

# Apply Kubernetes manifests
echo "Deploying to Kubernetes..."
kubectl apply -f k8s/deployment-resolved.yaml
kubectl apply -f k8s/service.yaml

# Wait for deployment
echo "Waiting for deployment..."
kubectl rollout status deployment/aks-demo-app

# Get external IP
echo ""
echo "Waiting for external IP (may take 1-2 minutes)..."
for i in {1..24}; do
    EXTERNAL_IP=$(kubectl get service aks-demo-app -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
    if [ -n "$EXTERNAL_IP" ]; then
        break
    fi
    echo "  Waiting... ($i/24)"
    sleep 5
done

echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""

if [ -n "$EXTERNAL_IP" ]; then
    echo "App URL: http://$EXTERNAL_IP"
    echo ""
    echo "Test endpoints:"
    echo "  curl http://$EXTERNAL_IP/"
    echo "  curl http://$EXTERNAL_IP/api/info"
    echo "  curl http://$EXTERNAL_IP/health"
else
    echo "External IP not yet available. Check with:"
    echo "  kubectl get service aks-demo-app"
fi

echo ""
echo "Useful commands:"
echo "  kubectl get pods"
echo "  kubectl logs -l app=aks-demo-app"
echo "  kubectl scale deployment aks-demo-app --replicas=3"
echo ""

# Cleanup
rm -f k8s/deployment-resolved.yaml
