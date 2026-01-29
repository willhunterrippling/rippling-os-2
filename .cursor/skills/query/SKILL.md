# /query - Execute SQL Query

Execute SQL queries against Snowflake and cache results as JSON.

## Trigger

User says "query", "/query", "run query", "execute SQL", or provides a SQL file to run.

## Workflow

1. **Identify SQL to Execute**
   - If user provides a SQL file path, use that
   - If user provides inline SQL, save to a temp file first
   - SQL files should be in `projects/[project]/queries/` folder

2. **Validate SQL**
   - Check for prohibited statements: DELETE, UPDATE, DROP, TRUNCATE
   - Warn if no LIMIT clause (suggest adding one)
   - Ensure proper filters (is_deleted, _fivetran_deleted)

3. **Execute Query**
   Run the query runner:
   ```bash
   npm run query -- projects/[project]/queries/[query].sql
   ```
   
   Or with explicit output:
   ```bash
   npm run query -- projects/[project]/queries/[query].sql --output projects/[project]/data/[query].json
   ```

4. **Handle Authentication**
   - The query runner uses `externalbrowser` SSO
   - A browser window will open for Okta/SSO authentication
   - User authenticates once, then queries run

5. **Output Results**
   ```
   ✅ Query executed successfully!
   
   Results saved to: projects/[project]/data/[query].json
   Rows returned: [count]
   
   Preview (first 5 rows):
   [show preview]
   
   Next steps:
   1. Add this data to your dashboard.yaml
   2. Run /save to commit results
   ```

## CLI Usage

```bash
# From repo root
npm run query -- <sql-file> [--output <json-file>]

# Examples
npm run query -- projects/my-analysis/queries/s1_count.sql
npm run query -- projects/my-analysis/queries/trend.sql --output projects/my-analysis/data/trend.json
```

## Dashboard Integration

After running a query, add it to `dashboard.yaml`:

```yaml
widgets:
  - type: metric
    title: "S1 Count"
    data: data/s1_count.json
    valueKey: count
```

## Environment Requirements

- `RIPPLING_ACCOUNT_EMAIL` must be set in `.env`
- Snowflake connection details in `.env` (uses defaults if not set)

## Safety Rules

- ALWAYS use LIMIT when exploring data
- NEVER run DELETE, UPDATE, DROP, or TRUNCATE
- ALWAYS filter by is_deleted = FALSE for SFDC tables
- ALWAYS filter by _fivetran_deleted = FALSE

## Error Handling

- If connection fails, check environment variables
- If query fails, show the error and suggest fixes
- If output directory doesn't exist, create it
