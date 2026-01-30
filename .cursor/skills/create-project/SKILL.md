---
name: create-project
description: Create a new analysis project in the database. Use when the user says "/create-project", wants to start a new project, or needs a new analysis workspace.
---

# /create-project - Create New Project

Create a new analysis project in the database.

## STOP - Clarify Before Proceeding

**You MUST know these before creating a project:**

| Requirement | How to Clarify |
|-------------|----------------|
| Project name | "What should I call this project?" |
| Purpose | "What will you use this project for?" (helps with description) |

**If the user just says "create a project" without a name, ASK.**

Do NOT:
- Make up a project name
- Create a project without user confirmation

## Trigger

User says "create project", "/create-project [name]", or "new project".

## Workflow

1. **Get Project Name**
   - If user provided name, use it
   - Otherwise, ask for project name
   - Convert to slug format (lowercase, hyphens): "My Analysis" → `my-analysis`

2. **Get User Identity**
   - Get git email: `git config user.email`
   - Validate it's `@rippling.com`
   - This will be the project owner

3. **Check for Existing Project**
   - Query database for existing project with same slug
   - If exists, warn and ask for different name

4. **Create Project**
   
   Run the create script:
   ```bash
   npx tsx .cursor/skills/create-project/scripts/create-project.ts --name "Project Name" --slug project-slug
   ```
   
   This creates the project and user (if needed).

5. **Output Confirmation**
   ```
   ✅ Project created!
   
   Project: [Project Name]
   Slug: [project-slug]
   Owner: [your-email]
   
   Next steps:
   1. Run /query to execute SQL and save results
   2. Queries will automatically be added to the dashboard
   3. Run /report to add written documentation
   
   View at: /projects/[slug]
   ```

## Quick Reference

| Resource | URL |
|----------|-----|
| Project overview | `/projects/[slug]` |

## Next Steps

- For Prisma patterns and error handling, see [reference.md](reference.md)
- For detailed database architecture, see [reference.md](reference.md)
