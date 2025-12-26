/**
 * Authentication Middleware
 *
 * Validates JWT tokens from Azure AD and protects API routes.
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { tenantId, clientId } from './authConfig.js';

// JWKS client to fetch Azure AD signing keys
const jwks = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
});

// Get signing key from JWKS
function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback): void {
  jwks.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string;
        name?: string;
        email?: string;
        roles?: string[];
      };
    }
  }
}

/**
 * Middleware to validate Azure AD JWT tokens
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const token = authHeader.substring(7);

  // Verify token
  jwt.verify(
    token,
    getSigningKey,
    {
      algorithms: ['RS256'],
      audience: clientId,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    },
    (err, decoded) => {
      if (err) {
        console.error('Token validation error:', err.message);
        res.status(401).json({ error: 'Invalid token', details: err.message });
        return;
      }

      // Attach user info to request
      const payload = decoded as jwt.JwtPayload;
      req.user = {
        sub: payload.sub!,
        name: payload.name,
        email: payload.preferred_username || payload.email,
        roles: payload.roles,
      };

      next();
    }
  );
}

/**
 * Optional middleware - attaches user if token present, continues if not
 */
export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.substring(7);

  jwt.verify(
    token,
    getSigningKey,
    {
      algorithms: ['RS256'],
      audience: clientId,
      issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
    },
    (err, decoded) => {
      if (!err && decoded) {
        const payload = decoded as jwt.JwtPayload;
        req.user = {
          sub: payload.sub!,
          name: payload.name,
          email: payload.preferred_username || payload.email,
          roles: payload.roles,
        };
      }
      next();
    }
  );
}
