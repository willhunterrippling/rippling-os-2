---
name: dashboard
description: Create or edit dashboards with charts, metrics, and data tables. Use when the user says "/dashboard", wants to visualize data, or add widgets.
---

# /dashboard - Create or Edit Dashboard

Create or edit dashboards with charts, metric cards, and data tables. For detailed widget configuration, see [widgets.md](widgets.md). For code examples and troubleshooting, see [reference.md](reference.md).

**Skill directory**: `.cursor/skills/dashboard`

## Clarify Before Proceeding

You must know these before configuring a dashboard:

| Requirement | How to Clarify |
|-------------|----------------|
| Project | "Which project should this dashboard belong to?" |
| Dashboard name | "What should I call this dashboard?" (default: "main") |
| Widget type | "Would you like this as a table (recommended), chart, or metric card?" |
| Data source | "Which query should power this widget?" |

**Skip clarification when:**
- User explicitly named the project
- You just created/queried a project in this conversation
- Only one project exists for the user
- User specified the visualization type

## Default to Tables

**Always use a table unless:**
- User explicitly asks for a chart or visualization
- Data is clearly time-series with 5+ data points AND user wants to see trends
- Data is a single summary number (use metric card)

Tables are the safe default because they:
- Work for any data shape
- Show exact values (no visual approximation)
- Never mislead the user about patterns

See [widgets.md](widgets.md) for detailed guidance on when NOT to use charts.

## Widget Types Quick Reference

| Type | Purpose | Key Properties |
|------|---------|----------------|
| `table` | Tabular data display (default) | `columns` array |
| `metric` | Single number display | `valueKey`, `previousKey` (optional) |
| `chart` | Line, bar, or area charts (only when requested) | `chartType`, `xKey`, `yKey` |

For detailed configuration options, see [widgets.md](widgets.md).

## UPPERCASE Keys (CRITICAL)

**Snowflake returns UPPERCASE column names.** Always use:
- `WEEK` not `week`
- `COUNT` not `count`
- `TOTAL_OPPORTUNITIES` not `total_opportunities`

## Core Workflow

1. **Identify project and dashboard** - Query user's projects if unclear
2. **Determine widget type** - Default to table; only use chart if user explicitly requests it
3. **Identify data source** - Use existing query or run `/query` to create one
4. **Configure and add widget** - Use Prisma to update dashboard config
5. **Output confirmation** - Show dashboard URL and widget details

For complete code examples, see [reference.md](reference.md).

## Cursor Agent Permissions

**When modifying dashboards, you MUST request `all` permissions.**

Required for:
- **Network access** - connects to database
- **tsx execution** - runs TypeScript scripts

## Quick Error Reference

| Error | Solution |
|-------|----------|
| Project not found | Run `/create-project` first |
| Dashboard not found | Create new dashboard or check name |
| Query not found | Run the query first with `/query` |
| Widget not displaying | Check column names are UPPERCASE |
| tsx/sandbox error | Request `all` permissions |

For detailed error handling, see [reference.md](reference.md).

## Utility Scripts

List all widgets on a dashboard:

```bash
npx tsx .cursor/skills/dashboard/scripts/list-widgets.ts <project-slug> [dashboard-name]
```

## Next Steps

- For widget configuration details (charts, metrics, tables), see [widgets.md](widgets.md)
- For Prisma code examples and troubleshooting, see [reference.md](reference.md)
