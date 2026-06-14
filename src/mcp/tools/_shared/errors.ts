/**
 * MCP Typed Error Factories
 *
 * Pre-built error constructors for common scenarios.
 * Provides consistent error messages with actionable suggestions for LLMs.
 */

import { ERROR_CODES } from '../../config/constants';
import { mcpError, type McpToolResponse } from './response';

/**
 * Error factory — provides ready-made error responses for common cases.
 * LLM-friendly: every error includes a suggestion for what to do next.
 */
export const Errors = {
  unauthorized(wwwAuthenticate?: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.UNAUTHORIZED,
      'Authentication required. Provide a valid API key or sign in.',
      undefined,
      undefined,
      wwwAuthenticate
        ? { 'mcp/www_authenticate': wwwAuthenticate }
        : undefined,
    );
  },

  forbidden(resource = 'resource', wwwAuthenticate?: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.FORBIDDEN,
      `You do not have permission to access this ${resource}.`,
      `Verify the ${resource} ID and ensure you are the owner.`,
      undefined,
      wwwAuthenticate
        ? { 'mcp/www_authenticate': wwwAuthenticate }
        : undefined,
    );
  },

  insufficientScope(requiredScopes: readonly string[], wwwAuthenticate?: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.FORBIDDEN,
      `This OAuth connection needs the following scope: ${requiredScopes.join(' ')}.`,
      'Reconnect Verto AI and grant the requested permission.',
      { required_scopes: requiredScopes },
      wwwAuthenticate
        ? { 'mcp/www_authenticate': wwwAuthenticate }
        : undefined,
    );
  },

  notFound(resource: string, id: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.NOT_FOUND,
      `${resource} with ID '${id}' was not found.`,
      `Use presentation_list to browse valid ${resource.toLowerCase()} IDs.`,
    );
  },

  validationError(message: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.VALIDATION_ERROR,
      message,
      'Check the tool input schema for required fields and constraints.',
    );
  },

  rateLimited(retryAfterSeconds: number): McpToolResponse {
    return mcpError(
      ERROR_CODES.RATE_LIMITED,
      `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
      `Wait ${retryAfterSeconds} seconds before making another request.`,
      { retry_after_seconds: retryAfterSeconds },
    );
  },

  usageLimitExceeded(usage: number, limit: number): McpToolResponse {
    return mcpError(
      ERROR_CODES.USAGE_LIMIT_EXCEEDED,
      `Usage limit reached (${usage}/${limit}). Upgrade your plan or add an API key to continue.`,
      'Upgrade to Pro for higher limits, or add your own AI API key.',
    );
  },

  generationFailed(detail?: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.GENERATION_FAILED,
      `Presentation generation failed.${detail ? ` ${detail}` : ''}`,
      'Try again with a different topic or simplified outlines.',
    );
  },

  internal(detail?: string): McpToolResponse {
    return mcpError(
      ERROR_CODES.INTERNAL_ERROR,
      'An unexpected error occurred. The Verto AI team has been notified.',
      detail ?? 'Try again. If the issue persists, contact support.',
    );
  },
} as const;
