/**
 * MCP Tool — presentation_recover
 *
 * Recover a soft-deleted presentation (sets isDeleted = false).
 * Idempotent: if not deleted, returns success with advisory.
 *
 * Reuses:
 * - presentationRecoverSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createActionResultWidgetData } from '../../apps/widget-data';
import type { PresentationRecoverInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

/**
 * Handler for the presentation_recover tool.
 */
export async function handlePresentationRecover(
  args: PresentationRecoverInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id } = args;

  // Must include deleted to find the soft-deleted project
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId, {
    includeDeleted: true,
  });

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Idempotent: not deleted
  if (!project.isDeleted) {
    const presentation = projectToPresentation(project);
    return mcpSuccess({
      ...presentation,
      message: 'Presentation is not deleted. No recovery needed.',
    }, {
      widget: createActionResultWidgetData({
        kind: 'recover',
        title: 'Presentation already active',
        message: 'No recovery was needed.',
        presentation,
      }),
    });
  }

  // Recover
  const recovered = await prisma.project.update({
    where: { id: project.id },
    data: { isDeleted: false },
  });

  const presentation = projectToPresentation(recovered);

  return mcpSuccess(presentation, {
    widget: createActionResultWidgetData({
      kind: 'recover',
      title: 'Presentation recovered',
      message: 'The deck is active again.',
      presentation,
    }),
  });
}
