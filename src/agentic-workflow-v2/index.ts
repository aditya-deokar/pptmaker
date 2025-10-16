// index.ts - Main Export File for Advanced Agentic Workflow V2

/**
 * Advanced Agentic Workflow V2
 * 
 * A production-ready, multi-agent system for generating presentations
 * using LangGraph and Google Gemini AI.
 * 
 * Features:
 * - Database-first approach with real-time project updates
 * - AI-powered layout selection
 * - Smart image fetching with fallbacks
 * - Comprehensive error handling and retry logic
 * - Progress tracking throughout the workflow
 * 
 * Usage:
 * ```typescript
 * import { generateAdvancedPresentation } from '@/agentic-workflow-v2';
 * 
 * const result = await generateAdvancedPresentation(
 *   userId,
 *   "Machine Learning for Beginners",
 *   "Focus on practical applications",
 *   "light"
 * );
 * 
 * if (result.success) {
 *   console.log(`Generated ${result.slideCount} slides`);
 *   router.push(`/presentation/${result.projectId}`);
 * }
 * ```
 */

// Main server action
export { generateAdvancedPresentation, buildGraph } from "./actions/advanced-genai-graph";

// All agents (for testing or custom workflows)
export { runProjectInitializer } from "./agents/projectInitializer";
export { runOutlineGenerator } from "./agents/outlineGenerator";
export { runContentWriter } from "./agents/contentWriter";
export { runLayoutSelector } from "./agents/layoutSelector";
export { runImageQueryGenerator } from "./agents/imageQueryGenerator";
export { runImageFetcher, shouldFetchMoreImages } from "./agents/imageFetcher";
export { runJsonCompiler } from "./agents/jsonCompiler";
export { runDatabasePersister } from "./agents/databasePersister";

// Types and interfaces
export type {
  AdvancedPresentationState,
  Slide,
  FinalSlideContent,
  SlideGenerationData,
  LayoutTemplate,
} from "./lib/state";

// Layout templates
export {
  LAYOUT_TEMPLATES,
  LAYOUT_DESCRIPTIONS,
  getLayoutTemplate,
  getTextOnlyLayouts,
  getImageLayouts,
} from "./lib/layoutTemplates";

// Validators
export {
  outlineSchema,
  bulkContentSchema,
  layoutSelectionSchema,
  imageQuerySchema,
  validateSlideCount,
  validateSlideData,
} from "./lib/validators";

// Utilities
export {
  fetchImageForQuery,
  fetchImagesForQueries,
  validateImageUrl,
  getDefaultImage,
} from "./utils/imageUtils";

export {
  retryWithBackoff,
  sleep,
  getErrorMessage,
  isRecoverableError,
  executeAgentSafely,
  DEFAULT_RETRY_CONFIG,
} from "./utils/retryLogic";

// LLM configuration
export { model, modelConfigs } from "./lib/llm";
