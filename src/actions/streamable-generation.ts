"use server";

// actions/streamable-generation.ts - Server actions for the Streamable Slides mode
//
// Handles project creation, post-generation image patching, and other tasks
// specific to the streamable slides flow. The actual streaming happens via
// the API route, but project creation needs to be a server action for auth.

import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { fetchImageForQuery } from "@/agentic-workflow-v2/utils/imageUtils";

/**
 * Create a project for streamable generation.
 * Called before the SSE stream begins so we have a projectId to associate slides with.
 */
export async function createStreamableProject(
  topic: string,
  themeName: string = "Default"
) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return { status: 401 as const, error: "Not authenticated" };
    }

    if (!topic || topic.trim().length === 0) {
      return { status: 400 as const, error: "Topic is required" };
    }

    if (topic.length > 500) {
      return { status: 400 as const, error: "Topic is too long (max 500 characters)" };
    }

    // Find the user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: { id: true },
    });

    if (!user) {
      return { status: 404 as const, error: "User not found" };
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        title: topic.slice(0, 100).trim(),
        userId: user.id,
        outlines: [],
        themeName,
        isDeleted: false,
      },
    });

    console.log(`[Streamable] Created project ${project.id} for topic: "${topic}"`);

    return {
      status: 200 as const,
      data: {
        projectId: project.id,
        userId: user.id,
      },
    };
  } catch (error) {
    console.error("[Streamable] Error creating project:", error);
    return {
      status: 500 as const,
      error: error instanceof Error ? error.message : "Failed to create project",
    };
  }
}

/**
 * Save finalized slides to the project after streaming is complete.
 * This is called by the API route, not directly by the client.
 */
export async function saveStreamableSlides(
  projectId: string,
  slides: any[],
  outlines: string[]
) {
  try {
    // Extract thumbnail from first image found
    const thumbnail = extractFirstImage(slides);

    await prisma.project.update({
      where: { id: projectId },
      data: {
        slides: slides as any,
        outlines,
        thumbnail,
        updatedAt: new Date(),
      },
    });

    console.log(
      `[Streamable] Saved ${slides.length} slides to project ${projectId}`
    );

    return { success: true };
  } catch (error) {
    console.error("[Streamable] Error saving slides:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save slides",
    };
  }
}

/**
 * Recursively find the first image URL in a slides array.
 */
function extractFirstImage(slides: any[]): string | null {
  for (const slide of slides) {
    const found = findImageInContent(slide.content);
    if (found) return found;
  }
  return null;
}

function findImageInContent(content: any): string | null {
  if (!content) return null;

  if (
    content.type === "image" &&
    typeof content.content === "string" &&
    content.content.length > 0
  ) {
    return content.content;
  }

  if (Array.isArray(content.content)) {
    for (const item of content.content) {
      const found = findImageInContent(item);
      if (found) return found;
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────
// Phase 6.4 — Post-generation image patching
// ─────────────────────────────────────────────────────

/**
 * Collect all image nodes that have empty content (placeholder images).
 * Returns an array of { id, query } where query comes from the node's
 * alt text or name field.
 */
function collectEmptyImageNodes(
  content: any
): Array<{ id: string; query: string }> {
  if (!content) return [];

  const results: Array<{ id: string; query: string }> = [];

  if (content.type === "image") {
    const src = typeof content.content === "string" ? content.content.trim() : "";
    const isPlaceholder =
      src === "" ||
      src.startsWith("[IMAGE:") ||
      src === "/placeholder.svg";

    if (isPlaceholder) {
      // Use alt text or name as the search query
      const query =
        content.alt ||
        content.name ||
        content.placeholder ||
        "presentation visual";

      // Strip the [IMAGE: ...] wrapper if present
      const cleanQuery = query.replace(/^\[IMAGE:\s*/i, "").replace(/\]$/, "").trim();

      results.push({ id: content.id, query: cleanQuery });
    }
  }

  // Recurse into children
  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      if (typeof child === "object" && child !== null) {
        results.push(...collectEmptyImageNodes(child));
      }
    }
  }

  return results;
}

/**
 * Patch an image node in the content tree by ID, setting its content to the resolved URL.
 * Returns true if the node was found and patched.
 */
function patchImageInContentTree(
  content: any,
  nodeId: string,
  imageUrl: string,
  altText?: string
): boolean {
  if (!content) return false;

  if (content.id === nodeId && content.type === "image") {
    content.content = imageUrl;
    if (altText) content.alt = altText;
    return true;
  }

  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      if (typeof child === "object" && child !== null) {
        if (patchImageInContentTree(child, nodeId, imageUrl, altText)) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * @deprecated Images are now resolved inline during streaming in the API route.
 * This function is kept for backward compatibility but is no longer called by the client.
 *
 * Post-generation image patching for Streamable Slides.
 * Scans all slides for image nodes with empty/placeholder content,
 * resolves them, and saves the updated slides to the DB.
 */
export async function patchStreamableImages(projectId: string) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { status: 401 as const, error: "Not authenticated" };
    }

    // Fetch the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { slides: true, userId: true },
    });

    if (!project) {
      return { status: 404 as const, error: "Project not found" };
    }

    const slides = project.slides as any[];
    if (!slides || slides.length === 0) {
      return {
        status: 200 as const,
        data: { patchedCount: 0, message: "No slides to patch" },
      };
    }

    // Collect all empty image nodes across all slides
    const imageNodes: Array<{ slideIdx: number; id: string; query: string }> = [];
    for (let i = 0; i < slides.length; i++) {
      const empty = collectEmptyImageNodes(slides[i].content);
      for (const node of empty) {
        imageNodes.push({ slideIdx: i, ...node });
      }
    }

    if (imageNodes.length === 0) {
      console.log(`[Streamable ImagePatch] No empty images found in project ${projectId}`);
      return {
        status: 200 as const,
        data: { patchedCount: 0, message: "No images to patch" },
      };
    }

    console.log(
      `[Streamable ImagePatch] Resolving ${imageNodes.length} images for project ${projectId}`
    );

    // Fetch images in parallel (batch of 4 to avoid rate-limiting)
    let patchedCount = 0;
    const BATCH_SIZE = 4;

    for (let batchStart = 0; batchStart < imageNodes.length; batchStart += BATCH_SIZE) {
      const batch = imageNodes.slice(batchStart, batchStart + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((node, idx) =>
          fetchImageForQuery(node.query, batchStart + idx)
        )
      );

      for (let i = 0; i < batch.length; i++) {
        const result = results[i];
        const node = batch[i];

        if (result.status === "fulfilled" && result.value.url) {
          const patched = patchImageInContentTree(
            slides[node.slideIdx].content,
            node.id,
            result.value.url,
            result.value.altText
          );

          if (patched) {
            patchedCount++;
            console.log(
              `[Streamable ImagePatch] ✅ Slide ${node.slideIdx + 1}: "${node.query}" → ${result.value.url.substring(0, 60)}...`
            );
          }
        } else {
          console.warn(
            `[Streamable ImagePatch] ⚠️ Failed to resolve image for "${node.query}"`
          );
        }
      }
    }

    // Update the thumbnail if we now have a real image
    const newThumbnail = extractFirstImage(slides);

    // Save the patched slides back to DB
    await prisma.project.update({
      where: { id: projectId },
      data: {
        slides: slides as any,
        ...(newThumbnail ? { thumbnail: newThumbnail } : {}),
        updatedAt: new Date(),
      },
    });

    console.log(
      `[Streamable ImagePatch] ✅ Patched ${patchedCount}/${imageNodes.length} images for project ${projectId}`
    );

    return {
      status: 200 as const,
      data: {
        patchedCount,
        totalImages: imageNodes.length,
        message: `Resolved ${patchedCount} of ${imageNodes.length} images`,
      },
    };
  } catch (error) {
    console.error("[Streamable ImagePatch] Error:", error);
    return {
      status: 500 as const,
      error: error instanceof Error ? error.message : "Failed to patch images",
    };
  }
}

