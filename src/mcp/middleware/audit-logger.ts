/**
 * MCP Middleware — Audit Logger
 *
 * Structured logging for every MCP tool invocation.
 * All logs go to stderr (stdout is reserved for MCP protocol in stdio transport).
 */

import { randomUUID } from 'crypto';

export interface AuditLogEntry {
  timestamp: string;
  trace_id: string;
  user_id: string;
  tool_name: string;
  tool_input?: unknown;
  status: 'success' | 'error';
  latency_ms: number;
  transport: 'stdio' | 'http';
  client_info?: string;
  session_id?: string;
  request_id?: string;
  request_size_bytes?: number;
  response_size_bytes?: number;
  auth_method?: string;
  oauth_client_id?: string;
  scope_count?: number;
  operation?: string;
  reads_user_data?: boolean;
  writes_user_data?: boolean;
  destructive?: boolean;
  creates_public_url?: boolean;
  error_code?: string;
}

const SENSITIVE_KEY_PATTERN = /(authorization|api[-_]?key|token|secret|password|cookie|keyhash)/i;
const USER_CONTENT_KEY_PATTERN = /(slides|content|html|prompt|additional_context|speaker_notes|notes|transcript)/i;

function truncateString(value: string, maxLength = 180): string {
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

export function sanitizeForAudit(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'string') {
    return truncateString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return {
      item_count: value.length,
      sample: value.slice(0, 5).map((item) => sanitizeForAudit(item)),
      truncated: value.length > 5,
    };
  }

  if (typeof value === 'object') {
    const sanitizedEntries = Object.entries(value as Record<string, unknown>)
      .slice(0, 20)
      .map(([key, entryValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key)
          ? '[REDACTED_SECRET]'
          : USER_CONTENT_KEY_PATTERN.test(key)
            ? '[REDACTED_USER_CONTENT]'
            : sanitizeForAudit(entryValue),
      ]);

    return {
      ...Object.fromEntries(sanitizedEntries),
      ...(Object.keys(value as Record<string, unknown>).length > 20
        ? { truncated_keys: true }
        : {}),
    };
  }

  return String(value);
}

export function estimateResponseSizeBytes(toolOutput?: unknown): number | undefined {
  if (!toolOutput) {
    return undefined;
  }

  try {
    return Buffer.byteLength(JSON.stringify(toolOutput), 'utf8');
  } catch {
    return undefined;
  }
}

function extractErrorCode(status: AuditLogEntry['status'], toolOutput?: unknown): string | undefined {
  if (status !== 'error' || !toolOutput || typeof toolOutput !== 'object') {
    return undefined;
  }

  const response = toolOutput as { content?: Array<{ text?: string }> };
  const payloadText = response.content?.[0]?.text;
  if (!payloadText) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(payloadText) as {
      error?: { code?: string };
    };
    return parsed.error?.code;
  } catch {
    return undefined;
  }
}

/**
 * Create a new trace ID for request correlation.
 */
export function createTraceId(): string {
  return randomUUID();
}

/**
 * Log an audit entry as structured JSON to stderr.
 */
export function logAuditEntry(entry: AuditLogEntry, toolOutput?: unknown): void {
  const log = {
    level: entry.status === 'error' ? 'error' : 'info',
    component: 'mcp',
    event: 'tool_invocation',
    ...entry,
    tool_input: sanitizeForAudit(entry.tool_input),
    error_code: entry.error_code ?? extractErrorCode(entry.status, toolOutput),
  };

  console.error(JSON.stringify(log));
}

/**
 * Measure execution time helper.
 */
export function createTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}
