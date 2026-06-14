/**
 * MCP Transport - Streamable HTTP (Next.js API Route)
 */

import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { MCP_PROTOCOL_VERSION } from '../config/constants';
import { validateMcpEnv } from '../config/env';
import { createMcpServer } from '../server';
import { registerAllTools } from '../tools/registry';
import { registerAllResources } from '../resources/registry';
import { setTransportType } from '../tools/presentation/index';
import { resolveAuth } from '../auth/middleware';
import { buildWwwAuthenticateChallenge } from '../auth/oauth-config';
import {
  getRequiredScopesForTool,
  hasRequiredScopes,
} from '../auth/scopes';

import '../tools/presentation/index';
import '../resources/presentations';
import '../resources/templates';
import '../resources/themes';
import '../resources/generation-progress';

interface HttpSession {
  server: McpServer;
  transport: WebStandardStreamableHTTPServerTransport;
}

interface ParsedRequestBody {
  request: Request;
  body: unknown;
}

const sessions = new Map<string, HttpSession>();

function createServerInstance(): McpServer {
  setTransportType('http');

  const server = createMcpServer();
  registerAllTools(server);
  registerAllResources(server);

  console.error('[MCP] HTTP server initialized');
  return server;
}

function getAllowedOrigins(): string[] {
  const env = validateMcpEnv();
  const configured = env.MCP_ALLOWED_ORIGINS
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  return [env.NEXT_PUBLIC_APP_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'];
}

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) {
    return true;
  }

  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
}

function applyCorsHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const origin = request.headers.get('origin');
  const allowedOrigins = getAllowedOrigins();

  if (origin && isOriginAllowed(origin)) {
    headers.set(
      'Access-Control-Allow-Origin',
      allowedOrigins.includes('*') ? '*' : origin
    );
    headers.set('Vary', 'Origin');
  }

  headers.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, MCP-Session-Id, MCP-Protocol-Version, Last-Event-ID'
  );
  headers.set('Access-Control-Expose-Headers', 'MCP-Session-Id');
  headers.set('Access-Control-Max-Age', '86400');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function jsonResponse(
  request: Request,
  status: number,
  body: unknown,
  extraHeaders?: HeadersInit
): Response {
  return applyCorsHeaders(
    request,
    new Response(JSON.stringify(body), {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...(extraHeaders ?? {}),
      },
    })
  );
}

function requestHeadersToRecord(request: Request): Record<string, string | undefined> {
  const record: Record<string, string | undefined> = {};
  request.headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function getJsonRpcId(body: unknown): unknown {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  return (body as { id?: unknown }).id ?? null;
}

function getToolNameFromBody(body: unknown): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return null;
  }

  const message = body as {
    method?: unknown;
    params?: { name?: unknown };
  };

  if (message.method !== 'tools/call' || typeof message.params?.name !== 'string') {
    return null;
  }

  return message.params.name;
}

async function guardHttpAuthorization(
  request: Request,
  body: unknown
): Promise<Response | null> {
  const headers = requestHeadersToRecord(request);
  const authHeader = headers.authorization ?? headers.Authorization;
  const toolName = getToolNameFromBody(body);
  const requiredScopes = toolName ? getRequiredScopesForTool(toolName) : [];
  const hasBearer = authHeader?.startsWith('Bearer ') ?? false;

  if (!toolName && !hasBearer) {
    return null;
  }

  const auth = await resolveAuth('http', headers);
  const challenge = buildWwwAuthenticateChallenge({
    requestUrl: request.url,
    scopes: requiredScopes,
    error: auth ? 'insufficient_scope' : 'invalid_token',
    errorDescription: auth
      ? 'Reconnect Verto AI and grant the required scope.'
      : 'Sign in to Verto AI or reconnect this app.',
  });

  if (!auth) {
    return jsonResponse(
      request,
      401,
      {
        jsonrpc: '2.0',
        error: {
          code: -32004,
          message: 'Authentication required for this MCP request.',
        },
        id: getJsonRpcId(body),
      },
      { 'WWW-Authenticate': challenge }
    );
  }

  if (!hasRequiredScopes(auth, requiredScopes)) {
    return jsonResponse(
      request,
      403,
      {
        jsonrpc: '2.0',
        error: {
          code: -32005,
          message: `This OAuth connection needs the following scope: ${requiredScopes.join(' ')}.`,
        },
        id: getJsonRpcId(body),
      },
      { 'WWW-Authenticate': challenge }
    );
  }

  return null;
}

function validateJsonDepth(value: unknown, maxDepth: number, depth = 0): boolean {
  if (depth > maxDepth) {
    return false;
  }

  if (value === null || typeof value !== 'object') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => validateJsonDepth(item, maxDepth, depth + 1));
  }

  return Object.values(value).every((item) => validateJsonDepth(item, maxDepth, depth + 1));
}

function normalizeAcceptHeader(headers: Headers): string {
  const accept = headers.get('accept');

  if (!accept || accept.trim() === '' || accept.includes('*/*')) {
    return 'application/json, text/event-stream';
  }

  const acceptedTypes = accept
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  const includesJson = acceptedTypes.some((entry) => entry.includes('application/json'));
  const includesEventStream = acceptedTypes.some((entry) => entry.includes('text/event-stream'));

  if (includesJson && includesEventStream) {
    return accept;
  }

  const normalized = [...acceptedTypes];
  if (!includesJson) {
    normalized.push('application/json');
  }
  if (!includesEventStream) {
    normalized.push('text/event-stream');
  }

  return normalized.join(', ');
}

function normalizeRequestHeaders(request: Request): Request {
  const headers = new Headers();
  request.headers.forEach((v, k) => headers.set(k, v));
  headers.set('accept', normalizeAcceptHeader(headers));

  // Create a new request from scratch to avoid "private member #state" errors
  // which happen when passing a Next.js Request object to the standard Request constructor.
  const init: RequestInit = {
    method: request.method,
    headers: headers,
  };

  if (!['GET', 'HEAD'].includes(request.method) && request.body) {
    init.body = request.body;
    // @ts-ignore - duplex is required for streaming bodies in some environments
    init.duplex = 'half';
  }

  return new Request(request.url, init);
}

async function parseRequestBody(request: Request): Promise<ParsedRequestBody> {
  const env = validateMcpEnv();

  if (['GET', 'HEAD', 'DELETE'].includes(request.method)) {
    return {
      request: normalizeRequestHeaders(request),
      body: undefined,
    };
  }

  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (Number.isFinite(contentLength) && contentLength > env.MCP_MAX_REQUEST_BYTES) {
      throw new Error('REQUEST_TOO_LARGE');
    }
  }

  const rawText = await request.text();
  const requestBytes = Buffer.byteLength(rawText, 'utf8');

  if (requestBytes > env.MCP_MAX_REQUEST_BYTES) {
    throw new Error('REQUEST_TOO_LARGE');
  }

  const normalizedRequest = normalizeRequestHeaders(
    new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body: rawText,
    })
  );

  if (rawText.trim().length === 0) {
    return {
      request: normalizedRequest,
      body: undefined,
    };
  }

  let body: unknown;
  try {
    body = JSON.parse(rawText);
  } catch {
    throw new Error('INVALID_JSON');
  }

  if (!validateJsonDepth(body, env.MCP_MAX_JSON_DEPTH)) {
    throw new Error('JSON_TOO_DEEP');
  }

  return {
    request: normalizedRequest,
    body,
  };
}

async function closeSession(sessionId: string): Promise<void> {
  const session = sessions.get(sessionId);
  if (!session) {
    return;
  }

  sessions.delete(sessionId);

  try {
    await session.transport.close();
  } catch {
    // ignore cleanup errors
  }

  try {
    await session.server.close();
  } catch {
    // ignore cleanup errors
  }
}

function getErrorResponse(request: Request, error: unknown): Response {
  if (error instanceof Error) {
    switch (error.message) {
      case 'REQUEST_TOO_LARGE':
        return jsonResponse(request, 413, {
          jsonrpc: '2.0',
          error: { code: -32001, message: 'Request exceeds the 10MB MCP limit.' },
          id: null,
        });
      case 'INVALID_JSON':
        return jsonResponse(request, 400, {
          jsonrpc: '2.0',
          error: { code: -32700, message: 'Invalid JSON body.' },
          id: null,
        });
      case 'JSON_TOO_DEEP':
        return jsonResponse(request, 400, {
          jsonrpc: '2.0',
          error: { code: -32002, message: 'Request JSON exceeds the maximum nesting depth.' },
          id: null,
        });
      default:
        break;
    }
  }

  return jsonResponse(request, 500, {
    jsonrpc: '2.0',
    error: { code: -32603, message: 'Internal server error' },
    id: null,
  });
}

async function createSessionTransport(): Promise<HttpSession> {
  const server = createServerInstance();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { server, transport });
    },
    onsessionclosed: (sessionId) => {
      sessions.delete(sessionId);
    },
  });

  transport.onerror = (error) => {
    console.error('[MCP HTTP] Transport error:', error);
  };

  await server.connect(transport);

  return { server, transport };
}

export async function handlePost(request: Request): Promise<Response> {
  try {
    if (!isOriginAllowed(request.headers.get('origin'))) {
      return jsonResponse(request, 403, {
        jsonrpc: '2.0',
        error: { code: -32003, message: 'Origin not allowed.' },
        id: null,
      });
    }

    const { request: normalizedRequest, body } = await parseRequestBody(request);
    const authGuardResponse = await guardHttpAuthorization(request, body);
    if (authGuardResponse) {
      return authGuardResponse;
    }

    const sessionId = normalizedRequest.headers.get('mcp-session-id');
    let session: HttpSession | undefined;

    if (sessionId) {
      session = sessions.get(sessionId);
      if (!session) {
        return jsonResponse(request, 400, {
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Invalid or expired session ID.' },
          id: null,
        });
      }
    } else {
      if (!isInitializeRequest(body)) {
        return jsonResponse(request, 400, {
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'No valid session ID provided. Send an initialize request first.',
          },
          id: null,
        });
      }

      session = await createSessionTransport();
    }

    const response = await session.transport.handleRequest(normalizedRequest, {
      parsedBody: body,
    });

    if (!sessionId && !session.transport.sessionId) {
      await session.transport.close().catch(() => undefined);
      await session.server.close().catch(() => undefined);
    }

    return applyCorsHeaders(request, response);
  } catch (error) {
    console.error('[MCP HTTP] Error handling POST:', error);
    return getErrorResponse(request, error);
  }
}

export async function handleGet(request: Request): Promise<Response> {
  if (!isOriginAllowed(request.headers.get('origin'))) {
    return jsonResponse(request, 403, {
      jsonrpc: '2.0',
      error: { code: -32003, message: 'Origin not allowed.' },
      id: null,
    });
  }

  const sessionId = request.headers.get('mcp-session-id');
  if (!sessionId) {
    const env = validateMcpEnv();
    const endpoint = new URL(request.url).pathname;
    return jsonResponse(request, 200, {
      name: env.MCP_SERVER_NAME,
      version: env.MCP_SERVER_VERSION,
      protocol_version: MCP_PROTOCOL_VERSION,
      endpoint,
      primary_endpoint: '/mcp',
      legacy_endpoint: '/api/mcp',
      capabilities: ['tools', 'resources', 'logging'],
      transports: ['streamable-http'],
    });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return jsonResponse(request, 400, {
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Invalid or expired session ID.' },
      id: null,
    });
  }

  const normalizedRequest = normalizeRequestHeaders(request);
  const response = await session.transport.handleRequest(normalizedRequest);

  return applyCorsHeaders(request, response);
}

export async function handleDelete(request: Request): Promise<Response> {
  try {
    if (!isOriginAllowed(request.headers.get('origin'))) {
      return jsonResponse(request, 403, {
        jsonrpc: '2.0',
        error: { code: -32003, message: 'Origin not allowed.' },
        id: null,
      });
    }

    const sessionId = request.headers.get('mcp-session-id');
    if (!sessionId) {
      return applyCorsHeaders(request, new Response(null, { status: 204 }));
    }

    await closeSession(sessionId);
    return applyCorsHeaders(request, new Response(null, { status: 204 }));
  } catch (error) {
    console.error('[MCP HTTP] Error handling DELETE:', error);
    return getErrorResponse(request, error);
  }
}

export async function handleOptions(request: Request): Promise<Response> {
  if (!isOriginAllowed(request.headers.get('origin'))) {
    return jsonResponse(request, 403, { error: 'Origin not allowed.' });
  }

  return applyCorsHeaders(request, new Response(null, { status: 204 }));
}
