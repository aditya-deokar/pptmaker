import { revokeOAuthToken } from '@/mcp/auth/oauth-tokens';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function readRevokeRequest(request: Request): Promise<URLSearchParams> {
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
    params = await readRevokeRequest(request);
  } catch {
    return Response.json(
      {
        error: 'invalid_request',
        error_description: 'Revocation requests must be form-encoded or JSON.',
      },
      { status: 400 }
    );
  }

  const token = params.get('token');
  if (token) {
    await revokeOAuthToken(token);
  }

  return new Response(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      Pragma: 'no-cache',
    },
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
