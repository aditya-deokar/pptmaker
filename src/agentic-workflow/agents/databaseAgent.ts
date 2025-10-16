// /agents/databaseAgent.ts

import { PrismaClient } from "@prisma/client";
import { PresentationGraphState } from "../lib/state";
import { currentUser } from '@clerk/nextjs/server';

// Initialize a single Prisma client instance to be reused.
const prisma = new PrismaClient();

/**
 * Final Node: Saves the generated outlines and slides to the database.
 * This node should only run after the JSON compiler has successfully finished.
 *
 * @param state The final state of the graph.
 * @returns An empty partial state, as this is a terminal action.
 */
export async function saveToDatabase(
  state: PresentationGraphState
): Promise<Partial<PresentationGraphState>> {
  console.log("--- Running Save to Database Node ---");

  // 1. Extract the necessary data from the final state
  const { outlines, finalPresentationJson, userInput } = state;

  // 2. Validate that we have the data we need to save
  if (!outlines || outlines.length === 0) {
    console.error("🔴 Cannot save to DB: Outlines are missing from the state.");
    return { error: "Cannot save presentation: Outlines were not generated." };
  }
  if (!finalPresentationJson) {
    console.error("🔴 Cannot save to DB: Final presentation JSON is missing.");
    return { error: "Cannot save presentation: Final JSON was not compiled." };
  }

  try {
    // 3. Find the project to update.
    // NOTE: This assumes the project was already created and you have its ID.
    // A robust implementation would pass the projectId through the graph's state.
    // For now, let's assume we find it by the initial userInput title.
    // A better approach is shown in the "Enhancement" section below.

    // For this example, let's assume you pass projectId in the initial state.
    // We'll modify the state and server action to support this.
   const user = await currentUser();
           if (!user) {
             return { error: "User not authenticated" };
           }
       
           const userExist = await prisma.user.findUnique({
             where: { clerkId: user.id },
           });
       
           if (!userExist) {
             return { error: "User not found in the database" };
           }

    await prisma.project.create({
      data: {
        title: userInput,
        userId: user.id,
        outlines: outlines,
        slides: finalPresentationJson as any, // Cast to 'any' to satisfy Prisma's Json type
        createdAt: new Date(), // if you have a createdAt field
        updatedAt: new Date(),
      },
    });

   
    return {}; // Return an empty object as this is the end of the line
  } catch (error) {
    console.error("🔴 Error saving presentation to the database:", error);
    return { error: "Failed to save the final presentation to the database." };
  }
}
