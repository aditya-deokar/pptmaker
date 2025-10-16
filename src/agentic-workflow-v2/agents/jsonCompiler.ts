// agents/jsonCompiler.ts - Agent 7: Compile Final JSON Structure

import { v4 as uuidv4 } from "uuid";
import {
  AdvancedPresentationState,
  Slide,
  FinalSlideContent,
  SlideGenerationData,
} from "../lib/state";
import { getLayoutTemplate } from "../lib/layoutTemplates";

/**
 * Parse content into list format
 */
function parseListContent(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.replace(/^-|^\*|^\d+\.\s*/, "").trim())
    .filter((line) => line.length > 0);
}

/**
 * Check if content is a list
 */
function isListContent(content: string): boolean {
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) return false;

  const listPatterns = /^[-*•]\s+|^\d+\.\s+/;
  const listLines = lines.filter((line) => listPatterns.test(line.trim()));

  return listLines.length >= lines.length * 0.5; // At least 50% are list items
}

/**
 * Build layout-specific content structure
 */
function buildLayoutContent(
  slide: SlideGenerationData,
  layoutType: string
): FinalSlideContent {
  const textComponents: FinalSlideContent[] = [];

  // Add title
  if (slide.slideTitle) {
    textComponents.push({
      id: uuidv4(),
      type: "heading1",
      name: "Slide Title",
      content: slide.slideTitle,
    });
  }

  // Add content based on type
  if (slide.slideContent) {
    if (isListContent(slide.slideContent)) {
      textComponents.push({
        id: uuidv4(),
        type: "bulletList",
        name: "Bullet Points",
        content: parseListContent(slide.slideContent),
      });
    } else {
      textComponents.push({
        id: uuidv4(),
        type: "paragraph",
        name: "Main Content",
        content: slide.slideContent,
      });
    }
  }

  // Build layout based on type
  switch (layoutType) {
    case "accentLeft":
      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        restrictDropTo: true,
        content: [
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Resizable column",
            restrictToDrop: true,
            content: [
              {
                id: uuidv4(),
                type: "image",
                name: "Image",
                content: slide.imageUrl || "",
                alt: slide.slideTitle || slide.outline,
              },
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: textComponents,
                className: "w-full h-full p-8 flex justify-center items-center",
              },
            ],
          },
        ],
      };

    case "accentRight":
      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Resizable column",
            restrictToDrop: true,
            content: [
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: textComponents,
                className: "w-full h-full p-8 flex justify-center items-center",
              },
              {
                id: uuidv4(),
                type: "image",
                name: "Image",
                restrictToDrop: true,
                content: slide.imageUrl || "",
                alt: slide.slideTitle || slide.outline,
              },
            ],
          },
        ],
      };

    case "imageAndText":
      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Image and text",
            className: "border",
            content: [
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: [
                  {
                    id: uuidv4(),
                    type: "image",
                    name: "Image",
                    className: "p-3",
                    content: slide.imageUrl || "",
                    alt: slide.slideTitle || slide.outline,
                  },
                ],
              },
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: textComponents,
                className: "w-full h-full p-8 flex justify-center items-center",
              },
            ],
          },
        ],
      };

    case "textAndImage":
      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Text and image",
            className: "border",
            content: [
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: textComponents,
                className: "w-full h-full p-8 flex justify-center items-center",
              },
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: [
                  {
                    id: uuidv4(),
                    type: "image",
                    name: "Image",
                    className: "p-3",
                    content: slide.imageUrl || "",
                    alt: slide.slideTitle || slide.outline,
                  },
                ],
              },
            ],
          },
        ],
      };

    case "twoColumns":
      // Split content into two parts
      const paragraphs = slide.slideContent?.split("\n\n") || [];
      const half = Math.ceil(paragraphs.length / 2);
      
      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "title",
            name: "Title",
            content: slide.slideTitle || "",
            placeholder: "Untitled Card",
          },
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Two columns",
            className: "border",
            content: [
              {
                id: uuidv4(),
                type: "paragraph",
                name: "Paragraph",
                content: paragraphs.slice(0, half).join("\n\n"),
                placeholder: "Start typing...",
              },
              {
                id: uuidv4(),
                type: "paragraph",
                name: "Paragraph",
                content: paragraphs.slice(half).join("\n\n"),
                placeholder: "Start typing...",
              },
            ],
          },
        ],
      };

    case "twoColumnsWithHeadings":
      const items = isListContent(slide.slideContent || "")
        ? parseListContent(slide.slideContent || "")
        : [slide.slideContent || ""];
      const midpoint = Math.ceil(items.length / 2);

      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "title",
            name: "Title",
            content: slide.slideTitle || "",
            placeholder: "Untitled Card",
          },
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Two columns with headings",
            className: "border",
            content: [
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: [
                  {
                    id: uuidv4(),
                    type: "heading3",
                    name: "Heading3",
                    content: "Column 1",
                    placeholder: "Heading 3",
                  },
                  {
                    id: uuidv4(),
                    type: "paragraph",
                    name: "Paragraph",
                    content: items.slice(0, midpoint).join("\n"),
                    placeholder: "Start typing...",
                  },
                ],
              },
              {
                id: uuidv4(),
                type: "column",
                name: "Column",
                content: [
                  {
                    id: uuidv4(),
                    type: "heading3",
                    name: "Heading3",
                    content: "Column 2",
                    placeholder: "Heading 3",
                  },
                  {
                    id: uuidv4(),
                    type: "paragraph",
                    name: "Paragraph",
                    content: items.slice(midpoint).join("\n"),
                    placeholder: "Start typing...",
                  },
                ],
              },
            ],
          },
        ],
      };

    case "threeColumns":
      const threeItems = isListContent(slide.slideContent || "")
        ? parseListContent(slide.slideContent || "")
        : [slide.slideContent || ""];
      const third = Math.ceil(threeItems.length / 3);

      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: [
          {
            id: uuidv4(),
            type: "title",
            name: "Title",
            content: slide.slideTitle || "",
            placeholder: "Untitled Card",
          },
          {
            id: uuidv4(),
            type: "resizable-column",
            name: "Three columns",
            className: "border",
            content: [
              {
                id: uuidv4(),
                type: "paragraph",
                name: "Paragraph",
                content: threeItems.slice(0, third).join("\n"),
                placeholder: "Start typing...",
              },
              {
                id: uuidv4(),
                type: "paragraph",
                name: "Paragraph",
                content: threeItems.slice(third, third * 2).join("\n"),
                placeholder: "Start typing...",
              },
              {
                id: uuidv4(),
                type: "paragraph",
                name: "Paragraph",
                content: threeItems.slice(third * 2).join("\n"),
                placeholder: "Start typing...",
              },
            ],
          },
        ],
      };

    case "blank-card":
    default:
      return {
        id: uuidv4(),
        type: "column",
        name: "Column",
        content: textComponents,
      };
  }
}

/**
 * Compile a single slide into final JSON structure
 */
function compileSingleSlide(slide: SlideGenerationData): Slide {
  const layoutType = slide.layoutType || "blank-card";
  const template = getLayoutTemplate(layoutType);
  
  const content = buildLayoutContent(slide, layoutType);

  return {
    id: uuidv4(),
    slideName: slide.outline,
    type: layoutType,
    className: template?.className || "p-8 mx-auto flex justify-center items-center min-h-[200px]",
    content: content,
  };
}

/**
 * Agent 7: JSON Compiler
 * 
 * Purpose: Compiles all slide data into final presentation JSON
 * - Validates all required data is present
 * - Builds proper nested structure
 * - Ensures schema compliance
 * 
 * @param state - Current graph state
 * @returns Updated state with final JSON
 */
export async function runJsonCompiler(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  📦 AGENT 7: JSON Compiler             │");
  console.log("└─────────────────────────────────────────┘");

  if (!state.slideData || state.slideData.length === 0) {
    console.error("🔴 Cannot compile JSON, no slide data available.");
    return {
      error: "No slide data was generated to compile.",
    };
  }

  try {
    console.log(`📦 Compiling ${state.slideData.length} slides into final JSON...`);

    // Validate all slides have required data
    const incompleteSlides = state.slideData.filter(
      (slide) => !slide.slideTitle || !slide.slideContent || !slide.layoutType
    );

    if (incompleteSlides.length > 0) {
      console.warn(`⚠️  ${incompleteSlides.length} slides have incomplete data`);
    }

    // Compile all slides
    const finalPresentation: Slide[] = state.slideData.map(compileSingleSlide);

    console.log("✅ Presentation JSON compiled successfully:");
    finalPresentation.forEach((slide, i) => {
      console.log(`   ${i + 1}. ${slide.slideName} (${slide.type})`);
    });

    return {
      finalPresentationJson: finalPresentation,
      currentStep: "JSON Compiled",
      progress: 85, // 85% complete
    };
  } catch (error) {
    console.error("🔴 Error during JSON compilation:", error);
    return {
      error: `Failed to compile JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
