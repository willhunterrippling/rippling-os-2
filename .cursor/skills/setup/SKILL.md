---
name: setup
description: Complete repository setup including environment, dependencies, and database connection. Use when the user says "/setup", needs initial configuration, or the repo hasn't been set up yet.
---

# /setup - Complete Repository Setup

Set up everything needed to work in Rippling OS: environment, dependencies, and database connection.

**Skill directory**: `.cursor/skills/setup`

## Platform Requirements

**macOS required.** All scripts assume a Unix environment with bash.

## Step 0: Prerequisites (CRITICAL - Agent Cannot Install These)

**IMPORTANT FOR AGENT:** The prerequisites in this step are things you CANNOT install yourself. You must:

1. Run the check script to see what's missing
2. If anything is missing, STOP and guide the user with the install instructions below
3. Wait for the user to confirm they've completed the installation
4. Re-run the check to verify before proceeding to Step 1

**DO NOT** attempt to run `brew install`, `curl | sh`, or any installation commands yourself. These require user permissions and terminal access that you don't have.

### Check Prerequisites

Run this first:

```bash
bash .cursor/skills/setup/scripts/check-prerequisites.sh
```

If any checks fail, show the user the relevant install instructions and **wait for them to confirm completion** before proceeding.

### Required Tools (User Must Install)

| Tool | How User Checks | How User Installs |
|------|-----------------|-------------------|
| Homebrew | `brew --version` | See [brew.sh](https://brew.sh) |
| Node.js 18+ | `node --version` | `brew install node` |
| Git | `git --version` | Usually pre-installed on macOS |
| Python 3.8+ | `python3 --version` | `brew install pyenv` then `pyenv install 3.11.8` |
| uv | `uvx --version` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |

If a tool is missing, tell the user:

> "I can't install [tool] for you because it requires system-level access. Here's what you need to do:
> 
> [Tool] is required for [reason - be specific about what it's used for].
> 
> To install it:
> 1. Open a terminal
> 2. Run: [install command]
> 3. Restart your terminal
> 4. Let me know when it's done and I'll verify"

See [prerequisites.md](prerequisites.md) for detailed installation instructions to share with the user.

### Git Email Configuration

The user's git email **must** be their @rippling.com address. If the check shows a different email:

> "Your git email must be your @rippling.com address. This is mandatory per Rippling policy.
> 
> Run these commands:
> ```
> git config --global user.name "Your Name"
> git config --global user.email "your.name@rippling.com"
> ```
> 
> See: https://rippling.atlassian.net/wiki/spaces/I/pages/5198086415/GitHub+at+Rippling"

### Environment File (.env)

The user needs a complete `.env` file from their admin. If the check shows `.env` is missing:

> "You need a .env file with database credentials. Please ask your admin for the .env file.
> 
> Once you have it:
> 1. Copy the file to the repository root
> 2. Update RIPPLING_ACCOUNT_EMAIL with your email
> 3. Run: `ln -sf ../.env web/.env`
> 4. Let me know when it's done"

### Cursor Settings (User Must Configure)

These settings must be configured by the user in Cursor's preferences.

See [cursor-settings.md](cursor-settings.md) for detailed walkthrough.

**Quick summary of required settings:**
- Web Search Tool: ON
- Auto-Accept Web Search: ON
- Web Fetch Tool: ON
- Auto-Run Mode: "Auto-Run in Sandbox"
- Auto-Run Network Access: "Enabled by Default"
- Allow Git Writes Without Approval: ON
- Fetch Domain Allowlist: add `github.com`, `docs.snowflake.com`
- MCP Tools Protection: OFF

**After Cursor settings changes:** Tell the user they may need to restart Cursor for some settings to take effect.

### Proceeding to Setup

Only proceed to Step 1 when:
- All prerequisite checks pass (run check-prerequisites.sh again to verify)
- User confirms Cursor settings are configured

---

## Before You Start (Step 1+)

**If `.env` exists with valid URLs, setup may not be needed.** Ask the user what issue they're trying to solve.

| Check | Why |
|-------|-----|
| Is `.env` already configured? | Don't overwrite existing config |
| Does user have database URLs? | They need these from admin |
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
