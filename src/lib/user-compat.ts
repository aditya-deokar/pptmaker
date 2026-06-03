import type { Prisma } from "@/generated/prisma";
import prisma from "@/lib/prisma";

export const AUTHENTICATED_APP_USER_SELECT = {
  id: true,
  clerkId: true,
  email: true,
  name: true,
  profileImage: true,
  subscription: true,
  PurchasedProjects: {
    select: {
      id: true,
    },
  },
} satisfies Prisma.UserSelect;

export type AuthenticatedAppUser = Prisma.UserGetPayload<{
  select: typeof AUTHENTICATED_APP_USER_SELECT;
}>;

export async function findAuthenticatedAppUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: AUTHENTICATED_APP_USER_SELECT,
  });
}

export async function findUserIdByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
}
