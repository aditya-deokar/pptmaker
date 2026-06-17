/**
 * MCP Presentation Schemas
 *
 * Shared Zod validation schemas used across presentation tool handlers.
 * These define the input contracts for all presentation MCP tools.
 */

import { z } from 'zod';
import { LIMITS, PAGINATION } from '../../config/constants';

// ─── Common Fields ─────────────────────────────────────────────

export const presentationIdSchema = z.string().min(1)
  .describe('The unique identifier of the presentation (cuid format).');

// ─── Tool Input Schemas ────────────────────────────────────────

export const presentationListSchema = z.object({
  cursor: z.string().optional()
    .describe('Pagination cursor from a previous response. Omit for the first page.'),
  limit: z.number().int().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE)
    .describe(`Number of presentations per page. Default: ${PAGINATION.DEFAULT_PAGE_SIZE}, Max: ${PAGINATION.MAX_PAGE_SIZE}.`),
  include_deleted: z.boolean().default(false)
    .describe('If true, also returns soft-deleted presentations.'),
  sort_by: z.enum(['updated_at', 'created_at', 'title']).default('updated_at')
    .describe('Field to sort results by.'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
    .describe('Sort direction.'),
});

export const presentationGetSchema = z.object({
  presentation_id: presentationIdSchema,
  include_slides: z.boolean().default(true)
    .describe('If true, includes the full slide JSON content. Set to false for metadata-only.'),
});

export const presentationCreateSchema = z.object({
  title: z.string().min(1).max(LIMITS.MAX_TITLE_LENGTH)
    .describe('The title of the new presentation.'),
  outlines: z.array(
    z.object({
      title: z.string().min(1).max(LIMITS.MAX_TITLE_LENGTH),
      order: z.number().int().min(0),
    })
  ).min(1).max(LIMITS.MAX_OUTLINES)
    .describe('Slide outline cards. Each has a title and display order.'),
  request_id: z.string().uuid().optional()
    .describe('Client-generated UUID for idempotent creation.'),
});

export const presentationDeleteSchema = z.object({
  presentation_id: presentationIdSchema.describe('ID of the presentation to soft-delete.'),
});

export const presentationRecoverSchema = z.object({
  presentation_id: presentationIdSchema.describe('ID of the soft-deleted presentation to recover.'),
});

export const presentationDeletePermanentlySchema = z.object({
  presentation_ids: z.array(z.string().min(1)).min(1).max(LIMITS.MAX_PERMANENT_DELETE_BATCH)
    .describe('Array of presentation IDs to permanently delete.'),
  confirm: z.literal(true)
    .describe('Must be true to confirm permanent deletion. Prevents accidental data loss.'),
});

export const presentationUpdateSlidesSchema = z.object({
  presentation_id: presentationIdSchema,
  slides: z.array(z.object({
    id: z.string(),
    slideName: z.string(),
    type: z.string(),
    content: z.any(),
    slideOrder: z.number().optional(),
    className: z.string().optional(),
  })).describe('The complete Slide[] array. Replaces all existing slides.'),
});

export const presentationUpdateThemeSchema = z.object({
  presentation_id: presentationIdSchema,
  theme_name: z.string().min(1)
    .describe("Name of the theme to apply. Use the 'verto://themes' resource for valid names."),
});

export const presentationPublishSchema = z.object({
  presentation_id: presentationIdSchema.describe('ID of the presentation to publish.'),
});

export const presentationUnpublishSchema = z.object({
  presentation_id: presentationIdSchema.describe('ID of the presentation to unpublish.'),
});

export const presentationGenerateSchema = z.object({
  topic: z.string().min(1).max(LIMITS.MAX_TOPIC_LENGTH)
    .describe('Topic for the AI to generate a presentation about. Be descriptive for better results.'),
  additional_context: z.string().max(LIMITS.MAX_ADDITIONAL_CONTEXT_LENGTH).optional()
    .describe('Optional additional instructions to guide generation.'),
  theme_preference: z.string().default('Default')
    .describe('Preferred visual theme for the generated presentation.'),
  outlines: z.array(z.string().min(1).max(LIMITS.MAX_TITLE_LENGTH)).max(LIMITS.MAX_OUTLINES).optional()
    .describe('Optional pre-defined slide outlines. If omitted, AI generates outlines automatically.'),
  wait_timeout_ms: z.number().int().min(1000).max(LIMITS.GENERATION_TIMEOUT_MS).optional()
    .describe(`How long to wait for completion before returning RUNNING. Defaults to ${LIMITS.GENERATION_DEFAULT_WAIT_TIMEOUT_MS} ms and maxes at ${LIMITS.GENERATION_TIMEOUT_MS} ms.`),
});

export const presentationGenerationStatusSchema = z.object({
  generation_run_id: z.string().min(1)
    .describe('Generation run ID returned by presentation_generate.'),
});

// ─── Schema Types ──────────────────────────────────────────────

export type PresentationListInput = z.infer<typeof presentationListSchema>;
export type PresentationGetInput = z.infer<typeof presentationGetSchema>;
export type PresentationCreateInput = z.infer<typeof presentationCreateSchema>;
export type PresentationDeleteInput = z.infer<typeof presentationDeleteSchema>;
export type PresentationRecoverInput = z.infer<typeof presentationRecoverSchema>;
export type PresentationDeletePermanentlyInput = z.infer<typeof presentationDeletePermanentlySchema>;
export type PresentationUpdateSlidesInput = z.infer<typeof presentationUpdateSlidesSchema>;
export type PresentationUpdateThemeInput = z.infer<typeof presentationUpdateThemeSchema>;
export type PresentationPublishInput = z.infer<typeof presentationPublishSchema>;
export type PresentationUnpublishInput = z.infer<typeof presentationUnpublishSchema>;
export type PresentationGenerateInput = z.infer<typeof presentationGenerateSchema>;
export type PresentationGenerationStatusInput = z.infer<typeof presentationGenerationStatusSchema>;
