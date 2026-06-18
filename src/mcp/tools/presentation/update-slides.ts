/**
 * MCP Tool — presentation_update_slides
 *
 * Replace all slides in a presentation with a new Slide[] array.
 * This is a full replacement — not a patch.
 *
 * Reuses:
 * - presentationUpdateSlidesSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createActionResultWidgetData } from '../../apps/widget-data';
import type { PresentationUpdateSlidesInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

/**
 * Handler for the presentation_update_slides tool.
 */
export async function handlePresentationUpdateSlides(
  args: PresentationUpdateSlidesInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id, slides } = args;

  // Ownership check
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Full replacement of slides array
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { slides: slides as unknown as any },
  });

  const presentation = projectToPresentation(updated, { includeSlides: true });

  return mcpSuccess(presentation, {
    widget: createActionResultWidgetData({
      kind: 'update_slides',
      title: 'Slides updated',
      message: 'The deck slides were replaced successfully.',
      presentation,
    }),
  });
}
