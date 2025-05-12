'use server'

import prisma from '@/lib/prisma';
import { currentUser } from '@clerk/nextjs/server';


export const onAuthenticateUser = async () => {
  try {
    const user = await currentUser();
    if (!user) {
      return { status: 403 };
    }

    // console.log("USER", user.id);

    const userExist = await prisma.user.findUnique({
      where: {
        clerkId: user.id,
      },
      include:{
        PurchasedProjects: {
          select:{
            id: true
          }
        }
      }
    });
    if (userExist) {
      return { status: 200, user: userExist };
    }

    const newUser = await prisma.user.create({
      data: {
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        name: user.firstName + " " + user.lastName,
        profileImage: user.imageUrl,
      },
    });
    if (newUser) {
      return { status: 201, user: newUser };
    }
    return { status: 400 };
  } catch (error) {
    console.log("🔴 ERROR", error);
    return { status: 500 };
  }
};