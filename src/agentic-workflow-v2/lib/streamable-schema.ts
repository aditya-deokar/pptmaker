// lib/streamable-schema.ts - Zod Schema for Streamable Single-Prompt Presentation Generation
//
// Simplified schema for reliable AI output. Only includes content types
// the model can consistently produce well. Old slides with deprecated
// types still render — this only constrains NEW generation output.

import { z } from "zod";

// ─────────────────────────────────────────────────────
// ContentItem type enum — curated set
// ─────────────────────────────────────────────────────

const CONTENT_ITEM_TYPES = [
  // Containers
  "column",       // root + sub-containers
  // Headings
  "heading1",     // slide titles
  "heading2",     // sub-headings, stat values
  "heading3",     // tertiary headings
  // Body
  "paragraph",    // body text (1-3 sentences)
  "blockquote",   // pull quotes, testimonials
  // Lists
  "bulletList",   // unordered items (string[])
  "numberedList", // ordered steps (string[])
  // Media
  "image",        // Unsplash URL or [IMAGE: query]
  // Interactive
  "customButton", // CTA labels
  // Data
  "statBox",      // metric card: [heading2, paragraph]
  // Decorative
  "divider",      // separator (content = "")
] as const;

// ─────────────────────────────────────────────────────
// ContentItem schema (recursive)
// ─────────────────────────────────────────────────────

const contentItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().describe("Unique element ID, e.g. 'h1-101', 'col-100'"),

    type: z.enum(CONTENT_ITEM_TYPES).describe("Content item type"),

    name: z.string().describe("Short display name, e.g. 'root', 'title', 'cta'"),

    /**
     * Content payload — shape depends on `type`:
     *   column / statBox   → ContentItem[]
     *   bulletList / numberedList → string[]
     *   everything else    → string
     */
    content: z
      .union([
        z.string(),
        z.array(z.string()),
        z.array(contentItemSchema),
      ])
      .describe("string for leaves, string[] for lists, ContentItem[] for containers"),

    className: z.string().optional().describe("Optional Tailwind classes"),

    alt: z.string().optional().describe("Required when type === 'image'"),
  })
);

export type ContentItem = z.infer<typeof contentItemSchema>;

// ─────────────────────────────────────────────────────
// Slide schema
// ─────────────────────────────────────────────────────

export const streamableSlideSchema = z.object({
  id: z.string().describe("Unique slide ID"),

  type: z.string().describe("Layout type, e.g. 'creativeHero', 'titleAndContent'"),

  content: contentItemSchema.describe("Root content node — must be type 'column'"),

  className: z.string().optional().describe("Tailwind classes for slide wrapper"),

  slideName: z.string().describe("Human-readable name, e.g. 'Introduction'"),

  slideOrder: z.number().int().min(0).describe("0-indexed position in deck"),
});

export type StreamableSlide = z.infer<typeof streamableSlideSchema>;

// ─────────────────────────────────────────────────────
// Presentation schema
// ─────────────────────────────────────────────────────

export const streamablePresentationSchema = z
  .array(streamableSlideSchema)
  .min(5)
  .max(20)
  .describe("Ordered array of 5–20 slides.");

export type StreamablePresentation = z.infer<typeof streamablePresentationSchema>;

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────

/**
 * Check whether a partially-streamed slide has enough data to render.
 *
 * Requires:
 *   1. slideName and type present
 *   2. Root content has type and name
 *   3. Root content array has ≥ 2 children (title + at least one body element)
 */
export function isSlideRenderable(slide: Partial<StreamableSlide>): boolean {
  if (!slide) return false;
  if (!slide.slideName || !slide.type) return false;

  const root = slide.content as any;
  if (!root) return false;
  if (!root.type || !root.name) return false;

  if (Array.isArray(root.content)) {
    return root.content.length >= 2;
  }

  if (typeof root.content === "string") {
    return root.content.length > 0;
  }

  return false;
}

/**
 * Sort slides by slideOrder. Slides without slideOrder go to the end.
 */
export function sortSlides(slides: StreamableSlide[]): StreamableSlide[] {
  return [...slides].sort(
    (a, b) => (a.slideOrder ?? Infinity) - (b.slideOrder ?? Infinity)
  );
}

/**
 * Validate a complete presentation against the schema.
 */
export function validatePresentation(raw: unknown) {
  return streamablePresentationSchema.safeParse(raw);
}