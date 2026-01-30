/**
 * create-report.ts - Create or update a report in a project
 * 
 * Usage: npx tsx .cursor/skills/report/scripts/create-report.ts <project-slug> <report-name> <content-file>
 * 
 * Arguments:
 *   project-slug  - The project slug (e.g., "my-analysis")
 *   report-name   - The report name (e.g., "suppression-analysis")
 *   content-file  - Path to markdown file with report content
 * 
 * This script:
 * 1. Validates the project exists
 * 2. Reads the markdown content from the file
 * 3. Creates or updates the report (upsert)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { readFileSync, existsSync } from 'fs';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  const [projectSlug, reportName, contentFile] = process.argv.slice(2);
  
  // Validate arguments
  if (!projectSlug || !reportName || !contentFile) {
    console.error('Usage: npx tsx create-report.ts <project-slug> <report-name> <content-file>');
    console.error('');
    console.error('Arguments:');
    console.error('  project-slug  - The project slug (e.g., "my-analysis")');
    console.error('  report-name   - The report name (e.g., "suppression-analysis")');
    console.error('  content-file  - Path to markdown file with report content');
    process.exit(1);
  }
  
  // Check content file exists
  if (!existsSync(contentFile)) {
    console.error(`Error: Content file not found: ${contentFile}`);
    process.exit(1);
  }
  
  // Find project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });
  
  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    console.error('Run /create-project first to create the project.');
    process.exit(1);
  }
  
  // Read content
  const content = readFileSync(contentFile, 'utf-8');
  
  // Upsert report
  const report = await prisma.report.upsert({
    where: {
      projectId_name: {
        projectId: project.id,
        name: reportName,
      },
    },
    create: {
      projectId: project.id,
      name: reportName,
      content,
    },
    update: {
      content,
    },
  });
  
  console.log('✅ Report saved!');
  console.log('');
  console.log(`Project: ${project.name} (${projectSlug})`);
  console.log(`Report: ${reportName}`);
  console.log(`View at: /projects/${projectSlug}/reports/${reportName}`);
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
