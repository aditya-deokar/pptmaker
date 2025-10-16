// /agents/outlineAgent.ts

import { z } from "zod";
import { generateObject } from "ai";
import { model } from "../lib/llm";
import { PresentationGraphState } from "../lib/state";


// Define the expected output structure for this agent using Zod
const outlineSchema = z.object({
  outlines: z.array(z.string()).describe("A list of 5 to 10 concise slide topics for the presentation."),
});

/**
 * Agent 1: Generates the presentation outline.
 * @param state The current state of the graph.
 * @returns A partial state object with the generated outlines.
 */
export async function runOutlineGenerator(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Outline Generator Agent ---");

  try {
    const { object } = await generateObject({
      model: model,
      schema: outlineSchema,
      prompt: `You are an expert presentation creator. Given the following topic, please generate a clear and logical outline for a presentation. The topic is: "${state.userInput}"`,
    });

    console.log("✅ Outlines generated successfully.");

    // Initialize the slideData array based on the new outlines
    const initialSlideData = object.outlines.map(outline => ({
      outline,
      slideTitle: null,
      slideContent: null,
      layoutType: null,
      imageQuery: null,
      imageUrl: null,
      finalJson: null,
    }));
    console.log(object.outlines);
    return {
      outlines: object.outlines,
      slideData: initialSlideData,
    };
  } catch (error) {
    console.error("🔴 Error in Outline Generator Agent:", error);
    return {
      error: "Failed to generate a valid outline for the presentation.",
    };
  }
}