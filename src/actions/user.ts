'use server'

import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';
import {
  AUTHENTICATED_APP_USER_SELECT,
  findAuthenticatedAppUserByClerkId,
} from '@/lib/user-compat';


export const onAuthenticateUser = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return { status: 403 };
    }

    // console.log("USER", user.id);

    const userExist = await findAuthenticatedAppUserByClerkId(user.id);
    if (userExist) {
      return { status: 200, user: userExist };
    }

    const email = user.emailAddresses[0].emailAddress;

    // Check if user exists by email (e.g., they recreated their Clerk account)
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: AUTHENTICATED_APP_USER_SELECT,
    });

    if (existingUserByEmail) {
      // Update their Clerk ID to the new one
      const updatedUser = await prisma.user.update({
        where: { id: existingUserByEmail.id },
        data: { clerkId: user.id },
        select: AUTHENTICATED_APP_USER_SELECT,
      });
      return { status: 200, user: updatedUser };
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email: email,
        name: user.firstName + " " + user.lastName,
        profileImage: user.imageUrl,
      },
      select: AUTHENTICATED_APP_USER_SELECT,
    });
    if (newUser) {
      return { status: 201, user: newUser };
    }
    return { status: 400 };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Auth error:", message);
    return { status: 500 };
  }
};
