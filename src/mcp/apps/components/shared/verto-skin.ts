/**
 * Verto Skin — shared design foundation for MCP Apps widgets (plan 10 §5).
 *
 * Layers:
 *  1. Design tokens mirroring the dashboard `globals.css` (brand gradient,
 *     vivid accents, glass panels, dotted-grid canvas, radius/shadow scale).
 *  2. Deck-theme engine: `setWidgetTheme()` resolves a catalog theme into
 *     `--vt-*` CSS variables exactly like `src/lib/themeUtils.ts` does for
 *     the editor, sourced from generated/themes-data.ts.
 *  3. Host adaptation: host theme/fonts/hover/safe-area context is adopted
 *     before the Verto skin is applied and re-applied on context changes.
 *  4. Motion kit + focus rings, all gated by `prefers-reduced-motion`.
 *  5. Deep-link helpers (`openVertoLink`, overflow menu) for plan F9.
 *
 * This module must stay dependency-free of `runtime.ts` (runtime wires it in).
 */

import type { App } from '@modelcontextprotocol/ext-apps';
import {
  applyDocumentTheme,
  applyHostFonts,
  getDocumentTheme,
} from '@modelcontextprotocol/ext-apps';
import { VERTO_THEMES, type VertoThemeData } from '../../generated/themes-data';

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface ResolvedVertoTheme {
  name: string;
  type: 'light' | 'dark';
  fontFamily: string;
  headingFontFamily: string;
  fontColor: string;
  accentColor: string;
  accentGradient: string;
  backgroundColor: string;
  surfaceColor: string;
  mutedColor: string;
  borderRadius: string;
  shadow: string;
  /** Painted slide background: gradient when the theme provides one. */
  slideBackground: string;
  /** Opaque representative color of `slideBackground` (gradient-averaged). */
  slideBackgroundSolid: string;
  /** Contrast-safe solid foreground for text painted on `slideBackground`. */
  slideForeground: string;
  /** Solid muted foreground derived from `slideForeground` vs background. */
  slideMutedForeground: string;
}

/**
 * Full widget stylesheet. Keeps every class from the former `baseStyles`
 * (.row/.bar/.fill/.slides/.slide/…) so existing widgets keep working, while
 * re-skinning them with Verto tokens.
 */
export const vertoSkinStyles = `
  :root {
    color-scheme: light dark;

    /* Host-adaptive chrome */
    --bg: #fbfbfc;
    --fg: #18181b;
    --muted: #6b7280;
    --line: #d7dce2;
    --accent: #0f766e;
    --accent-soft: #ccfbf1;
    --surface: #ffffff;

    /* Verto brand language (globals.css) */
    --vt-brand-gradient: linear-gradient(135deg, #ef4444 0%, #f97316 100%);
    --vt-vivid-gradient: linear-gradient(180deg, #F55C7A 0%, #F6BC66 100%);
    --vt-glass-bg: rgba(255, 255, 255, 0.06);
    --vt-glass-border: rgba(255, 255, 255, 0.1);
    --vt-glass-blur: blur(12px);

    /* Deck-theme layer — neutral defaults until setWidgetTheme() resolves */
    --vt-accent: var(--accent);
    --vt-fill: var(--vt-brand-gradient);
    --vt-accent-gradient: var(--vt-brand-gradient);
    --vt-heading-font: inherit;
    --vt-body-font: inherit;
    --vt-radius: 12px;
    --vt-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    --vt-slide-bg: var(--surface);
    --vt-slide-fg: var(--fg);
    --vt-slide-muted: var(--muted);

    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #0b0c0f;
      --fg: #f4f4f5;
      --muted: #a1a1aa;
      --line: #2f333a;
      --accent: #5eead4;
      --accent-soft: #123532;
      --surface: #111318;
      --vt-glass-bg: rgba(255, 255, 255, 0.06);
      --vt-glass-border: rgba(255, 255, 255, 0.1);
    }
  }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-width: 260px;
    background: var(--bg);
    color: var(--fg);
    font-size: 14px;
    line-height: 1.45;
  }
  main {
    position: relative;
    width: 100%;
    min-height: 180px;
    padding: 18px;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 8px;
  }
  h1 {
    margin: 0 0 12px;
    font-size: 18px;
    line-height: 1.25;
    letter-spacing: 0;
  }
  .muted { color: var(--muted); }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    border-top: 1px solid var(--line);
    padding: 10px 0;
  }
  .row:first-of-type { border-top: 0; }
  .label { color: var(--muted); }
  .value { font-weight: 650; text-align: right; overflow-wrap: anywhere; }
  .bar {
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--line) 70%, transparent);
    margin: 14px 0 6px;
  }
  .fill {
    width: var(--progress, 0%);
    height: 100%;
    background: var(--vt-fill);
    transition: width 180ms ease;
  }
  .slides {
    display: grid;
    gap: 8px;
    margin-top: 12px;
  }
  .slide {
    border: 1px solid var(--line);
    border-radius: var(--vt-radius);
    padding: 10px;
    background: color-mix(in srgb, var(--surface) 88%, var(--accent-soft));
  }
  .slide-title {
    font-weight: 650;
    overflow-wrap: anywhere;
  }
  .status {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    padding: 3px 8px;
    background: var(--accent-soft);
    color: var(--fg);
    font-size: 12px;
    font-weight: 650;
  }
  a {
    color: var(--accent);
    font-weight: 650;
    text-decoration: none;
  }

  /* Focus rings (Phase 9H keyboard checks) */
  :focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  button:focus-visible,
  a:focus-visible,
  summary:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 55%, transparent);
  }

  /* Verto utilities shared across widgets */
  .vt-glass {
    background: var(--vt-glass-bg);
    backdrop-filter: var(--vt-glass-blur);
    -webkit-backdrop-filter: var(--vt-glass-blur);
    border: 1px solid var(--vt-glass-border);
  }
  .vt-dotted-grid {
    background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
    background-size: 24px 24px;
  }
  .vt-swatch {
    display: inline-block;
    flex: none;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: var(--vt-accent-gradient);
    box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.35);
  }

  /* Themed slide surface: painted like SlideCanvas (gradient + dotted grid).
   * The solid underlay keeps the computed background-color opaque so embedded
   * tooling (and the QA contrast sampler) always resolves an effective
   * background, even when the paint itself is a gradient (plan 10G F12). */
  .vt-slide-surface {
    position: relative;
    background-color: var(--vt-slide-bg-solid, var(--surface));
    background-image: var(--vt-slide-bg-image, none);
    color: var(--vt-slide-fg);
    font-family: var(--vt-body-font);
    border-radius: var(--vt-radius);
    box-shadow: var(--vt-shadow);
    overflow: hidden;
  }
  .vt-slide-surface::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background-image: radial-gradient(circle, currentColor 1px, transparent 1px);
    background-size: 24px 24px;
    opacity: 0.05;
  }
  .vt-slide-surface > * { position: relative; z-index: 1; }
  .vt-slide-heading {
    font-family: var(--vt-heading-font);
    color: var(--vt-slide-fg);
  }
  .vt-slide-muted { color: var(--vt-slide-muted); }

  /* Deep-link overflow menu (plan F9) */
  main > .vt-links {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 6;
  }
  .vt-menu { position: relative; display: inline-block; }
  .vt-menu-btn {
    list-style: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 36px;
    height: 36px;
    border: 1px solid color-mix(in srgb, var(--line) 70%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface) 75%, transparent);
    color: var(--fg);
    cursor: pointer;
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    user-select: none;
  }
  .vt-menu-btn::-webkit-details-marker { display: none; }
  .vt-menu[open] .vt-menu-btn {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    color: var(--accent);
  }
  .vt-menu-list {
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    min-width: 184px;
    margin: 0;
    padding: 6px;
    display: grid;
    gap: 2px;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: var(--surface);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.18), 0 4px 6px -4px rgba(0, 0, 0, 0.12);
  }
  .vt-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: 8px;
    padding: 9px 10px;
    color: var(--fg);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }
  .vt-menu-item:hover {
    background: color-mix(in srgb, var(--accent) 10%, transparent);
    color: var(--accent);
  }

  /* Motion kit — every animation is gated below */
  @keyframes vt-fade-slide-in {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes vt-shimmer {
    from { background-position: -200% 0; }
    to { background-position: 200% 0; }
  }
  .vt-animate-in { animation: vt-fade-slide-in 260ms ease both; }
  .vt-skeleton {
    background: linear-gradient(
      90deg,
      color-mix(in srgb, var(--line) 40%, transparent) 25%,
      color-mix(in srgb, var(--line) 70%, transparent) 50%,
      color-mix(in srgb, var(--line) 40%, transparent) 75%
    );
    background-size: 200% 100%;
    animation: vt-shimmer 1400ms ease-in-out infinite;
  }

  /* ---------------------------------------------------------------- */
  /* Plan 10 F10 — host-adaptive layout.                               */
  /* Root classes are driven from host context (attachHostAdaptation): */
  /*   .vt-mobile   platform === 'mobile'                              */
  /*   .vt-touch    deviceCapabilities.touch === true                  */
  /*   .vt-narrow   viewport ≤560px (matchMedia watcher)               */
  /*   .vt-pip      displayMode === 'pip' → compact variant            */
  /*   .vt-fullscreen  displayMode === 'fullscreen'                    */
  /* Safe-area insets arrive as --vt-safe-* variables.                 */
  /* ---------------------------------------------------------------- */
  body {
    padding:
      var(--vt-safe-top, 0px)
      var(--vt-safe-right, 0px)
      var(--vt-safe-bottom, 0px)
      var(--vt-safe-left, 0px);
  }

  /* Touch-first hosts get ≥44px hit targets on primary controls. */
  :is(.vt-mobile, .vt-touch, .vt-narrow) button {
    min-height: 44px;
  }
  :is(.vt-mobile, .vt-touch, .vt-narrow)
    :is(.button, .pill-btn, .ts-button, .pc-button, .vte-btn, .ts-tab) {
    min-height: 46px;
    font-size: 15px;
  }
  :is(.vt-mobile, .vt-touch, .vt-narrow) .reorder-btn {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
  :is(.vt-mobile, .vt-touch, .vt-narrow) .vt-menu-btn {
    min-width: 44px;
    height: 44px;
  }
  :is(.vt-mobile, .vt-touch, .vt-narrow) .ts-search {
    min-height: 44px;
  }

  /* Bottom-sheet-style action footers on small surfaces. */
  :is(.vt-mobile, .vt-narrow) :is(.vte-foot, .pc-manage) {
    position: sticky;
    bottom: calc(var(--vt-safe-bottom, 0px) + 4px);
    z-index: 4;
    border-radius: 12px;
    padding: 8px;
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    box-shadow: 0 -6px 20px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }

  /* Hover-only affordances disappear on touch hosts. */
  .vt-no-hover [data-hover-only] {
    display: none;
  }

  /* Compact picture-in-picture variant. */
  .vt-pip main {
    padding: 10px;
    border-radius: 10px;
  }
  .vt-pip h1 {
    margin-bottom: 6px;
    font-size: 15px;
  }
  .vt-pip .deck-shell,
  .vt-pip .result-shell,
  .vt-pip .generation-shell,
  .vt-pip .ts-shell,
  .vt-pip .pc-shell,
  .vt-pip .live-shell {
    gap: 8px;
    padding: 10px;
    min-height: 0;
  }
  .vt-pip .filmstrip,
  .vt-pip .timeline-panel,
  .vt-pip .preview-panel,
  .vt-pip .stage-grid {
    display: none;
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation: none !important;
      transition: none !important;
    }
  }
`;

const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  soft: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  medium: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
  dramatic: '0 10px 15px -3px rgba(0,0,0,0.15), 0 4px 6px -4px rgba(0,0,0,0.1)',
};

const DEFAULT_THEME_NAME = 'Default';

/**
 * Ported from src/lib/themeUtils.ts so widgets resolve identical tokens.
 */
export function resolveThemeTokens(theme: VertoThemeData): ResolvedVertoTheme {
  const headingFontFamily = theme.headingFontFamily || theme.fontFamily;
  const accentGradient =
    theme.accentGradient ||
    `linear-gradient(135deg, ${theme.accentColor}, ${theme.accentColor}cc)`;
  const surfaceColor =
    theme.surfaceColor ||
    (theme.type === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)');
  const mutedColor =
    theme.mutedColor ||
    (theme.type === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)');
  const borderRadius = theme.borderRadius || '12px';
  const shadow = SHADOW_MAP[theme.shadowPreset || 'soft'];
  const slideBackground =
    theme.gradientBackground || theme.slideBackgroundColor || theme.backgroundColor;
  const base = parseColor(slideBackground) || { r: 255, g: 255, b: 255, a: 1 };
  const preferred = parseColor(theme.fontColor);
  const slideForeground = toHex(readableOn(preferred, base));
  const slideMutedForeground = mutedVariant(slideForeground, base);

  return {
    name: theme.name,
    type: theme.type,
    fontFamily: theme.fontFamily,
    headingFontFamily,
    fontColor: theme.fontColor,
    accentColor: theme.accentColor,
    accentGradient,
    backgroundColor: theme.backgroundColor,
    surfaceColor,
    mutedColor,
    borderRadius,
    shadow,
    slideBackground,
    slideBackgroundSolid: toHex(base),
    slideForeground,
    slideMutedForeground,
  };
}

export function findTheme(name: string | null | undefined): VertoThemeData | null {
  if (!name) return null;
  const needle = name.trim().toLowerCase();
  if (!needle) return null;
  const exact = VERTO_THEMES.find((theme) => theme.name.toLowerCase() === needle);
  if (exact) return exact;
  return (
    VERTO_THEMES.find((theme) => theme.name.toLowerCase().startsWith(needle)) || null
  );
}

function defaultTheme(): VertoThemeData | null {
  return findTheme(DEFAULT_THEME_NAME);
}

/**
 * Resolves `themeName` into `--vt-*` custom properties on the document root.
 * Unknown names fall back to the Default theme; returns null when neither
 * the name nor the catalog default can be resolved.
 */
export function setWidgetTheme(themeName: string | null | undefined): ResolvedVertoTheme | null {
  const theme = findTheme(themeName) || defaultTheme();
  if (!theme) return null;

  const tokens = resolveThemeTokens(theme);
  const root = document.documentElement.style;

  root.setProperty('--vt-accent', tokens.accentColor);
  root.setProperty('--vt-accent-gradient', tokens.accentGradient);
  root.setProperty('--vt-fill', tokens.accentGradient);
  root.setProperty('--vt-heading-font', tokens.headingFontFamily);
  root.setProperty('--vt-body-font', tokens.fontFamily);
  root.setProperty('--vt-radius', tokens.borderRadius);
  root.setProperty('--vt-shadow', tokens.shadow);
  root.setProperty('--vt-slide-bg', tokens.slideBackground);
  root.setProperty('--vt-slide-bg-solid', tokens.slideBackgroundSolid);

  // Plan 10G F12: gradients ride on background-image so the element keeps
  // an opaque computed background-color for contrast resolution.
  if (/gradient\(/i.test(tokens.slideBackground)) {
    root.setProperty('--vt-slide-bg-image', tokens.slideBackground);
  } else {
    root.setProperty('--vt-slide-bg-image', 'none');
  }

  root.setProperty('--vt-slide-fg', tokens.slideForeground);
  root.setProperty('--vt-slide-muted', tokens.slideMutedForeground);

  // Light/dark-variant styling hook for themed components (callouts, etc.).
  document.documentElement.dataset.vtTheme = tokens.type;

  return tokens;
}

/**
 * Adjusts a foreground color until it clears `minRatio`:1 against
 * `backgroundCss`. Returns the input unchanged when it already passes or
 * cannot be parsed. Used by the slide renderer to keep accent-colored text
 * (stat values, badges) readable across all 65 catalog themes.
 */
export function ensureReadable(
  foregroundCss: string,
  backgroundCss: string,
  minRatio = 4.5
): string {
  const fg = parseColor(foregroundCss);
  const bg = parseColor(backgroundCss);
  if (!fg || !bg) return foregroundCss;

  const opaqueFg: RgbColor = { ...fg, a: 1 };
  if (contrastRatio(opaqueFg, bg) >= minRatio) return foregroundCss;

  const white: RgbColor = { r: 255, g: 255, b: 255, a: 1 };
  const black: RgbColor = { r: 17, g: 17, b: 20, a: 1 };
  const target = contrastRatio(black, bg) >= contrastRatio(white, bg) ? black : white;

  let t = 0.15;
  while (t <= 1) {
    const candidate = mix(bg, target, t);
    if (contrastRatio(candidate, bg) >= minRatio) {
      return toHex(candidate);
    }
    t += 0.1;
  }
  return toHex(target);
}

/**
 * Reads the deck's theme name out of any payload shape (v2 contract fields,
 * snake_case fallbacks, list items, or raw presentation data).
 */
export function extractThemeName(payload: Record<string, unknown>): string | null {
  const widget = isRecord(payload.widget) ? payload.widget : {};

  const direct =
    readStringField(widget, 'themeName') || readStringField(widget, 'theme_name');
  if (direct) return direct;

  const presentation = isRecord(widget.presentation) ? widget.presentation : {};
  const fromPresentation =
    readStringField(presentation, 'themeName')
    || readStringField(presentation, 'theme_name');
  if (fromPresentation) return fromPresentation;

  const data = isRecord(payload.data) ? payload.data : {};
  const nestedPresentation = isRecord(data.presentation) ? data.presentation : data;
  const fromLegacy =
    readStringField(nestedPresentation, 'theme_name')
    || readStringField(nestedPresentation, 'themeName');
  if (fromLegacy) return fromLegacy;

  const items = Array.isArray(widget.presentations) ? widget.presentations : [];
  for (const item of items) {
    const record = isRecord(item) ? item : {};
    const itemTheme =
      readStringField(record, 'themeName') || readStringField(record, 'theme_name');
    if (itemTheme && !record.isDeleted && !record.is_deleted) return itemTheme;
  }

  return null;
}

/* ------------------------------------------------------------------ */
/* Color helpers — WCAG-safe text on arbitrary theme surfaces          */
/* ------------------------------------------------------------------ */

function parseColor(value: string): RgbColor | null {
  if (!value) return null;

  if (/gradient\(/i.test(value)) {
    const stops = value.match(/(?:#[0-9a-f]{3,8}|rgba?\([^)]*\))/gi) || [];
    const first = parseColor(stops[0] ?? '');
    const last = stops.length > 1 ? parseColor(stops[stops.length - 1] ?? '') : null;
    if (first && last) {
      return {
        r: Math.round((first.r + last.r) / 2),
        g: Math.round((first.g + last.g) / 2),
        b: Math.round((first.b + last.b) / 2),
        a: Math.max(first.a, last.a),
      };
    }
    return first;
  }

  const hex = /^#([0-9a-f]{3,8})$/i.exec(value.trim());
  if (hex) {
    const digits = hex[1];
    const expand = (chunk: string) => parseInt(chunk, 16);
    if (digits.length === 3 || digits.length === 4) {
      const [r, g, b, a] = digits.split('').map((char) => expand(char + char));
      return { r, g, b, a: digits.length === 4 ? a / 255 : 1 };
    }
    if (digits.length === 6 || digits.length === 8) {
      return {
        r: expand(digits.slice(0, 2)),
        g: expand(digits.slice(2, 4)),
        b: expand(digits.slice(4, 6)),
        a: digits.length === 8 ? expand(digits.slice(6, 8)) / 255 : 1,
      };
    }
    return null;
  }

  const rgb = /rgba?\(([^)]+)\)/i.exec(value);
  if (rgb) {
    const parts = rgb[1].split(/\s*,\s*|\s+/).filter(Boolean).map(Number.parseFloat);
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return {
        r: clampChannel(parts[0]),
        g: clampChannel(parts[1]),
        b: clampChannel(parts[2]),
        a: parts[3] === undefined || !Number.isFinite(parts[3]) ? 1 : parts[3],
      };
    }
  }

  return null;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function relativeLuminance(color: RgbColor): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return channel(color.r) * 0.2126 + channel(color.g) * 0.7152 + channel(color.b) * 0.0722;
}

function contrastRatio(a: RgbColor, b: RgbColor): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

function mix(foreground: RgbColor, background: RgbColor, t: number): RgbColor {
  return {
    r: clampChannel(background.r + (foreground.r - background.r) * t),
    g: clampChannel(background.g + (foreground.g - background.g) * t),
    b: clampChannel(background.b + (foreground.b - background.b) * t),
    a: 1,
  };
}

function toHex(color: RgbColor): string {
  const part = (value: number) => clampChannel(value).toString(16).padStart(2, '0');
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

/** Preferred color when it passes WCAG, otherwise black/white — max contrast. */
function readableOn(preferred: RgbColor | null, background: RgbColor): RgbColor {
  const white: RgbColor = { r: 255, g: 255, b: 255, a: 1 };
  const black: RgbColor = { r: 17, g: 17, b: 20, a: 1 };

  if (preferred) {
    const opaque: RgbColor = { ...preferred, a: 1 };
    const onBackground = mix(opaque, background, 1 - opaque.a);
    if (contrastRatio(onBackground, background) >= 4.5) return onBackground;
  }

  return contrastRatio(black, background) >= contrastRatio(white, background)
    ? black
    : white;
}

/** Solid "muted" variant that still clears 4.5:1 against the background. */
function mutedVariant(foreground: string, background: RgbColor): string {
  const fg = parseColor(foreground);
  if (!fg) return foreground;

  let strength = 0.68;
  while (strength > 0) {
    const candidate = mix(background, fg, strength);
    if (contrastRatio(candidate, background) >= 4.5) return toHex(candidate);
    strength -= 0.06;
  }
  return foreground;
}

/* ------------------------------------------------------------------ */
/* Host adaptation                                                     */
/* ------------------------------------------------------------------ */

type HostContextListener = () => void;

let openLinkHost: App | null = null;

/**
 * Registers host-context handling. Must run BEFORE `app.connect()` so the
 * change listener never misses the handshake burst; call the returned
 * refresh once connect resolves to adopt the initial context.
 */
export function attachHostAdaptation(app: App): HostContextListener {
  openLinkHost = app;
  installNarrowViewportWatcher();

  app.onhostcontextchanged = () => {
    applyHostContext(app);
  };

  return () => applyHostContext(app);
}

function applyHostContext(app: App): void {
  const context = app.getHostContext();
  if (!context) return;

  const root = document.documentElement;

  if (context.theme === 'dark' || context.theme === 'light') {
    applyDocumentTheme(context.theme);
  } else {
    // Plan 10 F11: hosts that force a scheme without announcing it in the
    // context still leave a document theme behind — adopt it so widgets
    // never flash the wrong scheme before the Verto skin applies.
    try {
      const documentTheme = getDocumentTheme();

      if (documentTheme === 'dark' || documentTheme === 'light') {
        applyDocumentTheme(documentTheme);
      }
    } catch {
      // getDocumentTheme is best-effort; system preference stands.
    }
  }

  const fonts = context.styles?.css?.fonts;
  if (fonts) {
    try {
      applyHostFonts(fonts);
    } catch {
      // Host font CSS is best-effort; system stacks remain as fallback.
    }
  }

  root.classList.toggle(
    'vt-no-hover',
    context.deviceCapabilities?.hover === false
  );
  root.classList.toggle(
    'vt-touch',
    context.deviceCapabilities?.touch === true
  );

  // Plan 10 F10: host platform + display mode drive the adaptive layout.
  root.classList.toggle('vt-mobile', context.platform === 'mobile');
  root.classList.toggle('vt-pip', context.displayMode === 'pip');
  root.classList.toggle('vt-fullscreen', context.displayMode === 'fullscreen');
  root.dataset.vtDisplayModes = (context.availableDisplayModes ?? []).join(',');

  const style = document.documentElement.style;
  if (context.safeAreaInsets) {
    style.setProperty('--vt-safe-top', `${context.safeAreaInsets.top}px`);
    style.setProperty('--vt-safe-right', `${context.safeAreaInsets.right}px`);
    style.setProperty('--vt-safe-bottom', `${context.safeAreaInsets.bottom}px`);
    style.setProperty('--vt-safe-left', `${context.safeAreaInsets.left}px`);
  }
}

let narrowWatcherInstalled = false;

/** Mirrors ≤560px viewports into a `.vt-narrow` class for basic-hosts that
 * never report a mobile platform. */
function installNarrowViewportWatcher(): void {
  if (narrowWatcherInstalled) return;
  narrowWatcherInstalled = true;

  const apply = () => {
    document.documentElement.classList.toggle('vt-narrow', window.innerWidth <= 560);
  };

  apply();

  if (typeof window.matchMedia === 'function') {
    try {
      window.matchMedia('(max-width: 560px)').addEventListener('change', apply);
    } catch {
      window.addEventListener('resize', apply);
    }
  }
}

/**
 * Whether the host advertised fullscreen display support. `null` when the
 * host did not advertise any modes (assume yes — the presenter falls back
 * to its inline stage regardless).
 */
export function canPresentFullscreen(): boolean | null {
  const raw = document.documentElement.dataset.vtDisplayModes;

  if (raw == null || raw.trim() === '') return null;

  return raw.split(',').map((mode) => mode.trim()).includes('fullscreen');
}

/* ------------------------------------------------------------------ */
/* Deep links (plan F9)                                                */
/* ------------------------------------------------------------------ */

export interface WidgetLinks {
  editorUrl?: string | null;
  presentUrl?: string | null;
  shareUrl?: string | null;
}

/** True when the connected host advertised `openLinks` support. */
export function canOpenLinks(app: App | null): boolean {
  return Boolean(app?.getHostCapabilities?.()?.openLinks);
}

/**
 * Opens a dashboard URL through the host when possible, falling back to a
 * plain browser navigation (standalone preview / capability-less hosts).
 */
export async function openVertoLink(url: string): Promise<void> {
  if (!url) return;

  const app = openLinkHost;
  if (app && canOpenLinks(app)) {
    try {
      const result = await app.openLink({ url });
      if (result && result.isError) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    } catch {
      // Fall through to plain navigation.
    }
  }

  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Derives deep links from v2 `links` contract fields or older payloads
 * (`openUrl`/`shareUrl`), so menus work against cached/host-provided v1 data.
 */
export function extractWidgetLinks(payload: Record<string, unknown>): WidgetLinks {
  const widget = isRecord(payload.widget) ? payload.widget : {};
  const explicit = isRecord(widget.links) ? widget.links : {};

  const presentation = isRecord(widget.presentation) ? widget.presentation : {};
  const data = isRecord(payload.data) ? payload.data : {};
  const legacyPresentation = isRecord(data.presentation) ? data.presentation : data;

  const editorUrl =
    readStringField(explicit, 'editorUrl')
    ?? readStringField(presentation, 'editorUrl')
    ?? readStringField(presentation, 'openUrl')
    ?? readStringField(presentation, 'open_url')
    ?? readStringField(legacyPresentation, 'open_url');

  const shareUrl =
    readStringField(explicit, 'shareUrl')
    ?? readStringField(presentation, 'shareUrl')
    ?? readStringField(presentation, 'share_url')
    ?? readStringField(legacyPresentation, 'share_url');

  let presentUrl = readStringField(explicit, 'presentUrl');
  if (!presentUrl && editorUrl) {
    presentUrl = editorUrl.includes('/presentation/')
      ? editorUrl.replace('/presentation/', '/present/')
      : null;
  }

  return { editorUrl, presentUrl, shareUrl };
}

/**
 * Renders an overflow menu ("Open in editor" / "Present" / "Share") using a
 * native `<details>` disclosure — keyboard accessible without extra script.
 * The container is left empty when no links are available.
 */
export function renderDeepLinkMenu(
  container: HTMLElement | null | undefined,
  links: WidgetLinks
): void {
  if (!container) return;

  container.textContent = '';

  const entries: Array<[string, string]> = [];
  if (links.editorUrl) entries.push(['Open in editor', links.editorUrl]);
  if (links.presentUrl) entries.push(['Present', links.presentUrl]);
  if (links.shareUrl) entries.push(['Share link', links.shareUrl]);

  if (entries.length === 0) return;

  const menu = document.createElement('details');
  menu.className = 'vt-menu';

  const summary = document.createElement('summary');
  summary.className = 'vt-menu-btn';
  summary.textContent = '⋯';
  summary.setAttribute('aria-label', 'Open this presentation in Verto');
  menu.appendChild(summary);

  const list = document.createElement('div');
  list.className = 'vt-menu-list';

  for (const [label, href] of entries) {
    const item = document.createElement('a');
    item.className = 'vt-menu-item';
    item.href = href;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    item.textContent = label;
    item.addEventListener('click', (event) => {
      event.preventDefault();
      menu.removeAttribute('open');
      void openVertoLink(href);
    });
    list.appendChild(item);
  }

  menu.appendChild(list);

  menu.addEventListener('focusout', (event) => {
    if (menu.contains(event.relatedTarget as Node)) return;
    menu.removeAttribute('open');
  });

  container.appendChild(menu);
}

/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readStringField(
  record: Record<string, unknown>,
  key: string
): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value : null;
}
