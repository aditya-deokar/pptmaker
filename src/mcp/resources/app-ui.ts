import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createUiResourceMeta,
  MCP_APP_UI_RESOURCE_URIS,
} from '../apps/constants';
import {
  getDeckPreviewWidgetHtml,
  getGenerationProgressWidgetHtml,
} from '../apps/widgets';
import { registerResourcePlugin } from './registry';

function registerAppUiResources(server: McpServer): void {
  server.resource(
    'verto-generation-progress-ui',
    MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
    createUiResourceMeta('Shows Verto AI presentation generation progress.'),
    async () => ({
      contents: [
        {
          uri: MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
          mimeType: 'text/html',
          text: getGenerationProgressWidgetHtml(),
        },
      ],
    })
  );

  server.resource(
    'verto-deck-preview-ui',
    MCP_APP_UI_RESOURCE_URIS.DECK_PREVIEW,
    createUiResourceMeta('Shows a compact Verto AI deck preview.'),
    async () => ({
      contents: [
        {
          uri: MCP_APP_UI_RESOURCE_URIS.DECK_PREVIEW,
          mimeType: 'text/html',
          text: getDeckPreviewWidgetHtml(),
        },
      ],
    })
  );
}

registerResourcePlugin({
  name: 'app-ui',
  register: registerAppUiResources,
});
