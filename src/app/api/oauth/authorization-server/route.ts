import { getAuthorizationServerMetadata } from '@/mcp/auth/oauth-metadata';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  return Response.json(getAuthorizationServerMetadata(request.url), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
