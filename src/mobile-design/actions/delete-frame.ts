"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function deleteFrame(frameId: string, projectId: string) {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const user = await findUserIdByClerkId(userId);

    if (!user) throw new Error("User not found");

    // Verify ownership
    const project = await prisma.mobileProject.findFirst({
        where: {
            id: projectId,
            userId: user.id,
        },
        include: {
            frames: {
                where: { id: frameId },
            },
        },
    });

    if (!project || !project.frames.length) {
        throw new Error("Frame not found");
    }

    // Delete the frame
    await prisma.mobileFrame.delete({
        where: { id: frameId },
    });

    revalidatePath(`/mobile-design/${projectId}`);

    return { success: true };
}
