// actions/advanced-genai-graph.ts - Main LangGraph Orchestrator
'use server';

import { START, END, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { AdvancedPresentationState } from "../lib/state";
import {
  completePresentationGenerationRun,
  failPresentationGenerationRun,
  markPresentationGenerationStepCompleted,
  markPresentationGenerationStepRunning,
  startPresentationGenerationRun,
} from "@/actions/presentation-generation";
import { streamingEmitter } from "@/lib/streaming/EventEmitter";

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
  generationRunId: { value: (_x, y) => y, default: () => undefined },
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

  // Streaming
  streamEventHandler: { value: (_x, y) => y, default: () => undefined },

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
  const wrapNode = (
    nodeName: string,
    agentName: string,
    handler: (
      state: AdvancedPresentationState
    ) => Promise<Partial<AdvancedPresentationState>>
  ) => {
    return async (state: AdvancedPresentationState) => {
      const runId = state.generationRunId;

      try {
        if (runId) {
          await markPresentationGenerationStepRunning(runId, nodeName);
          streamingEmitter.emitAgentStart(runId, nodeName, agentName);
          streamingEmitter.emitProgress(runId, nodeName, 
            getStepProgress(nodeName)
          );
        }

        const result = await handler(state);

        if (runId) {
          await markPresentationGenerationStepCompleted(
            runId,
            nodeName,
            {
              projectId:
                typeof result.projectId === "string"
                  ? result.projectId
                  : state.projectId,
            }
          );
          streamingEmitter.emitAgentComplete(runId, nodeName, result);
        }

        return result;
      } catch (error) {
        if (runId) {
          await failPresentationGenerationRun(
            runId,
            error instanceof Error ? error.message : "Unknown generation error",
            nodeName
          );
          streamingEmitter.emitError(
            runId,
            error instanceof Error ? error.message : "Unknown generation error"
          );
        }

        throw error;
      }
    };
  };

  const agentNames: Record<string, string> = {
    projectInitializer: "Project Setup",
    outlineGenerator: "Structure",
    contentWriter: "Content Writing",
    layoutSelector: "Design Layout",
    imageQueryGenerator: "Visual Search",
    imageFetcher: "Image Integration",
    jsonCompiler: "Assembly",
    databasePersister: "Finalization",
  };

  const stepProgressMap: Record<string, number> = {
    projectInitializer: 10,
    outlineGenerator: 20,
    layoutSelector: 30,
    contentWriter: 45,
    imageQueryGenerator: 60,
    imageFetcher: 75,
    jsonCompiler: 85,
    databasePersister: 100,
  };

  const getStepProgress = (nodeName: string) => stepProgressMap[nodeName] || 0;

  return new StateGraph<AdvancedPresentationState>({ channels })
    // Add all agent nodes
    .addNode("projectInitializer", wrapNode("projectInitializer", agentNames.projectInitializer, runProjectInitializer))
    .addNode("outlineGenerator", wrapNode("outlineGenerator", agentNames.outlineGenerator, runOutlineGenerator))
    .addNode("contentWriter", wrapNode("contentWriter", agentNames.contentWriter, runContentWriter))
    .addNode("layoutSelector", wrapNode("layoutSelector", agentNames.layoutSelector, runLayoutSelector))
    .addNode("imageQueryGenerator", wrapNode("imageQueryGenerator", agentNames.imageQueryGenerator, runImageQueryGenerator))
    .addNode("imageFetcher", wrapNode("imageFetcher", agentNames.imageFetcher, runImageFetcher))
    .addNode("jsonCompiler", wrapNode("jsonCompiler", agentNames.jsonCompiler, runJsonCompiler))
    .addNode("databasePersister", wrapNode("databasePersister", agentNames.databasePersister, runDatabasePersister))

    // Define edges (layout selection BEFORE content writing for layout-aware content)
    .addEdge(START, "projectInitializer")
    .addEdge("projectInitializer", "outlineGenerator")
    .addEdge("outlineGenerator", "layoutSelector")
    .addEdge("layoutSelector", "contentWriter")
    .addEdge("contentWriter", "imageQueryGenerator")
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
  themePreference: string = "Default",
  providedOutlines?: string[],
  generationRunId?: string,
  projectId?: string
) {
  console.log("\n");
  console.log("═══════════════════════════════════════════════════════════");
  console.log("🚀 ADVANCED AGENTIC PRESENTATION GENERATION STARTED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`📝 Topic: [REDACTED_USER_CONTENT], length=${topic.length}`);
  console.log(`👤 User: [REDACTED_INTERNAL_ID]`);
  console.log(`🎨 Theme: ${themePreference}`);
  if (projectId) console.log(`📦 Existing Project ID: ${projectId}`);
  if (additionalContext) {
    console.log(`📎 Context: [REDACTED_USER_CONTENT], length=${additionalContext.length}`);
  }
  console.log("═══════════════════════════════════════════════════════════\n");

  try {
    if (generationRunId) {
      await startPresentationGenerationRun(generationRunId);
      streamingEmitter.emitAgentStart(generationRunId, "projectInitializer", "Project Setup");
    }

    // Build the graph
    const app = buildGraph();

    // Create stream event handler
    const streamEventHandler = generationRunId
      ? (event: Parameters<typeof streamingEmitter.emit>[1]) => 
          streamingEmitter.emit(generationRunId, event)
      : undefined;

    // Initial state
    const initialState: AdvancedPresentationState = {
      generationRunId,
      projectId: projectId || null,
      userId: userId,
      userInput: topic,
      additionalContext: additionalContext,
      themePreference: themePreference,
      outlines: providedOutlines && providedOutlines.length > 0 ? providedOutlines : null,
      slideData: [],
      finalPresentationJson: null,
      error: null,
      currentStep: "Initializing",
      progress: 0,
      retryCount: 0,
      streamEventHandler,
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
      if (generationRunId) {
        await failPresentationGenerationRun(
          generationRunId,
          finalState.error,
          finalState.currentStep
        );
      }
      return {
        success: false,
        error: finalState.error,
        projectId: finalState.projectId,
      };
    }

    // Validate output
    if (!finalState.projectId || !finalState.finalPresentationJson) {
      console.error("🔴 Graph completed but missing required output");
      if (generationRunId) {
        await failPresentationGenerationRun(
          generationRunId,
          "Presentation generation incomplete - missing data",
          finalState.currentStep
        );
      }
      return {
        success: false,
        error: "Presentation generation incomplete - missing data",
        projectId: finalState.projectId,
      };
    }

    // Success!
    if (generationRunId) {
      await completePresentationGenerationRun(generationRunId, {
        projectId: finalState.projectId,
      });
      streamingEmitter.emitComplete(generationRunId, finalState.projectId!);
    }

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

    if (generationRunId) {
      await failPresentationGenerationRun(
        generationRunId,
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }

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
