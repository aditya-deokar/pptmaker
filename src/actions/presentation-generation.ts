"use server";

import { getAuthenticatedAppUser } from "./project-access";
import {
  completeRun,
  createGenerationRun,
  failRun,
  getOwnedGenerationRun,
  markStepCompleted,
  markStepRunning,
  startRun,
} from "@/core/generation/runs";
import { normalizeSteps } from "@/core/generation/steps";
import type { GenerationStepSnapshot } from "@/agentic-workflow-v2/lib/progress";

/**
 * Thin Clerk-authenticated wrappers around the transport-neutral
 * `src/core/generation` services. All business logic lives in core; this
 * file only resolves the session user and maps results into the
 * `{ status, data | error }` envelope consumed by client hooks.
 */

export const createPresentationGenerationRun = async (topic: string) => {
  try {
    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) {
      return auth;
    }

    const run = await createGenerationRun(auth.user.id, topic);

    return {
      status: 200 as const,
      data: run,
    };
  } catch (error) {
    console.error("ERROR", error);
    return {
      status: 500 as const,
      error: "Internal server error",
    };
  }
};

export const getPresentationGenerationRun = async (runId: string) => {
  try {
    if (!runId) {
      return {
        status: 400 as const,
        error: "Generation run ID is required",
      };
    }

    const auth = await getAuthenticatedAppUser();
    if (auth.status !== 200) {
      return auth;
    }

    const run = await getOwnedGenerationRun(runId, auth.user.id);

    if (!run) {
      return {
        status: 404 as const,
        error: "Generation run not found",
      };
    }

    return {
      status: 200 as const,
      data: {
        ...run,
        steps: normalizeSteps(run.steps) as GenerationStepSnapshot[],
      },
    };
  } catch (error) {
    console.error("ERROR", error);
    return {
      status: 500 as const,
      error: "Internal server error",
    };
  }
};

export async function startPresentationGenerationRun(runId: string) {
  await startRun(runId);
}

export async function markPresentationGenerationStepRunning(
  runId: string,
  stepId: string,
  details?: string
) {
  await markStepRunning(runId, stepId, details);
}

export async function markPresentationGenerationStepCompleted(
  runId: string,
  stepId: string,
  options?: {
    details?: string;
    projectId?: string | null;
  }
) {
  await markStepCompleted(runId, stepId, options);
}

export async function failPresentationGenerationRun(
  runId: string,
  error: string,
  stepId?: string
) {
  await failRun(runId, error, stepId);
}

export async function completePresentationGenerationRun(
  runId: string,
  options?: {
    projectId?: string | null;
  }
) {
  await completeRun(runId, options);
}
