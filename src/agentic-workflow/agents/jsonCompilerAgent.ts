// /agents/jsonCompilerAgent.ts

import { v4 as uuidv4 } from 'uuid';
// --- FIX: Import the new Slide interface ---
import { FinalSlideContent, PresentationGraphState, SlideGenerationData, Slide } from '../lib/state';

// ... (The parseListContent function remains exactly the same) ...
function parseListContent(content: string): string[] {
    return content
      .split('\n')
      .map(line => line.replace(/^-|^\*|^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
  }

/**
 * Helper function to compile the JSON for a single slide.
 * ...
 * --- FIX: This function now correctly returns our new `Slide` type ---
 * @returns The final JSON structure for one slide.
 */
function compileSingleSlide(slide: SlideGenerationData): Slide { // <--- The return type is now Slide
  const textComponents: FinalSlideContent[] = [];

  // 1. Always add the title component
  if (slide.slideTitle) {
    textComponents.push({
      id: uuidv4(),
      type: "heading1",
      name: "Slide Title",
      content: slide.slideTitle,
    });
  }

  // 2. Add the main content component based on the chosen layout (no changes here)
  if (slide.slideContent && slide.layoutType) {
    switch (slide.layoutType) {
        // ... all cases remain the same
      case "bulletList":
        textComponents.push({
          id: uuidv4(),
          type: "bulletList",
          name: "Bullet Points",
          content: parseListContent(slide.slideContent),
        });
        break;
      case "numberedList":
        textComponents.push({
          id: uuidv4(),
          type: "numberedList",
          name: "Numbered List",
          content: parseListContent(slide.slideContent),
        });
        break;
      case "codeBlock":
        textComponents.push({
          id: uuidv4(),
          type: "codeBlock",
          name: "Code Snippet",
          content: "",
          code: slide.slideContent,
          language: 'typescript',
        });
        break;
      default:
        textComponents.push({
          id: uuidv4(),
          type: "paragraph",
          name: "Main Content",
          content: slide.slideContent,
        });
        break;
    }
  }

  // 3. Decide the overall slide structure (no changes here)
  let finalSlideLayout: FinalSlideContent;

  if (slide.imageUrl) {
    finalSlideLayout = {
      id: uuidv4(),
      type: "resizable-column",
      name: "Image and Text Layout",
      content: [
        {
          id: uuidv4(),
          type: "column",
          name: "Text Section",
          content: textComponents,
          className: "p-8 justify-center",
        },
        {
          id: uuidv4(),
          type: "column",
          name: "Image Section",
          content: [
            {
              id: uuidv4(),
              type: "image",
              name: "Slide Image",
              content: slide.imageUrl,
              alt: slide.outline,
            }
          ]
        }
      ]
    };
  } else {
    finalSlideLayout = {
      id: uuidv4(),
      type: "column",
      name: "Main Content Column",
      content: textComponents,
      className: "p-8 justify-center",
    };
  }

  // 4. Wrap everything in the root slide object.
  // This object now perfectly matches the `Slide` interface.
  return {
    id: uuidv4(),
    slideName: slide.outline,
    type: "slide",
    className: "h-full w-full",
    content: [finalSlideLayout],
  };
}

/**
 * Agent 5: Compiles all generated data into the final JSON structure.
 * This is a synchronous, deterministic function, not an AI agent.
 * @param state The current state of the graph.
 * @returns A partial state object with the final compiled JSON.
 */
export async function runJsonCompiler(state: PresentationGraphState): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Final JSON Compiler ---");
  
  if (!state.slideData || state.slideData.length === 0) {
    console.error("🔴 Cannot compile JSON, no slide data available.");
    return { error: "No slide data was generated to compile." };
  }

  try {
    const finalPresentation = state.slideData.map(compileSingleSlide);
    console.log("✅ Presentation JSON compiled successfully.");
    return { finalPresentationJson: finalPresentation };
  } catch (error) {
    console.error("🔴 Error during JSON compilation:", error);
    return { error: "An unexpected error occurred while compiling the final JSON." };
  }
}