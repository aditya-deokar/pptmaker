"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function listMobileProjects() {
    const { userId } = await auth();

    if (!userId) {
        throw new Error("Unauthorized");
    }

    const user = await findUserIdByClerkId(userId);

    if (!user) {
        throw new Error("User not found");
    }

    const projects = await prisma.mobileProject.findMany({
        where: {
            userId: user.id,
            isDeleted: false,
        },
        include: {
            frames: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return { projects };
}
