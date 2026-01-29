# /setup - Complete Repository Setup

Set up everything needed to work in Rippling OS: environment, dependencies, and personal branch.

## Trigger

User says "setup", "/setup", or the onboarding rule detects a fresh repo.

## Pre-Setup Checks

Run these checks first to determine what needs to be done:

```bash
# Check for .env file
test -f .env && echo "ENV_EXISTS" || echo "ENV_MISSING"

# Check for node_modules
test -d node_modules && echo "DEPS_EXISTS" || echo "DEPS_MISSING"

# Check current branch
git branch --show-current
```

## Workflow

### Step 1: Environment Setup (if `.env` missing)

1. Check if `.env` exists
2. If missing:
   ```bash
   cp .env.template .env
   ```
3. Ask the user for their Rippling email address
4. Update the `.env` file with their email:
   ```
   RIPPLING_ACCOUNT_EMAIL=their.email@rippling.com
   ```

### Step 2: Install Dependencies (if `node_modules/` missing)

1. Check if `node_modules/` exists
2. If missing, run:
   ```bash
   npm install
   ```
3. Wait for installation to complete

### Step 3: Branch Setup (if not on `user/*` branch)

1. **Get User Email**
   - Read from `RIPPLING_ACCOUNT_EMAIL` in `.env` file
   - Should already be set from Step 1

2. **Extract Branch Name**
   - Take the prefix before `@` (e.g., `will.smith` from `will.smith@rippling.com`)
   - Branch name format: `user/[email-prefix]`

3. **Check Branch Existence**
   ```bash
   git fetch origin
   git branch -r | grep "origin/user/[email-prefix]"
   ```

4. **Create or Switch to Branch**
   - If branch doesn't exist:
     ```bash
     git checkout main
     git pull origin main
     git checkout -b user/[email-prefix]
     git push -u origin user/[email-prefix]
     ```
   - If branch exists:
     ```bash
     git fetch origin
     git checkout user/[email-prefix]
     git pull origin user/[email-prefix]
     ```

### Step 4: Output Summary

Show what was done and the final state:

```
✅ Setup complete!

What was configured:
  [✓] Environment: .env file created
  [✓] Dependencies: node_modules installed  
  [✓] Branch: user/[email-prefix]

Your details:
  Branch:      user/[email-prefix]
  Preview URL: https://rippling-os-2-git-user-[email-prefix]-ripplings-projects.vercel.app

Next steps:
  1. /create-project  - Start a new analysis
  2. /query           - Run SQL queries  
  3. /start           - Launch the dashboard
  4. /save            - Commit your work
```

## Partial Setup

If some steps are already complete, skip them and only run what's needed:

| State | Action |
|-------|--------|
| `.env` exists | Skip Step 1 |
| `node_modules/` exists | Skip Step 2 |
| Already on `user/*` branch | Skip Step 3 |

Show checkmarks for completed items in the summary.

## Shell Script Alternative

For branch setup only: `./scripts/setup-branch.sh`

## Error Handling

| Error | Solution |
|-------|----------|
| `.env.template` doesn't exist | Create `.env` manually with `RIPPLING_ACCOUNT_EMAIL` |
| `npm install` fails | Check Node.js is installed, try `npm cache clean --force` |
| Git push fails | Check git credentials, ensure repo access |
| Branch already exists locally | Run `git checkout user/[name]` directly |

## Environment Variables Reference

Required in `.env`:
```
RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com
```

Optional (have defaults in code):
```
SNOWFLAKE_ACCOUNT=RIPPLINGORG-RIPPLING
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_INTEGRATION_DWH
```
