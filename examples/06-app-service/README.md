# Azure App Service Example

Learn how to deploy Node.js applications to Azure App Service - Azure's fully managed web hosting platform.

## What You'll Learn

- Creating App Service Plan and Web App
- Deploying Node.js applications
- Environment variables and app settings
- Monitoring with built-in logging
- Deployment slots for zero-downtime deploys

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure subscription

## Local Development

```bash
npm install
npm run dev
```

Open <http://localhost:3000>

## Deploy to Azure

### 1. Create Azure Resources

```bash
chmod +x setup.sh deploy.sh
./setup.sh
```

This creates:

- App Service Plan (Free F1 tier)
- Web App with Node.js 20 runtime
- Configures app settings and logging

### 2. Deploy the Application

```bash
npm install
./deploy.sh
```

This will:

- Build TypeScript to JavaScript
- Package the application
- Deploy using ZIP deploy

## API Endpoints

| Endpoint | Description |
| ---------- | ------------- |
| `GET /` | Home page with environment info |
| `GET /api/health` | Health check for monitoring |
| `GET /api/info` | Detailed app and runtime info |
| `GET /api/config` | Configuration and feature flags |
| `POST /api/echo` | Echo request body |
| `GET /api/slow?ms=N` | Simulate slow response |

## App Service Environment Variables

App Service provides these automatically:

| Variable | Description |
| ---------- | ------------- |
| `PORT` | Port to listen on (set by App Service) |
| `WEBSITE_HOSTNAME` | Full hostname of your app |
| `WEBSITE_SITE_NAME` | Name of the web app |
| `WEBSITE_INSTANCE_ID` | Current instance ID |
| `WEBSITE_SLOT_NAME` | Deployment slot name |
| `WEBSITE_SKU` | App Service Plan tier |

## Code Structure

```text
├── src/
│   └── server.ts      # Express application
├── setup.sh           # Create Azure resources
├── deploy.sh          # Deploy application
├── package.json
└── tsconfig.json
```

## App Service Tiers

| Tier | Cost | Features |
| ------ | ------ | ---------- |
| **Free (F1)** | $0 | 60 CPU min/day, 1 GB RAM |
| Basic (B1) | ~$13/mo | Custom domains, SSL |
| Standard (S1) | ~$70/mo | Auto-scale, slots, backups |
| Premium (P1V2) | ~$80/mo | Better performance, VNet |

Free tier is perfect for learning and testing.

## Monitoring

```bash
# Stream logs
az webapp log tail \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services

# View in portal
# App Service > Your App > Log stream
```

## Deployment Slots (Standard tier+)

```bash
# Create staging slot
az webapp deployment slot create \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services \
  --slot staging

# Deploy to staging
az webapp deploy \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services \
  --slot staging \
  --src-path deploy.zip

# Swap staging to production
az webapp deployment slot swap \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services \
  --slot staging \
  --target-slot production
```

## Cleanup

```bash
# Delete web app
az webapp delete \
  --name YOUR_APP_NAME \
  --resource-group rg-azure-js-services

# Delete app service plan
az appservice plan delete \
  --name YOUR_PLAN_NAME \
  --resource-group rg-azure-js-services --yes
```

## App Service vs Container Apps vs Functions

| Feature | App Service | Container Apps | Functions |
| --------- | ------------- | ---------------- | ----------- |
| **Best for** | Traditional web apps | Microservices, containers | Event-driven, serverless |
| **Scaling** | Manual or auto | Auto (including to zero) | Auto (to zero) |
| **Cold start** | None (always running) | Possible | Possible |
| **Pricing** | Per hour | Per request/resource | Per execution |
| **Container** | Optional | Required | Not needed |

## Next Steps

- Try the [Static Web Apps example](../07-static-web-apps/)
- Enable Application Insights
- Configure custom domains
- Set up CI/CD with GitHub Actions
