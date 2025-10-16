// lib/validators.ts - Zod Schemas for Validation

import { z } from "zod";

/**
 * Schema for outline generation
 */
export const outlineSchema = z.object({
  outlines: z
    .array(z.string())
    .min(5)
    .max(15)
    .describe("A list of 5-15 concise slide topics based on topic complexity."),
});

/**
 * Schema for a single slide's content
 */
export const singleSlideContentSchema = z.object({
  title: z
    .string()
    .min(3)
    .max(100)
    .describe("A compelling and concise title for the slide."),
  content: z
    .string()
    .min(10)
    .max(1000)
    .describe("The main body content for the slide. Use markdown bullets (-) for lists. Keep it concise and engaging."),
});

/**
 * Schema for bulk content generation
 */
export const bulkContentSchema = z.object({
  slidesContent: z
    .array(singleSlideContentSchema)
    .describe("An array of content objects, one for each slide outline provided."),
});

/**
 * Schema for layout selection
 */
export const layoutSelectionSchema = z.object({
  layouts: z
    .array(
      z.object({
        slideIndex: z.number().describe("Index of the slide (0-based)"),
        layoutType: z
          .enum([
            "blank-card",
            "accentLeft",
            "accentRight",
            "imageAndText",
            "textAndImage",
            "twoColumns",
            "twoColumnsWithHeadings",
            "threeColumns",
          ])
          .describe("Selected layout type"),
        reasoning: z
          .string()
          .describe("Brief explanation for this layout choice"),
      })
    )
    .describe("Layout selection for each slide"),
});

/**
 * Schema for image query generation
 */
export const imageQuerySchema = z.object({
  imageQueries: z
    .array(
      z.object({
        slideIndex: z.number().describe("Index of the slide (0-based)"),
        query: z
          .string()
          .min(3)
          .max(100)
          .describe("Search query for image (optimized for stock photos)"),
        altText: z
          .string()
          .min(5)
          .max(200)
          .describe("Descriptive alt text for accessibility"),
      })
    )
    .describe("Image queries for slides that need images"),
});

/**
 * Validate that slide count matches expected count
 */
export function validateSlideCount(
  actual: number,
  expected: number,
  context: string
): void {
  if (actual !== expected) {
    throw new Error(
      `${context}: Expected ${expected} slides but got ${actual}. Please ensure the AI generates the exact number of items.`
    );
  }
}

/**
 * Validate slide data completeness
 */
export function validateSlideData(slideData: any[]): boolean {
  return slideData.every(
    (slide) =>
      slide.outline &&
      slide.slideTitle &&
      slide.slideContent &&
      slide.layoutType
  );
}
