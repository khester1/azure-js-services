# Azure AD Authentication Example

Learn how to implement Azure AD authentication using MSAL.js (Microsoft Authentication Library).

## What You'll Learn

- Azure AD app registration
- OAuth 2.0 Authorization Code Flow
- JWT token validation
- Protecting API endpoints
- User info retrieval

## Prerequisites

- Node.js 20+
- Azure CLI (`az login`)
- Azure AD tenant (comes with any Azure subscription)

## Setup

### 1. Create App Registration

```bash
chmod +x setup.sh
./setup.sh
```

This creates:
- Azure AD app registration
- Client secret
- Redirect URI configuration
- API permissions for Microsoft Graph

### 2. Configure Environment

```bash
cp .env.example .env
```

Update with values from setup output:
- `AZURE_TENANT_ID`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`

### 3. Install Dependencies

```bash
npm install
```

## Run the Demo

```bash
npm run dev
```

Open http://localhost:3000 and click "Sign In with Microsoft".

## Authentication Flow

```
1. User clicks "Sign In"
         ↓
2. Redirect to Azure AD login page
         ↓
3. User enters credentials
         ↓
4. Azure AD redirects back with authorization code
         ↓
5. Server exchanges code for tokens (access + ID token)
         ↓
6. User is authenticated, can access protected APIs
```

## API Endpoints

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /` | No | Home page with login button |
| `GET /auth/login` | No | Starts OAuth flow |
| `GET /auth/callback` | No | OAuth callback (automatic) |
| `GET /auth/logout` | No | Signs out user |
| `GET /api/public` | No | Public endpoint |
| `GET /api/protected` | Yes | Requires valid token |
| `GET /api/me` | Yes | Returns user info |
| `GET /api/greeting` | Optional | Works with or without token |

## Code Structure

```
src/
├── authConfig.ts     # MSAL configuration
├── authMiddleware.ts # JWT validation middleware
└── server.ts         # Express server with routes
```

## Key Concepts

### MSAL Configuration

```typescript
const msalConfig = {
  auth: {
    clientId: 'your-client-id',
    clientSecret: 'your-secret',
    authority: 'https://login.microsoftonline.com/your-tenant',
  },
};
```

### Protecting API Routes

```typescript
import { requireAuth } from './authMiddleware.js';

// This route requires authentication
app.get('/api/protected', requireAuth, (req, res) => {
  // req.user contains the authenticated user
  res.json({ user: req.user });
});
```

### Token Validation

The middleware validates:
- Token signature (using Azure AD public keys)
- Token audience (must match your client ID)
- Token issuer (must be your Azure AD tenant)
- Token expiration

## Testing with curl

After logging in, copy the access token and test:

```bash
# Public endpoint (no token needed)
curl http://localhost:3000/api/public

# Protected endpoint (token required)
curl http://localhost:3000/api/protected \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# User info
curl http://localhost:3000/api/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Cleanup

Delete the app registration when done:

```bash
az ad app delete --id YOUR_CLIENT_ID
```

## Cost

- **Free** - Azure AD authentication has no additional cost
- Included with any Azure subscription

## Security Notes

- Never expose client secrets in frontend code
- Use HTTPS in production
- Store tokens securely (not in localStorage for sensitive apps)
- Implement token refresh for long sessions
- Validate tokens on every API request

## Next Steps

- Try the [Container Apps example](../05-container-apps/)
- Add role-based access control (RBAC)
- Implement token refresh
- Add frontend SPA with MSAL.js browser library
