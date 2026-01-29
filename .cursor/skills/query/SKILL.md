---
name: query
description: Execute SQL queries against Snowflake and save results to the database. Use when the user says "/query", wants to run SQL, execute a query, or add data to their project.
---

# /query - Execute SQL Query

Execute SQL queries against Snowflake and save results to the database.

## Trigger

User says "query", "/query", "run query", "execute SQL", or provides SQL to run.

## Workflow

### 1. Identify Project and Query

#### Clarifying the Project (IMPORTANT)

Before proceeding, you MUST know which project to use. **If the project is unclear, ask the user to clarify.** A project is unclear when:

- The user didn't specify a project name
- Multiple projects exist and the user said something generic like "run this query"
- The conversation context doesn't make it obvious which project they mean

**How to clarify:**

1. Query the database for the user's projects:
   ```typescript
   const projects = await prisma.project.findMany({
     where: { ownerId: userId },
     select: { slug: true, name: true },
     orderBy: { updatedAt: 'desc' },
     take: 10
   });
   ```

2. Present options to the user:
   ```
   Which project should this query belong to?
   
   Your recent projects:
   - project-alpha
   - sales-analysis  
   - q4-review
   
   Or specify a different project name.
   ```

3. Wait for the user's response before proceeding.

**When you DON'T need to ask:**
- User explicitly named the project (e.g., "run this query in project-alpha")
- You just created/queried a project in this conversation
- Only one project exists for the user

Ask user for:
- **Project**: Which project should this query belong to? (clarify if unclear)
- **Query name**: What should this query be called? (e.g., "weekly_s1_count")
- **SQL**: The SQL to execute (inline or from a file)

### 2. Validate SQL

- Check for prohibited statements: DELETE, UPDATE, DROP, TRUNCATE
- Warn if no LIMIT clause (suggest adding one for safety)
- Ensure proper filters (is_deleted, _fivetran_deleted)

### 3. Execute Query

**IMPORTANT:** When running via Cursor agent, you MUST use `required_permissions: ["all"]` to allow network/tsx access.

Run the query runner with the new syntax:

```bash
# Execute with required_permissions: ["all"]
npm run query -- --project [project-slug] --name [query-name] --sql [sql-file]
```

Or if SQL is inline, first save it to a temp file:
```bash
# Execute with required_permissions: ["all"]  
echo "[SQL]" > /tmp/query.sql
npm run query -- --project [project-slug] --name [query-name] --sql /tmp/query.sql
```

### 4. Handle Authentication

- The query runner uses `externalbrowser` SSO
- A browser window will open for Okta/SSO authentication
- User authenticates once, then queries run

### 5. Dashboard Integration (Inline)

After query completes successfully, ask the user:

```
Query saved! Would you like to add this to your dashboard?

1. Yes, add as a chart (line, bar, area)
2. Yes, add as a metric card
3. Yes, add as a table
4. No, just save the query
```

If user wants to add to dashboard:

**For Chart:**
```
What type of chart?
1. Line chart
2. Bar chart
3. Area chart

What's the X-axis key? (e.g., "WEEK", "DATE")
What's the Y-axis key? (e.g., "COUNT", "TOTAL")
```

**For Metric:**
```
What value should be displayed? (e.g., "TOTAL_S1", "COUNT")
What label for the metric? (e.g., "Total S1 Leads")
```

**For Table:**
```
Which columns to display? (comma-separated, or 'all')
```

**IMPORTANT: Snowflake returns UPPERCASE column names!**

When the user runs a query like:
```sql
SELECT COUNT(*) as total, DATE_TRUNC('week', date) as week FROM ...
```

Snowflake returns: `{ "TOTAL": 123, "WEEK": "2026-01-20" }` (uppercase keys)

So when adding widgets, always use UPPERCASE keys:
- Use `TOTAL` not `total`
- Use `WEEK` not `week`
- Use `NEW_OPPORTUNITIES` not `new_opportunities`

Then update the dashboard config in the database:

```typescript
// Add widget to dashboard config
// IMPORTANT: Use UPPERCASE keys to match Snowflake output
const dashboard = await prisma.dashboard.findUnique({...});
const config = dashboard.config;
config.widgets.push({
  type: 'chart', // or 'metric', 'table'
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

### 6. Output Results

```
✅ Query executed successfully!

Project: [project-name]
Query: [query-name]
Rows: [count]

Preview (first 5 rows):
[table preview]

Dashboard: Widget added as line chart
View at: /projects/[slug]/dashboards/main
```

## CLI Usage

### Single Query Mode

```bash
# Execute query and save to database
npm run query -- --project my-analysis --name weekly_trend --sql query.sql

# Re-run existing query from database
npm run query -- --project my-analysis --name weekly_trend
```

### Batch Mode (Optional)

Batch mode runs multiple queries in a single command. Use it when you have multiple **independent** questions.

```bash
# Execute multiple queries from a JSON file
npm run query -- --project my-analysis --batch queries.json
```

**queries.json format:**
```json
[
  { "name": "report_weekly_s1", "sql": "SELECT COUNT(*) as count FROM table1" },
  { "name": "report_conversion", "sqlFile": "path/to/query.sql" },
  { "name": "existing_query" }
]
```

Each query item can have:
- `name` (required): The query name to save under
- `sql`: Inline SQL string
- `sqlFile`: Path to a SQL file
- Neither: Uses existing query SQL from database

**When to use batch mode:**
- You have multiple **independent** questions that don't depend on each other
- You already know exactly what queries you need (no discovery required)

**When NOT to use batch mode:**
- You're exploring or researching (query → learn → query again is better)
- Later queries depend on what you learn from earlier ones
- You're investigating an unknown problem

For most research and report work, **iterative querying is preferred** - run a query, analyze results, then decide what to query next based on what you learned.

## No Local Files

**Important:** Query results are stored in the database, not as JSON files.

- SQL is stored in `Query` table
- Results are stored in `QueryResult` table (one-to-one, latest only)
- Dashboard references queries by name

## Environment Requirements

- `DATABASE_URL` must be set in `.env` for database access
- `POSTGRES_URL` must be set (same as DATABASE_URL)
- `PRISMA_DATABASE_URL` must be set for Prisma Accelerate
- `RIPPLING_ACCOUNT_EMAIL` must be set for Snowflake SSO

## Cursor Agent Permissions (CRITICAL)

**When running queries via Cursor agent, you MUST request `all` permissions.**

The query runner requires:
1. **Network access** - connects to Snowflake over HTTPS
2. **tsx execution** - runs TypeScript scripts
3. **Browser SSO** - uses `externalbrowser` auth (opens browser for Okta login)

Without `all` permissions, the agent will fail with sandbox errors like:
- "Query runner failed in this environment (tsx/sandbox)"
- "tsx can't run in this environment"

**Correct approach:**
```bash
# When executing this, request required_permissions: ["all"]
npm run query -- --project my-analysis --name my_query --sql query.sql
```

**First-time users:**
The first query execution opens a browser window for Okta SSO login. After successful authentication, the token is cached locally, and subsequent queries run without browser interaction.

**User needs to approve:** When the agent requests `all` permissions, a dialog appears asking the user to approve. They must click "Allow" for queries to work.

## Safety Rules

- ALWAYS use LIMIT when exploring data
- NEVER run DELETE, UPDATE, DROP, or TRUNCATE
- ALWAYS filter by is_deleted = FALSE for SFDC tables
- ALWAYS filter by _fivetran_deleted = FALSE

## Schema Reference (Check Before Querying!)

**Before writing queries, check the schema documentation:**

- `context/global/schemas/SFDC_TABLES.md` - Main Salesforce tables
- `context/global/schemas/SFDC_HISTORY_TABLES.md` - History/audit tables (critical for status transitions!)
- `context/global/schemas/SNOWFLAKE_TABLES.md` - Growth/DWH tables
- `context/global/schemas/OUTREACH_TABLES.md` - Outreach integration tables

This prevents bugs like using wrong column names (e.g., `OLD_VALUE__C` vs `OLD_VALUE`).

## Query Patterns for Investigations

### Pattern 1: Status Breakdown with Temporal Analysis

Always include temporal context (30/90 day windows) for richer insights:

```sql
SELECT 
    STATUS,
    COUNT(*) as record_count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct,
    -- Temporal analysis
    COUNT(CASE WHEN LAST_MODIFIED_DATE >= DATEADD('day', -30, CURRENT_DATE()) THEN 1 END) as modified_30d,
    COUNT(CASE WHEN LAST_MODIFIED_DATE >= DATEADD('day', -90, CURRENT_DATE()) THEN 1 END) as modified_90d,
    MIN(CREATED_DATE) as earliest_created,
    MAX(LAST_MODIFIED_DATE) as latest_modified
FROM SFDC.LEAD
WHERE IS_DELETED = FALSE
GROUP BY STATUS
ORDER BY record_count DESC;
```

### Pattern 2: Status Transitions (History Tables)

Track how records move between statuses:

```sql
SELECT 
    OLD_VALUE as from_status,
    NEW_VALUE as to_status,
    COUNT(*) as transitions,
    MIN(CREATED_DATE) as first_transition,
    MAX(CREATED_DATE) as last_transition
FROM SFDC.LEAD_HISTORY
WHERE FIELD = 'Status'
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY OLD_VALUE, NEW_VALUE
ORDER BY transitions DESC;
```

### Pattern 3: Attribution (Manual vs Automated)

Distinguish human vs automation changes:

```sql
SELECT 
    CASE 
        WHEN u.NAME ILIKE '%integration%' 
          OR u.NAME ILIKE '%automation%' 
          OR u.NAME ILIKE '%api%' 
          OR u.NAME ILIKE '%outreach%'
        THEN 'Automated'
        ELSE 'Manual'
    END as change_type,
    COUNT(*) as changes,
    COUNT(DISTINCT lh.LEAD_ID) as distinct_records
FROM SFDC.LEAD_HISTORY lh
LEFT JOIN SFDC."USER" u ON lh.CREATED_BY_ID = u.ID
WHERE lh.FIELD = 'Status'
  AND lh.CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY change_type;
```

### Pattern 4: Top Users Making Changes

Identify who is driving changes:

```sql
SELECT 
    u.NAME as user_name,
    u.USER_TYPE,
    COUNT(*) as changes,
    COUNT(DISTINCT lh.LEAD_ID) as distinct_records,
    MAX(lh.CREATED_DATE) as last_change
FROM SFDC.LEAD_HISTORY lh
LEFT JOIN SFDC."USER" u ON lh.CREATED_BY_ID = u.ID
WHERE lh.FIELD = 'Status'
  AND lh.NEW_VALUE = 'Recycled'
  AND lh.CREATED_DATE >= DATEADD('day', -30, CURRENT_DATE())
GROUP BY u.NAME, u.USER_TYPE
ORDER BY changes DESC
LIMIT 20;
```

### Pattern 5: Well-Documented Query with CTEs

Use CTEs and comments for complex queries:

```sql
-- ============================================================================
-- Purpose: Analyze [what this query does]
-- Context: [why this matters]
-- ============================================================================

WITH 
-- Step 1: Get base population
base_records AS (
    SELECT ID, STATUS, CREATED_DATE
    FROM SFDC.LEAD
    WHERE IS_DELETED = FALSE
),

-- Step 2: Add enrichment
enriched AS (
    SELECT 
        b.*,
        DATEDIFF('day', b.CREATED_DATE, CURRENT_DATE()) as days_old
    FROM base_records b
)

-- Final output
SELECT 
    STATUS,
    COUNT(*) as count,
    AVG(days_old) as avg_age_days
FROM enriched
GROUP BY STATUS
ORDER BY count DESC;
```

## Result Validation - Detecting 0-Row Results

**CRITICAL:** Always validate query results. A query returning 0 rows when you expect data is often a bug, not correct behavior.

### When 0 Rows Might Indicate a Bug

| Scenario | Likely Cause | Action |
|----------|--------------|--------|
| History table query returns 0 | Wrong column names | Check schema docs - use `OLD_VALUE` not `OLD_VALUE__C` |
| Filter on date returns 0 | Wrong date format or function | Try different date syntax |
| JOIN returns 0 | Table/column name mismatch | Verify table and column names exist |
| Aggregation returns 0 | WHERE clause too restrictive | Remove filters and test incrementally |

### Validation Workflow

**After running a query that returns 0 rows:**

1. **Check if 0 rows is expected** - Is this a query where empty results make sense?

2. **If unexpected, investigate:**
   ```sql
   -- First, verify the table has data
   SELECT COUNT(*) FROM [table];
   
   -- Then, check column names exist
   SELECT * FROM [table] LIMIT 1;
   
   -- Finally, loosen filters and test
   SELECT * FROM [table] WHERE [partial_filter] LIMIT 10;
   ```

3. **Check schema documentation:**
   - Read `context/global/schemas/SFDC_HISTORY_TABLES.md` for history table column names
   - Read `context/global/schemas/SFDC_TABLES.md` for main table schemas
   - Verify column names match exactly (no `__C` suffix confusion)

4. **Common Column Name Mistakes:**

   | Wrong | Correct | Table |
   |-------|---------|-------|
   | `OLD_VALUE__C` | `OLD_VALUE` | LEAD_HISTORY, CONTACT_HISTORY |
   | `NEW_VALUE__C` | `NEW_VALUE` | LEAD_HISTORY, CONTACT_HISTORY |
   | `Person_Status_SFDC__c` (contact) | `PERSON_STATUS_SFDC_C` | CONTACT (column name is uppercase in Snowflake) |

5. **If you find a bug, fix and re-run:**
   - Update the SQL with correct column names
   - Re-run the query
   - Verify results are now returned

### Batch Mode Validation

When running batch queries, **review the summary for unexpected 0-row results:**

```
📊 Batch Summary:
   ✅ Successful: 8
   ❌ Failed: 0

   ✅ report_01_status: 12 rows
   ✅ report_02_breakdown: 15 rows
   ⚠️ report_03_history: 0 rows     ← INVESTIGATE THIS
   ⚠️ report_04_transitions: 0 rows ← INVESTIGATE THIS
```

Any query returning 0 rows when you expected data should be investigated before proceeding.

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Database connection fails | Check DATABASE_URL in .env |
| Snowflake connection fails | Check RIPPLING_ACCOUNT_EMAIL |
| Query fails | Show error, suggest fixes |
| User not owner/editor | Need permission to add to project |
| **Query returns 0 rows unexpectedly** | **Investigate: check column names, filters, and schema docs** |
| **tsx/sandbox error** | **Agent must request `all` permissions - retry with required_permissions: ["all"]** |
| **"Can't run in this environment"** | **Missing permissions - user must approve the permission dialog** |

## Widget-Query Linking

Dashboard widgets reference queries by name.

**IMPORTANT:** Use UPPERCASE keys for `valueKey`, `xKey`, `yKey` to match Snowflake output:

```json
{
  "widgets": [
    {
      "type": "chart",
      "queryName": "weekly_s1_count",
      "chartType": "line",
      "xKey": "WEEK",
      "yKey": "COUNT"
    },
    {
      "type": "metric",
      "queryName": "pipeline_metrics",
      "title": "Total Opportunities",
      "valueKey": "TOTAL_OPPORTUNITIES"
    }
  ]
}
```

The web app resolves `queryName` to actual data at render time.

### Common Snowflake Column Name Mappings

| SQL Alias | Snowflake Returns |
|-----------|-------------------|
| `as count` | `COUNT` |
| `as week` | `WEEK` |
| `as total_opportunities` | `TOTAL_OPPORTUNITIES` |
| `as conversion_rate` | `CONVERSION_RATE` |
