/**
 * MCP Tool — presentation_unpublish
 *
 * Remove public access to a presentation.
 * Idempotent: if already unpublished, returns success.
 *
 * Reuses:
 * - presentationUnpublishSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createActionResultWidgetData } from '../../apps/widget-data';
import type { PresentationUnpublishInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

/**
 * Handler for the presentation_unpublish tool.
 */
export async function handlePresentationUnpublish(
  args: PresentationUnpublishInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id } = args;

  // Ownership check
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Idempotent: already unpublished
  if (!project.isPublished) {
    const presentation = projectToPresentation(project);
    return mcpSuccess({
      ...presentation,
      message: 'Presentation is already unpublished.',
    }, {
      widget: createActionResultWidgetData({
        kind: 'unpublish',
        title: 'Presentation already unpublished',
        message: 'This deck is already private.',
        presentation,
      }),
    });
  }

  // Unpublish
  const unpublished = await prisma.project.update({
    where: { id: project.id },
    data: { isPublished: false },
  });

  const presentation = projectToPresentation(unpublished);

  return mcpSuccess(presentation, {
    widget: createActionResultWidgetData({
      kind: 'unpublish',
      title: 'Presentation unpublished',
      message: 'The public share link has been removed.',
      presentation,
    }),
  });
}
