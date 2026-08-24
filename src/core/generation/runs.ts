/**
 * Core generation-run lifecycle.
 *
 * Single implementation shared by the dashboard server actions and the MCP
 * presentation tools. Two flavors exist deliberately:
 *
 * - Ownership-scoped variants (`createGenerationRun`, `getOwnedGenerationRun`,
 *   `markGenerationRunStarted`) take an explicit `userId` and use atomic
 *   `updateMany` guards. Use these from any user-facing surface.
 * - Engine-internal transitions (`startRun`, `markStepRunning`,
 *   `markStepCompleted`, `failRun`, `completeRun`) operate on a trusted
 *   `runId` handed to the LangGraph engine after ownership was already
 *   established upstream.
 */

import prisma from '@/lib/prisma';
import type { PresentationGenerationRun } from '@/generated/prisma';
import {
  buildGenerationStepSnapshots,
  getGenerationStepDefinition,
} from '@/agentic-workflow-v2/lib/progress';
import { normalizeSteps, updateStepSnapshots } from './steps';

/** Create a PENDING run owned by `userId`. */
export async function createGenerationRun(
  userId: string,
  topic: string
): Promise<PresentationGenerationRun> {
  return prisma.presentationGenerationRun.create({
    data: {
      userId,
      topic,
      status: 'PENDING',
      progress: 0,
      steps: buildGenerationStepSnapshots(),
    },
  });
}

/** Fetch a run only when it is owned by `userId`; null otherwise. */
export async function getOwnedGenerationRun(
  runId: string,
  userId: string
): Promise<PresentationGenerationRun | null> {
  return prisma.presentationGenerationRun.findFirst({
    where: {
      id: runId,
      userId,
    },
  });
}

/**
 * Atomically flip an owned run to RUNNING (guards against cross-user writes).
 * Returns the updated row, or null when the run does not exist for the user.
 */
export async function markGenerationRunStarted(
  runId: string,
  userId: string
): Promise<PresentationGenerationRun | null> {
  const result = await prisma.presentationGenerationRun.updateMany({
    where: {
      id: runId,
      userId,
    },
    data: {
      status: 'RUNNING',
      progress: 0,
      currentStepId: null,
      currentStepName: 'Queued',
      error: null,
      steps: buildGenerationStepSnapshots(),
    },
  });

  if (result.count !== 1) {
    return null;
  }

  return getOwnedGenerationRun(runId, userId);
}

/** Engine transition: reset a run into the RUNNING state. */
export async function startRun(runId: string): Promise<void> {
  if (!runId) {
    return;
  }

  await prisma.presentationGenerationRun.update({
    where: { id: runId },
    data: {
      status: 'RUNNING',
      progress: 0,
      error: null,
      currentStepId: null,
      currentStepName: null,
      steps: buildGenerationStepSnapshots(),
    },
  });
}

/** Engine transition: mark one step running and advance coarse progress. */
export async function markStepRunning(
  runId: string,
  stepId: string,
  details?: string
): Promise<void> {
  if (!runId) {
    return;
  }

  const run = await prisma.presentationGenerationRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return;
  }

  const steps = updateStepSnapshots(
    normalizeSteps(run.steps),
    stepId,
    'running',
    details
  );
  const step = getGenerationStepDefinition(stepId);

  await prisma.presentationGenerationRun.update({
    where: { id: runId },
    data: {
      status: 'RUNNING',
      currentStepId: stepId,
      currentStepName: step?.name ?? stepId,
      progress: step ? Math.max(run.progress, step.progress - 5) : run.progress,
      error: null,
      steps,
    },
  });
}

/** Engine transition: mark one step completed; optionally bind projectId. */
export async function markStepCompleted(
  runId: string,
  stepId: string,
  options?: {
    details?: string;
    projectId?: string | null;
  }
): Promise<void> {
  if (!runId) {
    return;
  }

  const run = await prisma.presentationGenerationRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return;
  }

  const steps = updateStepSnapshots(
    normalizeSteps(run.steps),
    stepId,
    'completed',
    options?.details
  );
  const step = getGenerationStepDefinition(stepId);

  await prisma.presentationGenerationRun.update({
    where: { id: runId },
    data: {
      status: 'RUNNING',
      currentStepId: stepId,
      currentStepName: step?.name ?? stepId,
      progress: step?.progress ?? run.progress,
      error: null,
      steps,
      projectId: options?.projectId ?? run.projectId,
    },
  });
}

/** Engine transition: fail the run with an optional failing step. */
export async function failRun(
  runId: string,
  error: string,
  stepId?: string
): Promise<void> {
  if (!runId) {
    return;
  }

  const run = await prisma.presentationGenerationRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return;
  }

  const step = stepId ? getGenerationStepDefinition(stepId) : null;
  const steps = stepId
    ? updateStepSnapshots(normalizeSteps(run.steps), stepId, 'error', error)
    : normalizeSteps(run.steps);

  await prisma.presentationGenerationRun.update({
    where: { id: runId },
    data: {
      status: 'FAILED',
      error,
      currentStepId: stepId ?? run.currentStepId,
      currentStepName: step?.name ?? run.currentStepName,
      steps,
      completedAt: new Date(),
    },
  });
}

/** Engine transition: complete the run at 100% bound to its project. */
export async function completeRun(
  runId: string,
  options?: {
    projectId?: string | null;
  }
): Promise<void> {
  if (!runId) {
    return;
  }

  const run = await prisma.presentationGenerationRun.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return;
  }

  await prisma.presentationGenerationRun.update({
    where: { id: runId },
    data: {
      status: 'COMPLETED',
      progress: 100,
      currentStepId: 'databasePersister',
      currentStepName:
        getGenerationStepDefinition('databasePersister')?.name ?? 'Finalization',
      projectId: options?.projectId ?? run.projectId,
      completedAt: new Date(),
    },
  });
}
