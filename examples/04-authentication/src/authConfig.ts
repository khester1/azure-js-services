/**
 * MSAL Configuration
 *
 * Configures Microsoft Authentication Library for Azure AD.
 */

import { Configuration, LogLevel } from '@azure/msal-node';
import { config } from 'dotenv';

config();

// Required environment variables
const tenantId = process.env.AZURE_TENANT_ID!;
const clientId = process.env.AZURE_CLIENT_ID!;
const clientSecret = process.env.AZURE_CLIENT_SECRET!;
const redirectUri = process.env.REDIRECT_URI || 'http://localhost:3000/auth/callback';

// MSAL configuration
export const msalConfig: Configuration = {
  auth: {
    clientId,
    clientSecret,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            break;
          case LogLevel.Warning:
            console.warn(message);
            break;
          case LogLevel.Info:
            console.info(message);
            break;
          case LogLevel.Verbose:
            console.debug(message);
            break;
        }
      },
      piiLoggingEnabled: false,
      logLevel: LogLevel.Warning,
    },
  },
};

// OAuth 2.0 scopes
export const scopes = ['user.read', 'openid', 'profile', 'email'];

// Redirect URI
export const REDIRECT_URI = redirectUri;

// Token validation settings
export const tokenValidation = {
  issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
  audience: clientId,
};

// Export for use in other files
export { tenantId, clientId };
