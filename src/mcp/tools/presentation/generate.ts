/**
 * MCP Tool - presentation_generate
 */

import { generateAdvancedPresentation } from '@/agentic-workflow-v2/actions/advanced-genai-graph';
import { checkAndIncrementUsage } from '@/lib/usage-limit';
import { LIMITS } from '../../config/constants';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import type { PresentationGenerateInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import {
  buildGenerationStatusResponse,
  createGenerationRunForMcp,
  getGenerationRunForMcp,
  markGenerationRunStartedForMcp,
} from '../../lib/presentation-generation-runs';
import { logGenerationTelemetry } from '../../lib/generation-telemetry';
import { limitSlidesForMcp, projectToPresentation } from './mappers';

type GenerationOutcome =
  | {
      kind: 'completed';
      result: Awaited<ReturnType<typeof generateAdvancedPresentation>>;
    }
  | {
      kind: 'timeout';
    };

function createTimeoutPromise(timeoutMs: number): Promise<GenerationOutcome> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ kind: 'timeout' }), timeoutMs);
  });
}

function getGenerationErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown generation error';
}

export async function handlePresentationGenerate(
  args: PresentationGenerateInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const {
    topic,
    additional_context,
    theme_preference,
    outlines,
    wait_timeout_ms,
  } = args;

  const usageCheck = await checkAndIncrementUsage(
    auth.userId,
    auth.authMethod === 'oauth'
      ? { limitOverride: LIMITS.OAUTH_CONNECTED_GENERATION_LIMIT }
      : undefined
  );
  if (!usageCheck.success) {
    return Errors.usageLimitExceeded(usageCheck.usage, usageCheck.limit);
  }

  const generationRun = await createGenerationRunForMcp(auth.userId, topic);
  const startedRun =
    await markGenerationRunStartedForMcp(generationRun.id, auth.userId)
    ?? generationRun;
  const startedAt = performance.now();
  const waitTimeoutMs = Math.min(
    wait_timeout_ms ?? LIMITS.GENERATION_DEFAULT_WAIT_TIMEOUT_MS,
    LIMITS.GENERATION_TIMEOUT_MS
  );

  logGenerationTelemetry('run_created', {
    runId: generationRun.id,
    userId: auth.userId,
    authMethod: auth.authMethod,
    topic,
    status: startedRun.status,
    waitTimeoutMs,
  });

  logGenerationTelemetry('run_started', {
    runId: generationRun.id,
    userId: auth.userId,
    authMethod: auth.authMethod,
    topic,
    status: startedRun.status,
  });

  const guardedGenerationPromise = generateAdvancedPresentation(
    auth.clerkId,
    topic,
    additional_context,
    theme_preference,
    outlines,
    generationRun.id
  )
    .then(
      (result): GenerationOutcome => {
        logGenerationTelemetry(result.success ? 'run_completed' : 'run_failed', {
          runId: generationRun.id,
          userId: auth.userId,
          authMethod: auth.authMethod,
          topic,
          status: result.success ? 'COMPLETED' : 'FAILED',
          projectId: result.projectId,
          latencyMs: Math.round(performance.now() - startedAt),
          error: result.success ? null : result.error,
        });

        return {
          kind: 'completed',
          result,
        };
      }
    )
    .catch((error): GenerationOutcome => {
      const errorMessage = getGenerationErrorMessage(error);
      console.error('[MCP] presentation_generate background failure:', error);
      logGenerationTelemetry('run_failed', {
        runId: generationRun.id,
        userId: auth.userId,
        authMethod: auth.authMethod,
        topic,
        status: 'FAILED',
        latencyMs: Math.round(performance.now() - startedAt),
        error: errorMessage,
      });

      return {
        kind: 'completed',
        result: {
          success: false,
          error: errorMessage,
          projectId: null,
        },
      };
    });

  const outcome = await Promise.race([
    guardedGenerationPromise,
    createTimeoutPromise(waitTimeoutMs),
  ]);

  if (outcome.kind === 'timeout') {
    const latestRun =
      await getGenerationRunForMcp(generationRun.id, auth.userId)
      ?? startedRun;
    const statusPayload = buildGenerationStatusResponse(latestRun);

    logGenerationTelemetry('timeout_returned_running', {
      runId: generationRun.id,
      userId: auth.userId,
      authMethod: auth.authMethod,
      topic,
      status: latestRun.status,
      progress: latestRun.progress,
      waitTimeoutMs,
      latencyMs: Math.round(performance.now() - startedAt),
    });

    return mcpSuccess({
      ...statusPayload,
      response_mode: 'RUNNING_BEFORE_HOST_TIMEOUT',
      wait_timeout_ms: waitTimeoutMs,
      background_execution_note:
        'Generation has started. Use presentation_generation_status or the progress resource instead of starting a duplicate generation.',
    });
  }

  const result = outcome.result;
  if (!result.success) {
    const failedRun = await getGenerationRunForMcp(generationRun.id, auth.userId);

    return Errors.generationFailed(
      result.error,
      failedRun
        ? {
            generation_status: buildGenerationStatusResponse(failedRun),
          }
        : {
            generation_run_id: generationRun.id,
          }
    );
  }

  const latestRun = await getGenerationRunForMcp(generationRun.id, auth.userId);
  const project = result.projectId
    ? await getOwnedProjectForMcp(result.projectId, auth.userId)
    : null;
  const fallbackSlides = Array.isArray(result.slides) ? result.slides : [];
  const limitedFallbackSlides = limitSlidesForMcp(fallbackSlides);

  return mcpSuccess({
    status: 'COMPLETED',
    generation_run_id: generationRun.id,
    generation_status: latestRun ? buildGenerationStatusResponse(latestRun) : null,
    presentation_id: result.projectId,
    presentation: project
      ? projectToPresentation(project, { includeSlides: true })
      : {
          id: result.projectId,
          slide_count: result.slideCount,
          outlines: result.outlines ?? [],
          slides: limitedFallbackSlides.slides,
          slides_returned: limitedFallbackSlides.slidesReturned,
          slides_total: limitedFallbackSlides.slidesTotal,
          slides_truncated: limitedFallbackSlides.slidesTruncated,
          slide_payload_bytes: limitedFallbackSlides.slidePayloadBytes,
          ...(limitedFallbackSlides.truncationReason
            ? { truncation_reason: limitedFallbackSlides.truncationReason }
            : {}),
        },
  });
}
