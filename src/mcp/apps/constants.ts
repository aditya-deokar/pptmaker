export const MCP_APP_UI_RESOURCE_URIS = {
  GENERATION_PROGRESS: 'ui://verto/generation-progress.html',
  DECK_PREVIEW: 'ui://verto/deck-preview.html',
} as const;

export type McpAppUiResourceUri =
  (typeof MCP_APP_UI_RESOURCE_URIS)[keyof typeof MCP_APP_UI_RESOURCE_URIS];

export function createToolUiMeta(resourceUri?: McpAppUiResourceUri) {
  if (!resourceUri) {
    return undefined;
  }

  return {
    'ui/resourceUri': resourceUri,
    'openai/outputTemplate': resourceUri,
    ui: {
      resourceUri,
    },
  };
}

export function createUiResourceMeta(description: string) {
  return {
    description,
    mimeType: 'text/html',
    _meta: {
      'ui/csp': {
        connect_domains: [],
        resource_domains: [],
      },
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [],
      },
      'openai/widgetDescription': description,
      'openai/widgetPrefersBorder': true,
    },
  };
}
