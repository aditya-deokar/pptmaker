/**
 * MCP Tool - presentation_generation_status
 *
 * Read the status of a presentation generation run owned by the authenticated user.
 */

import type { AuthContext } from '../../auth/types';
import { logGenerationTelemetry } from '../../lib/generation-telemetry';
import {
  buildGenerationStatusResponse,
  getGenerationRunForMcp,
} from '../../lib/presentation-generation-runs';
import { createGenerationProgressWidgetData } from '../../apps/widget-data';
import { mcpSuccess, type McpToolResponse } from '../_shared/response';
import { Errors } from '../_shared/errors';
import type { PresentationGenerationStatusInput } from './schemas';

export async function handlePresentationGenerationStatus(
  args: PresentationGenerationStatusInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const run = await getGenerationRunForMcp(args.generation_run_id, auth.userId);

  if (!run) {
    return Errors.notFound('Generation run', args.generation_run_id);
  }

  logGenerationTelemetry('status_read', {
    runId: run.id,
    userId: auth.userId,
    authMethod: auth.authMethod,
    topic: run.topic,
    status: run.status,
    progress: run.progress,
    projectId: run.projectId,
    error: run.error,
  });

  const statusPayload = buildGenerationStatusResponse(run);

  return mcpSuccess(statusPayload, {
    widget: createGenerationProgressWidgetData(statusPayload),
  });
}
