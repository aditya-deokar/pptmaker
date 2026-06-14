/**
 * MCP Resource - verto://generation/{runId}/progress
 */

import prisma from '@/lib/prisma';
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';
import type { ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types.js';
import { resolveAuth } from '../auth/middleware';
import { hasRequiredScopes } from '../auth/scopes';
import { RESOURCE_URIS } from '../config/constants';
import {
  generationRunToMcpResponse,
  getGenerationRunForMcp,
} from '../lib/presentation-generation-runs';
import { getCurrentTransport } from '../lib/transport-context';
import { registerResourcePlugin } from './registry';

function requestHeadersToRecord(
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
): Record<string, string | undefined> | undefined {
  const headers = extra.requestInfo?.headers;
  if (!headers) {
    return undefined;
  }

  const record: Record<string, string | undefined> = {};

  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      record[key] = value;
    });

    return record;
  }

  for (const [key, value] of Object.entries(headers)) {
    record[key] = Array.isArray(value) ? value.join(', ') : value;
  }

  return record;
}

async function resolveResourceAuth(
  extra: RequestHandlerExtra<ServerRequest, ServerNotification>
) {
  return resolveAuth(getCurrentTransport(), requestHeadersToRecord(extra));
}

function registerGenerationProgressResource(server: McpServer): void {
  const template = new ResourceTemplate(RESOURCE_URIS.GENERATION_PROGRESS, {
    list: async (extra) => {
      const auth = await resolveResourceAuth(extra);
      if (!auth || !hasRequiredScopes(auth, ['presentations:generate'])) {
        return { resources: [] };
      }

      const runs = await prisma.presentationGenerationRun.findMany({
        where: { userId: auth.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return {
        resources: runs.map((run) => ({
          name: `Generation Run ${run.id}`,
          uri: RESOURCE_URIS.GENERATION_PROGRESS.replace('{runId}', run.id),
          mimeType: 'application/json',
          description: `Progress for "${run.topic}" (${run.status.toLowerCase()})`,
        })),
      };
    },
  });

  server.resource(
    'generation-progress',
    template,
    {
      description:
        'Progress for a tracked AI presentation generation run. Read this after presentation_generate returns RUNNING.',
      mimeType: 'application/json',
    },
    async (_uri, variables, extra) => {
      const auth = await resolveResourceAuth(extra);
      const runId = typeof variables.runId === 'string' ? variables.runId : '';

      if (!auth || !hasRequiredScopes(auth, ['presentations:generate'])) {
        return {
          contents: [
            {
              uri: RESOURCE_URIS.GENERATION_PROGRESS.replace('{runId}', runId),
              mimeType: 'application/json',
              text: JSON.stringify({
                error:
                  'Authentication with presentations:generate scope is required to read generation progress.',
              }),
            },
          ],
        };
      }

      const run = await getGenerationRunForMcp(runId, auth.userId);
      if (!run) {
        return {
          contents: [
            {
              uri: RESOURCE_URIS.GENERATION_PROGRESS.replace('{runId}', runId),
              mimeType: 'application/json',
              text: JSON.stringify({
                error: `Generation run '${runId}' was not found.`,
              }),
            },
          ],
        };
      }

      return {
        contents: [
          {
            uri: RESOURCE_URIS.GENERATION_PROGRESS.replace('{runId}', run.id),
            mimeType: 'application/json',
            text: JSON.stringify({
              generation_run: generationRunToMcpResponse(run),
              next_actions: run.projectId
                ? [
                    'Use presentation_get with the returned presentation_id to inspect the generated slides.',
                  ]
                : [
                    'Re-read this resource to follow progress.',
                  ],
            }),
          },
        ],
      };
    }
  );
}

registerResourcePlugin({
  name: 'generation-progress',
  register: registerGenerationProgressResource,
});
