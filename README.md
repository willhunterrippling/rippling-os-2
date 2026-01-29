# Rippling OS 2.0

AI-assisted Snowflake querying and interactive dashboard platform for Rippling's Growth team.

## Overview

Rippling OS enables Growth Managers to:
- Query Snowflake data with AI assistance
- View results as interactive web dashboards
- Save and share work without understanding Git
- Learn from others' approved queries and dashboards

## Quick Start

### 1. Setup

Run the setup script (installs dependencies, configures environment):

```bash
./scripts/setup.sh
```

This will:
- Create `.env` from template and prompt for your email
- Install npm dependencies
- Generate MCP configuration

Then restart Cursor to load the Snowflake MCP.

### 2. Create a Project

In Cursor, type `/create-project my-analysis` or manually:

```bash
mkdir -p projects/my-analysis/{dashboards,queries,reports,data}
cp -r projects/_templates/basic-analysis/* projects/my-analysis/
```

### 3. Run Queries

Create a SQL file in `projects/my-analysis/queries/count.sql`, then:

In Cursor, type `/query` or run:

```bash
npm run query -- projects/my-analysis/queries/count.sql
```

Results are saved to `projects/my-analysis/data/count.json`

### 4. Configure Dashboard

Edit `projects/my-analysis/dashboards/main.yaml`:

```yaml
title: "My Analysis"
widgets:
  - type: metric
    title: "Total Count"
    data: data/count.json
    valueKey: count
```

### 5. Save Your Work

In Cursor, type `/save` or run:

```bash
./scripts/save.sh "Add count analysis"
```

### 6. View Dashboard

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000/projects/my-analysis to see the project overview, or go directly to:
- Dashboard: http://localhost:3000/projects/my-analysis/dashboards/main
- Queries: http://localhost:3000/projects/my-analysis/queries/count
- Reports: http://localhost:3000/projects/my-analysis/reports/findings

## Commands

| Command | Description | Script Alternative |
|---------|-------------|-------------------|
| `/setup` | Install dependencies and configure environment | `./scripts/setup.sh` |
| `/save` | Commit and push changes | `./scripts/save.sh` |
| `/update-os` | Sync with main branch | `./scripts/sync.sh` |
| `/create-project` | Create new analysis project | Manual |
| `/query` | Execute SQL and cache results | `npm run query` |

## Snowflake MCP Integration

This repo includes a Snowflake MCP (Model Context Protocol) server for direct database access from Cursor.

### How It Works

1. Run `/setup` (or `./scripts/setup.sh`) to generate your MCP config
2. Restart Cursor to load the Snowflake MCP server
3. On your first query, a browser window opens for Okta SSO authentication
4. After authenticating, you can query Snowflake directly through the AI agent

### MCP vs /query

| Use Case | Tool | Output |
|----------|------|--------|
| Quick exploration ("What's the S1 count?") | MCP direct | Results shown inline |
| Dashboard data ("Add to my dashboard") | `/query` skill | Saves JSON to `data/` folder |

### Prerequisites

The MCP server requires `uv` (Python package manager):

```bash
# Install uv if not already installed
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Configuration

- MCP template: `.cursor/mcp.json.template` (committed to repo)
- MCP config: `.cursor/mcp.json` (generated per-user, gitignored)
- SQL permissions: `services/snowflake-config.yaml`

The MCP reads your `RIPPLING_ACCOUNT_EMAIL` from `.env` and is configured for **read-only access** - SELECT, DESCRIBE, and SHOW queries only.

## Project Structure

```
rippling-os-2/
├── web/                    # Next.js dashboard app
├── projects/               # User analysis projects
│   ├── _templates/         # Project templates
│   └── [project-name]/     # Individual projects
│       ├── dashboards/     # Dashboard YAML configs
│       │   └── main.yaml   # Main dashboard
│       ├── queries/        # SQL files
│       ├── reports/        # Written reports (markdown)
│       ├── data/           # Cached JSON results
│       └── README.md       # Project description
├── context/
│   ├── import/            # Staging folder for /ingest-context
│   ├── global/            # Shared context (docs, schemas, sql-patterns, code, definitions)
│   └── personal/          # Per-user context (gitignored)
├── services/              # MCP service configurations
│   └── snowflake-config.yaml
├── scripts/               # CLI tools
└── .cursor/
    ├── mcp.json           # MCP server registration
    ├── rules/             # Safety guardrails
    └── skills/            # Cursor skills
```

## URL Routes

| Route | Description |
|-------|-------------|
| `/projects/[slug]` | Project overview (folder view) |
| `/projects/[slug]/dashboards/[name]` | View a specific dashboard |
| `/projects/[slug]/queries/[name]` | View SQL query source |
| `/projects/[slug]/reports/[name]` | View a written report |

## Dashboard Widgets

Configure widgets in `dashboards/*.yaml` files:

### Metric
```yaml
- type: metric
  title: "Total S1"
  data: data/s1_count.json
  valueKey: count
```

### Chart (line, bar, area, pie)
```yaml
- type: chart
  title: "S1 by Week"
  data: data/weekly.json
  chartType: line
  xKey: week
  yKey: count
```

### Table
```yaml
- type: table
  title: "Top Sequences"
  data: data/sequences.json
  columns:
    - name
    - sends
    - replies
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RIPPLING_ACCOUNT_EMAIL` | Your Rippling email (required) | - |
| `SNOWFLAKE_ACCOUNT` | Snowflake account | `RIPPLINGORG-RIPPLING` |
| `SNOWFLAKE_DATABASE` | Database | `PROD_RIPPLING_DWH` |
| `SNOWFLAKE_ROLE` | Role | `PROD_RIPPLING_MARKETING` |
| `SNOWFLAKE_WAREHOUSE` | Warehouse | `PROD_RIPPLING_INTEGRATION_DWH` |

## Safety Rules

- Never commit directly to main
- Never run DELETE/UPDATE/DROP queries
- Always use LIMIT when exploring data
- Always filter by `is_deleted = FALSE`

## Development

```bash
# Install dependencies
npm install
cd web && npm install

# Start development server
npm run dev

# Run a query
npm run query -- projects/example/queries/test.sql
```
