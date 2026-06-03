"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/mobile-design/inngest/client";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function createMobileProject(name: string, prompt: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const project = await prisma.mobileProject.create({
        data: {
            userId: user.id,
            name,
        },
    });

    await inngest.send({
        name: "ui/generate.screens",
        data: {
            userId: user.id,
            projectId: project.id,
            prompt,
            frames: [],
            theme: null,
        },
    });

    return project;
}
