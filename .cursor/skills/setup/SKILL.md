---
name: setup
description: Complete repository setup including environment, dependencies, and database connection. Use when the user says "/setup", needs initial configuration, or the repo hasn't been set up yet.
---

# /setup - Complete Repository Setup

Set up everything needed to work in Rippling OS: environment, dependencies, and database connection.

**Skill directory**: `.cursor/skills/setup`

## Before You Start

**If `.env` exists with valid URLs, setup may not be needed.** Ask the user what issue they're trying to solve.

| Check | Why |
|-------|-----|
| Is `.env` already configured? | Don't overwrite existing config |
| Does user have database URLs? | They need these from admin/Vercel |
| Does user have Snowflake access? | They'll need to SSO authenticate |

## Quick Status Check

Run the verification script to see what needs setup:

```bash
bash .cursor/skills/setup/scripts/verify-setup.sh
```

## Workflow

### Step 1: Environment Setup

If `.env` is missing:

```bash
cp .env.template .env
ln -sf ../.env web/.env
```

Required variables:
- `DATABASE_URL`, `POSTGRES_URL`, `PRISMA_DATABASE_URL` - From Vercel/Prisma Postgres
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `BYPASS_AUTH=true` - For local development

For Snowflake, use EITHER `RIPPLING_ACCOUNT_EMAIL` in `.env` OR `~/.snowflake/connections.toml`.

See [env-reference.md](env-reference.md) for full details.

### Step 2: Install Dependencies

```bash
npm install
npm install --prefix web
```

### Step 3: Generate Prisma Client

```bash
npx prisma generate
```

### Step 4: Create User in Database

```bash
npx tsx .cursor/skills/setup/scripts/create-user.ts
```

This validates the git email is `@rippling.com` and creates the user if needed.

### Step 5: Test Snowflake Connection

```bash
npm run query -- --project example-analysis --name test --sql /dev/stdin <<< "SELECT CURRENT_USER() LIMIT 1"
```

**First time:** A browser window opens for Okta/SSO login. Complete the login - tokens are cached afterward.

**Agent permissions:** The agent MUST request `all` permissions. Tell the user to approve the permission prompt.

### Step 6: Create Example Project

```bash
npx tsx .cursor/skills/setup/scripts/create-example-project.ts
```

Creates `example-{username}` with sample queries and dashboard.

### Step 7: Output Summary

```
Setup complete!

What was configured:
  [✓] Environment: .env file configured
  [✓] Dependencies: root & web node_modules installed
  [✓] Prisma: Client generated
  [✓] User: {email} (auto-created in database)
  [✓] Snowflake: Connection tested
  [✓] Example Project: example-{username} created

Next steps:
  1. /start           - Launch the dashboard
  2. /query           - Run SQL queries
  3. /create-project  - Start a new analysis

View your example at: /projects/example-{username}
```

## Partial Setup

Skip steps that are already complete:

| State | Action |
|-------|--------|
| `.env` exists with DATABASE_URL | Skip Step 1 |
| `node_modules/` exists | Skip npm install in Step 2 |
| `web/node_modules/` exists | Skip web install in Step 2 |
| `.prisma` client exists | Skip Step 3 |
| User already in database | Skip Step 4 |
| SSO token cached | Skip Step 5 |
| Example project exists | Skip Step 6 |

## Branch Policy

Everyone works on `main` branch. User data is isolated in the database, not via git branches.

If user is on a `user/*` branch:
```bash
git checkout main
git pull origin main
```

## Troubleshooting

See [env-reference.md](env-reference.md) for error handling and configuration details.
