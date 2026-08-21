/**
 * MCP Presentation Tools - Plugin Registration
 *
 * Registers all presentation-domain tools with shared auth, audit,
 * and rate-limit middleware.
 */

import { z } from 'zod';
import type {
  McpServer,
  ToolCallback,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {
  AnySchema,
  ZodRawShapeCompat,
} from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';
import {
  createToolUiMeta,
  MCP_APP_UI_RESOURCE_URIS,
  type McpAppUiResourceUri,
} from '../../apps/constants';
import { registerToolPlugin } from '../registry';
import { MCP_SUCCESS_OUTPUT_SCHEMA } from '../_shared/response';
import { TOOL_NAMES, PAGINATION, LIMITS } from '../../config/constants';
import { Errors } from '../_shared/errors';
import { resolveAuth, type TransportType } from '../../auth/middleware';
import { buildWwwAuthenticateChallenge } from '../../auth/oauth-config';
import {
  getRequiredScopesForTool,
  hasRequiredScopes,
} from '../../auth/scopes';
import { withErrorBoundary, type ToolHandler } from '../../middleware/error-handler';
import {
  createRequestContext,
  type McpRequestExtra,
} from '../../middleware/request-context';
import { createTraceId, logAuditEntry } from '../../middleware/audit-logger';
import { getCurrentTransport, setCurrentTransport } from '../../lib/transport-context';

import { handlePresentationList } from './list';
import { handlePresentationGet } from './get';
import { handlePresentationCreate } from './create';
import { handlePresentationDelete } from './delete';
import { handlePresentationRecover } from './recover';
import { handlePresentationDeletePermanently } from './delete-permanently';
import { handlePresentationUpdateSlides } from './update-slides';
import { handlePresentationUpdateTheme } from './update-theme';
import { handlePresentationPublish } from './publish';
import { handlePresentationUnpublish } from './unpublish';
import { handlePresentationGenerate } from './generate';
import { handlePresentationGenerationStatus } from './generation-status';

interface PresentationToolMetadata {
  title: string;
  annotations: ToolAnnotations;
  uiResourceUri?: McpAppUiResourceUri;
  appCallable?: boolean;
}

const PRESENTATION_TOOL_METADATA: Record<
  (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES],
  PresentationToolMetadata
> = {
  [TOOL_NAMES.PRESENTATION_LIST]: {
    title: 'List presentations',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.PRESENTATION_LIST,
    appCallable: true,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_GET]: {
    title: 'Get presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.DECK_PREVIEW,
    appCallable: true,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_CREATE]: {
    title: 'Create presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_DELETE]: {
    title: 'Soft-delete presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_RECOVER]: {
    title: 'Recover presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_DELETE_PERMANENTLY]: {
    title: 'Permanently delete presentations',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_UPDATE_SLIDES]: {
    title: 'Replace presentation slides',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_UPDATE_THEME]: {
    title: 'Update presentation theme',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_PUBLISH]: {
    title: 'Publish presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    appCallable: true,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  [TOOL_NAMES.PRESENTATION_UNPUBLISH]: {
    title: 'Unpublish presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  [TOOL_NAMES.PRESENTATION_GENERATE]: {
    title: 'Generate presentation',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  [TOOL_NAMES.PRESENTATION_GENERATION_STATUS]: {
    title: 'Get generation status',
    uiResourceUri: MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
    appCallable: true,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
};

/**
 * Callback type exactly as `registerAppTool` expects it: the SDK helper
 * resolves its `InputArgs` through a conditional before handing it to
 * `ToolCallback`, so the mirror conditional must appear in the cast too.
 */
type AppToolCallback<TInputSchema extends Record<string, z.ZodTypeAny> & ZodRawShapeCompat> =
  ToolCallback<
    TInputSchema extends undefined | ZodRawShapeCompat | AnySchema
      ? TInputSchema
      : AnySchema
  >;

function registerPresentationTool<
  TInputSchema extends Record<string, z.ZodTypeAny> & ZodRawShapeCompat
>(
  server: McpServer,
  toolName: (typeof TOOL_NAMES)[keyof typeof TOOL_NAMES],
  description: string,
  inputSchema: TInputSchema,
  handler: ToolHandler<z.infer<z.ZodObject<TInputSchema>>>
): void {
  const metadata = PRESENTATION_TOOL_METADATA[toolName];
  const callback = createToolCallback<z.infer<z.ZodObject<TInputSchema>>>(
    toolName,
    handler
  ) as AppToolCallback<TInputSchema>;

  registerAppTool(
    server,
    toolName,
    {
      title: metadata.title,
      description,
      inputSchema,
      outputSchema: MCP_SUCCESS_OUTPUT_SCHEMA,
      annotations: metadata.annotations,
      _meta: createToolUiMeta(metadata.uiResourceUri, {
        appCallable: metadata.appCallable,
      }),
    },
    callback
  );
}

function resolveToolTransport(): TransportType {
  return getCurrentTransport();
}

export function setTransportType(transport: TransportType): void {
  setCurrentTransport(transport);
}

function createToolCallback<TArgs>(
  toolName: string,
  handler: ToolHandler<TArgs>
) {
  return async (args: TArgs, extra: McpRequestExtra) => {
    const transport = resolveToolTransport();
    const requestContext = createRequestContext(transport, extra, args);
    const auth = await resolveAuth(transport, requestContext.headers);
    const requiredScopes = getRequiredScopesForTool(toolName);

    if (!auth) {
      const result = Errors.unauthorized(
        buildWwwAuthenticateChallenge({
          scopes: requiredScopes,
          error: 'invalid_token',
          errorDescription: 'Sign in to Verto AI or reconnect this app.',
        })
      );
      logAuditEntry(
        {
          timestamp: new Date().toISOString(),
          trace_id: createTraceId(),
          user_id: 'anonymous',
          tool_name: toolName,
          tool_input: args,
          status: 'error',
          latency_ms: 0,
          transport,
          client_info: requestContext.clientInfo,
          session_id: requestContext.sessionId,
          request_id: requestContext.requestId,
          request_size_bytes: requestContext.requestSizeBytes,
          error_code: 'UNAUTHORIZED',
        },
        result
      );
      return result;
    }

    if (!hasRequiredScopes(auth, requiredScopes)) {
      const result = Errors.insufficientScope(
        requiredScopes,
        buildWwwAuthenticateChallenge({
          scopes: requiredScopes,
          error: 'insufficient_scope',
          errorDescription: 'Reconnect Verto AI and grant the required scope.',
        })
      );
      logAuditEntry(
        {
          timestamp: new Date().toISOString(),
          trace_id: createTraceId(),
          user_id: auth.userId,
          tool_name: toolName,
          tool_input: args,
          status: 'error',
          latency_ms: 0,
          transport,
          client_info: requestContext.clientInfo,
          session_id: requestContext.sessionId,
          request_id: requestContext.requestId,
          request_size_bytes: requestContext.requestSizeBytes,
          error_code: 'INSUFFICIENT_SCOPE',
        },
        result
      );
      return result;
    }

    const wrapped = withErrorBoundary(
      toolName,
      handler,
      transport,
      requestContext
    );

    return wrapped(args, auth);
  };
}

function registerPresentationTools(server: McpServer): void {
  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_LIST,
    'List all presentations owned by the authenticated user. Returns metadata only (no slide content) for token efficiency. Supports cursor-based pagination, sorting, and optional inclusion of soft-deleted items.',
    {
      cursor: z.string().optional()
        .describe('Pagination cursor from a previous response. Omit for the first page.'),
      limit: z.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE)
        .describe(`Number of presentations per page. Default: ${PAGINATION.DEFAULT_PAGE_SIZE}, Max: ${PAGINATION.MAX_PAGE_SIZE}.`),
      include_deleted: z.boolean().default(false)
        .describe('If true, also returns soft-deleted presentations.'),
      sort_by: z.enum(['updated_at', 'created_at', 'title']).default('updated_at')
        .describe('Field to sort results by.'),
      sort_order: z.enum(['asc', 'desc']).default('desc')
        .describe('Sort direction.'),
    },
    handlePresentationList
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_GET,
    'Get a single presentation by ID. Returns full metadata and optionally the complete slide JSON. Set include_slides to false for metadata-only (saves tokens).',
    {
      presentation_id: z.string().min(1)
        .describe('The unique identifier of the presentation (cuid format).'),
      include_slides: z.boolean().default(true)
        .describe('If true, includes the full slide JSON content. Set to false for metadata-only.'),
    },
    handlePresentationGet
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_CREATE,
    'Create a new presentation with a title and slide outlines. Each outline becomes a slide placeholder. Returns the created presentation with metadata. Usage limits are enforced.',
    {
      title: z.string().min(1).max(LIMITS.MAX_TITLE_LENGTH)
        .describe('The title of the new presentation.'),
      outlines: z.array(
        z.object({
          title: z.string().min(1).max(LIMITS.MAX_TITLE_LENGTH),
          order: z.number().int().min(0),
        })
      ).min(1).max(LIMITS.MAX_OUTLINES)
        .describe('Slide outline cards. Each has a title and display order.'),
      request_id: z.string().uuid().optional()
        .describe('Client-generated UUID for idempotent creation.'),
    },
    handlePresentationCreate
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_DELETE,
    'Soft-delete a presentation. The presentation can be recovered later using presentation_recover. Idempotent: calling on an already-deleted presentation returns success.',
    {
      presentation_id: z.string().min(1)
        .describe('ID of the presentation to soft-delete.'),
    },
    handlePresentationDelete
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_RECOVER,
    'Recover a soft-deleted presentation, restoring it to active status. Idempotent: calling on an active presentation returns success.',
    {
      presentation_id: z.string().min(1)
        .describe('ID of the soft-deleted presentation to recover.'),
    },
    handlePresentationRecover
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_DELETE_PERMANENTLY,
    'PERMANENTLY delete presentations from the database. This action CANNOT be undone. Requires confirm: true to proceed. Only deletes presentations you own. Maximum 20 IDs per call.',
    {
      presentation_ids: z.array(z.string().min(1)).min(1).max(LIMITS.MAX_PERMANENT_DELETE_BATCH)
        .describe('Array of presentation IDs to permanently delete.'),
      confirm: z.literal(true)
        .describe('Must be exactly true to confirm permanent deletion. Prevents accidental data loss.'),
    },
    handlePresentationDeletePermanently
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_UPDATE_SLIDES,
    'Replace ALL slides in a presentation with the provided Slide[] array. This is a FULL REPLACEMENT - not a patch. Always use presentation_get first to read current slides, modify the array, then call this tool with the complete updated array.',
    {
      presentation_id: z.string().min(1)
        .describe('The unique identifier of the presentation to update.'),
      slides: z.array(z.object({
        id: z.string(),
        slideName: z.string(),
        type: z.string(),
        content: z.any(),
        slideOrder: z.number().optional(),
        className: z.string().optional(),
      })).describe('The complete Slide[] array. Replaces all existing slides.'),
    },
    handlePresentationUpdateSlides
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_UPDATE_THEME,
    "Change the visual theme of a presentation. Use the 'verto://themes' resource to browse valid theme names before calling this tool.",
    {
      presentation_id: z.string().min(1)
        .describe('The unique identifier of the presentation to update.'),
      theme_name: z.string().min(1)
        .describe("Name of the theme to apply. Use the 'verto://themes' resource for valid names."),
    },
    handlePresentationUpdateTheme
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_PUBLISH,
    'Make a presentation publicly shareable via a unique share URL. Idempotent: calling on an already-published presentation returns the existing share URL.',
    {
      presentation_id: z.string().min(1)
        .describe('ID of the presentation to publish.'),
    },
    handlePresentationPublish
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_UNPUBLISH,
    'Remove public access from a presentation. The share URL will no longer work. Idempotent: calling on an already-unpublished presentation returns success.',
    {
      presentation_id: z.string().min(1)
        .describe('ID of the presentation to unpublish.'),
    },
    handlePresentationUnpublish
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_GENERATE,
    'Generate a presentation with Verto AI using the advanced multi-agent pipeline. Creates a tracked generation run, waits for completion up to the configured timeout, and returns either the completed presentation or a RUNNING status with a progress resource URI.',
    {
      topic: z.string().min(1).max(LIMITS.MAX_TOPIC_LENGTH)
        .describe('Topic for the AI to generate a presentation about. Be descriptive for better results.'),
      additional_context: z.string().max(LIMITS.MAX_ADDITIONAL_CONTEXT_LENGTH).optional()
        .describe('Optional additional instructions to guide generation.'),
      theme_preference: z.string().default('Default')
        .describe('Preferred visual theme for the generated presentation.'),
      outlines: z.array(z.string().min(1).max(LIMITS.MAX_TITLE_LENGTH)).max(LIMITS.MAX_OUTLINES).optional()
        .describe('Optional pre-defined slide outlines. If omitted, AI generates outlines automatically.'),
      wait_timeout_ms: z.number().int().min(1000).max(LIMITS.GENERATION_TIMEOUT_MS).optional()
        .describe(`How long to wait for completion before returning RUNNING. Defaults to ${LIMITS.GENERATION_DEFAULT_WAIT_TIMEOUT_MS} ms and maxes at ${LIMITS.GENERATION_TIMEOUT_MS} ms.`),
    },
    handlePresentationGenerate
  );

  registerPresentationTool(
    server,
    TOOL_NAMES.PRESENTATION_GENERATION_STATUS,
    'Get the current status of a tracked presentation generation run. Use this after presentation_generate returns RUNNING instead of starting a duplicate generation.',
    {
      generation_run_id: z.string().min(1)
        .describe('Generation run ID returned by presentation_generate.'),
    },
    handlePresentationGenerationStatus
  );

  console.error('[MCP] Presentation plugin: 12 tools registered (3 read, 8 mutation, 1 generation)');
}

registerToolPlugin({
  name: 'presentation',
  register: registerPresentationTools,
});
