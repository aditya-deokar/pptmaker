/**
 * MCP Tool — presentation_get
 *
 * Get a single presentation by ID.
 * Returns full metadata and optionally the complete slide JSON.
 * Enforces ownership via userId from AuthContext.
 *
 * Reuses:
 * - presentationGetSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 */

import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createDeckPreviewWidgetData } from '../../apps/widget-data';
import type { PresentationGetInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

/**
 * Handler for the presentation_get tool.
 */
export async function handlePresentationGet(
  args: PresentationGetInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id, include_slides } = args;

  // Ownership-enforced lookup
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Transform to MCP-safe response
  const presentation = projectToPresentation(project, {
    includeSlides: include_slides,
  });

  return mcpSuccess(presentation, {
    widget: createDeckPreviewWidgetData(presentation),
  });
}
