import prisma from './src/lib/prisma';
import fs from 'fs';

async function main() {
  const slidesData = JSON.parse(fs.readFileSync('slides.json', 'utf8'));

  // Edit slide 9 (index 8)
  const slide9 = slidesData[8];
  
  // Update root container
  slide9.className = "h-full w-full max-w-7xl mx-auto px-6 md:px-12 py-16 flex flex-col justify-center";

  // Main column
  const mainCol = slide9.content.content;
  
  // Title
  mainCol[0].className = "text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-10 text-center";
  
  const bentoGrid = mainCol[1];

  // Col 1
  const col1 = bentoGrid.content[0];
  col1.className = "p-3 h-full w-full"; // wrapper
  col1.content = [{
    id: "col1-inner",
    type: "column",
    name: "Inner Container",
    className: "h-full w-full bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-3 shadow-sm border border-slate-200 dark:border-slate-800",
    content: [
      {
        id: "col1-image",
        type: "image",
        name: "Image",
        content: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=1200&q=80",
        className: "w-full h-full min-h-[300px] object-cover rounded-[1.5rem]"
      }
    ]
  }];

  // Col 2
  const col2 = bentoGrid.content[1];
  col2.className = "p-3 h-full w-full"; // wrapper
  col2.content = [{
    id: "col2-inner",
    type: "column",
    name: "Inner Container",
    className: "h-full w-full flex flex-col gap-6",
    content: [
      {
        id: "stat1",
        type: "statBox",
        name: "Stat Box",
        content: "50ms",
        label: "API Latency",
        icon: "⚡",
        className: "flex-1 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm"
      },
      {
        id: "stat2",
        type: "statBox",
        name: "Stat Box",
        content: "99.9%",
        label: "Uptime",
        icon: "🛡️",
        className: "flex-1 rounded-[2rem] bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-sm"
      }
    ]
  }];

  // Col 3
  const col3 = bentoGrid.content[2];
  col3.className = "p-3 h-full w-full"; // wrapper
  col3.content = [{
    id: "col3-inner",
    type: "column",
    name: "Inner Container",
    className: "h-full w-full bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-center",
    content: [
      {
        id: "col3-heading",
        type: "heading2",
        name: "Heading",
        content: "Key Insights",
        className: "text-2xl font-bold mb-6 text-foreground"
      },
      {
        id: "col3-list",
        type: "bulletList",
        name: "List",
        content: [
          "Distributed edge caching for global low-latency",
          "Redundant data stores ensuring zero data loss",
          "Auto-scaling infrastructure based on demand"
        ],
        className: "space-y-4 text-lg text-muted-foreground marker:text-primary"
      }
    ]
  }];

  // Update database
  await prisma.project.update({
    where: { id: 'cmrrr4d5m0003la04od09tnq9' },
    data: { slides: slidesData }
  });

  console.log('Slide 9 fixed successfully!');
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
