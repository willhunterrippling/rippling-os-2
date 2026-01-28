# Rippling OS 2.0

AI-assisted Snowflake querying and interactive dashboard platform for Rippling's Growth team.

## Overview

Rippling OS enables Growth Managers to:
- Query Snowflake data with AI assistance
- View results as interactive web dashboards
- Save and share work without understanding Git
- Learn from others' approved queries and dashboards

## Quick Start

### 1. Setup Environment

Copy the environment template and add your email:

```bash
cp .env.template .env
# Edit .env and set RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com
```

### 2. Setup Your Branch

In Cursor, type `/setup` or run:

```bash
./scripts/setup-branch.sh
```

This creates your personal branch: `user/your.name`

### 3. Create a Project

In Cursor, type `/create-project my-analysis` or manually:

```bash
mkdir -p projects/my-analysis/{queries,data}
cp projects/_templates/basic-analysis/* projects/my-analysis/
```

### 4. Run Queries

Create a SQL file in `projects/my-analysis/queries/count.sql`, then:

In Cursor, type `/query` or run:

```bash
npm run query -- projects/my-analysis/queries/count.sql
```

Results are saved to `projects/my-analysis/data/count.json`

### 5. Configure Dashboard

Edit `projects/my-analysis/dashboard.yaml`:

```yaml
title: "My Analysis"
widgets:
  - type: metric
    title: "Total Count"
    data: data/count.json
    valueKey: count
```

### 6. Save Your Work

In Cursor, type `/save` or run:

```bash
./scripts/save.sh "Add count analysis"
```

### 7. View Dashboard

Start the development server:

```bash
npm run dev
```

Open http://localhost:3000/projects/my-analysis

## Commands

| Command | Description | Script Alternative |
|---------|-------------|-------------------|
| `/setup` | Create/switch to your user branch | `./scripts/setup-branch.sh` |
| `/save` | Commit and push changes | `./scripts/save.sh` |
| `/update-os` | Sync with main branch | `./scripts/sync.sh` |
| `/create-project` | Create new analysis project | Manual |
| `/query` | Execute SQL and cache results | `npm run query` |

## Project Structure

```
rippling-os-2/
├── web/                    # Next.js dashboard app
├── projects/               # User analysis projects
│   ├── _templates/         # Project templates
│   └── [project-name]/     # Individual projects
│       ├── queries/        # SQL files
│       ├── data/           # Cached JSON results
│       └── dashboard.yaml  # Dashboard config
├── context/
│   ├── global/            # Shared schema docs & SQL patterns
│   └── personal/          # Per-user context (gitignored)
├── scripts/               # CLI tools
└── .cursor/
    ├── rules/             # Safety guardrails
    └── skills/            # Cursor skills
```

## Dashboard Widgets

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
