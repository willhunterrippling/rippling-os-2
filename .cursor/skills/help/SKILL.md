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

1. /setup          Set up your personal branch (run this first!)
2. /create-project Create a new analysis project  
3. /query          Run SQL queries and cache results
4. /save           Commit and push your changes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ALL COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  /setup           Create or switch to your user branch
  /create-project  Create a new analysis project with proper structure
  /query           Execute SQL queries against Snowflake
  /save            Commit and push changes to your branch
  /start           Start the web dashboard dev server
  /update-os       Sync your branch with latest from main
  /ingest-context  Add schemas, SQL patterns, or code to shared context
  /help            Show this help message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UTILITY SKILLS (auto-triggered)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  docx             Create, edit, and analyze Word documents
  xlsx             Create, edit, and analyze Excel spreadsheets  
  pdf-processing   Extract text, fill forms, merge/split PDFs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SHELL SCRIPTS (alternative to commands)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ./scripts/setup-branch.sh     Same as /setup
  ./scripts/save.sh "message"   Same as /save
  ./scripts/sync.sh             Same as /update-os
  npm run query -- <file.sql>   Same as /query
  npm run dev                   Same as /start

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
| `/help save` | `.cursor/skills/save/SKILL.md` |
| `/help start` | `.cursor/skills/start/SKILL.md` |
| `/help update-os` | `.cursor/skills/update-os/SKILL.md` |
| `/help ingest-context` | `.cursor/skills/ingest-context/SKILL.md` |

Provide a concise summary of the workflow and key usage examples from that skill.

## Common Questions

### "How do I get started?"

Direct them to:
1. Copy `.env.template` to `.env` and set `RIPPLING_ACCOUNT_EMAIL`
2. Run `/setup` to create their user branch
3. Run `/create-project` to start their first analysis

### "How do I run a SQL query?"

Explain `/query` usage:
- Put SQL file in `projects/[project]/queries/`
- Run `/query` or `npm run query -- <sql-file>`
- Results save to `projects/[project]/data/`

### "How do I see my dashboard?"

Explain `/start`:
- Run `/start` or `npm run dev`
- Open http://localhost:3000
- Navigate to your project

### "How do I share my work?"

Explain the workflow:
1. Run `/save` to commit and push
2. Changes deploy to your preview URL automatically
3. To get work into main, create a PR for approval

## Project Structure Reference

```
rippling-os-2/
├── projects/           # Your analysis projects live here
│   ├── _templates/     # Templates for new projects
│   └── [your-project]/ # Individual projects
│       ├── queries/    # SQL files
│       ├── data/       # Cached JSON results
│       └── dashboard.yaml
├── context/global/     # Shared schemas, SQL patterns, definitions
├── web/                # Dashboard web app (Next.js)
└── scripts/            # CLI tools
```

## Environment Setup

Required in `.env`:
```
RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com
```

Optional (have defaults):
```
SNOWFLAKE_ACCOUNT=RIPPLINGORG-RIPPLING
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_INTEGRATION_DWH
```
