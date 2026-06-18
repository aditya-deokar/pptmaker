import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  createUiResourceContentMeta,
  createUiResourceMeta,
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

const PRESENTATION_LIST_DESCRIPTION =
  'Shows a visual Verto AI presentation workspace list.';
const GENERATION_PROGRESS_DESCRIPTION =
  'Shows Verto AI presentation generation progress.';
const DECK_PREVIEW_DESCRIPTION = 'Shows a compact Verto AI deck preview.';
const ACTION_RESULT_DESCRIPTION = 'Shows a visual Verto AI action result.';

function registerAppUiResources(server: McpServer): void {
  server.resource(
    'verto-presentation-list-ui',
    MCP_APP_UI_RESOURCE_URIS.PRESENTATION_LIST,
    createUiResourceMeta(PRESENTATION_LIST_DESCRIPTION),
    async () => ({
      contents: [
        {
          uri: MCP_APP_UI_RESOURCE_URIS.PRESENTATION_LIST,
          mimeType: MCP_APP_UI_MIME_TYPE,
          text: getPresentationListWidgetHtml(),
          _meta: createUiResourceContentMeta(PRESENTATION_LIST_DESCRIPTION),
        },
      ],
    })
  );

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

  server.resource(
    'verto-action-result-ui',
    MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
    createUiResourceMeta(ACTION_RESULT_DESCRIPTION),
    async () => ({
      contents: [
        {
          uri: MCP_APP_UI_RESOURCE_URIS.ACTION_RESULT,
          mimeType: MCP_APP_UI_MIME_TYPE,
          text: getActionResultWidgetHtml(),
          _meta: createUiResourceContentMeta(ACTION_RESULT_DESCRIPTION),
        },
      ],
    })
  );
}

registerResourcePlugin({
  name: 'app-ui',
  register: registerAppUiResources,
});
