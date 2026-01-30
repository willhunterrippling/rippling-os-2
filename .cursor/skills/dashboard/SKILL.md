---
name: dashboard
description: Create or edit dashboards with charts, metrics, and data tables. Use when the user says "/dashboard", wants to visualize data, or add widgets.
---

# /dashboard - Create or Edit Dashboard

Create or edit dashboards with charts, metric cards, and data tables.

## STOP - Clarify Before Proceeding

**You MUST know these before configuring a dashboard:**

| Requirement | How to Clarify |
|-------------|----------------|
| Project | "Which project should this dashboard belong to?" |
| Dashboard name | "What should I call this dashboard?" (default: "main") |
| Widget type | "How should the data be displayed? Chart, metric card, or table?" |
| Data source | "Which query should power this widget?" |

**If the visualization goal is unclear, ASK.**

Do NOT:
- Assume which project without confirmation
- Add widgets without knowing what data to display
- Guess at chart configuration

### When You DON'T Need to Ask

- User explicitly named the project
- You just created/queried a project in this conversation
- Only one project exists for the user
- User specified the visualization type

## Trigger

User says "dashboard", "/dashboard", "add widget", "add chart", "visualize", or wants to configure dashboard display.

## Widget Types

### Chart

Line, bar, or area charts for time-series or categorical data.

```typescript
{
  type: 'chart',
  queryName: 'weekly_leads',
  title: 'Weekly Lead Volume',
  chartType: 'line',  // 'line' | 'bar' | 'area'
  xKey: 'WEEK',       // UPPERCASE!
  yKey: 'COUNT',      // UPPERCASE!
}
```

### Metric Card

Single number display with optional comparison.

```typescript
{
  type: 'metric',
  queryName: 'total_leads',
  title: 'Total Leads',
  valueKey: 'TOTAL',        // UPPERCASE!
  previousKey: 'PREVIOUS',  // Optional, for % change
}
```

### Data Table

Tabular display of query results.

```typescript
{
  type: 'table',
  queryName: 'status_breakdown',
  title: 'Status Distribution',
  columns: ['STATUS', 'COUNT', 'PERCENTAGE'],  // UPPERCASE!
}
```

## UPPERCASE Keys (CRITICAL)

**Snowflake returns UPPERCASE column names.** Always use:
- `WEEK` not `week`
- `COUNT` not `count`
- `TOTAL_OPPORTUNITIES` not `total_opportunities`

## Core Workflow

### 1. Identify Project and Dashboard

If unclear, query user's projects:

```typescript
const projects = await prisma.project.findMany({
  where: { ownerId: userId },
  select: { slug: true, name: true },
  orderBy: { updatedAt: 'desc' },
  take: 10
});
```

### 2. Determine Widget Type

Ask if not specified:
```
How should this be displayed on the dashboard?

1. Chart (line, bar, area)
2. Metric card (single number)
3. Data table
```

### 3. Identify Data Source

Either:
- Use an existing query: `"Which query should power this widget?"`
- Run a new query: Use `/query` skill to create and save the query first

### 4. Configure and Add Widget

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

const dashboard = await prisma.dashboard.findFirst({
  where: {
    project: { slug: projectSlug },
    name: dashboardName,
  },
});

const config = dashboard.config as any;
config.widgets.push({
  type: 'chart',
  queryName: 'my_query',
  title: 'My Chart',
  chartType: 'line',
  xKey: 'WEEK',
  yKey: 'COUNT',
});

await prisma.dashboard.update({
  where: { id: dashboard.id },
  data: { config },
});

await prisma.$disconnect();
```

### 5. Output Confirmation

```
✅ Widget added!

Dashboard: [dashboard-name]
Widget: [widget-title]
Type: [chart/metric/table]
Data source: [query-name]

View at: /projects/[slug]/dashboards/[name]
```

## Creating a New Dashboard

If the dashboard doesn't exist:

```typescript
await prisma.dashboard.create({
  data: {
    projectId: project.id,
    name: dashboardName,
    config: {
      title: 'Dashboard Title',
      widgets: [],
    },
  },
});
```

## Updating Widget Configuration

To modify an existing widget:

```typescript
const config = dashboard.config as any;
const widgetIndex = config.widgets.findIndex(w => w.queryName === 'target_query');

if (widgetIndex >= 0) {
  config.widgets[widgetIndex] = {
    ...config.widgets[widgetIndex],
    title: 'Updated Title',
    chartType: 'bar',
  };
}

await prisma.dashboard.update({
  where: { id: dashboard.id },
  data: { config },
});
```

## Removing a Widget

```typescript
const config = dashboard.config as any;
config.widgets = config.widgets.filter(w => w.queryName !== 'query_to_remove');

await prisma.dashboard.update({
  where: { id: dashboard.id },
  data: { config },
});
```

## Cursor Agent Permissions

**When modifying dashboards via Cursor agent, you MUST request `all` permissions.**

Required for:
1. **Network access** - connects to database
2. **tsx execution** - runs TypeScript scripts

## Error Handling

| Error | Solution |
|-------|----------|
| Project not found | Run /create-project first |
| Dashboard not found | Create new dashboard or check name |
| Query not found | Run the query first with /query |
| Widget not displaying | Check column names are UPPERCASE |
| tsx/sandbox error | Request `all` permissions |

## Chart Type Reference

| Chart Type | Best For |
|------------|----------|
| `line` | Time series, trends over time |
| `bar` | Categorical comparisons, rankings |
| `area` | Cumulative values, volume over time |
