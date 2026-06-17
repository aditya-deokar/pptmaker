import { randomBytes } from 'node:crypto';
import prisma from '@/lib/prisma';

const CLIENT_ID_PREFIX = 'vc_';
const CLIENT_METADATA_TIMEOUT_MS = 3000;

interface StaticOAuthClient {
  client_id: string;
  redirect_uris: string[];
  client_name?: string;
}

export interface OAuthClientInfo {
  clientId: string;
  clientName?: string | null;
  redirectUris: string[];
}

export interface DynamicClientRegistrationInput {
  redirect_uris?: unknown;
  client_name?: unknown;
  client_uri?: unknown;
  logo_uri?: unknown;
  scope?: unknown;
  token_endpoint_auth_method?: unknown;
  grant_types?: unknown;
  response_types?: unknown;
}

function randomBase64Url(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

function isAllowedRedirectUri(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.hash) {
      return false;
    }

    if (url.protocol === 'https:') {
      return true;
    }

    return (
      url.protocol === 'http:'
      && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function isClientMetadataDocumentUrl(clientId: string): boolean {
  try {
    const url = new URL(clientId);
    return url.protocol === 'https:';
  } catch {
    return false;
  }
}

function getErrorSummary(error: unknown): Record<string, string> {
  if (!error || typeof error !== 'object') {
    return { type: typeof error };
  }

  const record = error as Record<string, unknown>;
  return {
    name: error instanceof Error ? error.name : 'UnknownError',
    code: typeof record.code === 'string' ? record.code : 'UNKNOWN',
  };
}

function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
}

function parseStaticClients(): StaticOAuthClient[] {
  const raw = process.env.OAUTH_ALLOWED_CLIENTS;
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    const clients = Array.isArray(parsed) ? parsed : [parsed];

    return clients
      .map((client): StaticOAuthClient | null => {
        if (!client || typeof client !== 'object') {
          return null;
        }

        const record = client as Record<string, unknown>;
        const clientId = record.client_id ?? record.clientId;
        const redirectUris = record.redirect_uris ?? record.redirectUris;

        if (typeof clientId !== 'string') {
          return null;
        }

        const uris = parseStringArray(redirectUris).filter(isAllowedRedirectUri);
        if (uris.length === 0) {
          return null;
        }

        return {
          client_id: clientId,
          redirect_uris: uris,
          client_name:
            typeof record.client_name === 'string'
              ? record.client_name
              : undefined,
        };
      })
      .filter((client): client is StaticOAuthClient => Boolean(client));
  } catch {
    return [];
  }
}

async function fetchClientMetadata(clientId: string): Promise<OAuthClientInfo | null> {
  let url: URL;
  try {
    url = new URL(clientId);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:') {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLIENT_METADATA_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const metadata = await response.json() as Record<string, unknown>;
    const metadataClientId = metadata.client_id;
    const redirectUris = parseStringArray(metadata.redirect_uris);
    const tokenEndpointAuthMethod = metadata.token_endpoint_auth_method;

    if (
      typeof metadataClientId !== 'string'
      || metadataClientId !== clientId
      || redirectUris.length === 0
      || (
        typeof tokenEndpointAuthMethod === 'string'
        && tokenEndpointAuthMethod !== 'none'
      )
    ) {
      return null;
    }

    return {
      clientId,
      clientName:
        typeof metadata.client_name === 'string' ? metadata.client_name : null,
      redirectUris: redirectUris.filter(isAllowedRedirectUri),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function findDynamicOAuthClient(clientId: string) {
  try {
    return await prisma.mcpOAuthClient.findFirst({
      where: {
        clientId,
        revokedAt: null,
      },
    });
  } catch (error) {
    console.error('[OAuth] Dynamic client lookup failed', getErrorSummary(error));
    return null;
  }
}

export async function validateOAuthClient(
  clientId: string,
  redirectUri: string
): Promise<OAuthClientInfo | null> {
  if (!clientId || !isAllowedRedirectUri(redirectUri)) {
    return null;
  }

  const staticClient = parseStaticClients().find(
    (client) => client.client_id === clientId
  );

  if (isClientMetadataDocumentUrl(clientId)) {
    const metadataClient = await fetchClientMetadata(clientId);
    if (metadataClient) {
      return metadataClient.redirectUris.includes(redirectUri) ? metadataClient : null;
    }

    return staticClient?.redirect_uris.includes(redirectUri)
      ? {
          clientId,
          clientName: staticClient.client_name,
          redirectUris: staticClient.redirect_uris,
        }
      : null;
  }

  const dynamicClient = await findDynamicOAuthClient(clientId);

  if (dynamicClient) {
    return dynamicClient.redirectUris.includes(redirectUri)
      ? {
          clientId,
          clientName: dynamicClient.clientName,
          redirectUris: dynamicClient.redirectUris,
        }
      : null;
  }

  if (staticClient) {
    return staticClient.redirect_uris.includes(redirectUri)
      ? {
          clientId,
          clientName: staticClient.client_name,
          redirectUris: staticClient.redirect_uris,
        }
      : null;
  }

  const metadataClient = await fetchClientMetadata(clientId);
  if (!metadataClient) {
    return null;
  }

  return metadataClient.redirectUris.includes(redirectUri) ? metadataClient : null;
}

export async function registerDynamicOAuthClient(
  input: DynamicClientRegistrationInput
) {
  const redirectUris = parseStringArray(input.redirect_uris);
  const validRedirectUris = redirectUris.filter(isAllowedRedirectUri);

  if (validRedirectUris.length === 0 || validRedirectUris.length !== redirectUris.length) {
    throw new Error('INVALID_REDIRECT_URIS');
  }

  const tokenEndpointAuthMethod =
    typeof input.token_endpoint_auth_method === 'string'
      ? input.token_endpoint_auth_method
      : 'none';

  if (tokenEndpointAuthMethod !== 'none') {
    throw new Error('UNSUPPORTED_TOKEN_AUTH_METHOD');
  }

  const grantTypes = parseStringArray(input.grant_types);
  const responseTypes = parseStringArray(input.response_types);
  const clientId = `${CLIENT_ID_PREFIX}${randomBase64Url(24)}`;

  const client = await prisma.mcpOAuthClient.create({
    data: {
      clientId,
      clientName:
        typeof input.client_name === 'string' ? input.client_name : null,
      clientUri:
        typeof input.client_uri === 'string' ? input.client_uri : null,
      logoUri:
        typeof input.logo_uri === 'string' ? input.logo_uri : null,
      redirectUris: validRedirectUris,
      scope: typeof input.scope === 'string' ? input.scope : null,
      tokenEndpointAuthMethod,
      grantTypes:
        grantTypes.length > 0 ? grantTypes : ['authorization_code', 'refresh_token'],
      responseTypes:
        responseTypes.length > 0 ? responseTypes : ['code'],
    },
  });

  return {
    client_id: client.clientId,
    client_id_issued_at: Math.floor(client.createdAt.getTime() / 1000),
    client_name: client.clientName ?? undefined,
    client_uri: client.clientUri ?? undefined,
    logo_uri: client.logoUri ?? undefined,
    redirect_uris: client.redirectUris,
    token_endpoint_auth_method: client.tokenEndpointAuthMethod,
    grant_types: client.grantTypes,
    response_types: client.responseTypes,
    scope: client.scope ?? undefined,
  };
}
