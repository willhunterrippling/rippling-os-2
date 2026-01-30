/**
 * list-reports.ts - List all reports in a project
 * 
 * Usage: npx tsx .cursor/skills/report/scripts/list-reports.ts <project-slug>
 * 
 * Arguments:
 *   project-slug  - The project slug (e.g., "my-analysis")
 * 
 * This script:
 * 1. Validates the project exists
 * 2. Lists all reports with their names and dates
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  const [projectSlug] = process.argv.slice(2);
  
  // Validate arguments
  if (!projectSlug) {
    console.error('Usage: npx tsx list-reports.ts <project-slug>');
    console.error('');
    console.error('Arguments:');
    console.error('  project-slug  - The project slug (e.g., "my-analysis")');
    process.exit(1);
  }
  
  // Find project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });
  
  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    process.exit(1);
  }
  
  // List reports
  const reports = await prisma.report.findMany({
    where: { projectId: project.id },
    select: {
      name: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
  
  console.log(`Reports in ${project.name} (${projectSlug}):`);
  console.log('');
  
  if (reports.length === 0) {
    console.log('  (no reports)');
  } else {
    console.log('| Name | Created | Updated |');
    console.log('|------|---------|---------|');
    reports.forEach(r => {
      const created = r.createdAt.toISOString().split('T')[0];
      const updated = r.updatedAt.toISOString().split('T')[0];
      console.log(`| ${r.name} | ${created} | ${updated} |`);
    });
    console.log('');
    console.log(`Total: ${reports.length} report(s)`);
  }
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
