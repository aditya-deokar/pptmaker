import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createUiResourceContentMeta,
  createUiResourceMeta,
  MCP_APP_UI_MIME_TYPE,
  MCP_APP_UI_RESOURCE_URIS,
} from '../apps/constants';
import {
  getDeckPreviewWidgetHtml,
  getGenerationProgressWidgetHtml,
} from '../apps/widgets';
import { registerResourcePlugin } from './registry';

const GENERATION_PROGRESS_DESCRIPTION =
  'Shows Verto AI presentation generation progress.';
const DECK_PREVIEW_DESCRIPTION = 'Shows a compact Verto AI deck preview.';

function registerAppUiResources(server: McpServer): void {
  server.resource(
    'verto-generation-progress-ui',
    MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
    createUiResourceMeta(GENERATION_PROGRESS_DESCRIPTION),
    async () => ({
      contents: [
        {
          uri: MCP_APP_UI_RESOURCE_URIS.GENERATION_PROGRESS,
          mimeType: MCP_APP_UI_MIME_TYPE,
          text: getGenerationProgressWidgetHtml(),
          _meta: createUiResourceContentMeta(GENERATION_PROGRESS_DESCRIPTION),
        },
      ],
    })
  );

  server.resource(
    'verto-deck-preview-ui',
    MCP_APP_UI_RESOURCE_URIS.DECK_PREVIEW,
    createUiResourceMeta(DECK_PREVIEW_DESCRIPTION),
    async () => ({
      contents: [
        {
          uri: MCP_APP_UI_RESOURCE_URIS.DECK_PREVIEW,
          mimeType: MCP_APP_UI_MIME_TYPE,
          text: getDeckPreviewWidgetHtml(),
          _meta: createUiResourceContentMeta(DECK_PREVIEW_DESCRIPTION),
        },
      ],
    })
  );
}

registerResourcePlugin({
  name: 'app-ui',
  register: registerAppUiResources,
});
