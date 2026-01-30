# Report Reference

This document contains CLI commands, database operations, error handling, and validation patterns for creating reports.

## Scripts

The `scripts/` directory contains reusable TypeScript scripts for report operations:

### create-report.ts

Create or update a report from a markdown file:

```bash
npx tsx .cursor/skills/report/scripts/create-report.ts <project-slug> <report-name> <content-file>
```

**Arguments:**
- `project-slug` - The project slug (e.g., "my-analysis")
- `report-name` - The report name (e.g., "suppression-analysis")
- `content-file` - Path to markdown file with report content

### get-report.ts

Fetch a report's content to stdout:

```bash
npx tsx .cursor/skills/report/scripts/get-report.ts <project-slug> <report-name>
```

Use this to read an existing report before editing it.

### list-reports.ts

List all reports in a project:

```bash
npx tsx .cursor/skills/report/scripts/list-reports.ts <project-slug>
```

## CLI Reference

### Query Commands

```bash
# Temp query (for exploration, not saved)
npm run query -- --project <slug> --sql <file> --temp

# Save query to project
npm run query -- --project <slug> --name <name> --sql <file>

# Save query and link to report
npm run query -- --project <slug> --name <name> --sql <file> --report <report-name>
```

**IMPORTANT:** Use `required_permissions: ["all"]` when running queries via agent.

### Query Naming Convention

Use descriptive names with `report_` prefix when gathering data for reports:

- `report_01_status_breakdown`
- `report_02_lifecycle_analysis`
- `report_03_transition_history`

## Database Operations

### Finding a Project

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
});
```

### Listing User's Projects

```typescript
const projects = await prisma.project.findMany({
  where: { ownerId: userId },
  select: { slug: true, name: true },
  orderBy: { updatedAt: 'desc' },
  take: 10
});
```

### Creating/Updating a Report

```typescript
await prisma.report.upsert({
  where: {
    projectId_name: {
      projectId: project.id,
      name: reportName,
    },
  },
  create: {
    projectId: project.id,
    name: reportName,
    content: markdownContent,
  },
  update: {
    content: markdownContent,
  },
});

await prisma.$disconnect();
```

### Fetching an Existing Report

```typescript
const report = await prisma.report.findUnique({
  where: {
    projectId_name: {
      projectId: project.id,
      name: reportName,
    },
  },
});

const existingContent = report?.content || '';
```

## Schema Documentation

**BEFORE writing any queries**, check the relevant schema docs:

| Schema File | Contents |
|-------------|----------|
| `context/global/schemas/SFDC_TABLES.md` | Lead, Contact, Account, Opportunity |
| `context/global/schemas/SFDC_HISTORY_TABLES.md` | History tables (status transitions) |
| `context/global/schemas/SNOWFLAKE_TABLES.md` | Growth tables, MO tables |
| `context/global/schemas/OUTREACH_TABLES.md` | Outreach integration |

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Database connection fails | Check DATABASE_URL in .env |
| Query returns 0 rows unexpectedly | Check schema docs and column names |
| tsx/sandbox error | Request `all` permissions |

## Result Validation

A query returning 0 rows when you expect data is often a bug:

| Scenario | Likely Cause |
|----------|--------------|
| History table returns 0 | Wrong column names (use `OLD_VALUE` not `OLD_VALUE__C`) |
| Date filter returns 0 | Wrong date format |
| JOIN returns 0 | Table/column mismatch |

### Validation Checklist

Before concluding a query is correct:

1. **Check column names** - Snowflake returns UPPERCASE columns
2. **Check date formats** - Use `YYYY-MM-DD` format
3. **Verify table exists** - Check schema docs for exact table names
4. **Test with LIMIT** - Run a `SELECT * LIMIT 10` first to see actual data
