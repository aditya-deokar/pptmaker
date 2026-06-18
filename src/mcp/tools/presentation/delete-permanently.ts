/**
 * MCP Tool — presentation_delete_permanently
 *
 * Permanently delete presentations (hard delete from database).
 * Requires `confirm: true` (z.literal) to prevent accidental data loss.
 * Only deletes projects owned by the authenticated user.
 *
 * Reuses:
 * - presentationDeletePermanentlySchema (schemas.ts)
 * - Prisma batch operations
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createActionResultWidgetData } from '../../apps/widget-data';
import type { PresentationDeletePermanentlyInput } from './schemas';

/**
 * Handler for the presentation_delete_permanently tool.
 */
export async function handlePresentationDeletePermanently(
  args: PresentationDeletePermanentlyInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_ids } = args;
  // `confirm: true` is enforced by z.literal(true) at schema level

  // Find all projects owned by this user from the requested IDs
  const ownedProjects = await prisma.project.findMany({
    where: {
      id: { in: presentation_ids },
      userId: auth.userId,
    },
    select: { id: true, title: true },
  });

  if (ownedProjects.length === 0) {
    return Errors.notFound('Presentations', presentation_ids.join(', '));
  }

  const ownedIds = ownedProjects.map((p) => p.id);

  // Log which IDs were not owned (for audit clarity)
  const skippedIds = presentation_ids.filter((id: string) => !ownedIds.includes(id));
  if (skippedIds.length > 0) {
    console.error(
      `[MCP] presentation_delete_permanently: skipped ${skippedIds.length} non-owned IDs`
    );
  }

  // Hard delete
  const result = await prisma.project.deleteMany({
    where: {
      id: { in: ownedIds },
    },
  });

  const data = {
    deleted_count: result.count,
    deleted_ids: ownedIds,
    deleted_titles: ownedProjects.map((p) => p.title),
    skipped_ids: skippedIds.length > 0 ? skippedIds : undefined,
  };

  return mcpSuccess(data, {
    widget: createActionResultWidgetData({
      kind: 'delete_permanently',
      title: 'Presentations permanently deleted',
      message: `${result.count} presentation${result.count === 1 ? '' : 's'} were permanently deleted.`,
      affectedPresentations: ownedProjects.map((project) => ({
        id: project.id,
        title: project.title,
      })),
      status: 'warning',
    }),
  });
}
