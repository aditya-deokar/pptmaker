import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import {
  createUiResourceContentMeta,
  MCP_APP_UI_MIME_TYPE,
  MCP_APP_UI_RESOURCE_URIS,
} from '../apps/constants';
import {
  getActionResultWidgetHtml,
  getDeckPreviewWidgetHtml,
  getGenerationProgressWidgetHtml,
  getPresentationListWidgetHtml,
} from '../apps/widgets';
import { registerResourcePlugin } from './registry';

interface AppUiResourceDescriptor {
  name: string;
  uri: string;
  description: string;
  getHtml: () => string;
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
    registerAppResource(
      server,
      resource.name,
      resource.uri,
      {
        description: resource.description,
        _meta: createUiResourceContentMeta(),
      },
      async () => ({
        contents: [
          {
            uri: resource.uri,
            mimeType: MCP_APP_UI_MIME_TYPE,
            text: resource.getHtml(),
            _meta: createUiResourceContentMeta(),
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
