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

List reports in a project:

```bash
npx tsx .cursor/skills/report/scripts/list-reports.ts <project-slug>
```

### 2. Gather Data (Save All Queries!)

**Single query:**

```bash
npm run query -- --project [slug] --name report_01_analysis --sql query.sql --report [report-name]
```

**Multiple queries - use batch mode:**

When running multiple queries for a report, use batch mode to avoid multiple Snowflake authentication windows. Batch mode uses a single connection for all queries.

1. Write SQL files to temp folder
2. Create a batch JSON file:

```json
[
  { "name": "report_01_total", "sqlFile": "temp/report_01.sql" },
  { "name": "report_02_breakdown", "sqlFile": "temp/report_02.sql" }
]
```

3. Run batch:

```bash
npm run query -- --project [slug] --batch temp/queries.json --report [report-name]
```

**Query iteratively** - let each result inform the next. Don't plan all queries upfront.

**IMPORTANT:** Use `required_permissions: ["all"]` when running queries via agent.

**Fetch saved query results** when writing the report content:

```bash
# Get results for a specific query
npx tsx .cursor/skills/report/scripts/get-query-results.ts <project-slug> <query-name>

# Get all results matching a pattern (e.g., all queries for this report)
npx tsx .cursor/skills/report/scripts/get-query-results.ts <project-slug> --pattern "report_*"

# Get all query results for the project
npx tsx .cursor/skills/report/scripts/get-query-results.ts <project-slug> --all
```

Output is JSON with query name, row count, execution time, and data array.

### 3. Create or Update Report

Write markdown content to a temp file, then save:

```bash
npx tsx .cursor/skills/report/scripts/create-report.ts <project-slug> <report-name> <content-file>
```

Or fetch existing content first:

```bash
npx tsx .cursor/skills/report/scripts/get-report.ts <project-slug> <report-name>
```

### 4. Output Confirmation

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
| Key finding 1 | X records affected [1] |
| Key finding 2 | Y% of total [2] |

---

## 1. [First Section]
[Analysis and findings]

---

## References
[1]: report_01_total_count
[2]: report_02_percentage_breakdown
```

## Citations

**ALWAYS use citations** when referencing query results in reports. Citations create clickable links to the source queries.

### Citation Format

1. Add inline citations like `[1]`, `[2]` after numbers or findings
2. Add a References section at the bottom mapping citations to query names

```markdown
The total lead count is 5.4M [1], with 60% being suppressed [2].

---

## References
[1]: report_01_total_leads
[2]: report_02_suppression_rate
```

### How It Works

- `[1]` in the text becomes a superscript link to the query page
- The References section shows the mapping and links to each query
- Query names must match exactly (no `.sql` extension)

## Local Report Files

Reports are automatically written to `local-reports/<project>/<report>.md`.
This allows you to:
- `@` mention reports in Cursor chat
- See reports in the file tree
- Edit locally if needed (re-run create-report to sync back to DB)

To backfill existing reports from the database to local files:

```bash
npx tsx scripts/backfill-local.ts <project-slug>
```

## Next Steps

- For CLI commands and database operations, see [reference.md](reference.md)
- For detailed report templates and formatting best practices, see [templates.md](templates.md)
- For iterative report building and session continuity, see [iterative.md](iterative.md)
- For reusable scripts, see the [scripts/](scripts/) directory
