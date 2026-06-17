/**
 * MCP Auth — Middleware Factory
 *
 * Creates the appropriate auth resolver based on the transport type.
 * Tool handlers receive the AuthContext — they never know which transport is in use.
 */

import type { AuthContext } from './types';
import { validateApiKey } from './api-key';
import { resolveClerkSession } from './clerk-session';
import { validateOAuthAccessToken } from './oauth-tokens';

export type TransportType = 'stdio' | 'http';

/**
 * Resolve authentication for the current request.
 *
 * - stdio: uses VERTO_API_KEY from environment
 * - http: tries Authorization header first, falls back to Clerk session
 */
export async function resolveAuth(
  transport: TransportType,
  headers?: Record<string, string | undefined>
): Promise<AuthContext | null> {
  if (transport === 'stdio') {
    return resolveStdioAuth();
  }

  return resolveHttpAuth(headers);
}

/**
 * stdio transport: resolve auth from the VERTO_API_KEY environment variable.
 */
async function resolveStdioAuth(): Promise<AuthContext | null> {
  const apiKey = process.env.VERTO_API_KEY;
  if (!apiKey) {
    console.error('[MCP Auth] VERTO_API_KEY not set in environment');
    return null;
  }

  return validateApiKey(apiKey);
}

/**
 * HTTP transport: try Bearer token first, then fall back to Clerk session cookies.
 */
async function resolveHttpAuth(
  headers?: Record<string, string | undefined>
): Promise<AuthContext | null> {
  // 1. Try Bearer token (for headless/agent clients)
  const authHeader = headers?.['authorization'] ?? headers?.['Authorization'];
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    return (await validateOAuthAccessToken(token)) ?? validateApiKey(token);
  }

  // 2. Fall back to Clerk session (for browser-based clients)
  return resolveClerkSession();
}
