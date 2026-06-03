"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function getMobileProject(projectId: string) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const project = await prisma.mobileProject.findFirst({
        where: {
            id: projectId,
            userId: user.id,
        },
        include: {
            frames: {
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });

    if (!project) {
        throw new Error("Project not found");
    }

    return { project };
}
