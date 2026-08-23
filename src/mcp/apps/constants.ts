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
  DECK_LIVE: 'ui://verto/deck-live.html',
  THEME_STUDIO: 'ui://verto/theme-studio.html',
  PUBLISH_CARD: 'ui://verto/publish-card.html',
} as const;

/**
 * W1 (plan 10): slide image origins observed in generated decks. The image
 * providers emit `images.unsplash.com` / `plus.unsplash.com` URLs and a
 * legacy `via.placeholder.com` fallback; Gemini-generated images are inline
 * data URLs (no origin). These are allowlisted as CSP `resourceDomains` for
 * the deck-rendering widgets only.
 */
export const SLIDE_IMAGE_RESOURCE_DOMAINS = [
  'images.unsplash.com',
  'plus.unsplash.com',
  'via.placeholder.com',
] as const;

/**
 * MCP Apps UI resource MIME type, re-exported from the SDK so all server
 * code shares one constant (`text/html;profile=mcp-app`).
 */
export const MCP_APP_UI_MIME_TYPE = RESOURCE_MIME_TYPE;

export type McpAppUiResourceUri =
  (typeof MCP_APP_UI_RESOURCE_URIS)[keyof typeof MCP_APP_UI_RESOURCE_URIS];

interface ToolUiMetaOptions {
  appCallable?: boolean;
  /** Restrict the tool to app visibility only (never surfaced to the model). */
  appOnly?: boolean;
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
      // The ternary below is asserted verbatim by scripts/mcp-apps/phase7-checks.mjs.
      ...(options.appOnly
        ? { visibility: ['app'] }
        : { visibility: appCallable ? ['model', 'app'] : ['model'] }),
    },
  };
}

/**
 * Content-item `_meta.ui` for MCP Apps UI resources. Widgets are fully
 * self-contained single-file HTML documents; deck-rendering widgets pass
 * `extraResourceDomains` (W1) to allow slide image origins.
 */
export function createUiResourceContentMeta(options: {
  extraResourceDomains?: readonly string[];
  /** Declare sandbox clipboard-write permission (publish card Copy button). */
  clipboardWrite?: boolean;
} = {}): { ui: McpUiResourceMeta } {
  const domain = getWidgetDomain();

  return {
    ui: {
      prefersBorder: true,
      csp: {
        connectDomains: [],
        resourceDomains: options.extraResourceDomains
          ? [...options.extraResourceDomains]
          : [],
      },
      ...(options.clipboardWrite ? { permissions: { clipboardWrite: {} } } : {}),
      ...(domain ? { domain } : {}),
    },
  };
}
