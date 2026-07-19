import prisma from './src/lib/prisma';

async function main() {
  const wrongUser = await prisma.user.findUnique({
    where: { id: '9b9d484a-375e-4a69-a8e7-cd8f43131151' }
  });
  console.log("Wrong user found:", wrongUser ? { id: wrongUser.id, email: wrongUser.email, clerkId: wrongUser.clerkId } : null);

  // also check what MCP api keys exist for the correct user vs the wrong user
  const keys1 = await prisma.mcpApiKey.findMany({ where: { userId: 'f53e58b5-4c54-4f37-9083-8ed18f1815b6' }});
  const keys2 = await prisma.mcpApiKey.findMany({ where: { userId: '9b9d484a-375e-4a69-a8e7-cd8f43131151' }});
  
  console.log("Keys for correct user:", keys1);
  console.log("Keys for wrong user:", keys2);
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
