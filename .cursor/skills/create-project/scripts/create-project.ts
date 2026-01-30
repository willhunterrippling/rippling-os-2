#!/usr/bin/env npx tsx
/**
 * Create a new project in the database.
 *
 * Usage:
 *   npx tsx .cursor/skills/create-project/scripts/create-project.ts --name "My Project" --slug my-project
 *
 * Options:
 *   --name    Project display name (required)
 *   --slug    URL-safe identifier (optional, derived from name if not provided)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

function parseArgs(): { name: string; slug: string } {
  const args = process.argv.slice(2);
  let name = '';
  let slug = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--name' && args[i + 1]) {
      name = args[++i];
    } else if (args[i] === '--slug' && args[i + 1]) {
      slug = args[++i];
    }
  }

  if (!name) {
    console.error('Error: --name is required');
    console.error('Usage: npx tsx create-project.ts --name "My Project" [--slug my-project]');
    process.exit(1);
  }

  // Generate slug from name if not provided
  if (!slug) {
    slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  return { name, slug };
}

async function main() {
  const { name, slug } = parseArgs();

  // Get git email for owner
  const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();

  if (!email.endsWith('@rippling.com')) {
    console.error(`Error: Git email must be @rippling.com`);
    console.error(`Current email: ${email}`);
    console.error(`Fix with: git config user.email "you@rippling.com"`);
    process.exit(1);
  }

  // Check for existing project
  const existing = await prisma.project.findUnique({
    where: { slug },
  });

  if (existing) {
    console.error(`Error: Project "${slug}" already exists`);
    process.exit(1);
  }

  // Get or create user
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  // Create project
  const project = await prisma.project.create({
    data: {
      slug,
      name,
      description: '',
      ownerId: user.id,
    },
  });

  // Create default dashboard
  await prisma.dashboard.create({
    data: {
      projectId: project.id,
      name: 'main',
      config: {
        title: name,
        widgets: [],
      },
    },
  });

  await prisma.$disconnect();

  console.log(`
✅ Project created!

Project: ${name}
Slug: ${slug}
Owner: ${email}

Next steps:
1. Run /query to execute SQL and save results
2. Queries will automatically be added to the dashboard
3. Run /report to add written documentation

View at: /projects/${slug}
`);
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
