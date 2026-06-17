import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import {
  AUTHENTICATED_APP_USER_SELECT,
  findAuthenticatedAppUserByClerkId,
} from '@/lib/user-compat';

export async function resolveCurrentOAuthUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) {
    return null;
  }

  const existingUser = await findAuthenticatedAppUserByClerkId(clerkUser.id);
  if (existingUser) {
    return existingUser;
  }

  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
  if (!primaryEmail) {
    return null;
  }

  const name = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(' ')
    || primaryEmail;

  return prisma.user.create({
    data: {
      clerkId: clerkUser.id,
      email: primaryEmail,
      name,
      profileImage: clerkUser.imageUrl,
    },
    select: AUTHENTICATED_APP_USER_SELECT,
  });
}
