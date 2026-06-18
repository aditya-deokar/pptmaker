export const MCP_APP_UI_RESOURCE_URIS = {
  GENERATION_PROGRESS: 'ui://verto/generation-progress.html',
  DECK_PREVIEW: 'ui://verto/deck-preview.html',
} as const;

export const MCP_APP_UI_MIME_TYPE = 'text/html;profile=mcp-app';

const FALLBACK_WIDGET_DOMAIN = 'https://verto.ai.aditya-deokar.me';

export type McpAppUiResourceUri =
  (typeof MCP_APP_UI_RESOURCE_URIS)[keyof typeof MCP_APP_UI_RESOURCE_URIS];

interface ToolUiMetaOptions {
  appCallable?: boolean;
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function getWidgetDomain(): string {
  return stripTrailingSlash(
    process.env.MCP_APP_WIDGET_DOMAIN
      || process.env.NEXT_PUBLIC_APP_URL
      || FALLBACK_WIDGET_DOMAIN
  );
}

export function createToolUiMeta(
  resourceUri?: McpAppUiResourceUri,
  options: ToolUiMetaOptions = {}
) {
  const appCallable = Boolean(options.appCallable);

  return {
    ...(resourceUri
      ? {
          'ui/resourceUri': resourceUri,
          'openai/outputTemplate': resourceUri,
          'openai/toolInvocation/invoking': 'Preparing Verto view',
          'openai/toolInvocation/invoked': 'Verto view ready',
        }
      : {}),
    'openai/widgetAccessible': appCallable,
    ui: {
      ...(resourceUri ? { resourceUri } : {}),
      visibility: appCallable ? ['model', 'app'] : ['model'],
    },
  };
}

export function createUiResourceContentMeta(description: string) {
  const domain = getWidgetDomain();

  return {
    ui: {
      prefersBorder: true,
      domain,
      csp: {
        connectDomains: [],
        resourceDomains: [],
      },
    },
    'ui/csp': {
      connect_domains: [],
      resource_domains: [],
    },
    'openai/widgetCSP': {
      connect_domains: [],
      resource_domains: [],
      redirect_domains: [domain],
    },
    'openai/widgetDescription': description,
    'openai/widgetPrefersBorder': true,
    'openai/widgetDomain': domain,
  };
}

export function createUiResourceMeta(description: string) {
  return {
    description,
    mimeType: MCP_APP_UI_MIME_TYPE,
    _meta: createUiResourceContentMeta(description),
  };
}
