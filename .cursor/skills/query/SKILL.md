---
name: query
description: Execute SQL queries against Snowflake. Queries can be temporary (not saved) or attached to a dashboard/report. Use when the user says "/query", wants to run SQL, or needs data from Snowflake.
---

# /query - Execute SQL Query

Execute SQL queries against Snowflake. Queries must either be:
- **Temporary**: Run and show results, but don't save to DB
- **Saved**: Attached to a dashboard or report

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

**Temp queries** (default for exploration):
- Run SQL, see results, nothing saved
- Good for: quick lookups, data exploration, answering questions

**Saved queries** (for dashboards/reports):
- SQL and results stored in database
- Must be attached to a dashboard OR report
- Good for: tracking metrics, building visualizations, documenting findings

## Workflow

### 1. Determine Query Type

For ad-hoc questions or exploration, default to **temp query**:
```
"How many leads are there?" → temp query
"What's the status breakdown?" → temp query
```

For building dashboards or reports, use **saved query**:
```
"Add a chart showing weekly trends to the dashboard" → saved query (dashboard)
"Run this query for the report" → saved query (report)
```

### 2. Validate SQL

- Check for prohibited statements: DELETE, UPDATE, DROP, TRUNCATE
- Warn if no LIMIT clause (suggest adding one for safety)
- Ensure proper filters (is_deleted, _fivetran_deleted)

### 3. Execute Query

**IMPORTANT:** When running via Cursor agent, you MUST use `required_permissions: ["all"]` to allow network/tsx access.

#### Temp Query (no save)

```bash
# Execute with required_permissions: ["all"]
echo "[SQL]" > /tmp/query.sql
npm run query -- --project [project-slug] --sql /tmp/query.sql --temp
```

Results are displayed but NOT saved to the database.

#### Saved Query (to dashboard)

```bash
# Execute with required_permissions: ["all"]
echo "[SQL]" > /tmp/query.sql
npm run query -- --project [project-slug] --name [query-name] --sql /tmp/query.sql --dashboard [dashboard-name]
```

#### Saved Query (to report)

```bash
# Execute with required_permissions: ["all"]
echo "[SQL]" > /tmp/query.sql
npm run query -- --project [project-slug] --name [query-name] --sql /tmp/query.sql --report [report-name]
```

### 4. After Temp Query - Ask About Saving

After showing results from a temp query, ask:

```
Would you like to save this query?

1. Add to a dashboard (for visualizations)
2. Add to a report (for documentation)
3. No, this was just a quick lookup
```

If user wants to save:
1. Ask which dashboard or report (or create new)
2. Ask for a query name
3. Re-run with appropriate `--dashboard` or `--report` flag

### 5. Dashboard Widget Integration

When saving to a dashboard, ask about widget type:

```
How should this be displayed on the dashboard?

1. Chart (line, bar, area)
2. Metric card
3. Data table
4. Don't add a widget (just save the data)
```

**IMPORTANT: Snowflake returns UPPERCASE column names!**

When configuring widgets, use UPPERCASE keys:
- Use `TOTAL` not `total`
- Use `WEEK` not `week`
- Use `NEW_OPPORTUNITIES` not `new_opportunities`

Then update the dashboard config:

```typescript
const dashboard = await prisma.dashboard.findUnique({...});
const config = dashboard.config;
config.widgets.push({
  type: 'chart',
  queryName: queryName,
  title: 'My Chart',
  chartType: 'line',
  xKey: 'WEEK',       // UPPERCASE!
  yKey: 'COUNT',      // UPPERCASE!
});
await prisma.dashboard.update({
  where: { id: dashboard.id },
  data: { config },
});
```

## CLI Reference

```bash
# Temp query (no save)
npm run query -- --project <slug> --sql <file> --temp

# Save to dashboard
npm run query -- --project <slug> --name <name> --sql <file> --dashboard <dashboard-name>

# Save to report
npm run query -- --project <slug> --name <name> --sql <file> --report <report-name>

# Batch mode (multiple queries to same target)
npm run query -- --project <slug> --batch <file.json> --dashboard <name>
npm run query -- --project <slug> --batch <file.json> --report <name>
```

**Options:**
- `-p, --project` - Project slug (required)
- `-n, --name` - Query name (required for saved queries)
- `-s, --sql` - SQL file path
- `-d, --dashboard` - Attach to this dashboard
- `-r, --report` - Attach to this report
- `-t, --temp` - Run without saving
- `-b, --batch` - Batch JSON file

## Cursor Agent Permissions (CRITICAL)

**When running queries via Cursor agent, you MUST request `all` permissions.**

The query runner requires:
1. **Network access** - connects to Snowflake over HTTPS
2. **tsx execution** - runs TypeScript scripts
3. **Browser SSO** - uses `externalbrowser` auth

Without `all` permissions, the agent will fail with sandbox errors.

**First-time users:** The first query opens a browser for Okta SSO login. After authentication, the token is cached locally.

## Safety Rules

- ALWAYS use LIMIT when exploring data
- NEVER run DELETE, UPDATE, DROP, or TRUNCATE
- ALWAYS filter by is_deleted = FALSE for SFDC tables
- ALWAYS filter by _fivetran_deleted = FALSE

## Schema Reference

**Before writing queries, check the schema documentation:**

- `context/global/schemas/SFDC_TABLES.md` - Main Salesforce tables
- `context/global/schemas/SFDC_HISTORY_TABLES.md` - History/audit tables
- `context/global/schemas/SNOWFLAKE_TABLES.md` - Growth/DWH tables
- `context/global/schemas/OUTREACH_TABLES.md` - Outreach integration

## Query Patterns

### Status Breakdown

```sql
SELECT 
    STATUS,
    COUNT(*) as record_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct
FROM SFDC.LEAD
WHERE IS_DELETED = FALSE
GROUP BY STATUS
ORDER BY record_count DESC;
```

### Status Transitions

```sql
SELECT 
    OLD_VALUE as from_status,
    NEW_VALUE as to_status,
    COUNT(*) as transitions
FROM SFDC.LEAD_HISTORY
WHERE FIELD = 'Status'
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY OLD_VALUE, NEW_VALUE
ORDER BY transitions DESC;
```

### Temporal Analysis

```sql
SELECT 
    DATE_TRUNC('week', CREATED_DATE) as week,
    COUNT(*) as count
FROM SFDC.LEAD
WHERE IS_DELETED = FALSE
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY week
ORDER BY week;
```

## Result Validation

**CRITICAL:** A query returning 0 rows when you expect data is often a bug.

| Scenario | Likely Cause | Action |
|----------|--------------|--------|
| History table returns 0 | Wrong column names | Use `OLD_VALUE` not `OLD_VALUE__C` |
| Filter on date returns 0 | Wrong date format | Try different date syntax |
| JOIN returns 0 | Table/column mismatch | Verify names exist |

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Dashboard not found | Check dashboard name or create one |
| Report not found | Check report name or create one |
| Must specify target | Add `--dashboard`, `--report`, or `--temp` |
| tsx/sandbox error | Request `all` permissions |

## Common Column Name Mappings

| SQL Alias | Snowflake Returns |
|-----------|-------------------|
| `as count` | `COUNT` |
| `as week` | `WEEK` |
| `as total` | `TOTAL` |
