// agents/imageQueryGenerator.ts - Agent 5: Generate Image Search Queries

import { generateObject } from "ai";
import { model, modelConfigs } from "../lib/llm";
import { AdvancedPresentationState } from "../lib/state";
import { imageQuerySchema } from "../lib/validators";
import { getLayoutTemplate } from "../lib/layoutTemplates";

/**
 * Agent 5: Image Query Generator
 * 
 * Purpose: Generates optimized image search queries for slides that need images
 * - Identifies which slides need images based on layout
 * - Creates contextual, professional search queries
 * - Generates descriptive alt text for accessibility
 * 
 * @param state - Current graph state
 * @returns Updated state with image queries
 */
export async function runImageQueryGenerator(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  🖼️  AGENT 5: Image Query Generator    │");
  console.log("└─────────────────────────────────────────┘");

  if (!state.slideData || state.slideData.length === 0) {
    console.log("⚠️  No slide data to process. Skipping image query generation.");
    return {};
  }

  try {
    // Filter slides that need images based on layout
    const slidesNeedingImages = state.slideData
      .map((slide, index) => ({ ...slide, index }))
      .filter((slide) => {
        const template = getLayoutTemplate(slide.layoutType || "");
        return template?.requiresImage === true;
      });

    if (slidesNeedingImages.length === 0) {
      console.log("✅ No slides require images. Skipping image query generation.");
      return {
        currentStep: "Image Queries Generated (None needed)",
        progress: 65,
      };
    }

    console.log(`🎯 Generating image queries for ${slidesNeedingImages.length} slides...`);

    // Format slides for prompt
    const slidesSummary = slidesNeedingImages
      .map((slide) => {
        return `Slide ${slide.index + 1}:
  Layout: ${slide.layoutType}
  Title: ${slide.slideTitle}
  Content: ${slide.slideContent?.slice(0, 100)}...`;
      })
      .join("\n\n");

    const prompt = `You are an expert at creating image search queries for professional presentations.

Presentation Topic: "${state.userInput}"

Slides needing images:
${slidesSummary}

Instructions:
1. For each slide, create a search query that would find a relevant, professional stock photo
2. Queries should be:
   - Specific but not too narrow (3-7 words)
   - Professional and business-appropriate
   - Focused on the main concept, not literal text
   - Suitable for stock photo sites like Unsplash
3. Also create descriptive alt text for accessibility (10-30 words)
4. Consider the overall presentation topic for context

Examples:
- For "Data Analytics" → Query: "business data analysis charts", Alt: "Professional analyzing business data on digital dashboard"
- For "Team Collaboration" → Query: "diverse team working together office", Alt: "Diverse business team collaborating on project in modern office"
- For "Innovation" → Query: "technology innovation concept lightbulb", Alt: "Glowing lightbulb representing innovation and creative ideas"

Generate image queries for all ${slidesNeedingImages.length} slides:`;

    console.log("🤖 Calling AI to generate image queries...");

    const { object } = await generateObject({
      model: model,
      schema: imageQuerySchema,
      prompt: prompt,
      temperature: modelConfigs.imageQuery.temperature,
      maxTokens: modelConfigs.imageQuery.maxTokens,
    });

    const imageQueries = object.imageQueries;

    console.log(`✅ Generated ${imageQueries.length} image queries:`);
    imageQueries.forEach((query) => {
      console.log(`   Slide ${query.slideIndex + 1}: "${query.query}"`);
    });

    // Update slide data with image queries
    const updatedSlideData = state.slideData.map((slide, index) => {
      const queryData = imageQueries.find((q) => q.slideIndex === index);
      
      if (queryData) {
        return {
          ...slide,
          imageQuery: queryData.query,
        };
      }
      
      return slide;
    });

    return {
      slideData: updatedSlideData,
      currentStep: "Image Queries Generated",
      progress: 65, // 65% complete
    };
  } catch (error) {
    console.error("🔴 Error generating image queries:", error);
    return {
      error: `Failed to generate image queries: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
