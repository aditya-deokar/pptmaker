/**
 * Slide-render kernel color utilities — WCAG-safe text on arbitrary theme
 * surfaces. Framework-free so both the MCP widget bundles (esbuild IIFE)
 * and the React dashboard can share one implementation.
 *
 * Extracted verbatim from `src/mcp/apps/components/shared/verto-skin.ts`,
 * which now re-exports from here.
 */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function parseColor(value: string): RgbColor | null {
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

export function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function relativeLuminance(color: RgbColor): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return channel(color.r) * 0.2126 + channel(color.g) * 0.7152 + channel(color.b) * 0.0722;
}

export function contrastRatio(a: RgbColor, b: RgbColor): number {
  const lighter = Math.max(relativeLuminance(a), relativeLuminance(b));
  const darker = Math.min(relativeLuminance(a), relativeLuminance(b));
  return (lighter + 0.05) / (darker + 0.05);
}

export function mix(foreground: RgbColor, background: RgbColor, t: number): RgbColor {
  return {
    r: clampChannel(background.r + (foreground.r - background.r) * t),
    g: clampChannel(background.g + (foreground.g - background.g) * t),
    b: clampChannel(background.b + (foreground.b - background.b) * t),
    a: 1,
  };
}

export function toHex(color: RgbColor): string {
  const part = (value: number) => clampChannel(value).toString(16).padStart(2, '0');
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

/** Preferred color when it passes WCAG, otherwise black/white — max contrast. */
export function readableOn(preferred: RgbColor | null, background: RgbColor): RgbColor {
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
export function mutedVariant(foreground: string, background: RgbColor): string {
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
