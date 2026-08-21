import type {
  McpUiResourceMeta,
  McpUiToolMeta,
} from '@modelcontextprotocol/ext-apps';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';

export const MCP_APP_UI_RESOURCE_URIS = {
  PRESENTATION_LIST: 'ui://verto/presentation-list.html',
  GENERATION_PROGRESS: 'ui://verto/generation-progress.html',
  DECK_PREVIEW: 'ui://verto/deck-preview.html',
  ACTION_RESULT: 'ui://verto/action-result.html',
} as const;

/**
 * MCP Apps UI resource MIME type, re-exported from the SDK so all server
 * code shares one constant (`text/html;profile=mcp-app`).
 */
export const MCP_APP_UI_MIME_TYPE = RESOURCE_MIME_TYPE;

export type McpAppUiResourceUri =
  (typeof MCP_APP_UI_RESOURCE_URIS)[keyof typeof MCP_APP_UI_RESOURCE_URIS];

interface ToolUiMetaOptions {
  appCallable?: boolean;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Optional dedicated sandbox origin for the widget iframe.
 *
 * Only an explicit `MCP_APP_WIDGET_DOMAIN` is honoured. When unset, hosts
 * assign their own sandbox origin — the Next.js app URL is NOT a valid
 * widget domain.
 */
function getWidgetDomain(): string | undefined {
  const configured = process.env.MCP_APP_WIDGET_DOMAIN?.trim();
  return configured ? stripTrailingSlash(configured) : undefined;
}

/**
 * Tool `_meta` for MCP Apps. Emits only spec keys:
 * `ui.resourceUri` + `ui.visibility` (`['model', 'app']` when the widget
 * may call the tool, otherwise model-only).
 */
export function createToolUiMeta(
  resourceUri?: McpAppUiResourceUri,
  options: ToolUiMetaOptions = {}
): { ui: McpUiToolMeta } {
  const appCallable = Boolean(options.appCallable);

  return {
    ui: {
      ...(resourceUri ? { resourceUri } : {}),
      visibility: appCallable ? ['model', 'app'] : ['model'],
    },
  };
}

/**
 * Content-item `_meta.ui` for MCP Apps UI resources. Widgets are fully
 * self-contained single-file HTML documents, so no external CSP domains are
 * required; a dedicated domain is added only when explicitly configured.
 */
export function createUiResourceContentMeta(): { ui: McpUiResourceMeta } {
  const domain = getWidgetDomain();

  return {
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: [],
        resourceDomains: [],
      },
      ...(domain ? { domain } : {}),
    },
  };
}
