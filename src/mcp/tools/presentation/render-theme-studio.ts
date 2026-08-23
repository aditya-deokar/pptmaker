/**
 * MCP Tool — presentation_render_theme_studio
 *
 * App-only entry point for the visual theme browser (plan 10 F4). Returns
 * the deck's presentation context plus the full theme catalog bound to the
 * `theme-studio` UI, so a host swaps the current view for the studio
 * without any model round-trip.
 *
 * Reuses:
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 * - createThemeStudioWidgetData (apps/widget-data.ts)
 */

import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createThemeStudioWidgetData } from '../../apps/widget-data';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

interface PresentationRenderThemeStudioInput {
  presentation_id: string;
}

/**
 * Handler for the presentation_render_theme_studio tool.
 */
export async function handlePresentationRenderThemeStudio(
  args: PresentationRenderThemeStudioInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id } = args;

  // Ownership-enforced lookup
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  const presentation = projectToPresentation(project, {
    includeSlides: false,
  });

  return mcpSuccess(presentation, {
    widget: createThemeStudioWidgetData({ presentation }),
  });
}
