// /actions/genai-graph.ts
'use server';

import { START, END, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { PresentationGraphState } from "../lib/state";
import { runOutlineGenerator } from "../agents/outlineAgent";
import { runContentWriter } from "../agents/contentAgent"; // The new bulk agent
import { runLayoutDesigner } from "../agents/layoutAgent";
import { runImageQueryGenerator } from "../agents/imageQueryAgent";
import { runImageGenerator } from "../agents/imageGenerationAgent"; // Assuming this exists now
import { runJsonCompiler } from "../agents/jsonCompilerAgent";
import prisma from "@/lib/prisma";

// const shouldGenerateImage = (state: PresentationGraphState): "imageGenerator" | "jsonCompiler" => {
//   console.log("-> Router: Checking if more images are needed...");
//   const hasPendingImage = state.slideData.some(slide => slide.imageQuery && !slide.imageUrl);
//   return hasPendingImage ? "imageGenerator" : "jsonCompiler";
// };


// Channels definition remains the same
const channels: StateGraphArgs<PresentationGraphState>["channels"] = {
  userInput: { value: (_x, y) => y, default: () => "" },
  outlines: { value: (_x, y) => y, default: () => null },
  slideData: { value: (_x, y) => y, default: () => [] },
  finalPresentationJson: { value: (_x, y) => y, default: () => null },
  error: { value: (_x, y) => y, default: () => null },
};

// Define the graph structure with the simplified, more linear flow
const app = new StateGraph<PresentationGraphState>({ channels })
  .addNode("outlineGenerator", runOutlineGenerator)
  .addNode("contentWriter", runContentWriter)
  .addNode("layoutDesigner", runLayoutDesigner)
  .addNode("imageQueryGenerator", runImageQueryGenerator)
//   .addNode("imageGenerator", runImageGenerator)
  .addNode("jsonCompiler", runJsonCompiler)

  // 1. Entry point
  .addEdge(START, "outlineGenerator")

  // 2. A completely linear sequence for all LLM-based generation steps.
  // Each of these is a single, bulk API call.
  .addEdge("outlineGenerator", "contentWriter")
  .addEdge("contentWriter", "layoutDesigner")
  .addEdge("layoutDesigner", "imageQueryGenerator")
  .addEdge("imageQueryGenerator", "jsonCompiler")

  // 3. The final remaining loop for the external image generation tool.
//   .addConditionalEdges("imageGenerator", shouldGenerateImage, {
//     imageGenerator: "imageGenerator", // Loop back if more images are needed
//     jsonCompiler: "jsonCompiler",     // Proceed to the final step when done
//   })

  // 4. Finish
  .addEdge("jsonCompiler", END)
  .compile();

// Server action (no changes needed here, it remains robust)
export const generatePresentationGraph = async (topic: string) => {
  console.log("🚀 Starting Presentation Generation Graph for topic:", topic);
  try {
    const initialState: PresentationGraphState = {
      userInput: topic,
      outlines: null,
      slideData: [],
      finalPresentationJson: null,
      error: null,
    };
    
    // const finalState = await app.invoke(initialState, { recursionLimit: 150 });
    const finalState = await app.invoke({ userInput: topic }, { recursionLimit: 100 });

    if (finalState.error) {
      throw new Error(`Graph execution failed: ${finalState.error}`);
    }

    console.log("✅ Graph execution finished successfully.");
    // console.log(finalState.finalPresentationJson);
    console.log(JSON.stringify(finalState.finalPresentationJson, null, 2));
    if ( !finalState.finalPresentationJson) {
          return { status: "Failed to generate valid layouts" };
    }
    
   
    return { status: 200, data: finalState.finalPresentationJson };
    
  } catch (error) {
    console.error("Graph error:", error);
    return { status: 500, error: "Failed to generate presentation." };
  }
};