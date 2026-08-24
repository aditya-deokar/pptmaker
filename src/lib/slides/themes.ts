/**
 * Theme token bridge (Phase D1 step 3).
 *
 * The dashboard historically consumed `--theme-*` CSS variables while the
 * MCP widget skin consumes `--vt-*`. Both derive from the same `Theme`
 * shape, so this module resolves tokens once and emits BOTH variable
 * namespaces together — any surface can now paint a themed slide canvas.
 */

import type { CSSProperties } from 'react';
import type { Theme } from '@/lib/types';
import { resolveThemeTokens } from '@/lib/themeUtils';

/**
 * Returns inline style properties setting both `--theme-*` (dashboard
 * convention) and `--vt-*` (widget/kernel convention) custom properties for
 * the given theme, so children — including kernel-rendered slide HTML —
 * resolve identical colors and fonts everywhere.
 */
export function getDualThemeVars(theme: Theme): CSSProperties {
  const tokens = resolveThemeTokens(theme);

  return {
    // Dashboard namespace
    '--theme-font': tokens.fontFamily,
    '--theme-heading-font': tokens.headingFontFamily,
    '--theme-color': tokens.fontColor,
    '--theme-accent': tokens.accentColor,
    '--theme-accent-gradient': tokens.accentGradient,
    '--theme-bg': tokens.backgroundColor,
    '--theme-surface': tokens.surfaceColor,
    '--theme-muted': tokens.mutedColor,

    // Kernel / widget namespace
    '--vt-accent': tokens.accentColor,
    '--vt-accent-gradient': tokens.accentGradient,
    '--vt-heading-font': tokens.headingFontFamily,
    '--vt-body-font': tokens.fontFamily,
    '--vt-radius': tokens.borderRadius,
    '--vt-shadow': tokens.shadow,
    '--vt-slide-bg': tokens.gradientBackground || theme.backgroundColor,
    '--vt-slide-bg-solid': theme.slideBackgroundColor || theme.backgroundColor,
    '--vt-slide-fg': theme.fontColor,
    '--vt-slide-muted': tokens.mutedColor,
  } as CSSProperties;
}

export { resolveThemeTokens };
