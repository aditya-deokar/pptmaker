/**
 * Core project-ownership lookup.
 *
 * Transport-neutral: accepts an explicit `userId` so it can serve Clerk
 * session flows (`src/actions/*`) and MCP AuthContexts (`src/mcp/**`)
 * without importing either auth stack. Nothing in `src/core` may import
 * from `@clerk/*`, `src/actions`, or `src/mcp`.
 */

import prisma from '@/lib/prisma';
import type { Project } from '@/generated/prisma';

export interface GetOwnedProjectOptions {
  /** If true, also match soft-deleted projects. */
  includeDeleted?: boolean;
}

/**
 * Find a project by ID and enforce ownership via userId.
 *
 * @param projectId - The project cuid to look up
 * @param userId - The authenticated user's internal UUID
 * @param opts - Optional flags (includeDeleted)
 * @returns The Project record if found and owned, null otherwise
 */
export async function findOwnedProject(
  projectId: string,
  userId: string,
  opts?: GetOwnedProjectOptions
): Promise<Project | null> {
  if (!projectId || !userId) {
    return null;
  }

  const where: {
    id: string;
    userId: string;
    isDeleted?: boolean;
  } = {
    id: projectId,
    userId,
  };

  // By default, exclude soft-deleted projects
  if (!opts?.includeDeleted) {
    where.isDeleted = false;
  }

  const project = await prisma.project.findFirst({ where });

  return project;
}
