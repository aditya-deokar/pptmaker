'use server'

import { currentUser } from "@clerk/nextjs/server";
import { getUserUsageDetails } from "@/lib/usage-limit";
import { findUserIdByClerkId } from "@/lib/user-compat";

export async function getUserUsage() {
  try {
    const user = await currentUser();
    if (!user) return { status: 403, error: "Unauthorized" };

    const dbUser = await findUserIdByClerkId(user.id);

    if (!dbUser) return { status: 404, error: "User not found" };

    const details = await getUserUsageDetails(dbUser.id);

    return {
      status: 200,
      data: details
    };
  } catch (error) {
    console.error("Failed to get user usage:", error);
    return { status: 500, error: "Internal server error" };
  }
}
