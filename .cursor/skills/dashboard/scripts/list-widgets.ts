/**
 * list-widgets.ts - List all widgets on a dashboard
 * 
 * Usage: npx tsx .cursor/skills/dashboard/scripts/list-widgets.ts <project-slug> [dashboard-name]
 * 
 * Examples:
 *   npx tsx .cursor/skills/dashboard/scripts/list-widgets.ts my-analysis
 *   npx tsx .cursor/skills/dashboard/scripts/list-widgets.ts my-analysis main
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

interface Widget {
  type: 'chart' | 'metric' | 'table';
  queryName: string;
  title: string;
  chartType?: string;
  xKey?: string;
  yKey?: string;
  valueKey?: string;
  previousKey?: string;
  columns?: string[];
}

async function main() {
  const [projectSlug, dashboardName = 'main'] = process.argv.slice(2);

  if (!projectSlug) {
    console.error('Usage: npx tsx list-widgets.ts <project-slug> [dashboard-name]');
    console.error('');
    console.error('Examples:');
    console.error('  npx tsx list-widgets.ts my-analysis');
    console.error('  npx tsx list-widgets.ts my-analysis main');
    process.exit(1);
  }

  const dashboard = await prisma.dashboard.findFirst({
    where: {
      project: { slug: projectSlug },
      name: dashboardName,
    },
    include: {
      project: { select: { name: true, slug: true } },
    },
  });

  if (!dashboard) {
    console.error(`Dashboard not found: ${projectSlug}/${dashboardName}`);
    
    // List available dashboards for this project
    const dashboards = await prisma.dashboard.findMany({
      where: { project: { slug: projectSlug } },
      select: { name: true },
    });
    
    if (dashboards.length > 0) {
      console.error('');
      console.error('Available dashboards:');
      dashboards.forEach(d => console.error(`  - ${d.name}`));
    } else {
      console.error('No dashboards found for this project.');
    }
    
    await prisma.$disconnect();
    process.exit(1);
  }

  const config = dashboard.config as { title?: string; widgets?: Widget[] };
  const widgets = config.widgets || [];

  console.log(`Dashboard: ${dashboard.project.name} / ${dashboardName}`);
  console.log(`Title: ${config.title || '(untitled)'}`);
  console.log(`Widgets: ${widgets.length}`);
  console.log('');

  if (widgets.length === 0) {
    console.log('No widgets configured.');
  } else {
    widgets.forEach((widget, index) => {
      console.log(`[${index + 1}] ${widget.title}`);
      console.log(`    Type: ${widget.type}`);
      console.log(`    Query: ${widget.queryName}`);
      
      if (widget.type === 'chart') {
        console.log(`    Chart: ${widget.chartType} (x: ${widget.xKey}, y: ${widget.yKey})`);
      } else if (widget.type === 'metric') {
        console.log(`    Value: ${widget.valueKey}${widget.previousKey ? ` (compare: ${widget.previousKey})` : ''}`);
      } else if (widget.type === 'table') {
        console.log(`    Columns: ${widget.columns?.join(', ') || '(all)'}`);
      }
      
      console.log('');
    });
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Error:', err.message || err);
  await prisma.$disconnect();
  process.exit(1);
});
