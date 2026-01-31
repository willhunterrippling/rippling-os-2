# Query Reference

Technical reference for the query skill including CLI options, permissions, error handling, and troubleshooting.

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

### Options

| Flag | Short | Description | Required |
|------|-------|-------------|----------|
| `--project` | `-p` | Project slug | Yes |
| `--name` | `-n` | Query name | For saved queries |
| `--sql` | `-s` | SQL file path | Yes (or --batch) |
| `--dashboard` | `-d` | Attach to this dashboard | One of: --dashboard, --report, --temp |
| `--report` | `-r` | Attach to this report | One of: --dashboard, --report, --temp |
| `--temp` | `-t` | Run without saving | One of: --dashboard, --report, --temp |
| `--batch` | `-b` | Batch JSON file | Alternative to --sql |

### Batch Mode

Use batch mode when running multiple queries. Batch mode uses a **single Snowflake connection** for all queries, avoiding multiple authentication browser windows.

**JSON file format:**

```json
[
  { "name": "report_01_total", "sqlFile": "/tmp/report_01.sql" },
  { "name": "report_02_breakdown", "sqlFile": "/tmp/report_02.sql" },
  { "name": "report_03_details", "sql": "SELECT * FROM table LIMIT 10" }
]
```

Each query item requires:
- `name` (required): Query name for saving
- `sqlFile` (optional): Path to SQL file
- `sql` (optional): Inline SQL string

If neither `sqlFile` nor `sql` is provided, the query runner looks up existing SQL from the database by name.

**Example usage:**

```bash
# Write SQL files
echo "SELECT COUNT(*) as total FROM leads" > /tmp/q1.sql
echo "SELECT status, COUNT(*) as count FROM leads GROUP BY status" > /tmp/q2.sql

# Create batch file
echo '[{"name":"report_01_total","sqlFile":"/tmp/q1.sql"},{"name":"report_02_status","sqlFile":"/tmp/q2.sql"}]' > /tmp/batch.json

# Run batch
npm run query -- --project my-analysis --batch /tmp/batch.json --report findings
```

## Cursor Agent Permissions (CRITICAL)

**When running queries via Cursor agent, you MUST request `all` permissions.**

The query runner requires:
1. **Network access** - connects to Snowflake over HTTPS
2. **tsx execution** - runs TypeScript scripts
3. **Browser SSO** - uses `externalbrowser` auth

Without `all` permissions, the agent will fail with sandbox errors.

### First-Time Authentication

The first query opens a browser for Okta SSO login. After authentication, the token is cached locally.

Tell users: "A browser window will open for Snowflake authentication. Please complete the login."

## Dashboard Widget Integration

When saving to a dashboard, ask about widget type:

```
How should this be displayed on the dashboard?

1. Chart (line, bar, area)
2. Metric card
3. Data table
4. Don't add a widget (just save the data)
```

### UPPERCASE Column Names (CRITICAL)

**Snowflake returns UPPERCASE column names.** When configuring widgets:
- Use `TOTAL` not `total`
- Use `WEEK` not `week`
- Use `NEW_OPPORTUNITIES` not `new_opportunities`

### Widget Configuration Example

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

### Column Name Mappings

| SQL Alias | Snowflake Returns |
|-----------|-------------------|
| `as count` | `COUNT` |
| `as week` | `WEEK` |
| `as total` | `TOTAL` |
| `as my_column` | `MY_COLUMN` |

## Result Validation (CRITICAL - DO NOT SKIP)

**A query returning 0 rows is usually a BUG. Do not save empty queries.**

### Rule: Never Save Empty Queries Without Investigation

Before saving any query, check the row count. If 0 rows:

1. **DO NOT SAVE** - Empty results break dashboards and reports
2. **DEBUG** - Follow the workflow below
3. **FIX** - Rewrite the query until it returns data
4. **CONFIRM** - Only save after results look correct

If the query legitimately should return 0 rows (rare), explicitly ask the user before saving.

### Debugging Zero Results Workflow

```
Step 1: Verify tables exist
  → Run: SHOW TABLES LIKE '%tablename%'
  
Step 2: Check column names  
  → Run: DESCRIBE TABLE schema.tablename
  
Step 3: Remove all filters, test base query
  → SELECT * FROM table LIMIT 10
  
Step 4: Add filters back one at a time
  → Find which filter causes 0 rows
  
Step 5: Fix the problematic filter
  → Adjust column name, date format, or value
```

### Common Causes of 0 Rows

| Scenario | Likely Cause | Fix |
|----------|--------------|--------|
| History table returns 0 | Wrong column names | Use `OLD_VALUE` not `OLD_VALUE__C` |
| Filter on date returns 0 | Wrong date format | Use ISO: `'2026-01-30'` |
| JOIN returns 0 | Table/column mismatch | Verify names exist |
| SFDC table returns 0 | Including deleted records | Add `WHERE IS_DELETED = FALSE` |
| LIKE filter returns 0 | Case sensitivity | Use `ILIKE` or `LOWER()` |
| Enum filter returns 0 | Wrong value | Check actual values with `SELECT DISTINCT` |

### Example: Debugging a Failed Query

```sql
-- Original query returns 0 rows
SELECT * FROM leads WHERE status = 'qualified' AND created_date > '2026-01-01';

-- Step 1: Check if table has data
SELECT COUNT(*) FROM leads;  -- Returns 50000 ✓

-- Step 2: Check status values
SELECT DISTINCT status FROM leads LIMIT 20;  -- Shows 'Qualified' not 'qualified'

-- Step 3: Check date column name
DESCRIBE TABLE leads;  -- Shows CREATED_AT not created_date

-- Fixed query
SELECT * FROM leads WHERE status = 'Qualified' AND CREATED_AT > '2026-01-01';
```

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run `/create-project` first |
| Dashboard not found | Check dashboard name or create one |
| Report not found | Check report name or create one |
| Must specify target | Add `--dashboard`, `--report`, or `--temp` |
| tsx/sandbox error | Request `all` permissions |
| Network/connection error | Check VPN, request `all` permissions |
| Authentication failed | Re-authenticate via browser SSO |

## Troubleshooting

### "Query runner failed in this environment"

This means the sandbox blocked network access or tsx execution.

**Solution:** Re-run with `required_permissions: ["all"]`

### "Cannot connect to Snowflake"

1. Ensure you're on VPN (if required)
2. Request `all` permissions
3. Try re-authenticating (token may have expired)

### Query Runs But Widget Shows No Data

1. Check column names are UPPERCASE in widget config
2. Verify query name matches exactly
3. Ensure query results are saved (not temp)
