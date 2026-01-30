/**
 * get-report.ts - Fetch a report's content from a project
 * 
 * Usage: npx tsx .cursor/skills/report/scripts/get-report.ts <project-slug> <report-name>
 * 
 * Arguments:
 *   project-slug  - The project slug (e.g., "my-analysis")
 *   report-name   - The report name (e.g., "suppression-analysis")
 * 
 * This script:
 * 1. Validates the project exists
 * 2. Fetches the report
 * 3. Outputs the markdown content to stdout
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  const [projectSlug, reportName] = process.argv.slice(2);
  
  // Validate arguments
  if (!projectSlug || !reportName) {
    console.error('Usage: npx tsx get-report.ts <project-slug> <report-name>');
    console.error('');
    console.error('Arguments:');
    console.error('  project-slug  - The project slug (e.g., "my-analysis")');
    console.error('  report-name   - The report name (e.g., "suppression-analysis")');
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
  
  // Find report
  const report = await prisma.report.findUnique({
    where: {
      projectId_name: {
        projectId: project.id,
        name: reportName,
      },
    },
  });
  
  if (!report) {
    console.error(`Error: Report not found: ${reportName}`);
    console.error(`Project: ${projectSlug}`);
    console.error('');
    console.error('Available reports:');
    
    const reports = await prisma.report.findMany({
      where: { projectId: project.id },
      select: { name: true },
      orderBy: { updatedAt: 'desc' },
    });
    
    if (reports.length === 0) {
      console.error('  (no reports in this project)');
    } else {
      reports.forEach(r => console.error(`  - ${r.name}`));
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }
  
  // Output content to stdout
  console.log(report.content);
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
