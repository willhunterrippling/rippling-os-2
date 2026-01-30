# Widget Configuration Reference

Detailed configuration options for dashboard widgets. All widgets require a `queryName` that references a saved query in the project.

## Chart Widget

Line, bar, or area charts for time-series or categorical data.

### Configuration

```typescript
{
  type: 'chart',
  queryName: 'weekly_leads',      // Required: name of saved query
  title: 'Weekly Lead Volume',    // Required: display title
  chartType: 'line',              // Required: 'line' | 'bar' | 'area'
  xKey: 'WEEK',                   // Required: column for x-axis (UPPERCASE)
  yKey: 'COUNT',                  // Required: column for y-axis (UPPERCASE)
}
```

### Chart Type Selection

| Chart Type | Best For | Example Use Case |
|------------|----------|------------------|
| `line` | Time series, trends over time | Weekly lead volume, monthly revenue |
| `bar` | Categorical comparisons, rankings | Status breakdown, team performance |
| `area` | Cumulative values, volume over time | Running totals, stacked metrics |

### Example: Line Chart

```typescript
{
  type: 'chart',
  queryName: 'leads_by_week',
  title: 'Leads Over Time',
  chartType: 'line',
  xKey: 'WEEK_START',
  yKey: 'LEAD_COUNT',
}
```

### Example: Bar Chart

```typescript
{
  type: 'chart',
  queryName: 'status_breakdown',
  title: 'Leads by Status',
  chartType: 'bar',
  xKey: 'STATUS',
  yKey: 'COUNT',
}
```

## Metric Card Widget

Single number display with optional comparison to previous period.

### Configuration

```typescript
{
  type: 'metric',
  queryName: 'total_leads',       // Required: name of saved query
  title: 'Total Leads',           // Required: display title
  valueKey: 'TOTAL',              // Required: column for main value (UPPERCASE)
  previousKey: 'PREVIOUS',        // Optional: column for comparison value
}
```

### How Comparison Works

When `previousKey` is provided, the widget calculates and displays:
- Percentage change: `((current - previous) / previous) * 100`
- Visual indicator: green for positive change, red for negative

### Example: Simple Metric

```typescript
{
  type: 'metric',
  queryName: 'active_opps',
  title: 'Active Opportunities',
  valueKey: 'TOTAL_COUNT',
}
```

### Example: Metric with Comparison

```typescript
{
  type: 'metric',
  queryName: 'weekly_comparison',
  title: 'This Week vs Last Week',
  valueKey: 'THIS_WEEK',
  previousKey: 'LAST_WEEK',
}
```

### Query Pattern for Comparison

Your query should return both current and previous values:

```sql
SELECT
  COUNT(CASE WHEN created_at >= DATEADD(week, -1, CURRENT_DATE) THEN 1 END) AS THIS_WEEK,
  COUNT(CASE WHEN created_at >= DATEADD(week, -2, CURRENT_DATE)
              AND created_at < DATEADD(week, -1, CURRENT_DATE) THEN 1 END) AS LAST_WEEK
FROM leads
```

## Data Table Widget

Tabular display of query results with specified columns.

### Configuration

```typescript
{
  type: 'table',
  queryName: 'status_breakdown',  // Required: name of saved query
  title: 'Status Distribution',   // Required: display title
  columns: ['STATUS', 'COUNT', 'PERCENTAGE'],  // Required: columns to display (UPPERCASE)
}
```

### Column Ordering

Columns display in the order specified in the `columns` array. Only listed columns are shown, even if the query returns additional columns.

### Example: Simple Table

```typescript
{
  type: 'table',
  queryName: 'lead_status_summary',
  title: 'Lead Status Summary',
  columns: ['STATUS', 'COUNT'],
}
```

### Example: Detailed Table

```typescript
{
  type: 'table',
  queryName: 'opportunity_details',
  title: 'Opportunity Pipeline',
  columns: ['ACCOUNT_NAME', 'STAGE', 'AMOUNT', 'CLOSE_DATE', 'OWNER'],
}
```

## Common Patterns

### Multiple Widgets from Same Query

You can create multiple widgets from a single query if it returns the necessary columns:

```typescript
// Query returns: WEEK, COUNT, TOTAL, PREVIOUS_TOTAL

// Widget 1: Chart
{ type: 'chart', queryName: 'weekly_summary', chartType: 'line', xKey: 'WEEK', yKey: 'COUNT' }

// Widget 2: Metric
{ type: 'metric', queryName: 'weekly_summary', valueKey: 'TOTAL', previousKey: 'PREVIOUS_TOTAL' }
```

### Dashboard Layout

Widgets are displayed in the order they appear in the `config.widgets` array. Plan your widget order for logical flow:

1. Summary metrics at top
2. Trend charts in middle
3. Detail tables at bottom

## Column Name Requirements

**All column keys must be UPPERCASE** because Snowflake returns uppercase column names.

| Correct | Incorrect |
|---------|-----------|
| `xKey: 'WEEK'` | `xKey: 'week'` |
| `valueKey: 'TOTAL_COUNT'` | `valueKey: 'total_count'` |
| `columns: ['STATUS', 'COUNT']` | `columns: ['status', 'count']` |
