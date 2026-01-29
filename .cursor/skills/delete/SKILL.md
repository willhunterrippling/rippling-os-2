# /delete - Delete Resources

Delete projects, queries, dashboards, or reports from the database.

## Trigger

User says "delete", "/delete", "remove", "drop project/query/dashboard/report".

## Workflow

### 1. Identify What to Delete

Ask user what they want to delete:
- **Project** - Deletes the entire project and all its contents
- **Query** - Deletes a specific query and its results
- **Dashboard** - Deletes a specific dashboard
- **Report** - Deletes a specific report

### 2. Validate Permission

Check that the current user has permission:
- Must be project owner OR
- Must have ADMIN permission on the project

Get git email:
```bash
git config user.email
```

### 3. Confirm Deletion

**ALWAYS confirm before deleting:**

```
⚠️ Are you sure you want to delete this [resource]?

Project: [name]
[Resource]: [name]

This action cannot be undone.

Type 'yes' to confirm, or 'no' to cancel.
```

### 4. Delete from Database

**Delete Project (cascades to all related data):**
```typescript
await prisma.project.delete({
  where: { slug: projectSlug },
});
// This automatically deletes all dashboards, queries, reports, and shares
```

**Delete Query (and its result):**
```typescript
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
});

await prisma.query.delete({
  where: {
    projectId_name: {
      projectId: project.id,
      name: queryName,
    },
  },
});
// QueryResult is deleted via cascade
```

**Delete Dashboard:**
```typescript
await prisma.dashboard.delete({
  where: {
    projectId_name: {
      projectId: project.id,
      name: dashboardName,
    },
  },
});
```

**Delete Report:**
```typescript
await prisma.report.delete({
  where: {
    projectId_name: {
      projectId: project.id,
      name: reportName,
    },
  },
});
```

### 5. Output Confirmation

```
✅ Deleted successfully!

Removed: [resource type] "[name]"
From project: [project-name]

Note: This action cannot be undone.
```

## Usage Examples

```
/delete project my-old-analysis
/delete query pipeline-report weekly_trend
/delete dashboard pipeline-report summary
/delete report my-analysis findings
```

## Example Script

```bash
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function deleteQuery(projectSlug, queryName) {
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
  
  await prisma.query.delete({
    where: {
      projectId_name: {
        projectId: project.id,
        name: queryName,
      },
    },
  });
  
  console.log('Query deleted:', queryName);
  await prisma.\$disconnect();
}

deleteQuery('my-project', 'old-query');
"
```

## Cascade Behavior

When deleting a project, all related data is automatically deleted:
- All queries (and their results)
- All dashboards
- All reports
- All project shares

This is configured in the Prisma schema with `onDelete: Cascade`.

## Safety Features

1. **Permission check** - Only owner or admin can delete
2. **Confirmation required** - Always ask before deleting
3. **No soft delete** - Data is permanently removed
4. **Audit via git** - No git history since data is in database

## Error Handling

| Error | Solution |
|-------|----------|
| Resource not found | Check the name/slug |
| No permission | Must be owner or admin |
| Database connection fails | Check DATABASE_URL |
| Foreign key constraint | Should not happen with cascade |
