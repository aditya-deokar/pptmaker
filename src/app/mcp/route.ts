/**
 * Public MCP Route - Clean connector endpoint.
 *
 * Keep /api/mcp for backward compatibility, but prefer /mcp for
 * ChatGPT, Claude, and other hosted remote MCP clients.
 */

import {
  handlePost,
  handleGet,
  handleDelete,
  handleOptions,
} from '@/mcp/transport/http';

export async function POST(request: Request): Promise<Response> {
  return handlePost(request);
}

export async function GET(request: Request): Promise<Response> {
  return handleGet(request);
}

export async function DELETE(request: Request): Promise<Response> {
  return handleDelete(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleOptions(request);
}
