# Share Project Reference

Detailed Prisma patterns, error handling, and technical reference for sharing projects.

## Setup

All scripts require this setup:

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});
```

## Prisma Patterns

### Get Current User Email

```typescript
const currentUserEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();

if (!currentUserEmail.endsWith('@rippling.com')) {
  throw new Error(`Git email must be @rippling.com, got: ${currentUserEmail}`);
}
```

### Find or Create Target User

```typescript
const targetUser = await prisma.user.upsert({
  where: { email: shareEmail },
  create: { email: shareEmail },
  update: {},
});
```

### Get Project with Owner

```typescript
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
  include: { owner: true },
});

if (!project) {
  throw new Error(`Project "${projectSlug}" not found`);
}
```

### Check Permission to Share

Only project owners or users with ADMIN permission can share:

```typescript
const currentUserEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();

if (project.owner.email !== currentUserEmail) {
  const share = await prisma.projectShare.findFirst({
    where: {
      projectId: project.id,
      user: { email: currentUserEmail },
      permission: 'ADMIN',
    },
  });
  if (!share) {
    throw new Error('No permission to share this project');
  }
}
```

### Add Share

```typescript
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
```

### List Shares

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

### Remove Share

```typescript
const targetUser = await prisma.user.findUnique({
  where: { email: shareEmail },
});

if (!targetUser) {
  throw new Error(`User "${shareEmail}" not found`);
}

await prisma.projectShare.delete({
  where: {
    projectId_userId: {
      projectId: project.id,
      userId: targetUser.id,
    },
  },
});
```

### Always Disconnect

```typescript
await prisma.$disconnect();
```

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Project not found | Invalid slug | Check project slug spelling |
| Email not @rippling.com | Non-Rippling email | Only Rippling emails allowed |
| No permission to share | User is not owner/admin | Must be owner or have ADMIN permission |
| User not found | Email doesn't exist in DB | User will be created automatically on add |
| Database connection fails | Missing env var | Check `PRISMA_DATABASE_URL` in `.env` |
| tsx/sandbox error | Missing permissions | Request `all` permissions |
| ECONNREFUSED | Network blocked | Request `all` permissions |

## Debugging Tips

### Check if user exists in database

```typescript
const user = await prisma.user.findUnique({
  where: { email: 'jane.doe@rippling.com' },
});
console.log(user ? `Found: ${user.id}` : 'Not found');
```

### Check all shares for a project

```typescript
const shares = await prisma.projectShare.findMany({
  where: { project: { slug: 'my-project' } },
  include: { user: true },
});
shares.forEach(s => console.log(`${s.user.email}: ${s.permission}`));
```

### Verify permission levels

Valid permission values are:
- `VIEW` - Read-only access
- `EDIT` - Can modify dashboards and run queries
- `ADMIN` - Full access including share management

## Complete Example Script

Full script combining all patterns for adding a share:

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function shareProject(
  projectSlug: string,
  shareEmail: string,
  permission: 'VIEW' | 'EDIT' | 'ADMIN'
) {
  // Validate email domain
  if (!shareEmail.endsWith('@rippling.com')) {
    throw new Error(`Email must be @rippling.com, got: ${shareEmail}`);
  }

  // Get current user
  const currentUserEmail = execSync('git config user.email', { encoding: 'utf-8' }).trim();

  // Get project
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { owner: true },
  });

  if (!project) {
    throw new Error(`Project "${projectSlug}" not found`);
  }

  // Check permission
  if (project.owner.email !== currentUserEmail) {
    const adminShare = await prisma.projectShare.findFirst({
      where: {
        projectId: project.id,
        user: { email: currentUserEmail },
        permission: 'ADMIN',
      },
    });
    if (!adminShare) {
      throw new Error('No permission to share this project');
    }
  }

  // Find or create target user
  const targetUser = await prisma.user.upsert({
    where: { email: shareEmail },
    create: { email: shareEmail },
    update: {},
  });

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
      permission,
    },
    update: {
      permission,
    },
  });

  await prisma.$disconnect();

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

// Example usage
shareProject('my-analysis', 'jane.doe@rippling.com', 'EDIT');
```

## Cursor Agent Permissions

Share operations require elevated permissions because:

1. **Network access** - Prisma connects to remote database
2. **tsx execution** - TypeScript scripts need full runtime

Always run share scripts with:

```bash
# Required: all permissions
npx tsx script.ts
# Use: required_permissions: ["all"]
```
