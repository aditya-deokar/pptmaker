"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function deleteMobileProject(projectId: string) {
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
        data: { isDeleted: true },
    });

    revalidatePath("/mobile-design");

    return { success: true };
}
