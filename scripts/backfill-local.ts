/**
 * backfill-local.ts - Backfill local files from database
 * 
 * Usage: npx tsx scripts/backfill-local.ts <project-slug>
 * 
 * Arguments:
 *   project-slug  - The project slug (e.g., "my-analysis")
 * 
 * This script:
 * 1. Fetches all reports and queries for a project from the database
 * 2. Saves reports to local-reports/<project>/<report>.md
 * 3. Saves queries to local-queries/<project>/<query>.sql
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { writeFileSync, mkdirSync } from 'fs';
import path from 'path';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  const [projectSlug] = process.argv.slice(2);
  
  if (!projectSlug) {
    console.error('Usage: npx tsx scripts/backfill-local.ts <project-slug>');
    console.error('');
    console.error('Arguments:');
    console.error('  project-slug  - The project slug (e.g., "my-analysis")');
    process.exit(1);
  }

  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { reports: true, queries: true },
  });

  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    process.exit(1);
  }

  console.log(`Backfilling local files for: ${project.name} (${projectSlug})`);
  console.log('');

  // Backfill reports
  if (project.reports.length > 0) {
    const reportsDir = path.join(process.cwd(), 'local-reports', projectSlug);
    mkdirSync(reportsDir, { recursive: true });
    
    for (const report of project.reports) {
      const filePath = path.join(reportsDir, `${report.name}.md`);
      writeFileSync(filePath, report.content);
      console.log(`📄 Report: local-reports/${projectSlug}/${report.name}.md`);
    }
  }

  // Backfill queries
  if (project.queries.length > 0) {
    const queriesDir = path.join(process.cwd(), 'local-queries', projectSlug);
    mkdirSync(queriesDir, { recursive: true });
    
    for (const query of project.queries) {
      const filePath = path.join(queriesDir, `${query.name}.sql`);
      writeFileSync(filePath, query.sql);
      console.log(`📄 Query: local-queries/${projectSlug}/${query.name}.sql`);
    }
  }

  console.log('');
  console.log(`✅ Backfilled ${project.reports.length} report(s), ${project.queries.length} query(ies)`);
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
