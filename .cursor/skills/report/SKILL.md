---
name: report
description: Create or edit markdown reports saved to the database. Use when the user says "/report", wants to create documentation, write findings, or add a report to a project.
---

# /report - Create or Edit Report

Create or edit markdown reports saved to the database.

## STOP - Clarify Before Proceeding

**You MUST know these before writing any report:**

| Requirement | How to Clarify |
|-------------|----------------|
| Project | "Which project should this report belong to?" |
| Report name | "What should I call this report?" |
| Report purpose | "What question are you trying to answer?" |
| Data needed | "Do you have the data, or should I run queries first?" |

**If ANY of these are unclear, ASK THE USER.**

Do NOT:
- Assume a project name
- Make up a report structure
- Run queries without knowing the goal

### When You DON'T Need to Ask

- User explicitly named the project (e.g., "create a report in project-alpha")
- You just created/queried a project in this conversation
- Only one project exists for the user

## Trigger

User says "report", "/report", "create report", "add report", or "edit report".

## Core Workflow

### 1. Identify Project and Report

If unclear, query user's projects and present options:

```typescript
const projects = await prisma.project.findMany({
  where: { ownerId: userId },
  select: { slug: true, name: true },
  orderBy: { updatedAt: 'desc' },
  take: 10
});
```

### 2. Check Schema Documentation

**BEFORE writing any queries**, read the relevant schema docs:

- `context/global/schemas/SFDC_TABLES.md` - Lead, Contact, Account, Opportunity
- `context/global/schemas/SFDC_HISTORY_TABLES.md` - History tables (status transitions)
- `context/global/schemas/SNOWFLAKE_TABLES.md` - Growth tables, MO tables
- `context/global/schemas/OUTREACH_TABLES.md` - Outreach integration

### 3. Gather Data (Save All Queries!)

Run queries and link them to the report:

```bash
# Run a query and link to this report
npm run query -- --project [slug] --name report_01_analysis --sql query.sql --report [report-name]
```

**Query iteratively** - let each result inform the next. Don't plan all queries upfront.

Use descriptive names with `report_` prefix:
- `report_01_status_breakdown`
- `report_02_lifecycle_analysis`
- `report_03_transition_history`

### 4. Create or Update Report

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
});

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

### 5. Output Confirmation

```
✅ Report created!

Project: [project-name]
Report: [report-name]
Queries saved: [list of query names]

View at: /projects/[slug]/reports/[name]
```

## Basic Report Structure

```markdown
# [Report Title]

**Date:** YYYY-MM-DD  

---

## Executive Summary

| Finding | Impact |
|---------|--------|
| Key finding 1 | X records affected |
| Key finding 2 | Y% of total |

---

## 1. [First Section]
[Analysis and findings]

---

## 2. [Second Section]
[More analysis]

---

## Appendix: Queries

| Query Name | Purpose |
|------------|---------|
| `report_01_...` | Description |
```

For detailed templates and formatting, see [templates.md](templates.md).

## CLI Reference

```bash
# Temp query (for exploration, not saved)
npm run query -- --project <slug> --sql <file> --temp

# Save to report
npm run query -- --project <slug> --name <name> --sql <file> --report <report-name>
```

**IMPORTANT:** Use `required_permissions: ["all"]` when running queries via agent.

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

## Follow-up Questions

When editing an existing report, recognize follow-up patterns:

| User Says | Action |
|-----------|--------|
| "What about X?" | Add section about X |
| "Break that down more" | Expand existing section |
| "What do you recommend?" | Add recommendations section |

For iterative building patterns and session continuity, see [iterative.md](iterative.md).
