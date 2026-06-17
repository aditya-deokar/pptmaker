/**
 * MCP Server Constants
 *
 * Central configuration for the Verto AI MCP server.
 * All magic numbers and string literals live here.
 */

// ─── Server Identity ───────────────────────────────────────────
export const MCP_SERVER_NAME = 'verto-ai';
export const MCP_SERVER_VERSION = '1.0.0';
export const MCP_PROTOCOL_VERSION = '2025-03-26';

// ─── Rate Limiting Defaults ────────────────────────────────────
export const RATE_LIMIT_DEFAULTS = {
  FREE: { requestsPerMinute: 30, concurrentTools: 3, generationsPerHour: 5 },
  PRO: { requestsPerMinute: 120, concurrentTools: 10, generationsPerHour: 50 },
  ENTERPRISE: { requestsPerMinute: 600, concurrentTools: 50, generationsPerHour: Infinity },
} as const;

// ─── Pagination ────────────────────────────────────────────────
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
} as const;

// ─── Tool Names ────────────────────────────────────────────────
export const TOOL_NAMES = {
  // Lifecycle
  PRESENTATION_LIST: 'presentation_list',
  PRESENTATION_GET: 'presentation_get',
  PRESENTATION_CREATE: 'presentation_create',
  PRESENTATION_DELETE: 'presentation_delete',
  PRESENTATION_RECOVER: 'presentation_recover',
  PRESENTATION_DELETE_PERMANENTLY: 'presentation_delete_permanently',
  // Content
  PRESENTATION_UPDATE_SLIDES: 'presentation_update_slides',
  PRESENTATION_UPDATE_THEME: 'presentation_update_theme',
  // Publishing
  PRESENTATION_PUBLISH: 'presentation_publish',
  PRESENTATION_UNPUBLISH: 'presentation_unpublish',
  // AI Generation
  PRESENTATION_GENERATE: 'presentation_generate',
  PRESENTATION_GENERATION_STATUS: 'presentation_generation_status',
} as const;

// ─── Resource URIs ─────────────────────────────────────────────
export const RESOURCE_URIS = {
  PRESENTATIONS: 'verto://presentations',
  TEMPLATES: 'verto://templates',
  THEMES: 'verto://themes',
  GENERATION_PROGRESS: 'verto://generation/{runId}/progress',
} as const;

// ─── Error Codes ───────────────────────────────────────────────
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  USAGE_LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
  GENERATION_FAILED: 'GENERATION_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ─── Limits ────────────────────────────────────────────────────
export const LIMITS = {
  OAUTH_CONNECTED_GENERATION_LIMIT: 15,
  MAX_PERMANENT_DELETE_BATCH: 20,
  MAX_OUTLINES: 30,
  MAX_TOPIC_LENGTH: 500,
  MAX_TITLE_LENGTH: 200,
  MAX_ADDITIONAL_CONTEXT_LENGTH: 2000,
  MAX_RESPONSE_SLIDES: 40,
  MAX_RESPONSE_SLIDE_BYTES: 200_000,
  GENERATION_DEFAULT_WAIT_TIMEOUT_MS: 25_000,
  GENERATION_TIMEOUT_MS: 120_000, // 2 minutes
} as const;
