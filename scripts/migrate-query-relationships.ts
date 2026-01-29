#!/usr/bin/env npx tsx

/**
 * Migration Script: Populate Query Relationships
 * 
 * This script migrates existing queries to the new junction table structure:
 * 1. Parse dashboard configs to find queryName references → create DashboardQuery records
 * 2. Attach report_* queries to the first report in the project → create ReportQuery records
 * 3. Attach orphan queries to the "main" dashboard
 * 
 * Run with: npx tsx scripts/migrate-query-relationships.ts
 */

import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

interface DashboardConfig {
  widgets?: Array<{
    queryName?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

async function migrateQueryRelationships() {
  console.log('🔄 Starting query relationship migration...\n');

  // Get all projects with their dashboards, queries, and reports
  const projects = await prisma.project.findMany({
    include: {
      dashboards: true,
      queries: {
        include: {
          dashboards: true,
          reports: true,
        },
      },
      reports: true,
    },
  });

  let dashboardLinksCreated = 0;
  let reportLinksCreated = 0;
  let orphansAttached = 0;

  for (const project of projects) {
    console.log(`📁 Processing project: ${project.name} (${project.slug})`);

    // Track which queries have been linked
    const linkedQueryIds = new Set<string>();

    // 1. Parse dashboard configs and link queries
    for (const dashboard of project.dashboards) {
      const config = dashboard.config as DashboardConfig;
      const queryNames = new Set<string>();

      // Extract queryName from widgets
      if (config.widgets && Array.isArray(config.widgets)) {
        for (const widget of config.widgets) {
          if (widget.queryName) {
            queryNames.add(widget.queryName);
          }
        }
      }

      // Create DashboardQuery records for each referenced query
      for (const queryName of queryNames) {
        const query = project.queries.find(q => q.name === queryName);
        if (query) {
          // Check if link already exists
          const existingLink = query.dashboards.find(
            dq => dq.dashboardId === dashboard.id
          );
          if (!existingLink) {
            await prisma.dashboardQuery.create({
              data: {
                dashboardId: dashboard.id,
                queryId: query.id,
              },
            });
            dashboardLinksCreated++;
            console.log(`   ✅ Linked query "${queryName}" to dashboard "${dashboard.name}"`);
          }
          linkedQueryIds.add(query.id);
        }
      }
    }

    // 2. Link report_* queries to the first report
    const firstReport = project.reports[0];
    if (firstReport) {
      for (const query of project.queries) {
        if (query.name.startsWith('report_') || query.name.startsWith('report-')) {
          // Check if link already exists
          const existingLink = query.reports.find(
            rq => rq.reportId === firstReport.id
          );
          if (!existingLink) {
            await prisma.reportQuery.create({
              data: {
                reportId: firstReport.id,
                queryId: query.id,
              },
            });
            reportLinksCreated++;
            console.log(`   ✅ Linked report query "${query.name}" to report "${firstReport.name}"`);
          }
          linkedQueryIds.add(query.id);
        }
      }
    }

    // 3. Attach orphan queries to "main" dashboard
    const mainDashboard = project.dashboards.find(d => d.name === 'main');
    if (mainDashboard) {
      for (const query of project.queries) {
        if (!linkedQueryIds.has(query.id)) {
          // This query hasn't been linked yet - attach to main dashboard
          const existingLink = query.dashboards.find(
            dq => dq.dashboardId === mainDashboard.id
          );
          if (!existingLink) {
            await prisma.dashboardQuery.create({
              data: {
                dashboardId: mainDashboard.id,
                queryId: query.id,
              },
            });
            orphansAttached++;
            console.log(`   ⚠️ Orphan query "${query.name}" attached to "main" dashboard`);
          }
        }
      }
    } else if (project.queries.some(q => !linkedQueryIds.has(q.id))) {
      console.log(`   ⚠️ No "main" dashboard found - some queries may remain unlinked`);
    }

    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Migration Summary:');
  console.log(`   Dashboard links created: ${dashboardLinksCreated}`);
  console.log(`   Report links created: ${reportLinksCreated}`);
  console.log(`   Orphan queries attached: ${orphansAttached}`);
  console.log('');
  console.log('✅ Migration complete!');
}

async function main() {
  try {
    await migrateQueryRelationships();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
