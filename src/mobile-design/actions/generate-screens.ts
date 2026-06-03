"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/mobile-design/inngest/client";
import { revalidatePath } from "next/cache";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function generateScreens(
    projectId: string,
    prompt: string,
    themeId?: string
) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    // Verify project ownership
    const project = await prisma.mobileProject.findFirst({
        where: {
            id: projectId,
            userId: user.id,
        },
        include: {
            frames: true,
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    // Trigger Inngest screen generation
    await inngest.send({
        name: "ui/generate.screens",
        data: {
            userId: user.id,
            projectId: project.id,
            prompt: prompt,
            frames: project.frames,
            theme: themeId || project.theme || null,
        },
    });

    revalidatePath(`/mobile-design/${projectId}`);

    return { success: true };
}
