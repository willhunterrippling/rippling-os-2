/**
 * create-example-project.ts - Create a starter example project for a user
 * 
 * Usage: npx tsx .cursor/skills/setup/scripts/create-example-project.ts
 * 
 * This script:
 * 1. Gets or creates the user from git email
 * 2. Creates an example project with slug "example-{username}"
 * 3. Adds sample queries and a dashboard with widgets
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function main() {
  // Get and validate git email
  const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
  
  if (!email) {
    console.error('Error: Git email not configured');
    console.error('Run: git config user.email "you@rippling.com"');
    process.exit(1);
  }
  
  if (!email.endsWith('@rippling.com')) {
    console.error('Error: Git email must be @rippling.com');
    console.error(`Current email: ${email}`);
    process.exit(1);
  }
  
  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  
  // Generate project slug from username
  const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const exampleSlug = `example-${username}`;
  const exampleName = `Example Project (${username})`;
  
  // Check if already exists
  const existing = await prisma.project.findUnique({
    where: { slug: exampleSlug },
  });
  
  if (existing) {
    console.log('Example project already exists:', exampleSlug);
    console.log('View at: /projects/' + exampleSlug);
    await prisma.$disconnect();
    return;
  }
  
  // Create the example project
  const project = await prisma.project.create({
    data: {
      slug: exampleSlug,
      name: exampleName,
      description: 'A starter project with example queries and dashboard widgets',
      ownerId: user.id,
    },
  });
  
  // Create pipeline metrics query
  await prisma.query.create({
    data: {
      projectId: project.id,
      name: 'pipeline_metrics',
      sql: `-- Pipeline metrics overview
SELECT
    COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END) as total_opportunities,
    COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) as qualified_opportunities,
    ROUND(
        COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) * 100.0 /
        NULLIF(COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END), 0),
        1
    ) as conversion_rate
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND created_date >= DATEADD(day, -30, CURRENT_DATE())
LIMIT 1;`,
    },
  });
  
  // Create weekly trend query
  await prisma.query.create({
    data: {
      projectId: project.id,
      name: 'weekly_trend',
      sql: `-- Weekly opportunity creation trend
SELECT
    DATE_TRUNC('week', created_date) as week,
    COUNT(DISTINCT id) as new_opportunities
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND created_date >= DATEADD(day, -90, CURRENT_DATE())
GROUP BY DATE_TRUNC('week', created_date)
ORDER BY week DESC
LIMIT 12;`,
    },
  });
  
  // Create dashboard with widgets
  // NOTE: Use UPPERCASE keys to match Snowflake column names
  await prisma.dashboard.create({
    data: {
      projectId: project.id,
      name: 'main',
      config: {
        title: exampleName,
        widgets: [
          {
            type: 'metric',
            queryName: 'pipeline_metrics',
            title: 'Total Opportunities (30d)',
            valueKey: 'TOTAL_OPPORTUNITIES',
          },
          {
            type: 'metric',
            queryName: 'pipeline_metrics',
            title: 'Qualified (30d)',
            valueKey: 'QUALIFIED_OPPORTUNITIES',
          },
          {
            type: 'metric',
            queryName: 'pipeline_metrics',
            title: 'Conversion Rate',
            valueKey: 'CONVERSION_RATE',
            suffix: '%',
          },
          {
            type: 'chart',
            queryName: 'weekly_trend',
            title: 'Weekly New Opportunities',
            chartType: 'bar',
            xKey: 'WEEK',
            yKey: 'NEW_OPPORTUNITIES',
          },
        ],
      },
    },
  });
  
  console.log('Created example project:', exampleSlug);
  console.log('View at: /projects/' + exampleSlug);
  
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
