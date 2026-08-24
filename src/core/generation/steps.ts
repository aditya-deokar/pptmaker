/**
 * Core generation-step snapshot helpers.
 *
 * Moved verbatim from `src/actions/presentation-generation.ts` (and its
 * former MCP twin `normalizeGenerationSteps` in
 * `src/mcp/lib/presentation-generation-runs.ts`) so both surfaces share one
 * implementation. Transport-neutral: no Clerk, no MCP imports.
 */

import {
  buildGenerationStepSnapshots,
  type GenerationStepSnapshot,
  type GenerationStepStatus,
} from '@/agentic-workflow-v2/lib/progress';

/**
 * Merge persisted step rows (arbitrary JSON from the DB) onto the canonical
 * step definitions so unknown/stale ids cannot leak into responses.
 */
export function normalizeSteps(steps: unknown): GenerationStepSnapshot[] {
  if (!Array.isArray(steps)) {
    return buildGenerationStepSnapshots();
  }

  const defaults = buildGenerationStepSnapshots();

  return defaults.map((defaultStep) => {
    const matchingStep = steps.find(
      (step) =>
        typeof step === 'object' &&
        step !== null &&
        'id' in step &&
        (step as { id?: string }).id === defaultStep.id
    ) as Partial<GenerationStepSnapshot> | undefined;

    return {
      ...defaultStep,
      status: matchingStep?.status ?? defaultStep.status,
      details: matchingStep?.details,
    };
  });
}

/**
 * Immutably set status/details for one step inside a snapshot array.
 */
export function updateStepSnapshots(
  steps: GenerationStepSnapshot[],
  stepId: string,
  status: GenerationStepStatus,
  details?: string
): GenerationStepSnapshot[] {
  return steps.map((step) => {
    if (step.id !== stepId) {
      return step;
    }

    return {
      ...step,
      status,
      details,
    };
  });
}
