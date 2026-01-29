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

1. /setup          Configure your environment and create your user
2. /create-project Create a new analysis project  
3. /query          Run SQL queries and save results to database
4. /start          Start the web dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /setup           Configure DATABASE_URL and create your user
  /create-project  Create a new analysis project in the database
  /query           Execute SQL queries against Snowflake
  /report          Create or edit markdown reports
  /share           Share projects with other users
  /delete          Delete projects, queries, or reports
  /start           Start the web dashboard dev server
  /update-os       Pull latest code from main
  /ingest-context  Add schemas, SQL patterns, or code to shared context
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
1. Get `DATABASE_URL` from admin (or Vercel dashboard)
2. Set it in `.env` along with `RIPPLING_ACCOUNT_EMAIL`
3. Run `/setup` to configure environment and create user
4. Run `/create-project` to start their first analysis

### "How do I run a SQL query?"

Explain `/query` usage:
- Run `/query` with project name and query name
- Results save to database automatically
- Optionally add to dashboard as chart/metric/table

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
- Queries: `/projects/[slug]/queries/[name]`
- Reports: `/projects/[slug]/reports/[name]`

## Environment Setup

Required in `.env`:
```
DATABASE_URL=postgres://...
RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com
```

For local development:
```
BYPASS_AUTH=true
```
