import prisma from './src/lib/prisma';
import fs from 'fs';

async function main() {
  const project = await prisma.project.findUnique({
    where: { id: 'cmrrr4d5m0003la04od09tnq9' }
  });
  if (project) {
    fs.writeFileSync('slides.json', JSON.stringify(project.slides, null, 2));
    console.log('Saved to slides.json');
  }
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
