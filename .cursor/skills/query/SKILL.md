---
name: query
description: Execute SQL queries against Snowflake. Queries can be temporary (not saved) or attached to a dashboard/report. Use when the user says "/query", wants to run SQL, or needs data from Snowflake.
---

# /query - Execute SQL Query

Execute SQL queries against Snowflake. For CLI options and troubleshooting, see [reference.md](reference.md). For SQL patterns and schema docs, see [patterns.md](patterns.md).

## STOP - Clarify Before Proceeding

**You MUST know these before writing SQL:**

| Requirement | How to Clarify |
|-------------|----------------|
| Project | "Which project should this query belong to?" |
| Data question | "What question are you trying to answer?" |
| Tables/schema | Read schema docs first. If still unclear, ask. |
| Temp vs saved | "Is this a quick lookup or for a dashboard/report?" |

**If you don't understand the business question, ASK.**

Do NOT:
- Guess at SQL logic when requirements are ambiguous
- Assume which project without confirmation
- Write complex queries without understanding the goal

### When You DON'T Need to Ask

- User explicitly named the project
- You just created/queried a project in this conversation
- Only one project exists for the user
- User provided clear SQL or a specific question

## Trigger

User says "query", "/query", "run query", "execute SQL", or provides SQL to run.

## Key Concept: Temp vs Saved Queries

| Type | When to Use | What Happens |
|------|-------------|--------------|
| **Temp** | Quick lookups, exploration | Results shown, nothing saved |
| **Saved** | Dashboards, reports | SQL and results stored in database |

Default to **temp** for ad-hoc questions. Use **saved** when building dashboards or reports.

## Workflow

### 1. Determine Query Type

```
"How many leads are there?" → temp query
"Add a chart to the dashboard" → saved query (dashboard)
```

### 2. Validate SQL

- Check for prohibited statements: DELETE, UPDATE, DROP, TRUNCATE
- Warn if no LIMIT clause (suggest adding one)
- Ensure proper filters (see [patterns.md](patterns.md) for safety rules)

### 3. Execute Query

**IMPORTANT:** Use `required_permissions: ["all"]` for network/tsx access.

```bash
# Temp query (no save)
echo "[SQL]" > /tmp/query.sql
npm run query -- --project [slug] --sql /tmp/query.sql --temp

# Save to dashboard
npm run query -- --project [slug] --name [name] --sql /tmp/query.sql --dashboard [dashboard-name]

# Save to report
npm run query -- --project [slug] --name [name] --sql /tmp/query.sql --report [report-name]
```

### 4. After Temp Query - Ask About Saving

```
Would you like to save this query?

1. Add to a dashboard (for visualizations)
2. Add to a report (for documentation)
3. No, this was just a quick lookup
```

If saving, ask for dashboard/report name and query name, then re-run with appropriate flag.

## Quick CLI Reference

| Command | Purpose |
|---------|---------|
| `--temp` | Run without saving |
| `--dashboard <name>` | Save and attach to dashboard |
| `--report <name>` | Save and attach to report |

For full CLI options, see [reference.md](reference.md).

## Permissions (CRITICAL)

**When running queries via Cursor agent, you MUST request `all` permissions.**

Without this, queries fail with sandbox errors. First-time users will see a browser window for SSO login.

## Next Steps

- For CLI options and error handling, see [reference.md](reference.md)
- For SQL patterns and schema docs, see [patterns.md](patterns.md)
- For dashboard widget configuration, see [reference.md](reference.md)
