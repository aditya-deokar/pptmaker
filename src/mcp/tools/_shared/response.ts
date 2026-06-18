/**
 * MCP Standard Response Builders
 *
 * Every tool handler uses these to build consistent, MCP-compliant responses.
 * Responses are serialized as JSON text content blocks.
 */

import { z } from 'zod';
import type { PaginationMeta } from './pagination';
import type { McpAppWidgetData } from '../../apps/widget-data';

interface McpSuccessOptions {
  widget?: McpAppWidgetData;
}

export const MCP_SUCCESS_OUTPUT_SCHEMA = {
  success: z.boolean(),
  data: z.any(),
  widget: z.any().optional(),
  pagination: z.any().optional(),
} as const;

/**
 * Standard MCP tool response type.
 */
export interface McpToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
  _meta?: Record<string, unknown>;
}

/**
 * Build a success response with data.
 */
export function mcpSuccess(
  data: unknown,
  options?: McpSuccessOptions
): McpToolResponse {
  return {
    structuredContent: {
      success: true,
      data,
      ...(options?.widget ? { widget: options.widget } : {}),
    },
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, data }, null, 0),
      },
    ],
  };
}

/**
 * Build a paginated success response.
 */
export function mcpPaginated(
  data: unknown[],
  pagination: PaginationMeta
): McpToolResponse {
  return {
    structuredContent: {
      success: true,
      data,
      pagination,
    },
    content: [
      {
        type: 'text',
        text: JSON.stringify({ success: true, data, pagination }, null, 0),
      },
    ],
  };
}

/**
 * Build an error response with code, message, and optional suggestion.
 * The `isError: true` flag signals to the MCP client that this is an error.
 */
export function mcpError(
  code: string,
  message: string,
  suggestion?: string,
  details?: Record<string, unknown>,
  meta?: Record<string, unknown>
): McpToolResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: { code, message, ...(suggestion ? { suggestion } : {}), ...(details ?? {}) },
        }),
      },
    ],
    isError: true,
    ...(meta ? { _meta: meta } : {}),
  };
}
