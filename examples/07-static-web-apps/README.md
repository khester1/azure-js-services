# Azure Static Web Apps Example

Learn how to deploy frontend applications with serverless APIs using Azure Static Web Apps.

## What You'll Learn

- Deploying static sites (HTML, CSS, JS)
- Integrated Azure Functions API
- Automatic CI/CD with GitHub Actions
- Preview environments for pull requests
- Built-in authentication

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure Functions Core Tools (optional for local dev)

## Project Structure

```
07-static-web-apps/
├── frontend/                  # Static files
│   └── index.html
├── api/                       # Azure Functions
│   ├── src/functions/
│   │   ├── hello.ts
│   │   └── time.ts
│   ├── package.json
│   └── host.json
├── staticwebapp.config.json   # SWA configuration
└── setup.sh
```

## Local Development

### Install the SWA CLI

```bash
npm install
```

### Build the API

```bash
npm run build:api
```

### Run locally

```bash
npm run dev
```

This starts:
- Frontend at http://localhost:4280
- API at http://localhost:4280/api/*

## Deploy to Azure

### Option 1: Azure CLI

```bash
# Create Static Web App
./setup.sh

# Build API
npm run build:api

# Deploy
npx swa deploy frontend \
  --api-location api \
  --deployment-token $(cat .deployment-token)
```

### Option 2: GitHub Actions (Recommended)

1. Push code to GitHub
2. In Azure Portal: Static Web Apps > Create
3. Connect to your GitHub repo
4. Azure automatically creates a GitHub Action

The workflow deploys on every push to main and creates preview URLs for PRs.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hello` | GET/POST | Returns greeting |
| `/api/hello?name=X` | GET | Personalized greeting |
| `/api/time` | GET | Current time info |

## Configuration

`staticwebapp.config.json` controls:

```json
{
  "routes": [
    { "route": "/api/*", "allowedRoles": ["anonymous"] }
  ],
  "navigationFallback": {
    "rewrite": "/index.html"
  },
  "globalHeaders": {
    "X-Content-Type-Options": "nosniff"
  }
}
```

## Features

### Navigation Fallback (SPA Support)

```json
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/*.{css,js,png}"]
  }
}
```

### Authentication (Built-in)

```json
{
  "routes": [
    {
      "route": "/admin/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

Login URLs:
- `/.auth/login/github`
- `/.auth/login/twitter`
- `/.auth/login/aad` (Azure AD)

### Custom Headers

```json
{
  "globalHeaders": {
    "Cache-Control": "max-age=3600"
  }
}
```

## Static Web Apps vs App Service

| Feature | Static Web Apps | App Service |
|---------|-----------------|-------------|
| **Best for** | Frontend + API | Full-stack apps |
| **Backend** | Azure Functions | Any runtime |
| **CDN** | Built-in global | Optional |
| **SSL** | Free, automatic | Free (managed) |
| **CI/CD** | GitHub Actions | Multiple options |
| **Cost** | Free tier | Free tier (limited) |

## Pricing

| Tier | Cost | Features |
|------|------|----------|
| **Free** | $0 | 100GB bandwidth, 2 custom domains |
| Standard | $9/mo | 100GB bandwidth, custom auth, SLA |

## Cleanup

```bash
az staticwebapp delete \
  --name YOUR_SWA_NAME \
  --resource-group rg-azure-js-services --yes
```

## Next Steps

- Try the [Kubernetes example](../08-kubernetes/)
- Add custom domain
- Implement authentication
- Set up staging environments
