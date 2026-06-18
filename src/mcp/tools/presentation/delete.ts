/**
 * MCP Tool — presentation_delete
 *
 * Soft-delete a presentation (sets isDeleted = true).
 * Recoverable via presentation_recover.
 * Idempotent: if already deleted, returns success with advisory.
 *
 * Reuses:
 * - presentationDeleteSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createActionResultWidgetData } from '../../apps/widget-data';
import type { PresentationDeleteInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';

/**
 * Handler for the presentation_delete tool.
 */
export async function handlePresentationDelete(
  args: PresentationDeleteInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id } = args;

  // Look up project (including already-deleted ones for idempotency)
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId, {
    includeDeleted: true,
  });

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Idempotent: already soft-deleted
  if (project.isDeleted) {
    const data = {
      id: project.id,
      title: project.title,
      deleted: true,
      message: 'Presentation was already deleted. Use presentation_recover to restore it.',
    };

    return mcpSuccess(data, {
      widget: createActionResultWidgetData({
        kind: 'delete',
        title: 'Presentation already deleted',
        message: 'Presentation was already deleted. Use presentation_recover to restore it.',
        affectedPresentations: [{ id: project.id, title: project.title }],
        status: 'warning',
      }),
    });
  }

  // Soft-delete
  await prisma.project.update({
    where: { id: project.id },
    data: { isDeleted: true },
  });

  const data = {
    id: project.id,
    title: project.title,
    deleted: true,
  };

  return mcpSuccess(data, {
    widget: createActionResultWidgetData({
      kind: 'delete',
      title: 'Presentation deleted',
      message: 'The deck was moved to deleted items and can be recovered.',
      affectedPresentations: [{ id: project.id, title: project.title }],
    }),
  });
}
