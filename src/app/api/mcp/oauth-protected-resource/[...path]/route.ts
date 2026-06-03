import { headers } from 'next/headers';
import { MCP_DOCS_PATH, MCP_HTTP_PATH } from '@/lib/mcp-client-guide';

async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const host = requestHeaders.get('host') ?? 'localhost:3000';
  const protocol = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    ? 'http'
    : 'https';

  return `${protocol}://${host}`;
}

export async function GET(): Promise<Response> {
  const baseUrl = await getBaseUrl();

  return Response.json({
    resource: `${baseUrl}${MCP_HTTP_PATH}`,
    bearer_methods_supported: ['header'],
    resource_name: 'Verto AI MCP Server',
    resource_documentation: `${baseUrl}${MCP_DOCS_PATH}`,
  });
}
