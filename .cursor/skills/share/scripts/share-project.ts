#!/usr/bin/env npx tsx
/**
 * Share a project with other Rippling users.
 *
 * Usage:
 *   npx tsx .cursor/skills/share/scripts/share-project.ts --action add --project my-analysis --email jane.doe@rippling.com --permission EDIT
 *   npx tsx .cursor/skills/share/scripts/share-project.ts --action list --project my-analysis
 *   npx tsx .cursor/skills/share/scripts/share-project.ts --action remove --project my-analysis --email jane.doe@rippling.com
 *
 * Options:
 *   --action      Action to perform: add, list, or remove (required)
 *   --project     Project slug (required)
 *   --email       Email of user to share with (required for add/remove)
 *   --permission  Permission level: VIEW, EDIT, or ADMIN (required for add, default: VIEW)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

type Action = 'add' | 'list' | 'remove';
type Permission = 'VIEW' | 'EDIT' | 'ADMIN';

interface Args {
  action: Action;
  project: string;
  email?: string;
  permission?: Permission;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let action: Action | undefined;
  let project = '';
  let email = '';
  let permission: Permission = 'VIEW';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--action' && args[i + 1]) {
      const val = args[++i].toLowerCase();
      if (val === 'add' || val === 'list' || val === 'remove') {
        action = val;
      } else {
        console.error(`Error: Invalid action "${val}". Must be add, list, or remove.`);
        process.exit(1);
      }
    } else if (args[i] === '--project' && args[i + 1]) {
      project = args[++i];
    } else if (args[i] === '--email' && args[i + 1]) {
      email = args[++i];
    } else if (args[i] === '--permission' && args[i + 1]) {
      const val = args[++i].toUpperCase();
      if (val === 'VIEW' || val === 'EDIT' || val === 'ADMIN') {
        permission = val;
      } else {
        console.error(`Error: Invalid permission "${val}". Must be VIEW, EDIT, or ADMIN.`);
        process.exit(1);
      }
    }
  }

  if (!action) {
    console.error('Error: --action is required (add, list, or remove)');
    printUsage();
    process.exit(1);
  }

  if (!project) {
    console.error('Error: --project is required');
    printUsage();
    process.exit(1);
  }

  if ((action === 'add' || action === 'remove') && !email) {
    console.error(`Error: --email is required for ${action} action`);
    printUsage();
    process.exit(1);
  }

  return { action, project, email: email || undefined, permission };
}

function printUsage() {
  console.error(`
Usage:
  npx tsx share-project.ts --action add --project <slug> --email <email> --permission <VIEW|EDIT|ADMIN>
  npx tsx share-project.ts --action list --project <slug>
  npx tsx share-project.ts --action remove --project <slug> --email <email>
`);
}

async function checkPermission(projectId: string, currentUserEmail: string, ownerEmail: string) {
  if (ownerEmail === currentUserEmail) {
    return true;
  }

  const adminShare = await prisma.projectShare.findFirst({
    where: {
      projectId,
      user: { email: currentUserEmail },
      permission: 'ADMIN',
    },
  });

  return !!adminShare;
}

async function addShare(projectSlug: string, shareEmail: string, permission: Permission) {
  // Validate email domain
  if (!shareEmail.endsWith('@rippling.com')) {
    console.error(`Error: Email must be @rippling.com`);
    console.error(`Got: ${shareEmail}`);
    process.exit(1);
  }

  // Get current user
  const currentUserEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();

  // Get project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { owner: true },
  });

  if (!project) {
    console.error(`Error: Project "${projectSlug}" not found`);
    process.exit(1);
  }

  // Check permission
  const hasPermission = await checkPermission(project.id, currentUserEmail, project.owner.email);
  if (!hasPermission) {
    console.error('Error: You do not have permission to share this project');
    console.error('You must be the owner or have ADMIN permission');
    process.exit(1);
  }

  // Find or create target user
  const targetUser = await prisma.user.upsert({
    where: { email: shareEmail },
    create: { email: shareEmail },
    update: {},
  });

  // Create or update share
  await prisma.projectShare.upsert({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: targetUser.id,
      },
    },
    create: {
      projectId: project.id,
      userId: targetUser.id,
      permission,
    },
    update: {
      permission,
    },
  });

  console.log(`
✅ Project shared!

Project: ${project.name}
Shared with: ${shareEmail}
Permission: ${permission}

They can now access:
- /projects/${projectSlug}

Note: They'll need to sign in with their @rippling.com email
to view the dashboard.
`);
}

async function listShares(projectSlug: string) {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      owner: { select: { email: true, name: true } },
      shares: {
        include: {
          user: { select: { email: true, name: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!project) {
    console.error(`Error: Project "${projectSlug}" not found`);
    process.exit(1);
  }

  console.log(`
Project: ${project.name} (${projectSlug})
Owner: ${project.owner.email}

Shares:`);

  if (project.shares.length === 0) {
    console.log('  (none)');
  } else {
    project.shares.forEach((s) => {
      const name = s.user.name ? ` (${s.user.name})` : '';
      console.log(`  ${s.user.email}${name}: ${s.permission}`);
    });
  }

  console.log('');
}

async function removeShare(projectSlug: string, shareEmail: string) {
  // Get current user
  const currentUserEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();

  // Get project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { owner: true },
  });

  if (!project) {
    console.error(`Error: Project "${projectSlug}" not found`);
    process.exit(1);
  }

  // Check permission
  const hasPermission = await checkPermission(project.id, currentUserEmail, project.owner.email);
  if (!hasPermission) {
    console.error('Error: You do not have permission to manage shares for this project');
    console.error('You must be the owner or have ADMIN permission');
    process.exit(1);
  }

  // Find target user
  const targetUser = await prisma.user.findUnique({
    where: { email: shareEmail },
  });

  if (!targetUser) {
    console.error(`Error: User "${shareEmail}" not found`);
    process.exit(1);
  }

  // Check if share exists
  const existingShare = await prisma.projectShare.findUnique({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: targetUser.id,
      },
    },
  });

  if (!existingShare) {
    console.error(`Error: "${shareEmail}" does not have access to this project`);
    process.exit(1);
  }

  // Remove share
  await prisma.projectShare.delete({
    where: {
      projectId_userId: {
        projectId: project.id,
        userId: targetUser.id,
      },
    },
  });

  console.log(`
✅ Share removed!

Project: ${project.name}
Removed: ${shareEmail}

They can no longer access /projects/${projectSlug}
`);
}

async function main() {
  const { action, project, email, permission } = parseArgs();

  switch (action) {
    case 'add':
      await addShare(project, email!, permission!);
      break;
    case 'list':
      await listShares(project);
      break;
    case 'remove':
      await removeShare(project, email!);
      break;
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
