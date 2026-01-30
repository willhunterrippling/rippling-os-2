# Delete Skill Reference

This document contains detailed Prisma code examples, cascade behavior documentation, and troubleshooting information for the delete skill.

## Prisma Delete Operations

### Delete Project

Deleting a project cascades to all related data automatically:

```typescript
await prisma.project.delete({
  where: { slug: projectSlug },
});
// This automatically deletes all dashboards, queries, reports, and shares
```

### Delete Dashboard

```typescript
await prisma.dashboard.delete({
  where: {
    projectId_name: {
      projectId: project.id,
      name: dashboardName,
    },
  },
});
// Note: Queries linked only to this dashboard will become orphaned
// but the query data itself remains for potential reuse
```

### Delete Report

```typescript
await prisma.report.delete({
  where: {
    projectId_name: {
      projectId: project.id,
      name: reportName,
    },
  },
});
// Note: Queries linked only to this report will become orphaned
// but the query data itself remains for potential reuse
```

## Permission Checking

Before deleting, verify the user has permission:

```typescript
const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();

const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
  include: { owner: true },
});

// Check permission - must be owner or admin
if (project.owner.email !== email) {
  const adminShare = await prisma.projectShare.findFirst({
    where: {
      projectId: project.id,
      user: { email },
      permission: 'ADMIN',
    },
  });
  if (!adminShare) {
    throw new Error('No permission to delete');
  }
}
```

## Complete Example Script

Full inline script for deleting a dashboard:

```bash
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function deleteDashboard(projectSlug, dashboardName) {
  const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
  
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: { owner: true },
  });
  
  // Check permission
  if (project.owner.email !== email) {
    const adminShare = await prisma.projectShare.findFirst({
      where: {
        projectId: project.id,
        user: { email },
        permission: 'ADMIN',
      },
    });
    if (!adminShare) {
      throw new Error('No permission to delete');
    }
  }
  
  await prisma.dashboard.delete({
    where: {
      projectId_name: {
        projectId: project.id,
        name: dashboardName,
      },
    },
  });
  
  console.log('Dashboard deleted:', dashboardName);
  await prisma.\$disconnect();
}

deleteDashboard('my-project', 'old-dashboard');
"
```

## Cascade Behavior

When deleting a project, all related data is automatically deleted:
- All dashboards (and their DashboardQuery links)
- All reports (and their ReportQuery links)
- All queries (and their results)
- All project shares

This is configured in the Prisma schema with `onDelete: Cascade`.

## Query Behavior

Queries are linked to dashboards and reports via junction tables:
- `DashboardQuery` - links queries to dashboards
- `ReportQuery` - links queries to reports

When you delete a dashboard or report:
- The junction table entries are deleted (cascade)
- The queries themselves remain in the database
- Orphaned queries (not linked to anything) may be cleaned up later

## Safety Features

1. **Permission check** - Only owner or admin can delete
2. **Confirmation required** - Always ask before deleting
3. **No soft delete** - Data is permanently removed
4. **Query preservation** - Queries remain after dashboard/report deletion for potential reuse

## Error Handling

| Error | Solution |
|-------|----------|
| Resource not found | Check the name/slug |
| No permission | Must be owner or admin |
| Database connection fails | Check DATABASE_URL |
| Foreign key constraint | Should not happen with cascade |
