// src/app/api/generation/streamable/route.ts
//
// SSE API route for Streamable Slides generation.
// Uses Vercel AI SDK's `streamText` + `experimental_output` (replaces
// deprecated `streamObject`) to generate a full presentation as structured
// output, emitting each completed slide to the client via SSE in real-time.

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

export const dynamic = "force-dynamic";
export const maxDuration = 120;

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

function processSlide(rawSlide: any, index: number): any {
  return {
    id: uuidv4(),
    slideName: rawSlide.slideName || `Slide ${index + 1}`,
    type: rawSlide.type || "titleAndContent",
    className: rawSlide.className || "p-8 mx-auto flex flex-col min-h-[400px]",
    slideOrder: index,
    content: ensureUniqueIds(rawSlide.content),
  };
}

// ─────────────────────────────────────────────────────
// Main POST handler
// ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── Auth ──
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // ── Parse body ──
  let body: { topic: string; theme?: string; context?: string; projectId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { topic, theme = "Default", context, projectId } = body;

  if (!topic || topic.trim().length === 0) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required — create a project first" },
      { status: 400 }
    );
  }

  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("🔄 STREAMABLE PRESENTATION GENERATION STARTED");
  console.log("═══════════════════════════════════════════════════════════");
  console.log(`📝 Topic: ${topic}`);
  console.log(`🎨 Theme: ${theme}`);
  console.log(`📦 Project: ${projectId}`);
  console.log("═══════════════════════════════════════════════════════════\n");

  // ── Build prompt ──
  const { system, user } = buildStreamablePrompt({
    topic,
    theme,
    additionalContext: context,
  });

  // ── Create SSE stream ──
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
        // ── Stream structured output ──
        // `streamText` + `experimental_output` is the replacement for the
        // deprecated `streamObject`. `Output.object` wraps our Zod schema and
        // provides `experimental_partialOutputStream` — a typed async iterable
        // of DeepPartial<Slide[]> that behaves identically to the old
        // `partialObjectStream` from `streamObject`.
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

        for await (const partial of result.experimental_partialOutputStream) {
          // Schema is flat Slide[] so partial IS the array (not { slides: [] }).
          const currentSlides = Array.isArray(partial) ? partial : [];

          for (let i = lastEmittedCount; i < currentSlides.length; i++) {
            const rawSlide = currentSlides[i];

            // rawSlide can be undefined while the partial stream is still
            // resolving array slots — skip until the slot has enough data.
            if (rawSlide == null || !isSlideRenderable(rawSlide)) continue;

            const processed = processSlide(rawSlide, i);
            allProcessedSlides.push(processed);

            console.log(
              `[Streamable] ✅ Slide ${i + 1} complete: "${processed.slideName}" (${processed.type})`
            );

            send({
              type: "slide",
              index: i,
              data: processed,
              progress: Math.round(((i + 1) / 10) * 90),
              timestamp: Date.now(),
            });

            lastEmittedCount = i + 1;
          }
        }

        // ── Save to database ──
        console.log(
          `\n[Streamable] Generation complete. ${allProcessedSlides.length} slides produced.`
        );

        send({
          type: "progress",
          message: "Saving presentation...",
          progress: 95,
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
          // Still emit complete — slides were generated successfully
        }

        send({
          type: "complete",
          projectId,
          progress: 100,
          message: `Generated ${allProcessedSlides.length} slides successfully`,
          timestamp: Date.now(),
        });

        console.log(
          "═══════════════════════════════════════════════════════════"
        );
        console.log("✅ STREAMABLE GENERATION COMPLETE");
        console.log(
          "═══════════════════════════════════════════════════════════\n"
        );
      } catch (error) {
        console.error("[Streamable] Generation error:", error);
        send({
          type: "error",
          message: error instanceof Error ? error.message : "Generation failed",
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
    content.content.length > 0
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
