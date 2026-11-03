import { Request } from 'express';
import env from '../config/env';

/**
 * Resolves the client frontend base URL from the incoming request or configuration.
 * Priority:
 * 1. Explicit body param (frontendUrl or returnUrl)
 * 2. Origin request header (if matching ACWS domain, allowed origins, or development hosts)
 * 3. Referer request header (origin part)
 * 4. Configured env.frontendUrl (falling back to http://acwsevents.com)
 */
export const resolveFrontendUrl = (req: Request): string => {
  // 1. Explicit body parameter
  if (req.body?.frontendUrl && typeof req.body.frontendUrl === 'string' && req.body.frontendUrl.trim()) {
    return req.body.frontendUrl.trim().replace(/\/$/, '');
  }
  if (req.body?.returnUrl && typeof req.body.returnUrl === 'string' && req.body.returnUrl.trim()) {
    return req.body.returnUrl.trim().replace(/\/$/, '');
  }

  // 2. Request Origin header
  const origin = req.get('origin');
  if (origin) {
    const cleanOrigin = origin.trim().replace(/\/$/, '');
    if (
      cleanOrigin.includes('acwsevents.com') ||
      env.allowedOrigins.includes(cleanOrigin)
    ) {
      return cleanOrigin;
    }
  }

  // 3. Request Referer header
  const referer = req.get('referer');
  if (referer) {
    try {
      const parsed = new URL(referer);
      const originFromReferer = `${parsed.protocol}//${parsed.host}`;
      if (
        originFromReferer.includes('acwsevents.com') ||
        env.allowedOrigins.includes(originFromReferer)
      ) {
        return originFromReferer;
      }
    } catch {}
  }

  // 4. Fallback to configured env.frontendUrl (defaulting to http://acwsevents.com)
  return env.frontendUrl || 'http://acwsevents.com';
};

