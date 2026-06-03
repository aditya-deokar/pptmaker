"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { inngest } from "@/mobile-design/inngest/client";
import { revalidatePath } from "next/cache";
import { checkAndIncrementUsage } from "@/lib/usage-limit";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function createMobileProject(formData: {
    name: string;
    prompt: string;
}) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    // --- Usage Limit Check ---
    const usageCheck = await checkAndIncrementUsage(user.id);
    if (!usageCheck.success) {
        return { 
            success: false, 
            error: usageCheck.error,
            usage: usageCheck.usage,
            limit: usageCheck.limit 
        };
    }

    const project = await prisma.mobileProject.create({
        data: {
            userId: user.id,
            name: formData.name,
        },
    });

    // Trigger Inngest screen generation
    await inngest.send({
        name: "ui/generate.screens",
        data: {
            userId: user.id,
            projectId: project.id,
            prompt: formData.prompt,
            frames: [],
            theme: null,
        },
    });

    revalidatePath("/mobile-design");

    return { success: true, project };
}
