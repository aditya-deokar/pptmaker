// src/app/api/generation/streamable/route.ts
//
// SSE API route for Streamable Slides generation.
// Single-prompt flow: generates structured slides via streamText,
// resolves images inline, and emits fully-formed slides to the client.

import { NextRequest, NextResponse } from "next/server";
import { streamText, Output } from "ai";
import { getAiModel } from "@/lib/ai-provider";
import { auth } from "@clerk/nextjs/server";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";
import {
  streamablePresentationSchema,
  isSlideRenderable,
} from "@/agentic-workflow-v2/lib/streamable-schema";
import { buildStreamablePrompt } from "@/agentic-workflow-v2/lib/streamable-prompt";
import { fetchImageForQuery } from "@/agentic-workflow-v2/utils/imageUtils";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// ─────────────────────────────────────────────────────
// Layout → className mapping (auto-assigned, not AI-generated)
// ─────────────────────────────────────────────────────

const LAYOUT_CLASSNAMES: Record<string, string> = {
  creativeHero: "h-full w-full p-8",
  fullImageBackground: "relative min-h-[500px]",
  titleAndContent: "p-8 mx-auto flex flex-col min-h-[400px]",
  accentLeft: "min-h-[300px]",
  statsRow: "h-full w-full p-8 flex flex-col justify-center",
  comparisonLayout: "p-8 mx-auto min-h-[400px]",
  processFlow: "p-8 mx-auto min-h-[400px]",
  iconGrid: "p-8 mx-auto min-h-[400px]",
  bentoGrid: "h-full w-full p-6",
  quoteLayout: "p-12 mx-auto flex items-center justify-center min-h-[400px]",
  sectionDivider:
    "p-12 mx-auto flex items-center justify-center min-h-[400px] bg-linear-to-br from-primary/10 to-primary/5",
  callToAction:
    "p-12 mx-auto flex flex-col items-center justify-center min-h-[400px] text-center",
};

const DEFAULT_CLASSNAME = "p-8 mx-auto flex flex-col min-h-[400px]";

// ─────────────────────────────────────────────────────
// Types for SSE events
// ─────────────────────────────────────────────────────

interface StreamableSSEEvent {
  type: "slide" | "progress" | "complete" | "error";
  index?: number;
  data?: any;
  projectId?: string;
  message?: string;
  progress?: number;
  timestamp: number;
}

// ─────────────────────────────────────────────────────
// SSE helpers
// ─────────────────────────────────────────────────────

function formatSSE(event: StreamableSSEEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

// ─────────────────────────────────────────────────────
// Slide post-processing
// ─────────────────────────────────────────────────────

/** Recursively assign fresh UUIDs to every node + set root className */
function ensureUniqueIds(content: any): any {
  if (!content) return content;

  const result = { ...content, id: uuidv4() };

  if (Array.isArray(result.content)) {
    if (
      result.content.length > 0 &&
      typeof result.content[0] === "object" &&
      result.content[0] !== null
    ) {
      result.content = result.content.map((item: any) => ensureUniqueIds(item));
    }
    // string[] (bulletList etc.) — leave as-is
  }

  return result;
}

/** Collect all image nodes with [IMAGE: ...] placeholders */
function collectImagePlaceholders(
  content: any
): Array<{ id: string; query: string }> {
  if (!content) return [];

  const results: Array<{ id: string; query: string }> = [];

  if (content.type === "image") {
    const src =
      typeof content.content === "string" ? content.content.trim() : "";
    const isPlaceholder =
      src === "" ||
      src.startsWith("[IMAGE:") ||
      src === "/placeholder.svg";

    if (isPlaceholder) {
      const query =
        content.alt || content.name || "presentation visual";
      const cleanQuery = query
        .replace(/^\[IMAGE:\s*/i, "")
        .replace(/\]$/, "")
        .trim();
      results.push({ id: content.id, query: cleanQuery });
    }
  }

  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      if (typeof child === "object" && child !== null) {
        results.push(...collectImagePlaceholders(child));
      }
    }
  }

  return results;
}

/** Patch a single image node by ID */
function patchImageNode(
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
        if (patchImageNode(child, nodeId, imageUrl, altText)) return true;
      }
    }
  }

  return false;
}

/** Resolve all image placeholders in a slide's content tree */
async function resolveSlideImages(content: any, slideIndex: number) {
  const placeholders = collectImagePlaceholders(content);
  if (placeholders.length === 0) return;

  const results = await Promise.allSettled(
    placeholders.map((p, i) => fetchImageForQuery(p.query, slideIndex * 10 + i))
  );

  for (let i = 0; i < placeholders.length; i++) {
    const result = results[i];
    if (result.status === "fulfilled" && result.value.url) {
      patchImageNode(
        content,
        placeholders[i].id,
        result.value.url,
        result.value.altText
      );
    }
  }
}

/** Process a raw AI slide into final format */
function processSlide(rawSlide: any, index: number): any {
  const layoutType = rawSlide.type || "titleAndContent";
  const contentWithIds = ensureUniqueIds(rawSlide.content);

  // Set root column className to match the layout
  if (contentWithIds && contentWithIds.type === "column") {
    contentWithIds.className = LAYOUT_CLASSNAMES[layoutType] || DEFAULT_CLASSNAME;
  }

  return {
    id: uuidv4(),
    slideName: rawSlide.slideName || `Slide ${index + 1}`,
    type: layoutType,
    className: LAYOUT_CLASSNAMES[layoutType] || DEFAULT_CLASSNAME,
    slideOrder: index,
    content: contentWithIds,
  };
}

// ─────────────────────────────────────────────────────
// Main POST handler
// ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: {
    topic: string;
    theme?: string;
    context?: string;
    projectId: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { topic, theme = "Default", context, projectId } = body;

  if (!topic || topic.trim().length === 0) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  console.log(`\n[Streamable] Starting generation: "${topic}" (${theme}), project: ${projectId}`);

  const { system, user } = buildStreamablePrompt({
    topic,
    theme,
    additionalContext: context,
  });

  const encoder = new TextEncoder();
  let heartbeatInterval: NodeJS.Timeout | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamableSSEEvent) => {
        try {
          controller.enqueue(encoder.encode(formatSSE(event)));
        } catch (err) {
          console.error("[Streamable SSE] Error sending event:", err);
        }
      };

      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": heartbeat\n\n"));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 5000);

      send({
        type: "progress",
        message: "Starting AI generation...",
        progress: 0,
        timestamp: Date.now(),
      });

      try {
        const result = streamText({
          model: await getAiModel(
            "gemini-3.1-flash-lite-preview",
            undefined,
            { clerkId }
          ),
          system,
          prompt: user,
          temperature: 0.7,
          experimental_output: Output.object({
            schema: streamablePresentationSchema,
          }),
        });

        let lastEmittedCount = 0;
        const allProcessedSlides: any[] = [];
        const targetSlideCount = 10; // default

        for await (const partial of result.experimental_partialOutputStream) {
          const currentSlides = Array.isArray(partial) ? partial : [];

          for (let i = lastEmittedCount; i < currentSlides.length; i++) {
            const rawSlide = currentSlides[i];

            if (rawSlide == null || !isSlideRenderable(rawSlide)) continue;

            const processed = processSlide(rawSlide, i);

            // Resolve image placeholders inline
            try {
              await resolveSlideImages(processed.content, i);
            } catch (imgErr) {
              console.warn(`[Streamable] Image resolution failed for slide ${i + 1} (non-fatal):`, imgErr);
            }

            allProcessedSlides.push(processed);

            console.log(
              `[Streamable] ✅ Slide ${i + 1}: "${processed.slideName}" (${processed.type})`
            );

            send({
              type: "slide",
              index: i,
              data: processed,
              progress: Math.round(
                ((i + 1) / targetSlideCount) * 95
              ),
              timestamp: Date.now(),
            });

            lastEmittedCount = i + 1;
          }
        }

        // Save to database
        console.log(
          `[Streamable] Generation complete. ${allProcessedSlides.length} slides produced.`
        );

        send({
          type: "progress",
          message: "Saving presentation...",
          progress: 97,
          timestamp: Date.now(),
        });

        const outlines = allProcessedSlides.map(
          (s) => s.slideName || `Slide ${s.slideOrder + 1}`
        );

        try {
          const thumbnail = extractFirstImageUrl(allProcessedSlides);

          await prisma.project.update({
            where: { id: projectId },
            data: {
              slides: allProcessedSlides as any,
              outlines,
              thumbnail,
              updatedAt: new Date(),
            },
          });

          console.log(`[Streamable] ✅ Saved to project ${projectId}`);
        } catch (dbError) {
          console.error("[Streamable] DB save error:", dbError);
        }

        send({
          type: "complete",
          projectId,
          progress: 100,
          message: `Generated ${allProcessedSlides.length} slides successfully`,
          timestamp: Date.now(),
        });

        console.log(`[Streamable] ✅ COMPLETE\n`);
      } catch (error) {
        console.error("[Streamable] Generation error:", error);
        send({
          type: "error",
          message:
            error instanceof Error ? error.message : "Generation failed",
          timestamp: Date.now(),
        });
      } finally {
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },

    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      console.log("[Streamable SSE] Client disconnected");
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}

// ─────────────────────────────────────────────────────
// Utility: extract first image URL from slides
// ─────────────────────────────────────────────────────

function extractFirstImageUrl(slides: any[]): string | null {
  for (const slide of slides) {
    const url = findImage(slide.content);
    if (url) return url;
  }
  return null;
}

function findImage(content: any): string | null {
  if (!content) return null;

  if (
    content.type === "image" &&
    typeof content.content === "string" &&
    content.content.length > 0 &&
    !content.content.startsWith("[IMAGE:")
  ) {
    return content.content;
  }

  if (Array.isArray(content.content)) {
    for (const item of content.content) {
      if (typeof item === "object" && item !== null) {
        const found = findImage(item);
        if (found) return found;
      }
    }
  }

  return null;
}
