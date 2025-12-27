# Azure Kubernetes Service (AKS) Example

Learn how to deploy containerized Node.js applications to Azure Kubernetes Service.

> **Cost Warning**: AKS costs approximately **$70+/month** even at minimum configuration. Delete resources after testing!

## What You'll Learn

- Creating an AKS cluster with Azure CLI
- Building and pushing Docker images to Azure Container Registry
- Writing Kubernetes deployment manifests
- Health checks and readiness probes
- Load balancing with Kubernetes Services
- Scaling applications

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Docker Desktop
- kubectl (`az aks install-cli`)

## Project Structure

```text
08-kubernetes/
├── src/
│   └── server.ts           # Express app with health endpoints
├── k8s/
│   ├── deployment.yaml     # Pod deployment config
│   ├── service.yaml        # LoadBalancer service
│   └── namespace.yaml      # Optional namespace
├── Dockerfile              # Multi-stage build
├── setup.sh                # Create AKS cluster + ACR
└── deploy.sh               # Build, push, deploy
```

## Local Development

### Run locally

```bash
npm install
npm run dev
```

### Test with Docker

```bash
npm run docker:build
npm run docker:run
# Visit http://localhost:3000
```

## Deploy to Azure

### Step 1: Create AKS Cluster

```bash
./setup.sh
```

This creates:

- Azure Container Registry (ACR)
- AKS cluster (1 node, Standard_B2s)
- Configures kubectl credentials

### Step 2: Deploy Application

```bash
./deploy.sh
```

This:

1. Builds Docker image
2. Pushes to ACR
3. Deploys to AKS
4. Creates LoadBalancer service

### Step 3: Access Your App

```bash
# Get external IP
kubectl get service aks-demo-app

# Test endpoints
curl http://<EXTERNAL-IP>/
curl http://<EXTERNAL-IP>/api/info
curl http://<EXTERNAL-IP>/health
```

## API Endpoints

| Endpoint | Description |
| ---------- | ------------- |
| `/` | Hello message with pod info |
| `/api/info` | Kubernetes environment details |
| `/health` | Liveness probe endpoint |
| `/ready` | Readiness probe endpoint |
| `/api/work?ms=100` | Simulate work (for load testing) |

## Kubernetes Concepts

### Deployment

```yaml
spec:
  replicas: 2                    # Run 2 pods
  containers:
    - name: app
      image: myacr.azurecr.io/app:latest
      resources:
        requests:
          memory: "64Mi"
          cpu: "100m"
        limits:
          memory: "128Mi"
          cpu: "250m"
```

### Health Probes

```yaml
livenessProbe:           # Restart if unhealthy
  httpGet:
    path: /health
    port: 3000
  periodSeconds: 10

readinessProbe:          # Remove from LB if not ready
  httpGet:
    path: /ready
    port: 3000
  periodSeconds: 5
```

### Service Types

| Type | Description |
| ------ | ------------- |
| `ClusterIP` | Internal only (default) |
| `LoadBalancer` | External Azure LB |
| `NodePort` | Expose on node ports |

## Useful Commands

```bash
# View pods
kubectl get pods

# View logs
kubectl logs -l app=aks-demo-app

# Scale up/down
kubectl scale deployment aks-demo-app --replicas=3

# Watch pods
kubectl get pods -w

# Describe pod (debugging)
kubectl describe pod <pod-name>

# Execute into pod
kubectl exec -it <pod-name> -- sh

# View events
kubectl get events --sort-by=.metadata.creationTimestamp
```

## Scaling

### Manual Scaling

```bash
kubectl scale deployment aks-demo-app --replicas=5
```

### Horizontal Pod Autoscaler

```bash
kubectl autoscale deployment aks-demo-app \
  --min=2 --max=10 --cpu-percent=50
```

## Pricing

| Resource | Approx. Cost |
| ---------- | ------------- |
| AKS Control Plane | Free |
| Standard_B2s node | ~$30/month |
| Load Balancer | ~$18/month |
| ACR Basic | ~$5/month |
| **Total (1 node)** | **~$53+/month** |

*Actual costs vary by region and usage.*

## Cleanup

**Delete everything to stop charges:**

```bash
# Delete AKS cluster
az aks delete \
  --name $(cat .aks-name) \
  --resource-group rg-azure-js-services --yes

# Delete Container Registry
az acr delete \
  --name $(cat .acr-name) \
  --resource-group rg-azure-js-services --yes
```

## AKS vs Other Options

| Feature | AKS | Container Apps | App Service |
| --------- | ----- | ---------------- | ------------- |
| **Best for** | Complex microservices | Simple containers | Traditional apps |
| **Complexity** | High | Low | Low |
| **Control** | Full K8s | Limited | Limited |
| **Min Cost** | ~$50/mo | $0 (serverless) | $0 (Free tier) |
| **Scaling** | Pods + Nodes | Automatic | Automatic |

## Next Steps

- Add Ingress controller for custom domains
- Configure TLS/SSL certificates
- Set up monitoring with Azure Monitor
- Implement CI/CD with GitHub Actions
- Try Helm charts for package management
