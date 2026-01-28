# Rippling OS 2.0 - Agent Build Prompt

**Instructions:** Copy this entire file as context when starting a new Cursor agent in plan mode to build Rippling OS 2.0.

---

## 1. Project Overview

You are building **Rippling OS 2.0**, a hybrid Cursor + web application system that enables Rippling's Growth team to explore Snowflake data with AI assistance and share insights through interactive dashboards.

### Problem Being Solved

- Growth Managers need to query Snowflake and generate insights
- Current `rippling-os` repo is messy and unsafe to share broadly
- Target users are semi-technical (comfortable with SQL, not with Git/IDE)
- Outputs should be interactive web dashboards, not markdown files

### Key Users

- **Growth Managers at Rippling**
  - Semi-technical, comfortable writing SQL
  - Not comfortable with Git or IDE workflows
  - Need to create, save, iterate on, and share analyses

### Core Value Proposition

Enable users to:
1. Ask plain-English business questions and get executed Snowflake queries
2. View results as interactive web dashboards
3. Save and share work without understanding Git
4. Learn from others' approved queries and dashboards

---

## 2. Architecture Overview

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER WORKFLOW                             │
│  Growth Manager → Cursor IDE → Skills → Git/Snowflake           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      GITHUB REPOSITORY                           │
│  main branch ←──────────────────────────→ user/[name] branches  │
│  (approved content)                        (personal work)       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL DEPLOYMENT                             │
│  Production (main) ←────────────────────→ Preview (per branch)  │
│  growth-os.vercel.app                      growth-os-user-will.vercel.app
└─────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Per-user branches** - Each user works on their own branch, abstracting Git complexity
2. **Web-rendered outputs** - Dashboards/reports are web pages, not markdown
3. **Skills as commands** - `/setup`, `/save`, etc. hide Git operations
4. **Global vs Personal context** - Shared knowledge on main, personal on user branches

---

## 3. Repository Structure

Create the following structure:

```
rippling-os-2/
├── .cursor/
│   └── rules/                      # Cursor rules (auto-applied)
│       ├── global.mdc              # Always-applied rules
│       └── snowflake.mdc           # SQL query rules
├── web/                            # Next.js application
│   ├── app/                        # App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Home/landing
│   │   ├── projects/
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Project view
│   │   ├── dashboards/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Dashboard view
│   │   └── api/
│   │       ├── query/
│   │       │   └── route.ts        # Snowflake query execution
│   │       └── git/
│   │           └── route.ts        # Git operations
│   ├── components/
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── dashboard/              # Dashboard components
│   │   │   ├── Chart.tsx
│   │   │   ├── DataTable.tsx
│   │   │   └── MetricCard.tsx
│   │   └── layout/
│   │       ├── Sidebar.tsx
│   │       ├── Header.tsx
│   │       └── Navigation.tsx
│   ├── lib/
│   │   ├── snowflake.ts            # Snowflake client
│   │   ├── github.ts               # GitHub API client
│   │   └── utils.ts                # Utilities
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── context/
│   ├── global/                     # Shared context (committed to main)
│   │   ├── schemas/                # Database schema docs
│   │   │   ├── OUTREACH_TABLES.md
│   │   │   ├── SFDC_TABLES.md
│   │   │   └── SNOWFLAKE_TABLES.md
│   │   ├── sql-patterns/           # Reusable SQL patterns
│   │   │   ├── analyze_opp.sql
│   │   │   └── get_sequence_type.sql
│   │   └── definitions/            # Metric definitions
│   │       └── PIPELINE_METRICS.md
│   └── personal/                   # Per-user context (gitignored)
│       └── .gitkeep
├── projects/
│   ├── _approved/                  # Merged/approved projects
│   │   └── .gitkeep
│   └── _templates/                 # Project templates
│       └── basic-analysis/
│           ├── README.md
│           └── queries/
├── skills/                         # Cursor skills
│   ├── setup/
│   │   └── SKILL.md                # /setup command
│   ├── save/
│   │   └── SKILL.md                # /save command
│   ├── update-os/
│   │   └── SKILL.md                # /update-os command
│   ├── create-project/
│   │   └── SKILL.md                # /create-project command
│   ├── ingest-context/
│   │   └── SKILL.md                # /ingest-context command
│   └── query-snowflake/
│       └── SKILL.md                # Snowflake query skill
├── scripts/
│   └── setup-branch.sh             # Branch setup script
├── .gitignore
├── .env.example
├── README.md
└── package.json                    # Root package.json for scripts
```

---

## 4. Core Features to Build

### 4.1 Next.js Web Application

**Purpose:** Render dashboards and reports as web pages accessible per branch.

**Requirements:**
- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS + shadcn/ui components
- Branch-aware routing (detect which branch is deployed)
- Responsive, modern UI

**Key Pages:**
1. **Home** (`/`) - List of available projects and dashboards
2. **Project View** (`/projects/[slug]`) - Individual project page
3. **Dashboard View** (`/dashboards/[id]`) - Interactive dashboard

**API Routes:**
1. `POST /api/query` - Execute Snowflake queries
2. `GET /api/projects` - List projects for current branch
3. `POST /api/git/save` - Commit and push changes

### 4.2 Cursor Skills System

Create skills that abstract Git complexity:

#### `/setup` Skill
```
Trigger: User says "setup", "/setup", or starts fresh
Actions:
1. Check if user branch exists (user/[email-prefix])
2. If not, create branch from main
3. Push initial commit
4. Output welcome message with preview URL
```

#### `/save` Skill
```
Trigger: User says "save", "/save", "commit"
Actions:
1. Stage all changes
2. Generate commit message from changes
3. Commit and push to user branch
4. Output confirmation with preview URL
```

#### `/update-os` Skill
```
Trigger: User says "update", "/update-os", "sync"
Actions:
1. Fetch latest main
2. Rebase user branch onto main
3. Handle conflicts if any
4. Push updated branch
```

#### `/create-project` Skill
```
Trigger: User says "create project", "/create-project [name]"
Actions:
1. Create project folder from template
2. Initialize with README and query folder
3. Add to navigation
4. Output instructions for next steps
```

### 4.3 Snowflake Integration

**Connection Details:**
- Account: `rippling`
- Authentication: External browser (SSO)
- Default Database: `PROD_RIPPLING_DWH`
- Default Role: `PROD_RIPPLING_MARKETING`
- Default Warehouse: `PROD_RIPPLING_DWH`

**Implementation Options:**
1. **Server-side API route** (recommended) - Use `snowflake-sdk` in Next.js API routes
2. **External service** - Proxy through a Python service

### 4.4 Dashboard Rendering

Dashboards should be defined as JSON/YAML configurations:

```yaml
# projects/my-analysis/dashboard.yaml
title: "Pipeline Analysis Q1 2026"
layout: grid
widgets:
  - type: metric
    title: "Total S1"
    query: queries/total_s1.sql
    format: number
  - type: chart
    title: "S1 by Week"
    query: queries/s1_by_week.sql
    chartType: line
  - type: table
    title: "Top Sequences"
    query: queries/top_sequences.sql
```

The web app reads these configs and renders interactive components.

---

## 5. Guardrails and Safety

### Cursor Rules (create in `.cursor/rules/`)

**global.mdc:**
```markdown
# Global Rules

## Branch Safety
- NEVER commit directly to main
- ALWAYS work on user branch
- NEVER delete other users' branches

## File Safety
- NEVER modify files outside your project folder
- NEVER edit context/global/ without explicit approval
- NEVER commit credentials or secrets

## Query Safety
- ALWAYS use LIMIT when exploring data
- NEVER run DELETE/UPDATE/DROP statements
- ALWAYS filter by is_deleted = FALSE
```

**snowflake.mdc:**
```markdown
# Snowflake Query Rules

## S1/S2 Definitions
- S1: ANY opportunity (is_deleted = FALSE)
- S2: Opportunities with sqo_qualified_date_c IS NOT NULL
- NEVER filter S1 by stage name

## Join Patterns
- Use data_connection with dc.type IN ('Contact', 'Lead')
- Always include _fivetran_deleted = FALSE

## Attribution
- Default window: 45 days
- Use sequence_state.created_at for timing
```

### Git Hooks

Create pre-commit hooks that:
1. Prevent commits to main branch
2. Validate no secrets in commit
3. Check for large files

---

## 6. Context Resources

The `exported-resources/` folder contains critical context from the original rippling-os repo:

### Schema Documentation
- `schemas/OUTREACH_TABLES.md` - Outreach.io schema (sequences, mailings, prospects)
- `schemas/SFDC_TABLES.md` - Salesforce schema (opportunities, contacts, leads)
- `schemas/SNOWFLAKE_TABLES.md` - Common Snowflake tables index
- `schemas/PIPELINE_METRICS_DEFINITIONS.md` - S1/S2 definitions, attribution windows

### SQL Patterns
- `sql-functions/analyze_opp.sql` - Opportunity attribution analysis
- `sql-functions/get_sequence_type.sql` - Sequence classification
- `sql-functions/get_sequence_volume.sql` - Sequence volume metrics

### Python Reference
- `python-clients/snowflake_executor.py` - Snowflake execution patterns
- `python-clients/query_runner.py` - CLI query runner

### Domain Skills
- `skills/suppression-investigation/` - How to investigate suppression logic
- `skills/suppression-impact-report/` - How to generate impact reports
- `skills/create-fix-doc/` - How to document fixes for other repos

**IMPORTANT:** Copy relevant content from `exported-resources/` into `context/global/` when setting up the new repo.

---

## 7. Implementation Priorities

### Phase 1: Foundation
1. Initialize repository structure
2. Create Next.js app with basic pages
3. Set up Tailwind + shadcn/ui
4. Implement basic Cursor rules

### Phase 2: Core Skills
1. Build `/setup` skill
2. Build `/save` skill
3. Test branch creation/push flow

### Phase 3: Web Features
1. Build dashboard rendering system
2. Implement Snowflake API route
3. Create basic chart/table components

### Phase 4: Polish
1. Build `/create-project` skill
2. Add project templates
3. Implement `/update-os` skill
4. Add navigation and home page

---

## 8. Environment Variables

Create `.env.example`:

```bash
# Snowflake
SNOWFLAKE_ACCOUNT=rippling
SNOWFLAKE_USER=your.email@rippling.com
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_DWH
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH

# GitHub (for branch operations)
GITHUB_TOKEN=ghp_...
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=rippling-os-2

# Vercel (auto-injected)
VERCEL_GIT_COMMIT_REF=  # Current branch
VERCEL_URL=             # Preview URL
```

---

## 9. Key Technical Decisions

### Use App Router (not Pages Router)
- Better for layouts and loading states
- Built-in support for React Server Components
- Modern Next.js standard

### Use shadcn/ui
- Copy-paste components (no npm package lock-in)
- Highly customizable
- Works great with Tailwind

### Dashboard as Config
- Declarative dashboard definitions (YAML/JSON)
- Separation of data (SQL) and presentation (config)
- Easy to version control

### Branch-based Deployment
- Vercel auto-deploys preview URLs per branch
- Each user gets their own preview environment
- Main branch = production

---

## 10. Success Criteria

The system is complete when:

1. [ ] A new user can run `/setup` and get a working branch
2. [ ] User can query Snowflake through Cursor and see results
3. [ ] User can create a dashboard that renders in web UI
4. [ ] User can run `/save` and see changes in preview URL
5. [ ] User can run `/update-os` to sync with main
6. [ ] Global context is shared; personal context is isolated
7. [ ] No Git knowledge required for basic workflows

---

## 11. Getting Started

When you receive this prompt:

1. **Read the exported-resources folder** - Understand the schema docs and SQL patterns
2. **Create the repository structure** - Follow Section 3
3. **Initialize Next.js** - Set up the web app with required dependencies
4. **Build skills in order** - Start with `/setup`, then `/save`
5. **Test end-to-end** - Verify a complete user workflow

Ask clarifying questions if any requirements are unclear.
