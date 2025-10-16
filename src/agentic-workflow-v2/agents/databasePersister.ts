// agents/databasePersister.ts - Agent 8: Save to Database

import prisma from "@/lib/prisma";
import { AdvancedPresentationState } from "../lib/state";

/**
 * Extract first image URL from slides for thumbnail
 */
function extractThumbnail(slides: any[]): string | null {
  for (const slide of slides) {
    if (slide.content && typeof slide.content === "object") {
      const thumbnail = findImageInContent(slide.content);
      if (thumbnail) return thumbnail;
    }
  }
  return null;
}

/**
 * Recursively search for image in content structure
 */
function findImageInContent(content: any): string | null {
  if (!content) return null;

  // Check if this is an image type
  if (content.type === "image" && typeof content.content === "string") {
    return content.content;
  }

  // Check if content has nested array
  if (Array.isArray(content.content)) {
    for (const item of content.content) {
      const found = findImageInContent(item);
      if (found) return found;
    }
  }

  // Check if content is array itself
  if (Array.isArray(content)) {
    for (const item of content) {
      const found = findImageInContent(item);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Agent 8: Database Persister
 * 
 * Purpose: Saves the final presentation to the database
 * - Updates project with slides JSON
 * - Sets outlines array
 * - Extracts and sets thumbnail
 * - Updates timestamp
 * 
 * @param state - Current graph state
 * @returns Updated state confirming save
 */
export async function runDatabasePersister(
  state: AdvancedPresentationState
): Promise<Partial<AdvancedPresentationState>> {
  console.log("\n┌─────────────────────────────────────────┐");
  console.log("│  💾 AGENT 8: Database Persister        │");
  console.log("└─────────────────────────────────────────┘");

  if (!state.projectId) {
    console.error("🔴 No project ID found - cannot save to database");
    return {
      error: "No project ID available for saving",
    };
  }

  if (!state.finalPresentationJson) {
    console.error("🔴 No presentation JSON found - cannot save");
    return {
      error: "No presentation data to save",
    };
  }

  try {
    const projectId = state.projectId;
    const slides = state.finalPresentationJson;
    const outlines = state.outlines || [];

    console.log(`💾 Saving presentation to project ${projectId}...`);
    console.log(`   - ${slides.length} slides`);
    console.log(`   - ${outlines.length} outlines`);

    // Extract thumbnail
    const thumbnail = extractThumbnail(slides);
    if (thumbnail) {
      console.log(`   - Thumbnail: ${thumbnail.substring(0, 50)}...`);
    }

    // Update project in database
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        slides: slides as any, // Prisma Json type
        outlines: outlines,
        thumbnail: thumbnail,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Presentation saved successfully to database!");
    console.log(`   Project: ${updatedProject.title}`);
    console.log(`   Updated: ${updatedProject.updatedAt.toISOString()}`);

    return {
      currentStep: "Saved to Database",
      progress: 100, // 100% complete!
    };
  } catch (error) {
    console.error("🔴 Error saving to database:", error);
    return {
      error: `Failed to save presentation: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
