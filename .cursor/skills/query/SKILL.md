# /query - Execute SQL Query

Execute SQL queries against Snowflake and save results to the database.

## Trigger

User says "query", "/query", "run query", "execute SQL", or provides SQL to run.

## Workflow

### 1. Identify Project and Query

Ask user for:
- **Project**: Which project should this query belong to?
- **Query name**: What should this query be called? (e.g., "weekly_s1_count")
- **SQL**: The SQL to execute (inline or from a file)

### 2. Validate SQL

- Check for prohibited statements: DELETE, UPDATE, DROP, TRUNCATE
- Warn if no LIMIT clause (suggest adding one for safety)
- Ensure proper filters (is_deleted, _fivetran_deleted)

### 3. Execute Query

Run the query runner with the new syntax:

```bash
npm run query -- --project [project-slug] --name [query-name] --sql [sql-file]
```

Or if SQL is inline, first save it to a temp file:
```bash
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

```bash
# Execute query and save to database
npm run query -- --project my-analysis --name weekly_trend --sql query.sql

# Re-run existing query from database
npm run query -- --project my-analysis --name weekly_trend
```

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

## Safety Rules

- ALWAYS use LIMIT when exploring data
- NEVER run DELETE, UPDATE, DROP, or TRUNCATE
- ALWAYS filter by is_deleted = FALSE for SFDC tables
- ALWAYS filter by _fivetran_deleted = FALSE

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Database connection fails | Check DATABASE_URL in .env |
| Snowflake connection fails | Check RIPPLING_ACCOUNT_EMAIL |
| Query fails | Show error, suggest fixes |
| User not owner/editor | Need permission to add to project |

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
