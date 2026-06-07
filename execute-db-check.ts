import prisma from './src/lib/prisma'

async function main() {
  const projects = await prisma.project.findMany({
    where: {
      title: "Model Context Protocol (MCP)"
    },
    orderBy: {
      createdAt: 'desc'
    }
  })
  
  console.log("Found", projects.length, "projects")
  for (const p of projects) {
    console.log("Project ID:", p.id, "| Slides isArray:", Array.isArray(p.slides), "| Slides type:", typeof p.slides, "| Slides length:", Array.isArray(p.slides) ? p.slides.length : 'N/A')
  }
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
