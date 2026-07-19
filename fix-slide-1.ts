import prisma from './src/lib/prisma';
import fs from 'fs';

async function main() {
  const slidesData = JSON.parse(fs.readFileSync('slides.json', 'utf8'));

  // Edit slide 1
  const slide1 = slidesData[0];
  
  // Update root container
  slide1.className = "h-full w-full max-w-7xl mx-auto px-6 md:px-12 py-16";

  const columns = slide1.content.content[0].content;
  const leftCol = columns[0];
  const rightCol = columns[1];

  // Update left column
  leftCol.className = "flex flex-col justify-center pr-4 md:pr-12 gap-2";
  
  // Heading1
  leftCol.content[0].className = "text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight drop-shadow-sm pb-2";
  
  // Paragraph
  leftCol.content[1].className = "text-xl md:text-2xl text-muted-foreground mt-4 leading-relaxed max-w-xl";

  // Button
  leftCol.content[2].className = "mt-8 w-fit px-8 py-6 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1";

  // Update right column image
  rightCol.content[0].className = "rounded-3xl object-cover w-full h-[400px] md:h-[500px] lg:h-[550px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-transform duration-700 hover:scale-[1.02] border border-border/50";

  // Update database
  await prisma.project.update({
    where: { id: 'cmrrr4d5m0003la04od09tnq9' },
    data: { slides: slidesData }
  });

  console.log('Slide 1 fixed successfully!');
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
