---
name: share
description: Share projects with other Rippling users. Use when the user says "/share", wants to add collaborators, share access, or manage project permissions.
---

# /share - Share Project

Share a project with other Rippling users via CLI.

## STOP - Clarify Before Proceeding

**You MUST know these before sharing:**

| Requirement | How to Clarify |
|-------------|----------------|
| Project | "Which project do you want to share?" |
| User email | "Who should I share it with? (email address)" |
| Permission | "Should they be an editor or viewer?" |

**If any of these are unclear, ASK THE USER.**

## Trigger

User says "share", "/share", "share project", or "add collaborator".

## Workflow

### 1. Collect Share Details

Confirm you have:
- **Project**: Which project do you want to share?
- **Email**: Who should get access? (must be @rippling.com)
- **Permission**: What level of access?
  - **VIEW** - Can view dashboards, queries, reports
  - **EDIT** - Can run queries, add to dashboard, edit reports
  - **ADMIN** - Can manage shares and delete content

### 2. Validate Permission

Check that the current user has permission to share:
- Must be project owner OR
- Must have ADMIN permission on the project

Get git email:
```bash
git config user.email
```

### 3. Add Share to Database

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

// Find or create target user
const targetUser = await prisma.user.upsert({
  where: { email: shareEmail },
  create: { email: shareEmail },
  update: {},
});

// Get project
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
  include: { owner: true },
});

// Check permission
const currentUserEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();
if (project.owner.email !== currentUserEmail) {
  const share = await prisma.projectShare.findFirst({
    where: {
      projectId: project.id,
      user: { email: currentUserEmail },
      permission: 'ADMIN',
    },
  });
  if (!share) throw new Error('No permission to share');
}

// Create share
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
    permission: permission, // VIEW, EDIT, or ADMIN
  },
  update: {
    permission: permission,
  },
});

await prisma.$disconnect();
```

### 4. Output Confirmation

```
✅ Project shared!

Project: [project-name]
Shared with: [email]
Permission: [VIEW/EDIT/ADMIN]

They can now access:
- /projects/[slug]

Note: They'll need to sign in with their @rippling.com email
to view the dashboard.
```

## Usage Examples

```
/share my-analysis with jane.doe@rippling.com as editor
/share pipeline-report john.smith@rippling.com view
/share Q4-analysis team@rippling.com admin
```

## List Current Shares

To see who has access to a project:

```typescript
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
  include: {
    owner: { select: { email: true, name: true } },
    shares: {
      include: {
        user: { select: { email: true, name: true } },
      },
    },
  },
});

console.log('Owner:', project.owner.email);
project.shares.forEach(s => {
  console.log(`${s.user.email}: ${s.permission}`);
});
```

## Remove Share

To remove someone's access:

```typescript
await prisma.projectShare.delete({
  where: {
    projectId_userId: {
      projectId: project.id,
      userId: targetUser.id,
    },
  },
});
```

## Permission Levels

| Level | View | Run Queries | Edit Dashboard | Manage Shares | Delete |
|-------|------|-------------|----------------|---------------|--------|
| VIEW  | ✓    | ✗           | ✗              | ✗             | ✗      |
| EDIT  | ✓    | ✓           | ✓              | ✗             | ✗      |
| ADMIN | ✓    | ✓           | ✓              | ✓             | ✓      |
| Owner | ✓    | ✓           | ✓              | ✓             | ✓      |

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Check project slug |
| Email not @rippling.com | Only Rippling emails allowed |
| No permission to share | Must be owner or admin |
| Database connection fails | Check DATABASE_URL |
