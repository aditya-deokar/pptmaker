/**
 * MCP Tool - presentation_generation_status
 *
 * Read the status of a presentation generation run owned by the authenticated user.
 *
 * Plan 10 F7: completed runs embed a completion snapshot (slide count +
 * first-slide preview) so the progress widget can celebrate inline without a
 * second tool round-trip.
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import { logGenerationTelemetry } from '../../lib/generation-telemetry';
import {
  buildGenerationStatusResponse,
  getGenerationRunForMcp,
} from '../../lib/presentation-generation-runs';
import {
  createGenerationCompletionInfo,
  createGenerationProgressWidgetData,
  type GenerationCompletionInfo,
} from '../../apps/widget-data';
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
  const completion = await readCompletionSnapshot(statusPayload);

  return mcpSuccess(statusPayload, {
    widget: createGenerationProgressWidgetData(statusPayload, completion),
  });
}

async function readCompletionSnapshot(
  statusPayload: ReturnType<typeof buildGenerationStatusResponse>
): Promise<GenerationCompletionInfo | null> {
  if (!statusPayload.is_complete || !statusPayload.presentation_id) {
    return null;
  }

  const project = await prisma.project.findUnique({
    where: { id: statusPayload.presentation_id },
    select: { slides: true, themeName: true },
  });

  if (!project) {
    return null;
  }

  return createGenerationCompletionInfo(project.slides, project.themeName);
}
