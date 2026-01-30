# Dashboard Code Reference

Prisma code examples for dashboard operations. All operations require `all` permissions in Cursor.

## Setup

All scripts require this setup:

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});
```

## Query User's Projects

Find projects owned by or shared with a user:

```typescript
const projects = await prisma.project.findMany({
  where: { ownerId: userId },
  select: { slug: true, name: true },
  orderBy: { updatedAt: 'desc' },
  take: 10
});
```

## Find Dashboard

Get a dashboard by project slug and dashboard name:

```typescript
const dashboard = await prisma.dashboard.findFirst({
  where: {
    project: { slug: projectSlug },
    name: dashboardName,
  },
});
```

## Create Dashboard

Create a new dashboard for a project:

```typescript
const project = await prisma.project.findUnique({
  where: { slug: projectSlug },
});

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

## Add Widget

Add a widget to an existing dashboard:

```typescript
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

## Update Widget

Modify an existing widget by query name:

```typescript
const dashboard = await prisma.dashboard.findFirst({
  where: {
    project: { slug: projectSlug },
    name: dashboardName,
  },
});

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

await prisma.$disconnect();
```

## Remove Widget

Remove a widget from a dashboard:

```typescript
const dashboard = await prisma.dashboard.findFirst({
  where: {
    project: { slug: projectSlug },
    name: dashboardName,
  },
});

const config = dashboard.config as any;
config.widgets = config.widgets.filter(w => w.queryName !== 'query_to_remove');

await prisma.dashboard.update({
  where: { id: dashboard.id },
  data: { config },
});

await prisma.$disconnect();
```

## Output Confirmation

After successful operations, display:

```
✅ Widget added!

Dashboard: [dashboard-name]
Widget: [widget-title]
Type: [chart/metric/table]
Data source: [query-name]

View at: /projects/[slug]/dashboards/[name]
```

## Error Handling

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Project not found | Invalid slug or no access | Run `/create-project` first or check slug spelling |
| Dashboard not found | Dashboard doesn't exist | Create new dashboard or verify name |
| Query not found | Query not saved to project | Run `/query` to create and save the query |
| Widget not displaying | Column name case mismatch | Use UPPERCASE column names |
| tsx/sandbox error | Missing permissions | Request `all` permissions |
| ECONNREFUSED | Network blocked by sandbox | Request `all` permissions |
| Cannot connect to Snowflake | SSO not completed | Complete browser authentication |

### Debugging Widget Display Issues

If a widget isn't displaying data:

1. **Check column names** - Must be UPPERCASE
2. **Verify query exists** - Query must be saved with matching `queryName`
3. **Check query returns data** - Run query manually to verify results
4. **Inspect browser console** - Look for JavaScript errors

### Debugging Prisma Connection Issues

If database operations fail:

1. **Check .env file** - Verify `PRISMA_DATABASE_URL` is set
2. **Request permissions** - Use `required_permissions: ["all"]`
3. **Check network** - Ensure not running in restricted sandbox

## Cursor Agent Permissions

Dashboard operations require elevated permissions because:

1. **Network access** - Prisma connects to remote database
2. **tsx execution** - TypeScript scripts need full runtime

Always run dashboard scripts with:

```bash
# Required: all permissions
npx tsx script.ts
# Use: required_permissions: ["all"]
```

## Complete Example Script

Full script to add a chart widget:

```typescript
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function addChartWidget() {
  const projectSlug = 'my-project';
  const dashboardName = 'main';

  // Find or create dashboard
  let dashboard = await prisma.dashboard.findFirst({
    where: {
      project: { slug: projectSlug },
      name: dashboardName,
    },
  });

  if (!dashboard) {
    const project = await prisma.project.findUnique({
      where: { slug: projectSlug },
    });

    if (!project) {
      console.error('Project not found');
      await prisma.$disconnect();
      return;
    }

    dashboard = await prisma.dashboard.create({
      data: {
        projectId: project.id,
        name: dashboardName,
        config: { title: 'Main Dashboard', widgets: [] },
      },
    });
  }

  // Add widget
  const config = dashboard.config as any;
  config.widgets.push({
    type: 'chart',
    queryName: 'weekly_leads',
    title: 'Weekly Lead Volume',
    chartType: 'line',
    xKey: 'WEEK',
    yKey: 'COUNT',
  });

  await prisma.dashboard.update({
    where: { id: dashboard.id },
    data: { config },
  });

  console.log('✅ Widget added!');
  console.log(`Dashboard: ${dashboardName}`);
  console.log(`View at: /projects/${projectSlug}/dashboards/${dashboardName}`);

  await prisma.$disconnect();
}

addChartWidget();
```
