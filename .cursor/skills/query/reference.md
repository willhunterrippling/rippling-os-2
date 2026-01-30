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
  { "name": "report_01_total", "sqlFile": "temp/report_01.sql" },
  { "name": "report_02_breakdown", "sqlFile": "temp/report_02.sql" },
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
echo "SELECT COUNT(*) as total FROM leads" > temp/q1.sql
echo "SELECT status, COUNT(*) as count FROM leads GROUP BY status" > temp/q2.sql

# Create batch file
echo '[{"name":"report_01_total","sqlFile":"temp/q1.sql"},{"name":"report_02_status","sqlFile":"temp/q2.sql"}]' > temp/batch.json

# Run batch
npm run query -- --project my-analysis --batch temp/batch.json --report findings
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

## Result Validation

**CRITICAL:** A query returning 0 rows when you expect data is often a bug.

| Scenario | Likely Cause | Action |
|----------|--------------|--------|
| History table returns 0 | Wrong column names | Use `OLD_VALUE` not `OLD_VALUE__C` |
| Filter on date returns 0 | Wrong date format | Try different date syntax |
| JOIN returns 0 | Table/column mismatch | Verify names exist |
| SFDC table returns 0 | Missing is_deleted filter | Add `WHERE IS_DELETED = FALSE` |

### Debugging Zero Results

1. Remove filters one at a time to isolate the issue
2. Check column names match exactly (case-sensitive)
3. Verify table exists with `SHOW TABLES LIKE '%name%'`
4. Test date ranges with broader windows first

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
