/**
 * MCP Tool — presentation_create
 *
 * Create a new presentation with a title and outline cards.
 * Enforces usage limits before creation.
 *
 * Reuses:
 * - presentationCreateSchema (schemas.ts)
 * - checkAndIncrementUsage (lib/usage-limit.ts)
 * - projectToPresentation (mappers.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import type { PresentationCreateInput } from './schemas';
import { projectToPresentation } from './mappers';
import { checkAndIncrementUsage } from '@/lib/usage-limit';

/**
 * Handler for the presentation_create tool.
 */
export async function handlePresentationCreate(
  args: PresentationCreateInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { title, outlines, request_id } = args;

  // Log request_id for audit trail (full idempotency dedup deferred to Phase 4)
  if (request_id) {
    console.error(`[MCP] presentation_create: request_id=${request_id}`);
  }

  // Enforce usage limits
  const usageCheck = await checkAndIncrementUsage(auth.userId);
  if (!usageCheck.success) {
    return Errors.usageLimitExceeded(usageCheck.usage, usageCheck.limit);
  }

  // Extract outline titles in order
  const outlineTitles = outlines.map(
    (outline: PresentationCreateInput['outlines'][number]) => outline.title
  );

  // Create the project
  const project = await prisma.project.create({
    data: {
      title,
      outlines: outlineTitles,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: auth.userId,
    },
  });

  return mcpSuccess(projectToPresentation(project));
}
