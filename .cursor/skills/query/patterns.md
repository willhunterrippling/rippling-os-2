# SQL Patterns and Schema Reference

Common SQL patterns, schema documentation, and safety rules for writing queries.

## Schema Reference

**Before writing queries, check the schema documentation:**

| Schema File | Contents |
|-------------|----------|
| `context/global/schemas/SFDC_TABLES.md` | Main Salesforce tables (Lead, Account, Opportunity, etc.) |
| `context/global/schemas/SFDC_HISTORY_TABLES.md` | History/audit tables for tracking field changes |
| `context/global/schemas/SNOWFLAKE_TABLES.md` | Growth/DWH tables |
| `context/global/schemas/OUTREACH_TABLES.md` | Outreach integration tables |

## Safety Rules

**ALWAYS follow these rules when writing SQL:**

| Rule | Why |
|------|-----|
| Use LIMIT when exploring | Prevents runaway queries on large tables |
| NEVER run DELETE, UPDATE, DROP, TRUNCATE | Read-only access, these will fail anyway |
| Filter by `IS_DELETED = FALSE` | SFDC soft-deletes records |
| Filter by `_FIVETRAN_DELETED = FALSE` | Fivetran sync marker for deleted records |

### Required Filters by Table Type

```sql
-- SFDC tables (Lead, Account, Opportunity, etc.)
WHERE IS_DELETED = FALSE

-- Fivetran-synced tables
WHERE _FIVETRAN_DELETED = FALSE

-- Both (when joining SFDC with Fivetran)
WHERE t1.IS_DELETED = FALSE
  AND t2._FIVETRAN_DELETED = FALSE
```

## Common Query Patterns

### Status Breakdown

Get counts and percentages by status:

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

Track how records move between statuses over time:

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

### Temporal Analysis (Weekly Trends)

Aggregate data by week for trend charts:

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

### Daily Trends

```sql
SELECT 
    DATE_TRUNC('day', CREATED_DATE) as day,
    COUNT(*) as count
FROM SFDC.LEAD
WHERE IS_DELETED = FALSE
  AND CREATED_DATE >= DATEADD('day', -30, CURRENT_DATE())
GROUP BY day
ORDER BY day;
```

### Monthly Aggregation

```sql
SELECT 
    DATE_TRUNC('month', CREATED_DATE) as month,
    COUNT(*) as count
FROM SFDC.OPPORTUNITY
WHERE IS_DELETED = FALSE
  AND CREATED_DATE >= DATEADD('month', -12, CURRENT_DATE())
GROUP BY month
ORDER BY month;
```

### Field Value Distribution

```sql
SELECT 
    LEAD_SOURCE,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as pct
FROM SFDC.LEAD
WHERE IS_DELETED = FALSE
  AND CREATED_DATE >= DATEADD('day', -90, CURRENT_DATE())
GROUP BY LEAD_SOURCE
ORDER BY count DESC
LIMIT 20;
```

### Recent Records Sample

```sql
SELECT *
FROM SFDC.LEAD
WHERE IS_DELETED = FALSE
ORDER BY CREATED_DATE DESC
LIMIT 100;
```

### Join Pattern (Lead to Account)

```sql
SELECT 
    l.ID as lead_id,
    l.NAME as lead_name,
    a.NAME as account_name
FROM SFDC.LEAD l
LEFT JOIN SFDC.ACCOUNT a ON l.CONVERTED_ACCOUNT_ID = a.ID
WHERE l.IS_DELETED = FALSE
  AND (a.IS_DELETED = FALSE OR a.ID IS NULL)
LIMIT 100;
```

## Date Functions Quick Reference

| Function | Example | Result |
|----------|---------|--------|
| Current date | `CURRENT_DATE()` | `2024-01-15` |
| Days ago | `DATEADD('day', -30, CURRENT_DATE())` | 30 days before today |
| Week truncate | `DATE_TRUNC('week', CREATED_DATE)` | Start of week |
| Month truncate | `DATE_TRUNC('month', CREATED_DATE)` | Start of month |
| Date difference | `DATEDIFF('day', start_date, end_date)` | Days between dates |

## History Table Notes

History tables track field changes over time. Key columns:

| Column | Description |
|--------|-------------|
| `FIELD` | Name of the field that changed |
| `OLD_VALUE` | Previous value (NOT `OLD_VALUE__C`) |
| `NEW_VALUE` | New value (NOT `NEW_VALUE__C`) |
| `CREATED_DATE` | When the change occurred |
| `CREATED_BY_ID` | User who made the change |

**Common mistake:** Using `OLD_VALUE__C` instead of `OLD_VALUE`. History tables use standard columns, not custom field syntax.
