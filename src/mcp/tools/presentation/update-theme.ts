/**
 * MCP Tool — presentation_update_theme
 *
 * Change the visual theme of a presentation.
 * Validates the theme name against the app's theme catalog before applying.
 *
 * Reuses:
 * - presentationUpdateThemeSchema (schemas.ts)
 * - getOwnedProjectForMcp (lib/mcp-project-access.ts)
 * - projectToPresentation (mappers.ts)
 * - isValidThemeName / getValidThemeNames (lib/theme-validator.ts)
 */

import prisma from '@/lib/prisma';
import type { AuthContext } from '../../auth/types';
import type { McpToolResponse } from '../_shared/response';
import { mcpSuccess } from '../_shared/response';
import { Errors } from '../_shared/errors';
import { createActionResultWidgetData } from '../../apps/widget-data';
import type { PresentationUpdateThemeInput } from './schemas';
import { getOwnedProjectForMcp } from '../../lib/mcp-project-access';
import { projectToPresentation } from './mappers';
import { isValidThemeName, getValidThemeNames } from '../../lib/theme-validator';

/**
 * Handler for the presentation_update_theme tool.
 */
export async function handlePresentationUpdateTheme(
  args: PresentationUpdateThemeInput,
  auth: AuthContext
): Promise<McpToolResponse> {
  const { presentation_id, theme_name } = args;

  // Validate theme name against catalog
  if (!isValidThemeName(theme_name)) {
    const validNames = getValidThemeNames();
    return Errors.validationError(
      `Invalid theme name '${theme_name}'. Valid themes: ${validNames.join(', ')}. ` +
      `Use the 'verto://themes' resource to browse all available themes.`
    );
  }

  // Ownership check
  const project = await getOwnedProjectForMcp(presentation_id, auth.userId);

  if (!project) {
    return Errors.notFound('Presentation', presentation_id);
  }

  // Apply theme
  const updated = await prisma.project.update({
    where: { id: project.id },
    data: { themeName: theme_name },
  });

  const presentation = projectToPresentation(updated);

  return mcpSuccess(presentation, {
    widget: createActionResultWidgetData({
      kind: 'update_theme',
      title: 'Theme updated',
      message: `The deck theme was changed to ${theme_name}.`,
      presentation,
    }),
  });
}
