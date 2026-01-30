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

User says "share", "/share", "share project", "add collaborator", "list shares", or "remove share".

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

### 3. Run Share Script

Use the share script to add, list, or remove shares:

```bash
# Add a share
npx tsx .cursor/skills/share/scripts/share-project.ts \
  --action add \
  --project my-analysis \
  --email jane.doe@rippling.com \
  --permission EDIT

# List current shares
npx tsx .cursor/skills/share/scripts/share-project.ts \
  --action list \
  --project my-analysis

# Remove a share
npx tsx .cursor/skills/share/scripts/share-project.ts \
  --action remove \
  --project my-analysis \
  --email jane.doe@rippling.com
```

**Important:** Run with `required_permissions: ["all"]` for database access.

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
/share my-analysis list               # List who has access
/share my-analysis remove jane.doe@rippling.com
```

## Permission Levels

| Level | View | Run Queries | Edit Dashboard | Manage Shares | Delete |
|-------|------|-------------|----------------|---------------|--------|
| VIEW  | ✓    | ✗           | ✗              | ✗             | ✗      |
| EDIT  | ✓    | ✓           | ✓              | ✗             | ✗      |
| ADMIN | ✓    | ✓           | ✓              | ✓             | ✓      |
| Owner | ✓    | ✓           | ✓              | ✓             | ✓      |

## Next Steps

- For detailed Prisma code examples, see [reference.md](reference.md)
- For error handling and debugging, see [reference.md](reference.md)
