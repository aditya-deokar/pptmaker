/**
 * MCP Tool - presentation_generate
 */

import { generateAdvancedPresentation } from '@/agentic-workflow-v2/actions/advanced-genai-graph';
import { checkAndIncrementUsage } from '@/lib/usage-limit';
import { LIMITS, RESOURCE_URIS } from '../../config/constants';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import type { PresentationGenerateInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import {
  createGenerationRunForMcp,
  generationRunToMcpResponse,
  getGenerationRunForMcp,
} from '../../lib/presentation-generation-runs';
import { projectToPresentation } from './mappers';

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
  const waitTimeoutMs = Math.min(
    wait_timeout_ms ?? LIMITS.GENERATION_TIMEOUT_MS,
    LIMITS.GENERATION_TIMEOUT_MS
  );

  const guardedGenerationPromise = generateAdvancedPresentation(
    auth.clerkId,
    topic,
    additional_context,
    theme_preference,
    outlines,
    generationRun.id
  )
    .then(
      (result): GenerationOutcome => ({
        kind: 'completed',
        result,
      })
    )
    .catch((error): GenerationOutcome => {
      console.error('[MCP] presentation_generate background failure:', error);
      return {
        kind: 'completed',
        result: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown generation error',
          projectId: null,
        },
      };
    });

  const outcome = await Promise.race([
    guardedGenerationPromise,
    createTimeoutPromise(waitTimeoutMs),
  ]);

  if (outcome.kind === 'timeout') {
    const latestRun = await getGenerationRunForMcp(generationRun.id, auth.userId);

    return mcpSuccess({
      status: 'RUNNING',
      generation_run_id: generationRun.id,
      generation_run: latestRun
        ? generationRunToMcpResponse(latestRun)
        : generationRunToMcpResponse(generationRun),
      progress_resource_uri: RESOURCE_URIS.GENERATION_PROGRESS.replace(
        '{runId}',
        generationRun.id
      ),
      poll_hint:
        'Read the progress resource for live status. Once project_id is available, use presentation_get to inspect the generated presentation.',
    });
  }

  const result = outcome.result;
  if (!result.success) {
    return Errors.generationFailed(result.error);
  }

  const latestRun = await getGenerationRunForMcp(generationRun.id, auth.userId);
  const project = result.projectId
    ? await getOwnedProjectForMcp(result.projectId, auth.userId)
    : null;

  return mcpSuccess({
    status: 'COMPLETED',
    generation_run_id: generationRun.id,
    generation_run: latestRun ? generationRunToMcpResponse(latestRun) : null,
    presentation_id: result.projectId,
    presentation: project
      ? projectToPresentation(project, { includeSlides: true })
      : {
          id: result.projectId,
          slide_count: result.slideCount,
          outlines: result.outlines ?? [],
          slides: result.slides ?? [],
        },
  });
}
