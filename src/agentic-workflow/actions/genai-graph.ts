// /actions/genai-graph.ts
'use server';

import { START, END, StateGraph, StateGraphArgs } from "@langchain/langgraph";
import { PresentationGraphState } from "../lib/state";
import { runOutlineGenerator } from "../agents/outlineAgent";
import { runContentWriter } from "../agents/contentAgent";
import { runLayoutDesigner } from "../agents/layoutAgent";
import { runImageQueryGenerator } from "../agents/imageQueryAgent";
import { runJsonCompiler } from "../agents/jsonCompilerAgent";

// Routers
const shouldWriteContent = (
  state: PresentationGraphState
): "contentWriter" | "layoutDesigner" => {
  const hasPendingContent = state.slideData.some((s) => s.slideContent === null);
  return hasPendingContent ? "contentWriter" : "layoutDesigner";
};

const shouldDesignLayout = (
  state: PresentationGraphState
): "layoutDesigner" | "imageQueryGenerator" => {
  const hasPendingLayout = state.slideData.some((s) => s.layoutType === null);
  return hasPendingLayout ? "layoutDesigner" : "imageQueryGenerator";
};

const shouldGenerateImageQuery = (
  state: PresentationGraphState
): "imageQueryGenerator" | "jsonCompiler" => {
  const hasPendingQuery = state.slideData.some((s) => s.imageQuery === "pending");
  return hasPendingQuery ? "imageQueryGenerator" : "jsonCompiler";
};

// Channels (kept; works fine with current API)
const channels: StateGraphArgs<PresentationGraphState>["channels"] = {
  userInput: { value: (_x, y) => y, default: () => "" },
  outlines: { value: (_x, y) => y, default: () => null },
  slideData: { value: (_x, y) => y, default: () => [] },
  finalPresentationJson: { value: (_x, y) => y, default: () => null },
  error: { value: (_x, y) => y, default: () => null },
};

// IMPORTANT: chain calls so node keys are preserved in the type
const app = new StateGraph<PresentationGraphState>({ channels })
  .addNode("outlineGenerator", runOutlineGenerator)
  .addNode("contentWriter", runContentWriter)
  .addNode("layoutDesigner", runLayoutDesigner)
  .addNode("imageQueryGenerator", runImageQueryGenerator)
  .addNode("jsonCompiler", runJsonCompiler)

  // Entry
  .addEdge(START, "outlineGenerator")

  // Routing after outline
  .addConditionalEdges("outlineGenerator", shouldWriteContent, {
    contentWriter: "contentWriter",
    layoutDesigner: "layoutDesigner",
  })

  // Content loop
  .addConditionalEdges("contentWriter", shouldWriteContent, {
    contentWriter: "contentWriter",
    layoutDesigner: "layoutDesigner",
  })

  // Layout loop
  .addConditionalEdges("layoutDesigner", shouldDesignLayout, {
    layoutDesigner: "layoutDesigner",
    imageQueryGenerator: "imageQueryGenerator",
  })

  // Image query loop
  .addConditionalEdges("imageQueryGenerator", shouldGenerateImageQuery, {
    imageQueryGenerator: "imageQueryGenerator",
    jsonCompiler: "jsonCompiler",
  })

  // Finish
  .addEdge("jsonCompiler", END)
  .compile();

// Server action
export const generatePresentationGraph = async (topic: string) => {
  try {
    const initialState: PresentationGraphState = {
      userInput: topic,
      outlines: null,
      slideData: [],
      finalPresentationJson: null,
      error: null,
    };
    // const finalState = await app.invoke(initialState, { recursionLimit: 100 });

    const finalState = await app.invoke({ userInput: topic }, { recursionLimit: 100 });
    
    if (finalState.error) throw new Error(`Graph execution failed: ${finalState.error}`);
    return { status: 200, data: finalState.finalPresentationJson };
  } catch (error) {
    console.error("Graph error:", error);
    return { status: 500, error: "Failed to generate presentation." };
  }
};
