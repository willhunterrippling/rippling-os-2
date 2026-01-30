---
name: help
description: Show available commands, skills, and usage guidance for Rippling OS. Use when the user types /help, asks for help, wants to know what commands are available, or is new to the repository.
---

# /help - Rippling OS Help

Display available commands and guide users on how to use this repository.

## Trigger

User says "help", "/help", "what commands are available", "how do I use this", or asks about available features.

## Default Response (No Input)

When `/help` is invoked without arguments, display this overview:

```
📚 Rippling OS Help

This is an AI-assisted Snowflake querying and dashboard platform for Rippling's Growth team.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GETTING STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. /setup          Configure environment, create user, and example project
2. /start          Start the web dashboard and explore your example project
3. /query          Run SQL queries and save results to database
4. /create-project Create a new analysis project

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /setup           Configure environment, create user & example project
  /create-project  Create a new analysis project in the database
  /query           Execute SQL queries (temp or saved to dashboard/report)
  /dashboard       Create or edit dashboards with charts and visualizations
  /report          Create or edit markdown reports with queries
  /share           Share projects with other users
  /delete          Delete projects, dashboards, or reports
  /start           Start the web dashboard dev server
  /update-os       Pull latest code from main
  /ingest-context  Import files from context/import/ to global or personal context
  /help            Show this help message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UTILITY SKILLS (auto-triggered)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  docx             Create, edit, and analyze Word documents
  xlsx             Create, edit, and analyze Excel spreadsheets  
  pdf-processing   Extract text, fill forms, merge/split PDFs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Type /help <command> for detailed help on a specific command.
Example: /help query
```

## Help for Specific Commands

If the user asks `/help <command>`, read and summarize the corresponding skill:

| Input | Skill to Read |
|-------|---------------|
| `/help setup` | `.cursor/skills/setup/SKILL.md` |
| `/help create-project` | `.cursor/skills/create-project/SKILL.md` |
| `/help query` | `.cursor/skills/query/SKILL.md` |
| `/help dashboard` | `.cursor/skills/dashboard/SKILL.md` |
| `/help report` | `.cursor/skills/report/SKILL.md` |
| `/help share` | `.cursor/skills/share/SKILL.md` |
| `/help delete` | `.cursor/skills/delete/SKILL.md` |
| `/help start` | `.cursor/skills/start/SKILL.md` |
| `/help update-os` | `.cursor/skills/update-os/SKILL.md` |
| `/help ingest-context` | `.cursor/skills/ingest-context/SKILL.md` |

Provide a concise summary of the workflow and key usage examples from that skill.

## Common Questions

### "How do I get started?"

Direct them to:
1. Get database URLs from admin (or Vercel dashboard)
2. Set them in `.env` along with `RIPPLING_ACCOUNT_EMAIL`
3. Run `/setup` to configure environment, create user, and get an example project
4. Run `/start` to launch the dashboard and explore your example project
5. Run queries on the example project to see data populate
6. Run `/create-project` when ready to start your own analysis

### "How do I run a SQL query?"

Explain `/query` usage:
- **Temp queries**: Run SQL and see results without saving (for exploration)
- **Saved queries**: Attach to a dashboard or report
- Results for saved queries are stored in the database
- Dashboard queries can be displayed as charts/metrics/tables

**Workflow:**
1. Run a temp query to explore data
2. If you want to keep it, save to a dashboard or report
3. Agent will ask where to attach it

**Important:** Snowflake returns UPPERCASE column names. When adding widgets:
- Use `WEEK` not `week`
- Use `TOTAL_OPPORTUNITIES` not `total_opportunities`

### "How do I see my dashboard?"

Explain `/start`:
- Run `/start` or `npm run dev`
- Set `BYPASS_AUTH=true` in `.env` for local dev
- Open http://localhost:3000
- Navigate to your project

### "How do I share my work?"

Explain the sharing model:
1. All @rippling.com users can view all projects by default
2. Run `/share` to give specific users edit or admin access
3. View dashboards at the deployed Vercel URL
4. Sign in with magic link (one-time email verification)

## Architecture Overview

**Data Storage:**
- All data is stored in Vercel Postgres (not local files)
- Projects, queries, dashboards, reports in database
- No need to commit data - it's saved automatically

**Authentication:**
- Web app requires @rippling.com email
- Magic link verification for web access
- CLI uses git email for identity (auto-creates user)

**Sharing:**
- Default: all users can view all projects
- Explicit shares for edit/admin permissions
- Owner can manage shares via `/share` or web UI

## URL Routes

- Home: `/`
- Project overview: `/projects/[slug]`
- Dashboards: `/projects/[slug]/dashboards/[name]`
- Reports: `/projects/[slug]/reports/[name]`
- Queries: `/projects/[slug]/queries/[name]` (linked from dashboards/reports)

## Environment Setup

Required in `.env`:
```
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...
PRISMA_DATABASE_URL=prisma+postgres://...
AUTH_SECRET=your-generated-secret
BYPASS_AUTH=true
```

For Snowflake (choose one):
```
# Option 1: In .env
RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com

# Option 2: Shared with VSCode extension
# Create ~/.snowflake/connections.toml (see README for format)
```

**Note:** Symlink `.env` to `web/.env`:
```bash
ln -sf ../.env web/.env
```

**Tip:** Install the Snowflake VSCode extension for SQL IntelliSense and shared credentials.
