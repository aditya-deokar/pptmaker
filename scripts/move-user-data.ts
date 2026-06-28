import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const oldEmail = "adityadeokar80@gmail.com";
  const newEmail = "adityadeokar76@gmail.com";

  console.log(`Looking up users...`);
  
  const oldUser = await prisma.user.findUnique({
    where: { email: oldEmail },
  });

  const newUser = await prisma.user.findUnique({
    where: { email: newEmail },
  });

  if (!oldUser) {
    console.error(`Old user with email ${oldEmail} not found!`);
    process.exit(1);
  }

  if (!newUser) {
    console.error(`New user with email ${newEmail} not found!`);
    process.exit(1);
  }

  console.log(`Found old user ID: ${oldUser.id}`);
  console.log(`Found new user ID: ${newUser.id}`);

  console.log(`\nMoving Projects...`);
  const projectsUpdate = await prisma.project.updateMany({
    where: { userId: oldUser.id },
    data: { userId: newUser.id },
  });
  console.log(`Moved ${projectsUpdate.count} standard projects/presentations.`);

  console.log(`\nMoving Mobile Projects...`);
  const mobileProjectsUpdate = await prisma.mobileProject.updateMany({
    where: { userId: oldUser.id },
    data: { userId: newUser.id },
  });
  console.log(`Moved ${mobileProjectsUpdate.count} mobile projects.`);

  console.log(`\nMoving Generation Runs...`);
  const generationsUpdate = await prisma.presentationGenerationRun.updateMany({
    where: { userId: oldUser.id },
    data: { userId: newUser.id },
  });
  console.log(`Moved ${generationsUpdate.count} presentation generation runs.`);

  // Optional: Move Favorites
  console.log(`\nMoving Template Favorites...`);
  try {
    // We use try-catch because there might be unique constraint violations 
    // if the new user already favorited the same templates
    const favoritesUpdate = await prisma.templateFavorite.updateMany({
      where: { userId: oldUser.id },
      data: { userId: newUser.id },
    });
    console.log(`Moved ${favoritesUpdate.count} template favorites.`);
  } catch (error) {
    console.log(`Could not move favorites (likely due to duplicates). Skipping...`);
  }

  console.log(`\nData migration completed successfully!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
