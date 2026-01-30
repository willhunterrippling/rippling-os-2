---
name: delete
description: Delete projects, dashboards, or reports from the database. Use when the user says "/delete", wants to remove resources, or clean up unused items.
---

# /delete - Delete Resources

Delete projects, dashboards, or reports from the database.

**Note:** Queries cannot be deleted directly - they are linked to dashboards and reports. Delete the parent resource to remove associated queries.

For detailed Prisma code examples, cascade behavior, and troubleshooting, see [reference.md](reference.md).

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

Get git email: `git config user.email`

### 3. Confirm Deletion

**ALWAYS confirm before deleting:**

```
Are you sure you want to delete this [resource]?

Project: [name]
[Resource]: [name]

This action cannot be undone.

Type 'yes' to confirm, or 'no' to cancel.
```

### 4. Delete from Database

Use Prisma to delete the resource. See [reference.md](reference.md) for full code examples.

### 5. Output Confirmation

```
Deleted successfully!

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

## Next Steps

- For Prisma delete operations, see [reference.md](reference.md)
- For cascade behavior documentation, see [reference.md](reference.md)
- For error handling and troubleshooting, see [reference.md](reference.md)
