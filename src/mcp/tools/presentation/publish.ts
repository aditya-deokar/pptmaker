/**
 * MCP Tool — presentation_publish
 *
 * Make a presentation publicly shareable via a share URL.
 * Idempotent: if already published, returns success with the existing share URL.
 *
 * Plan 10 F5: the result is bound to the dedicated publish-card widget
 * (celebration, share link, QR code, copy action, unpublish) instead of the
 * generic action result.
 *
 * Reuses:
 * - presentationPublishSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createPublishCardWidgetData } from '../../apps/widget-data';
import type { PresentationPublishInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

/**
 * Handler for the presentation_publish tool.
 */
export async function handlePresentationPublish(
  args: PresentationPublishInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id } = args;

  // Ownership check
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Idempotent: already published
  if (project.isPublished) {
    const presentation = projectToPresentation(project);
    return mcpSuccess({
      ...presentation,
      message: 'Presentation is already published.',
    }, {
      widget: createPublishCardWidgetData(presentation),
    });
  }

  // Publish — preserve original publishedAt if re-publishing
  const published = await prisma.project.update({
    where: { id: project.id },
    data: {
      isPublished: true,
      publishedAt: project.publishedAt ?? new Date(),
    },
  });

  const presentation = projectToPresentation(published);

  return mcpSuccess(presentation, {
    widget: createPublishCardWidgetData(presentation),
  });
}
