/**
 * MCP Middleware — Error Handler
 *
 * Global error boundary that wraps every tool handler.
 * Catches unhandled exceptions, logs them, and returns sanitized errors.
 */

import type { McpToolResponse } from '../tools/_shared/response';
import { Errors } from '../tools/_shared/errors';
import {
  logAuditEntry,
  createTimer,
  createTraceId,
  estimateResponseSizeBytes,
} from './audit-logger';
import type { AuthContext } from '../auth/types';
import type { TransportType } from '../auth/middleware';
import type { McpRequestContext } from './request-context';
import { acquireRateLimit } from './rate-limiter';
import { getToolSecurityPolicy } from '../security/tool-policy';

/**
 * Tool handler function signature.
 */
export type ToolHandler<TArgs = Record<string, unknown>> = (
  args: TArgs,
  auth: AuthContext,
  context?: McpRequestContext
) => Promise<McpToolResponse>;

/**
 * Wrap a tool handler with error boundary + audit logging.
 *
 * Usage:
 *   const safeHandler = withErrorBoundary('presentation_list', handler, 'http');
 */
export function withErrorBoundary<TArgs = Record<string, unknown>>(
  toolName: string,
  handler: ToolHandler<TArgs>,
  transport: TransportType,
  requestContext?: McpRequestContext
): (args: TArgs, auth: AuthContext) => Promise<McpToolResponse> {
  return async (args: TArgs, auth: AuthContext): Promise<McpToolResponse> => {
    const timer = createTimer();
    const traceId = createTraceId();
    const executionContext: McpRequestContext = {
      transport,
      ...requestContext,
      traceId,
    };
    const rateLimit = acquireRateLimit(auth);
    const toolPolicy = getToolSecurityPolicy(toolName);
    const baseAuditFields = {
      auth_method: auth.authMethod,
      oauth_client_id: auth.clientId,
      scope_count: auth.scopes.length,
      operation: toolPolicy.operation,
      reads_user_data: toolPolicy.readsUserData,
      writes_user_data: toolPolicy.writesUserData,
      destructive: toolPolicy.destructive,
      creates_public_url: toolPolicy.createsPublicUrl,
    };

    if (!rateLimit.ok) {
      const result = Errors.rateLimited(rateLimit.retryAfterSeconds ?? 1, {
        limit: rateLimit.limit,
        remaining: rateLimit.remaining,
        reset_after_seconds: rateLimit.resetAfterSeconds,
      });

      logAuditEntry(
        {
          timestamp: new Date().toISOString(),
          trace_id: traceId,
          user_id: auth.userId,
          tool_name: toolName,
          tool_input: args,
          status: 'error',
          latency_ms: timer(),
          transport,
          client_info: executionContext.clientInfo,
          session_id: executionContext.sessionId,
          request_id: executionContext.requestId,
          request_size_bytes: executionContext.requestSizeBytes,
          response_size_bytes: estimateResponseSizeBytes(result),
          ...baseAuditFields,
          error_code: 'RATE_LIMITED',
        },
        result
      );

      return result;
    }

    try {
      const result = await handler(args, auth, executionContext);

      logAuditEntry(
        {
          timestamp: new Date().toISOString(),
          trace_id: traceId,
          user_id: auth.userId,
          tool_name: toolName,
          tool_input: args,
          status: result.isError ? 'error' : 'success',
          latency_ms: timer(),
          transport,
          client_info: executionContext.clientInfo,
          session_id: executionContext.sessionId,
          request_id: executionContext.requestId,
          request_size_bytes: executionContext.requestSizeBytes,
          response_size_bytes: estimateResponseSizeBytes(result),
          ...baseAuditFields,
        },
        result
      );

      return result;
    } catch (error) {
      const latencyMs = timer();

      console.error(`[MCP] Unhandled error in ${toolName}:`, error);

      const result = Errors.internal();

      logAuditEntry(
        {
          timestamp: new Date().toISOString(),
          trace_id: traceId,
          user_id: auth.userId,
          tool_name: toolName,
          tool_input: args,
          status: 'error',
          latency_ms: latencyMs,
          transport,
          client_info: executionContext.clientInfo,
          session_id: executionContext.sessionId,
          request_id: executionContext.requestId,
          request_size_bytes: executionContext.requestSizeBytes,
          response_size_bytes: estimateResponseSizeBytes(result),
          ...baseAuditFields,
          error_code: 'INTERNAL_ERROR',
        },
        result
      );

      return result;
    } finally {
      rateLimit.release?.();
    }
  };
}
