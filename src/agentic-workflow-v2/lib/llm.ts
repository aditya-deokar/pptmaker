// lib/llm.ts - LLM Configuration for Advanced Workflow

import { google } from "@ai-sdk/google";

/**
 * Shared LLM model instance for all agents
 * Using Google's Gemini 2.0 Flash for fast, high-quality generation
 */
export const model = google("gemini-2.0-flash-exp");

/**
 * Configuration for different agent types
 */
export const modelConfigs = {
  // For outline generation - needs creativity
  outline: {
    temperature: 0.8,
    maxTokens: 2000,
  },
  
  // For content writing - balanced
  content: {
    temperature: 0.7,
    maxTokens: 4000,
  },
  
  // For layout selection - needs consistency
  layout: {
    temperature: 0.3,
    maxTokens: 1000,
  },
  
  // For image queries - needs creativity
  imageQuery: {
    temperature: 0.7,
    maxTokens: 500,
  },
  
  // For JSON compilation - needs precision
  jsonCompiler: {
    temperature: 0.2,
    maxTokens: 8000,
  },
};
