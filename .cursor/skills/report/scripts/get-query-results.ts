/**
 * get-query-results.ts - Fetch query results from the database
 * 
 * Usage:
 *   npx tsx .cursor/skills/report/scripts/get-query-results.ts <project-slug> <query-name>
 *   npx tsx .cursor/skills/report/scripts/get-query-results.ts <project-slug> --pattern "report_*"
 *   npx tsx .cursor/skills/report/scripts/get-query-results.ts <project-slug> --all
 * 
 * Arguments:
 *   project-slug  - The project slug (e.g., "my-analysis")
 *   query-name    - The specific query name to fetch
 *   --pattern     - Glob pattern to match query names (e.g., "report_*", "mops_*")
 *   --all         - Fetch all query results for the project
 * 
 * This script fetches query results (not just SQL) from the QueryResult table.
 * Use this when writing reports to reference data from previously run queries.
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

function globToRegex(pattern: string): RegExp {
  // Convert glob pattern to regex
  // * matches any characters except separator
  // ? matches single character
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped}$`, 'i');
}

interface QueryResultOutput {
  queryName: string;
  rowCount: number | null;
  executedAt: string | null;
  executedBy: string | null;
  data: unknown[] | null;
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage:');
    console.error('  npx tsx get-query-results.ts <project-slug> <query-name>');
    console.error('  npx tsx get-query-results.ts <project-slug> --pattern "report_*"');
    console.error('  npx tsx get-query-results.ts <project-slug> --all');
    console.error('');
    console.error('Arguments:');
    console.error('  project-slug  - The project slug (e.g., "my-analysis")');
    console.error('  query-name    - The specific query name to fetch');
    console.error('  --pattern     - Glob pattern to match query names');
    console.error('  --all         - Fetch all query results for the project');
    process.exit(1);
  }

  const projectSlug = args[0];
  
  // Parse mode: single query, pattern, or all
  let mode: 'single' | 'pattern' | 'all' = 'single';
  let queryName: string | undefined;
  let pattern: string | undefined;

  if (args[1] === '--all') {
    mode = 'all';
  } else if (args[1] === '--pattern') {
    mode = 'pattern';
    pattern = args[2];
    if (!pattern) {
      console.error('Error: --pattern requires a pattern argument');
      console.error('Example: --pattern "report_*"');
      process.exit(1);
    }
  } else {
    queryName = args[1];
  }

  // Find project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
  });

  if (!project) {
    console.error(`Error: Project not found: ${projectSlug}`);
    process.exit(1);
  }

  // Fetch queries with results
  const queries = await prisma.query.findMany({
    where: { projectId: project.id },
    include: { result: true },
    orderBy: { name: 'asc' },
  });

  // Filter based on mode
  let filteredQueries = queries;
  
  if (mode === 'single') {
    filteredQueries = queries.filter(q => q.name === queryName);
    if (filteredQueries.length === 0) {
      console.error(`Error: Query not found: ${queryName}`);
      console.error(`Project: ${projectSlug}`);
      console.error('');
      console.error('Available queries:');
      if (queries.length === 0) {
        console.error('  (no queries in this project)');
      } else {
        queries.forEach(q => console.error(`  - ${q.name}`));
      }
      await prisma.$disconnect();
      process.exit(1);
    }
  } else if (mode === 'pattern') {
    const regex = globToRegex(pattern!);
    filteredQueries = queries.filter(q => regex.test(q.name));
    if (filteredQueries.length === 0) {
      console.error(`Error: No queries match pattern: ${pattern}`);
      console.error(`Project: ${projectSlug}`);
      console.error('');
      console.error('Available queries:');
      if (queries.length === 0) {
        console.error('  (no queries in this project)');
      } else {
        queries.forEach(q => console.error(`  - ${q.name}`));
      }
      await prisma.$disconnect();
      process.exit(1);
    }
  }

  // Build output
  const results: QueryResultOutput[] = filteredQueries.map(q => ({
    queryName: q.name,
    rowCount: q.result?.rowCount ?? null,
    executedAt: q.result?.executedAt?.toISOString() ?? null,
    executedBy: q.result?.executedBy ?? null,
    data: q.result?.data as unknown[] | null,
  }));

  // Output
  if (mode === 'single') {
    // Single query: output just the one result
    console.log(JSON.stringify(results[0], null, 2));
  } else {
    // Multiple queries: output array
    console.log(JSON.stringify(results, null, 2));
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
