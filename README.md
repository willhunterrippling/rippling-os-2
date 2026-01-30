# Rippling OS 2.0

AI-assisted Snowflake querying and dashboard platform for Rippling's Growth team.

## Overview

Rippling OS enables Growth Managers to:
- Query Snowflake data with AI assistance via Cursor
- Create interactive web dashboards with charts, metrics, and tables
- Build markdown reports with linked query data
- Share work with teammates—no Git knowledge required

**Key Architecture:** All data (projects, queries, dashboards, reports) is stored in a PostgreSQL database, not local files. This enables real-time collaboration and access from the hosted web dashboard.

## Quick Start

### Prerequisites

1. **Cursor IDE** with this repository open
2. **Database access** - Get URLs from your admin or the Vercel dashboard
3. **Snowflake access** - You'll authenticate via SSO on first query

### Step 1: Configure Environment

Copy the template and add your database URLs:

```bash
cp .env.template .env
ln -sf ../.env web/.env
```

Edit `.env` with:
- `DATABASE_URL`, `POSTGRES_URL`, `PRISMA_DATABASE_URL` from Vercel Postgres
- `RIPPLING_ACCOUNT_EMAIL` - Your Rippling email for Snowflake SSO
- `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- `BYPASS_AUTH=true` - For local development

### Step 2: Run Setup

In Cursor, type `/setup` and follow the prompts. This will:
- Install dependencies
- Generate Prisma client
- Create your user in the database
- Test Snowflake connection (browser opens for SSO)
- Create an example project with sample dashboard

### Step 3: Start the Dashboard

```bash
npm run dev
```

Open http://localhost:3000 to see your projects.

### Step 4: Run Your First Query

In Cursor, type `/query` and describe what data you want. The AI will:
1. Write the SQL
2. Execute against Snowflake
3. Ask if you want to save results to a dashboard or report

## Commands

| Command | Description |
|---------|-------------|
| `/setup` | Configure environment, create user, generate example project |
| `/create-project` | Create a new analysis project |
| `/query` | Execute SQL queries (temp or saved to dashboard/report) |
| `/dashboard` | Create or edit dashboards with visualizations |
| `/report` | Create or edit markdown reports |
| `/share` | Share projects with other users |
| `/delete` | Delete projects, dashboards, or reports |
| `/start` | Start the web dashboard dev server |
| `/update-os` | Pull latest code from main |
| `/passcode` | Generate passcode for web dashboard access |
| `/help` | Show available commands |

## How It Works

### Projects

Projects are containers for related analysis work. Each project has:
- A unique slug (e.g., `q4-lead-analysis`)
- An owner (you) with full permissions
- Optional shares with other users

Create a project:
```
/create-project Q4 Lead Analysis
```

### Queries

Queries can be **temp** (for exploration) or **saved** (for dashboards/reports).

| Type | When to Use | What Happens |
|------|-------------|--------------|
| **Temp** | Quick lookups, exploration | Results shown inline, nothing saved |
| **Saved** | Dashboard/report data | SQL + results stored in database |

When you save a query, it's also written to `local-queries/<project>/<query>.sql` so you can run it in the VSCode Snowflake extension.

### Dashboards

Dashboards display query results as visualizations. Widget types:

| Type | Purpose | Example |
|------|---------|---------|
| `chart` | Line, bar, or area charts | Weekly lead trends |
| `metric` | Single number with optional comparison | Total leads this week |
| `table` | Tabular data display | Lead breakdown by status |

Dashboard config is stored as JSON in the database. The agent handles all configuration—just describe what you want.

**Important:** Snowflake returns UPPERCASE column names. When describing widgets, use `WEEK` not `week`.

### Reports

Reports are markdown documents with linked queries. Use them for:
- Investigation findings
- Analysis documentation
- Shareable insights

Reports store their content in the database and display in the web app with formatting.

## Authentication

### Local Development

Set `BYPASS_AUTH=true` in `.env` to skip authentication locally.

### Web Dashboard Access

The hosted dashboard uses passcode authentication:

1. Generate a passcode: `/passcode` or `npm run passcode generate`
2. A browser opens for Snowflake SSO verification
3. Save the displayed passcode (shown only once)
4. Use it to sign in at the web dashboard

Passcodes are bcrypt-hashed—lost passcodes cannot be recovered. Generate a new one if needed.

## Project Structure

```
rippling-os-2/
├── web/                    # Next.js dashboard app
├── prisma/
│   └── schema.prisma       # Database models
├── lib/
│   └── db.ts               # Shared Prisma client
├── scripts/
│   └── run-query.ts        # Query execution CLI
├── local-queries/          # SQL files synced from saved queries (gitignored)
├── services/
│   └── snowflake-config.yaml
└── .cursor/
    ├── mcp.json            # MCP server config (generated)
    ├── rules/              # Agent safety guardrails
    └── skills/             # Cursor skills (commands)
```

## Database Models

| Model | Purpose |
|-------|---------|
| `User` | Rippling employees (by email) |
| `Project` | Analysis containers |
| `ProjectShare` | Sharing permissions |
| `Dashboard` | Dashboard configs (JSON) |
| `Query` | Saved SQL with results |
| `QueryResult` | Latest execution results |
| `Report` | Markdown reports |
| `Passcode` | Authentication codes |

## URL Routes

| Route | Description |
|-------|-------------|
| `/` | Home - list all projects |
| `/projects/[slug]` | Project overview |
| `/projects/[slug]/dashboards/[name]` | Dashboard view |
| `/projects/[slug]/reports/[name]` | Report view |
| `/projects/[slug]/queries/[name]` | Query details |

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Postgres connection string |
| `POSTGRES_URL` | Postgres connection string (for Vercel) |
| `PRISMA_DATABASE_URL` | Prisma Accelerate URL |
| `AUTH_SECRET` | Session encryption key |
| `RIPPLING_ACCOUNT_EMAIL` | Your Rippling email for Snowflake |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `BYPASS_AUTH` | `false` | Skip auth in local dev |
| `SNOWFLAKE_ACCOUNT` | `RIPPLINGORG-RIPPLING` | Snowflake account |
| `SNOWFLAKE_DATABASE` | `PROD_RIPPLING_DWH` | Database |
| `SNOWFLAKE_ROLE` | `PROD_RIPPLING_MARKETING` | Role |
| `SNOWFLAKE_WAREHOUSE` | `PROD_RIPPLING_INTEGRATION_DWH` | Warehouse |
| `NEXT_PUBLIC_APP_URL` | - | Production URL for share links |

## Snowflake Integration

### MCP Server

The Snowflake MCP (Model Context Protocol) server enables direct database access from Cursor.

**Setup:**
1. Run `/setup` to generate MCP config
2. Restart Cursor to load the server
3. First query opens browser for SSO
4. Tokens are cached afterward

**MCP vs `/query`:**

| Use Case | Tool | Output |
|----------|------|--------|
| Quick exploration | MCP direct | Results inline |
| Dashboard data | `/query` | Saves to database |

### VSCode Snowflake Extension

Install the [Snowflake VSCode Extension](https://marketplace.visualstudio.com/items?itemName=snowflake.snowflake-vsc) for:
- SQL IntelliSense and autocomplete
- Schema browsing
- Direct query execution

Saved queries sync to `local-queries/` so you can run them in the extension.

### Shared Configuration

Both tools can share credentials via `~/.snowflake/connections.toml`:

```toml
[rippling]
account = "RIPPLINGORG-RIPPLING"
user = "your.email@rippling.com"
authenticator = "externalbrowser"
database = "PROD_RIPPLING_DWH"
schema = "MARKETING_OPS"
warehouse = "PROD_RIPPLING_INTEGRATION_DWH"
role = "PROD_RIPPLING_MARKETING"
```

## Safety Rules

- Never run DELETE, UPDATE, DROP, or TRUNCATE queries
- Always use LIMIT when exploring data
- Filter by `is_deleted = FALSE` where applicable
- Never commit secrets or credentials to Git

## Development

### Running Locally

```bash
# Install dependencies
npm install
npm install --prefix web

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

### Running Queries via CLI

```bash
# Temp query (not saved)
npm run query -- --project my-analysis --sql query.sql --temp

# Save to dashboard
npm run query -- --project my-analysis --name weekly_leads --sql query.sql --dashboard main

# Save to report
npm run query -- --project my-analysis --name findings_01 --sql query.sql --report findings
```

### Updating the Database Schema

After modifying `prisma/schema.prisma`:

```bash
npx prisma db push
npx prisma generate
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "tsx/sandbox error" | Request `all` permissions in Cursor |
| "Cannot connect to Snowflake" | SSO expired—browser will open for re-auth |
| "User not found" | Run `/setup` to create your user |
| "Project not found" | Run `/create-project` first |
| Widget not showing data | Check column names are UPPERCASE |
| Lost passcode | Generate new one with `/passcode` |

## Contributing

1. Work on `main` branch (user data is isolated via database, not branches)
2. Pull latest: `/update-os`
3. Make changes
4. Test locally with `/start`
