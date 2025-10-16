// actions/advanced-genai-graph.ts - Main LangGraph Orchestrator
'use server';

import { START, END, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { AdvancedPresentationState } from "../lib/state";

// Import all agents
import { runProjectInitializer } from "../agents/projectInitializer";
import { runOutlineGenerator } from "../agents/outlineGenerator";
import { runContentWriter } from "../agents/contentWriter";
import { runLayoutSelector } from "../agents/layoutSelector";
import { runImageQueryGenerator } from "../agents/imageQueryGenerator";
import { runImageFetcher, shouldFetchMoreImages } from "../agents/imageFetcher";
import { runJsonCompiler } from "../agents/jsonCompiler";
import { runDatabasePersister } from "../agents/databasePersister";

/**
 * State channels configuration
 * Defines how state updates are merged
 */
const channels: StateGraphArgs<AdvancedPresentationState>["channels"] = {
  // Input fields
  projectId: { value: (_x, y) => y, default: () => null },
  userId: { value: (_x, y) => y, default: () => "" },
  userInput: { value: (_x, y) => y, default: () => "" },
  additionalContext: { value: (_x, y) => y, default: () => undefined },
  themePreference: { value: (_x, y) => y, default: () => "light" },

  // Generation data
  outlines: { value: (_x, y) => y, default: () => null },
  slideData: { value: (_x, y) => y, default: () => [] },

  // Output
  finalPresentationJson: { value: (_x, y) => y, default: () => null },

  // Metadata
  error: { value: (_x, y) => y, default: () => null },
  currentStep: { value: (_x, y) => y, default: () => "Initializing" },
  progress: { value: (_x, y) => y, default: () => 0 },
  retryCount: { value: (_x, y) => y, default: () => 0 },
};

/**
 * Build the advanced presentation generation graph
 * 
 * Flow:
 * START → projectInitializer → outlineGenerator → contentWriter → 
 * layoutSelector → imageQueryGenerator → imageFetcher → 
 * [loop back if more images needed] → jsonCompiler → databasePersister → END
 */
const buildGraph = () => {
  return new StateGraph<AdvancedPresentationState>({ channels })
    // Add all agent nodes
    .addNode("projectInitializer", runProjectInitializer)
    .addNode("outlineGenerator", runOutlineGenerator)
    .addNode("contentWriter", runContentWriter)
    .addNode("layoutSelector", runLayoutSelector)
    .addNode("imageQueryGenerator", runImageQueryGenerator)
    .addNode("imageFetcher", runImageFetcher)
    .addNode("jsonCompiler", runJsonCompiler)
    .addNode("databasePersister", runDatabasePersister)

    // Define edges (linear sequence)
    .addEdge(START, "projectInitializer")
    .addEdge("projectInitializer", "outlineGenerator")
    .addEdge("outlineGenerator", "contentWriter")
    .addEdge("contentWriter", "layoutSelector")
    .addEdge("layoutSelector", "imageQueryGenerator")
    .addEdge("imageQueryGenerator", "imageFetcher")

    // Conditional edge: loop back for more images or proceed
    .addConditionalEdges("imageFetcher", shouldFetchMoreImages, {
      imageFetcher: "imageFetcher", // Loop back if more images needed
      jsonCompiler: "jsonCompiler",  // Proceed when all images fetched
    })

    // Final edges
    .addEdge("jsonCompiler", "databasePersister")
    .addEdge("databasePersister", END)
    
    .compile();
};

/**
 * Server Action: Generate Advanced Presentation
 * 
 * This is the main entry point for generating presentations with the advanced workflow
 * 
 * @param userId - User ID from Clerk
 * @param topic - Presentation topic/title
 * @param additionalContext - Optional additional context
 * @param themePreference - Theme name (default: "light")
 * @returns Generated presentation with project ID
 */
export async function generateAdvancedPresentation(
  userId: string,
  topic: string,
  additionalContext?: string,
  themePreference: string = "light"
) {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 ADVANCED AGENTIC PRESENTATION GENERATION STARTED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`📝 Topic: ${topic}`);
  console.log(`👤 User: ${userId}`);
  console.log(`🎨 Theme: ${themePreference}`);
  if (additionalContext) {
    console.log(`📎 Context: ${additionalContext.slice(0, 100)}...`);
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    // Build the graph
    const app = buildGraph();

    // Initial state
    const initialState: AdvancedPresentationState = {
      projectId: null,
      userId: userId,
      userInput: topic,
      additionalContext: additionalContext,
      themePreference: themePreference,
      outlines: null,
      slideData: [],
      finalPresentationJson: null,
      error: null,
      currentStep: "Initializing",
      progress: 0,
      retryCount: 0,
    };

    // Execute the graph
    console.log("🔄 Starting graph execution...\n");
    
    const finalState = await app.invoke(initialState as any, {
      recursionLimit: 150, // Allow for image fetching loops
    }) as unknown as AdvancedPresentationState;

    console.log("\n═══════════════════════════════════════════════════════════");
    console.log("✅ GRAPH EXECUTION COMPLETED");
    console.log("═══════════════════════════════════════════════════════════");
    console.log(`📊 Final Progress: ${finalState.progress}%`);
    console.log(`🎯 Current Step: ${finalState.currentStep}`);
    console.log(`📦 Project ID: ${finalState.projectId}`);
    console.log(`📄 Slides Generated: ${finalState.finalPresentationJson?.length || 0}`);
    console.log("═══════════════════════════════════════════════════════════\n");

    // Check for errors
    if (finalState.error) {
      console.error("🔴 Graph execution encountered an error:", finalState.error);
      return {
        success: false,
        error: finalState.error,
        projectId: finalState.projectId,
      };
    }

    // Validate output
    if (!finalState.projectId || !finalState.finalPresentationJson) {
      console.error("🔴 Graph completed but missing required output");
      return {
        success: false,
        error: "Presentation generation incomplete - missing data",
        projectId: finalState.projectId,
      };
    }

    // Success!
    return {
      success: true,
      projectId: finalState.projectId,
      slides: finalState.finalPresentationJson,
      outlines: finalState.outlines,
      slideCount: finalState.finalPresentationJson.length,
      progress: finalState.progress,
    };

  } catch (error) {
    console.error("\n═══════════════════════════════════════════════════════════");
    console.error("🔴 FATAL ERROR IN GRAPH EXECUTION");
    console.error("═══════════════════════════════════════════════════════════");
    console.error("Error:", error);
    console.error("═══════════════════════════════════════════════════════════\n");

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      projectId: null,
    };
  }
}

/**
 * Export graph builder for testing
 */
export { buildGraph };
