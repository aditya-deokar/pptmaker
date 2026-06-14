import { validateOAuthClient } from '@/mcp/auth/oauth-clients';
import { isExpectedMcpResource } from '@/mcp/auth/oauth-config';
import {
  exchangeAuthorizationCode,
  refreshAccessToken,
} from '@/mcp/auth/oauth-tokens';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function oauthJson(status: number, body: unknown): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
  });
}

async function readTokenRequest(request: Request): Promise<URLSearchParams> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const body = await request.json() as Record<string, unknown>;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        params.set(key, value);
      }
    }
    return params;
  }

  return new URLSearchParams(await request.text());
}

export async function POST(request: Request): Promise<Response> {
  let params: URLSearchParams;
  try {
    params = await readTokenRequest(request);
  } catch {
    return oauthJson(400, {
      error: 'invalid_request',
      error_description: 'Token requests must be form-encoded or JSON.',
    });
  }

  const grantType = params.get('grant_type');
  const clientId = params.get('client_id');
  const resource = params.get('resource');

  if (!clientId || !isExpectedMcpResource(resource, request.url)) {
    return oauthJson(400, {
      error: 'invalid_request',
      error_description: 'client_id and the Verto MCP resource parameter are required.',
    });
  }

  if (grantType === 'authorization_code') {
    const code = params.get('code');
    const redirectUri = params.get('redirect_uri');
    const codeVerifier = params.get('code_verifier');

    if (!code || !redirectUri || !codeVerifier) {
      return oauthJson(400, {
        error: 'invalid_request',
        error_description:
          'authorization_code exchange requires code, redirect_uri, and code_verifier.',
      });
    }

    const client = await validateOAuthClient(clientId, redirectUri);
    if (!client) {
      return oauthJson(400, {
        error: 'invalid_client',
        error_description: 'Unknown OAuth client or redirect_uri.',
      });
    }

    const tokenResponse = await exchangeAuthorizationCode({
      code,
      clientId,
      redirectUri,
      codeVerifier,
      resource: resource!,
    });

    if (!tokenResponse) {
      return oauthJson(400, {
        error: 'invalid_grant',
        error_description:
          'The authorization code is invalid, expired, already used, or failed PKCE validation.',
      });
    }

    return oauthJson(200, tokenResponse);
  }

  if (grantType === 'refresh_token') {
    const refreshToken = params.get('refresh_token');

    if (!refreshToken) {
      return oauthJson(400, {
        error: 'invalid_request',
        error_description: 'refresh_token grant requires refresh_token.',
      });
    }

    const tokenResponse = await refreshAccessToken({
      refreshToken,
      clientId,
      resource: resource!,
    });

    if (!tokenResponse) {
      return oauthJson(400, {
        error: 'invalid_grant',
        error_description: 'The refresh token is invalid, expired, or revoked.',
      });
    }

    return oauthJson(200, tokenResponse);
  }

  return oauthJson(400, {
    error: 'unsupported_grant_type',
    error_description:
      'Verto AI supports authorization_code and refresh_token grants.',
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
