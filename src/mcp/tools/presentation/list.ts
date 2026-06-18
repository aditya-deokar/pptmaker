/**
 * MCP Tool — presentation_list
 *
 * List all presentations owned by the authenticated user.
 * Returns metadata only (no slide content) for token efficiency.
 * Supports cursor-based pagination, sorting, and soft-delete filtering.
 *
 * Reuses:
 * - presentationListSchema (schemas.ts)
 * - buildPrismaCursorArgs / buildPaginationMeta (pagination.ts)
 * - projectsToListItems (mappers.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpPaginated } from '../_shared/response';
import type { PresentationListInput } from './schemas';
import { createPresentationListWidgetData } from '../../apps/widget-data';
import {
  buildPrismaCursorArgs,
  buildPaginationMeta,
} from '../_shared/pagination';
import { projectsToListItems } from './mappers';

/** Map the schema's sort_by field to Prisma column names */
const SORT_FIELD_MAP: Record<string, string> = {
  updated_at: 'updatedAt',
  created_at: 'createdAt',
  title: 'title',
};

/**
 * Handler for the presentation_list tool.
 */
export async function handlePresentationList(
  args: PresentationListInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { cursor, limit, include_deleted, sort_by, sort_order } = args;

  // Build Prisma where clause
  const where: Record<string, unknown> = {
    userId: auth.userId,
  };

  if (!include_deleted) {
    where.isDeleted = false;
  }

  // Build cursor-based pagination args
  const cursorArgs = buildPrismaCursorArgs(cursor, limit);

  // Resolve sort field
  const orderByField = SORT_FIELD_MAP[sort_by] ?? 'updatedAt';

  // Run query + count in parallel
  const [projects, totalCount] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: { [orderByField]: sort_order },
      take: cursorArgs.take,
      ...(cursorArgs.cursor ? { cursor: cursorArgs.cursor, skip: cursorArgs.skip } : {}),
    }),
    prisma.project.count({ where }),
  ]);

  // Build pagination metadata (handles the +1 peek record)
  const { items, pagination } = buildPaginationMeta(projects, cursorArgs.pageSize, totalCount);

  // Map to MCP-safe response (strips slides, renames to snake_case)
  const presentations = projectsToListItems(items);

  return mcpPaginated(presentations, pagination, {
    widget: createPresentationListWidgetData(presentations, pagination),
  });
}
