"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/mobile-design/inngest/client";
import { revalidatePath } from "next/cache";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function regenerateFrame(frameId: string, projectId: string, prompt: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    if (!prompt || prompt.trim() === "") {
        throw new Error("Prompt is required for regeneration");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) throw new Error("User not found");

    // Verify ownership and get project with frame
    const project = await prisma.mobileProject.findFirst({
        where: {
            id: projectId,
            userId: user.id,
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    // Get the actual frame data
    const frame = await prisma.mobileFrame.findFirst({
        where: {
            id: frameId,
            projectId: projectId,
        },
    });

    if (!frame) {
        throw new Error("Frame not found");
    }

    // Trigger Inngest regeneration - pass full frame object like XDesign
    await inngest.send({
        name: "ui/regenerate.frame",
        data: {
            userId: user.id,
            projectId: project.id,
            frameId: frame.id,
            prompt: prompt,
            theme: project.theme,
            frame: {
                id: frame.id,
                title: frame.title,
                htmlContent: frame.htmlContent,
            },
        },
    });

    revalidatePath(`/mobile-design/${projectId}`);

    return { success: true };
}
