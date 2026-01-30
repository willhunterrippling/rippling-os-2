# Widget Configuration Reference

Detailed configuration options for dashboard widgets. All widgets require a `queryName` that references a saved query in the project.

**Default to tables.** If unsure which widget type to use, choose a table. Tables work for any data shape, show exact values, and are never misleading. Only use charts when the user explicitly requests visualization OR the data has clear time-series characteristics with 5+ data points.

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

### When NOT to Use Charts

**Use a table instead when:**

| Situation | Why Table is Better |
|-----------|---------------------|
| Fewer than 5 data points | Charts look empty/misleading with sparse data |
| More than 15 categories | Bar charts become unreadable; tables handle any row count |
| User didn't ask for visualization | Default to showing exact values |
| Data has no natural ordering | Charts imply sequence/trend that may not exist |
| Multiple important columns | Charts only show 2 dimensions (x/y); tables show all |
| Exact values matter | Charts are for trends; tables show precise numbers |

**Chart validation:** The Chart component will automatically fall back to a table if:
- Data has fewer than 2 rows
- X or Y column doesn't exist in the data
- Y values aren't numeric
- Bar chart has more than 15 categories
- Pie chart has more than 8 slices

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
