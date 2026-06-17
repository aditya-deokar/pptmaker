import type { PresentationGenerationRun } from '@/generated/prisma';
import prisma from '@/lib/prisma';
import {
  buildGenerationStepSnapshots,
  type GenerationStepSnapshot,
} from '@/agentic-workflow-v2/lib/progress';
import { RESOURCE_URIS } from '../config/constants';

export interface PresentationGenerationRunMcpResponse {
  id: string;
  topic: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  current_step_id: string | null;
  current_step_name: string | null;
  error: string | null;
  project_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  steps: GenerationStepSnapshot[];
}

export interface PresentationGenerationStatusMcpResponse {
  status: PresentationGenerationRunMcpResponse['status'];
  generation_run_id: string;
  generation_run: PresentationGenerationRunMcpResponse;
  progress_resource_uri: string;
  presentation_id: string | null;
  is_complete: boolean;
  is_failed: boolean;
  next_actions: string[];
  poll_hint?: string;
}

function normalizeGenerationSteps(steps: unknown): GenerationStepSnapshot[] {
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

export function generationRunToMcpResponse(
  run: PresentationGenerationRun
): PresentationGenerationRunMcpResponse {
  return {
    id: run.id,
    topic: run.topic,
    status: run.status,
    progress: run.progress,
    current_step_id: run.currentStepId ?? null,
    current_step_name: run.currentStepName ?? null,
    error: run.error ?? null,
    project_id: run.projectId ?? null,
    completed_at: run.completedAt?.toISOString() ?? null,
    created_at: run.createdAt.toISOString(),
    updated_at: run.updatedAt.toISOString(),
    steps: normalizeGenerationSteps(run.steps),
  };
}

export function getGenerationProgressResourceUri(runId: string): string {
  return RESOURCE_URIS.GENERATION_PROGRESS.replace('{runId}', runId);
}

export function buildGenerationStatusResponse(
  run: PresentationGenerationRun
): PresentationGenerationStatusMcpResponse {
  const generationRun = generationRunToMcpResponse(run);
  const isComplete = generationRun.status === 'COMPLETED';
  const isFailed = generationRun.status === 'FAILED';

  return {
    status: generationRun.status,
    generation_run_id: generationRun.id,
    generation_run: generationRun,
    progress_resource_uri: getGenerationProgressResourceUri(generationRun.id),
    presentation_id: generationRun.project_id,
    is_complete: isComplete,
    is_failed: isFailed,
    next_actions: isComplete && generationRun.project_id
      ? [
          'Use presentation_get with presentation_id to inspect the generated deck.',
          'Use presentation_publish if the user wants a share link.',
        ]
      : isFailed
        ? [
            'Explain the error to the user and ask them to retry with a simpler topic or fewer constraints.',
          ]
        : [
            'Call presentation_generation_status again or read progress_resource_uri to check progress.',
          ],
    ...(isComplete || isFailed
      ? {}
      : {
          poll_hint:
            'Generation is still running. Check again after a short delay instead of starting a duplicate generation.',
        }),
  };
}

export async function createGenerationRunForMcp(
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

export async function markGenerationRunStartedForMcp(
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

  return getGenerationRunForMcp(runId, userId);
}

export async function getGenerationRunForMcp(
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
