import prisma from './src/lib/prisma';

async function main() {
  const updatedProject = await prisma.project.update({
    where: { id: 'cmrrr4d5m0003la04od09tnq9' },
    data: { userId: 'f53e58b5-4c54-4f37-9083-8ed18f1815b6' }
  });
  console.log("Updated Project:", updatedProject.id, "to User:", updatedProject.userId);
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
