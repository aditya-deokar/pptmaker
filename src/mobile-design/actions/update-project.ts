"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function updateMobileProject(
    projectId: string,
    data: { name: string }
) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    await prisma.mobileProject.updateMany({
        where: {
            id: projectId,
            userId: user.id,
        },
        data: { name: data.name },
    });

    revalidatePath(`/mobile-design/${projectId}`);

    return { success: true };
}

export async function updateProjectTheme(
    projectId: string,
    themeId: string
) {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    await prisma.mobileProject.updateMany({
        where: {
            id: projectId,
            userId: user.id,
        },
        data: { theme: themeId },
    });

    revalidatePath(`/mobile-design/${projectId}`);

    return { success: true };
}
