import { generateText } from "ai";
import { inngest } from "../client";
import { GENERATION_SYSTEM_PROMPT } from "@/mobile-design/lib/prompt";
import prisma from "@/lib/prisma";
import { BASE_VARIABLES, THEME_LIST } from "@/mobile-design/lib/themes";
import { unsplashTool } from "../tool";
import { getMobileDesignGenerationModel } from "@/mobile-design/lib/ai";

export const regenerateFrame = inngest.createFunction(
  { id: "regenerate-frame", triggers: [{ event: "ui/regenerate.frame" }] },
  async ({ event, step, publish }: any) => {
    const {
      userId,
      projectId,
      frameId,
      prompt,
      theme: themeId,
      frame,
    } = event.data;
    const CHANNEL = `user:${userId}`;

    // Step 1: Publish generation start
    await step.run("publish-generation-start", async () => {
      await publish({
        channel: CHANNEL,
        topic: "generation.start",
        data: {
          status: "generating",
          projectId: projectId,
        },
      });
      return { published: "generation.start" };
    });

    // Step 2: Generate new frame with the user's prompt
    const result = await step.run("regenerate-screen", async () => {
      const selectedTheme = THEME_LIST.find((t) => t.id === themeId);

      // Combine the Theme Styles + Base Variable
      const fullThemeCSS = `
        ${BASE_VARIABLES}
        ${selectedTheme?.style || ""}
      `;

      const aiResult = await generateText({
        model: await getMobileDesignGenerationModel(userId),
        system: GENERATION_SYSTEM_PROMPT,
        tools: {
          searchUnsplash: unsplashTool as any,
        },
        prompt: `
        USER REQUEST: ${prompt}

        ORIGINAL SCREEN TITLE: ${frame.title}
        ORIGINAL SCREEN HTML: ${frame.htmlContent}

        THEME VARIABLES (Reference ONLY - already defined in parent, do NOT redeclare these): ${fullThemeCSS}


        CRITICAL REQUIREMENTS A MUST - READ CAREFULLY:
        1. **PRESERVE the overall structure and layout - ONLY modify what the user explicitly requested**
          - Keep all existing components, styling, and layout that are NOT mentioned in the user request
          - Only change the specific elements the user asked for
          - Do not add or remove sections unless requested
          - Maintain the exact same HTML structure and CSS classes except for requested changes

        2. **Generate ONLY raw HTML markup for this mobile app screen using Tailwind CSS.**
          Use Tailwind classes for layout, spacing, typography, shadows, etc.
          Use theme CSS variables ONLY for color-related properties (bg-[var(--background)], text-[var(--foreground)], border-[var(--border)], ring-[var(--ring)], etc.)
        3. **All content must be inside a single root <div> that controls the layout.**
          - No overflow classes on the root.
          - All scrollable content must be in inner containers with hidden scrollbars: [&::-webkit-scrollbar]:hidden scrollbar-none
        4. **For absolute overlays (maps, bottom sheets, modals, etc.):**
          - Use \`relative w-full h-screen\` on the top div of the overlay.
        5. **For regular content:**
          - Use \`w-full h-full min-h-screen\` on the top div.
        6. **Do not use h-screen on inner content unless absolutely required.**
          - Height must grow with content; content must be fully visible inside an iframe.
        7. **For z-index layering:**
          - Ensure absolute elements do not block other content unnecessarily.
        8. **Output raw HTML only, starting with <div>.**
          - Do not include markdown, comments, <html>, <body>, or <head>.
        9. **Ensure iframe-friendly rendering:**
            - All elements must contribute to the final scrollHeight so your parent iframe can correctly resize.
        Generate the complete, production-ready HTML for this screen now
        `.trim(),
      });

      let finalHtml = aiResult.text ?? "";
      const match = finalHtml.match(/<div[\s\S]*<\/div>/);
      finalHtml = match ? match[0] : finalHtml;
      finalHtml = finalHtml.replace(/```/g, "");

      // Update the frame
      const updatedFrame = await prisma.mobileFrame.update({
        where: {
          id: frameId,
        },
        data: {
          htmlContent: finalHtml,
        },
      });

      return { success: true, frame: updatedFrame };
    });

    // Step 3: Publish frame.created event
    await step.run("publish-frame-created", async () => {
      await publish({
        channel: CHANNEL,
        topic: "frame.created",
        data: {
          frame: result.frame,
          screenId: frameId,
          projectId: projectId,
        },
      });
      return { published: "frame.created" };
    });

    // Step 4: Publish generation complete
    await step.run("publish-generation-complete", async () => {
      await publish({
        channel: CHANNEL,
        topic: "generation.complete",
        data: {
          status: "completed",
          projectId: projectId,
        },
      });
      return { published: "generation.complete" };
    });
  }
);
