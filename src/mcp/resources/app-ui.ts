import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import {
  createUiResourceContentMeta,
  MCP_APP_UI_MIME_TYPE,
  MCP_APP_UI_RESOURCE_URIS,
  SLIDE_IMAGE_RESOURCE_DOMAINS,
} from '../apps/constants';
import {
  getActionResultWidgetHtml,
  getDeckLiveWidgetHtml,
  getDeckPreviewWidgetHtml,
  getGenerationProgressWidgetHtml,
  getPresentationListWidgetHtml,
  getPublishCardWidgetHtml,
  getThemeStudioWidgetHtml,
} from '../apps/widgets';
import { registerResourcePlugin } from './registry';

interface AppUiResourceDescriptor {
  name: string;
  uri: string;
  description: string;
  getHtml: () => string;
  /**
   * W1 (plan 10): allowlist slide image origins (Unsplash hosts and the
   * legacy placeholder fallback) so real slide imagery renders in sandboxed
   * widget iframes. Data-URL images need no origin.
   */
  slideImageDomains?: boolean;
  /** Sandbox clipboard-write permission for in-widget Copy buttons. */
  clipboardWrite?: boolean;
}

const APP_UI_RESOURCES: AppUiResourceDescriptor[] = [
  {
    name: 'verto-presentation-list-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.PRESENTATION_LIST,
    description: 'Shows a visual Verto AI presentation workspace list.',
    getHtml: getPresentationListWidgetHtml,
  },
  {
    name: 'verto-generation-progress-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
    description: 'Shows Verto AI presentation generation progress.',
    getHtml: getGenerationProgressWidgetHtml,
  },
  {
    name: 'verto-deck-preview-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.DECK_PREVIEW,
    description: 'Shows a compact Verto AI deck preview.',
    getHtml: getDeckPreviewWidgetHtml,
    slideImageDomains: true,
  },
  {
    name: 'verto-deck-live-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.DECK_LIVE,
    description:
      'Immersive presenter view for a Verto AI deck with fullscreen, keyboard navigation, and a slide grid overview.',
    getHtml: getDeckLiveWidgetHtml,
    slideImageDomains: true,
  },
  {
    name: 'verto-theme-studio-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.THEME_STUDIO,
    description:
      'Visual theme browser for a Verto AI deck: search and filter the catalog, then apply a theme live.',
    getHtml: getThemeStudioWidgetHtml,
  },
  {
    name: 'verto-publish-card-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.PUBLISH_CARD,
    description:
      'Celebration card for a published Verto AI deck with share link, QR code, copy action, and unpublish.',
    getHtml: getPublishCardWidgetHtml,
    clipboardWrite: true,
  },
  {
    name: 'verto-action-result-ui',
    uri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    description: 'Shows a visual Verto AI action result.',
    getHtml: getActionResultWidgetHtml,
  },
];

function registerAppUiResources(server: McpServer): void {
  for (const resource of APP_UI_RESOURCES) {
    const meta = createUiResourceContentMeta({
      ...(resource.slideImageDomains
        ? { extraResourceDomains: SLIDE_IMAGE_RESOURCE_DOMAINS }
        : {}),
      ...(resource.clipboardWrite ? { clipboardWrite: true } : {}),
    });

    registerAppResource(
      server,
      resource.name,
      resource.uri,
      {
        description: resource.description,
        _meta: meta,
      },
      async () => ({
        contents: [
          {
            uri: resource.uri,
            mimeType: MCP_APP_UI_MIME_TYPE,
            text: resource.getHtml(),
            _meta: meta,
          },
        ],
      })
    );
  }
}

registerResourcePlugin({
  name: 'app-ui',
  register: registerAppUiResources,
});
