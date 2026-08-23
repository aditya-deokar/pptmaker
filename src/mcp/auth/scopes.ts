import { TOOL_NAMES } from '../config/constants';
import type { AuthContext } from './types';

export const MCP_OAUTH_SCOPES = [
  'presentations:read',
  'presentations:write',
  'presentations:generate',
  'presentations:publish',
] as const;

export type McpOAuthScope = (typeof MCP_OAUTH_SCOPES)[number];

const ALL_SCOPES = new Set<string>(MCP_OAUTH_SCOPES);

export function getAllMcpOAuthScopes(): McpOAuthScope[] {
  return [...MCP_OAUTH_SCOPES];
}

export function parseRequestedScopes(scope?: string | null): {
  scopes: McpOAuthScope[];
  invalidScopes: string[];
} {
  const requested = scope
    ?.split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (!requested || requested.length === 0) {
    return { scopes: getAllMcpOAuthScopes(), invalidScopes: [] };
  }

  const scopes: McpOAuthScope[] = [];
  const invalidScopes: string[] = [];

  for (const requestedScope of requested) {
    if (ALL_SCOPES.has(requestedScope)) {
      scopes.push(requestedScope as McpOAuthScope);
    } else {
      invalidScopes.push(requestedScope);
    }
  }

  return { scopes: [...new Set(scopes)], invalidScopes };
}

export function scopeString(scopes: readonly string[]): string {
  return scopes.join(' ');
}

export function getRequiredScopesForTool(toolName: string): McpOAuthScope[] {
  switch (toolName) {
    case TOOL_NAMES.PRESENTATION_LIST:
    case TOOL_NAMES.PRESENTATION_GET:
    case TOOL_NAMES.PRESENTATION_RENDER_DECK:
    case TOOL_NAMES.PRESENTATION_RENDER_THEME_STUDIO:
      return ['presentations:read'];

    case TOOL_NAMES.PRESENTATION_GENERATE:
    case TOOL_NAMES.PRESENTATION_GENERATION_STATUS:
      return ['presentations:generate'];

    case TOOL_NAMES.PRESENTATION_PUBLISH:
    case TOOL_NAMES.PRESENTATION_UNPUBLISH:
      return ['presentations:publish'];

    case TOOL_NAMES.PRESENTATION_CREATE:
    case TOOL_NAMES.PRESENTATION_DELETE:
    case TOOL_NAMES.PRESENTATION_RECOVER:
    case TOOL_NAMES.PRESENTATION_DELETE_PERMANENTLY:
    case TOOL_NAMES.PRESENTATION_UPDATE_SLIDES:
    case TOOL_NAMES.PRESENTATION_UPDATE_THEME:
      return ['presentations:write'];

    default:
      return [];
  }
}

export function hasRequiredScopes(
  auth: AuthContext,
  requiredScopes: readonly string[]
): boolean {
  if (requiredScopes.length === 0) {
    return true;
  }

  const grantedScopes = new Set(auth.scopes);
  return requiredScopes.every((scope) => grantedScopes.has(scope));
}
