/**
 * MCP Tool — presentation_render_deck
 *
 * App-only presenter feed (plan 10 F2). Returns the full deck (metadata +
 * complete slide JSON) as a slim widget payload bound to the immersive
 * `deck-live` UI, so a host swaps the current widget view for the presenter
 * without any model round-trip.
 *
 * Reuses:
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 * - createDeckLiveWidgetData (apps/widget-data.ts)
 */

import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createDeckLiveWidgetData } from '../../apps/widget-data';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';

interface PresentationRenderDeckInput {
  presentation_id: string;
}

/**
 * Handler for the presentation_render_deck tool.
 */
export async function handlePresentationRenderDeck(
  args: PresentationRenderDeckInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id } = args;

  // Ownership-enforced lookup
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  const presentation = projectToPresentation(project, {
    includeSlides: true,
  });

  return mcpSuccess(presentation, {
    widget: createDeckLiveWidgetData(presentation),
  });
}
