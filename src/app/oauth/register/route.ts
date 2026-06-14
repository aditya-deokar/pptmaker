import { registerDynamicOAuthClient } from '@/mcp/auth/oauth-clients';

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

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return oauthJson(400, {
      error: 'invalid_client_metadata',
      error_description: 'Dynamic client registration requires a JSON body.',
    });
  }

  try {
    const client = await registerDynamicOAuthClient(
      body && typeof body === 'object' ? body : {}
    );

    return oauthJson(201, client);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'REGISTRATION_FAILED';

    if (message === 'INVALID_REDIRECT_URIS') {
      return oauthJson(400, {
        error: 'invalid_redirect_uri',
        error_description:
          'redirect_uris must contain exact HTTPS redirect URIs. Localhost HTTP is allowed for development only.',
      });
    }

    if (message === 'UNSUPPORTED_TOKEN_AUTH_METHOD') {
      return oauthJson(400, {
        error: 'invalid_client_metadata',
        error_description: 'Only token_endpoint_auth_method "none" is supported.',
      });
    }

    return oauthJson(400, {
      error: 'invalid_client_metadata',
      error_description: 'Unable to register this OAuth client.',
    });
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
