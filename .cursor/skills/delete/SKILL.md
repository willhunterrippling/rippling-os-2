---
name: delete
description: Delete projects, dashboards, or reports from the database. Use when the user says "/delete", wants to remove resources, or clean up unused items.
---

# /delete - Delete Resources

Delete projects, dashboards, or reports from the database.

**Note:** Queries cannot be deleted directly - they are linked to dashboards and reports. Delete the parent resource to remove associated queries.

## STOP - Confirm Before Proceeding

**You MUST know these before deleting:**

| Requirement | How to Clarify |
|-------------|----------------|
| Resource type | "What do you want to delete? (project, dashboard, or report)" |
| Resource name | "Which specific [type] should I delete?" |
| Project (if applicable) | "Which project is this in?" |

**ALWAYS confirm before deleting.** Deletion is permanent.

Do NOT:
- Delete without explicit user confirmation
- Assume which resource to delete

## Trigger

User says "delete", "/delete", "remove", "drop project/dashboard/report".

## Workflow

### 1. Identify What to Delete

Ask user what they want to delete:
- **Project** - Deletes the entire project and all its contents (dashboards, reports, queries)
- **Dashboard** - Deletes a specific dashboard (queries remain for other dashboards/reports)
- **Report** - Deletes a specific report (queries remain for other dashboards/reports)

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
// Note: Queries linked only to this dashboard will become orphaned
// but the query data itself remains for potential reuse
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
// Note: Queries linked only to this report will become orphaned
// but the query data itself remains for potential reuse
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
