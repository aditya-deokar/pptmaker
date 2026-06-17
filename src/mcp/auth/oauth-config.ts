import {
  MCP_DISCOVERY_PATH,
  MCP_DOCS_PATH,
  MCP_HTTP_PATH,
} from '@/lib/mcp-client-guide';

const FALLBACK_PUBLIC_APP_URL = 'https://verto.ai.aditya-deokar.me';

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function baseFromRequestUrl(requestUrl?: string | URL): string | null {
  if (!requestUrl) {
    return null;
  }

  try {
    const url = typeof requestUrl === 'string' ? new URL(requestUrl) : requestUrl;
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

export function getOAuthIssuer(requestUrl?: string | URL): string {
  return stripTrailingSlash(
    process.env.OAUTH_ISSUER
      || process.env.NEXT_PUBLIC_APP_URL
      || baseFromRequestUrl(requestUrl)
      || FALLBACK_PUBLIC_APP_URL
  );
}

export function getMcpResourceUrl(requestUrl?: string | URL): string {
  return stripTrailingSlash(
    process.env.MCP_PUBLIC_ENDPOINT || `${getOAuthIssuer(requestUrl)}${MCP_HTTP_PATH}`
  );
}

export function getProtectedResourceMetadataUrl(requestUrl?: string | URL): string {
  return `${getOAuthIssuer(requestUrl)}${MCP_DISCOVERY_PATH}`;
}

export function getMcpDocumentationUrl(requestUrl?: string | URL): string {
  return `${getOAuthIssuer(requestUrl)}${MCP_DOCS_PATH}`;
}

export function getOAuthAuthorizationEndpoint(requestUrl?: string | URL): string {
  return `${getOAuthIssuer(requestUrl)}/oauth/authorize`;
}

export function getOAuthTokenEndpoint(requestUrl?: string | URL): string {
  return `${getOAuthIssuer(requestUrl)}/oauth/token`;
}

export function getOAuthRevocationEndpoint(requestUrl?: string | URL): string {
  return `${getOAuthIssuer(requestUrl)}/oauth/revoke`;
}

export function getOAuthRegistrationEndpoint(requestUrl?: string | URL): string {
  return `${getOAuthIssuer(requestUrl)}/oauth/register`;
}

export function normalizeResourceUri(value: string): string {
  const url = new URL(value);
  url.hash = '';
  url.username = '';
  url.password = '';
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();

  if (url.pathname !== '/') {
    url.pathname = url.pathname.replace(/\/+$/, '');
  } else {
    url.pathname = '';
  }

  return url.toString().replace(/\/+$/, '');
}

export function isExpectedMcpResource(
  resource: string | null | undefined,
  requestUrl?: string | URL
): boolean {
  if (!resource) {
    return false;
  }

  try {
    return normalizeResourceUri(resource) === normalizeResourceUri(getMcpResourceUrl(requestUrl));
  } catch {
    return false;
  }
}

function escapeChallengeValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function buildWwwAuthenticateChallenge(options: {
  requestUrl?: string | URL;
  scopes?: readonly string[];
  error?: 'invalid_token' | 'insufficient_scope';
  errorDescription?: string;
} = {}): string {
  const params = [
    `resource_metadata="${escapeChallengeValue(getProtectedResourceMetadataUrl(options.requestUrl))}"`,
  ];

  if (options.scopes && options.scopes.length > 0) {
    params.push(`scope="${escapeChallengeValue(options.scopes.join(' '))}"`);
  }

  if (options.error) {
    params.push(`error="${options.error}"`);
  }

  if (options.errorDescription) {
    params.push(`error_description="${escapeChallengeValue(options.errorDescription)}"`);
  }

  return `Bearer ${params.join(', ')}`;
}
