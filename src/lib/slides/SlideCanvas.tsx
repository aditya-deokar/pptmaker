'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  ensureSlideRendererStyles,
  renderSlideContent,
} from './render-core/index';

export interface SlideCanvasProps {
  /** ContentItem tree (or fragment) from Slide.content. */
  content: unknown;
  /** Optional CSS class for the outer wrapper. */
  className?: string;
}

/**
 * React mount point for the shared slide-render kernel (Phase D1).
 *
 * Renders a slide's ContentItem tree through the exact same vanilla
 * implementation the MCP widgets bundle — one renderer across dashboard
 * preview surfaces (viewer / present / share) and in-chat widgets.
 *
 * Use this for NON-EDITING surfaces only; the interactive editor keeps its
 * React components (drag, drop zones, inline textareas) and falls back to
 * this canvas for types it does not implement natively.
 */
export function SlideCanvas({ content, className }: SlideCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const html = useMemo(() => renderSlideContent(content), [content]);

  // The kernel injects a <style> tag into <head> on first render; do it in
  // an effect so SSR passes stay clean.
  useEffect(() => {
    ensureSlideRendererStyles();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      data-vts-canvas=""
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default SlideCanvas;
