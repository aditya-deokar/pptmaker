import {
  MCP_DISCOVERY_PATH,
  MCP_HTTP_PATH,
  MCP_LEGACY_HTTP_PATH,
  MCP_PROTOCOL_VERSION,
} from '@/lib/mcp-client-guide';
import {
  getMcpDocumentationUrl,
  getMcpResourceUrl,
  getOAuthIssuer,
  getProtectedResourceMetadataUrl,
} from '@/mcp/auth/oauth-config';
import { getAllMcpOAuthScopes } from '@/mcp/auth/scopes';

export async function getProtectedResourceMetadata(): Promise<Record<string, unknown>> {
  const issuer = getOAuthIssuer();
  const mcpEndpoint = getMcpResourceUrl();

  return {
    resource: mcpEndpoint,
    authorization_servers: [issuer],
    bearer_methods_supported: ['header'],
    scopes_supported: getAllMcpOAuthScopes(),
    token_endpoint_auth_methods_supported: ['none'],
    resource_name: 'Verto AI MCP Server',
    resource_documentation: getMcpDocumentationUrl(),
    mcp_protocol_version: MCP_PROTOCOL_VERSION,
    mcp_endpoint: mcpEndpoint,
    legacy_mcp_endpoint: `${issuer}${MCP_LEGACY_HTTP_PATH}`,
    oauth_protected_resource_metadata: getProtectedResourceMetadataUrl(),
    public_paths: {
      primary_mcp_path: MCP_HTTP_PATH,
      legacy_mcp_path: MCP_LEGACY_HTTP_PATH,
      protected_resource_metadata_path: MCP_DISCOVERY_PATH,
    },
  };
}

export async function getProtectedResourceMetadataResponse(): Promise<Response> {
  return Response.json(await getProtectedResourceMetadata(), {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
