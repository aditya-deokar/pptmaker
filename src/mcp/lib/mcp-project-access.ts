/**
 * MCP Data Access — Transport-Agnostic Project Ownership
 *
 * Thin re-export of the shared `src/core` implementation, which accepts a
 * `userId` directly from the MCP AuthContext, making it usable from both
 * stdio and HTTP transports. The Clerk-coupled dashboard variant wraps the
 * same function from `src/actions/project-access.ts`.
 */

export {
  findOwnedProject as getOwnedProjectForMcp,
  type GetOwnedProjectOptions,
} from '@/core/projects/ownership';
