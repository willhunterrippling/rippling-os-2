# /setup - Complete Repository Setup

Set up everything needed to work in Rippling OS: environment, dependencies, and database connection.

## Trigger

User says "setup", "/setup", or the onboarding rule detects a fresh repo.

## Pre-Setup Checks

Run these checks first to determine what needs to be done:

```bash
# Check for .env file
test -f .env && echo "ENV_EXISTS" || echo "ENV_MISSING"

# Check for root node_modules
test -d node_modules && echo "ROOT_DEPS_EXISTS" || echo "ROOT_DEPS_MISSING"

# Check for web node_modules
test -d web/node_modules && echo "WEB_DEPS_EXISTS" || echo "WEB_DEPS_MISSING"

# Check for Prisma client
test -d node_modules/.prisma && echo "PRISMA_EXISTS" || echo "PRISMA_MISSING"

# Get git email
git config user.email
```

## Workflow

### Step 1: Environment Setup (if `.env` missing or incomplete)

1. Check if `.env` exists
2. If missing:
   ```bash
   cp .env.template .env
   ```
3. Check for required variables:
   - `DATABASE_URL` - **Required** for database connection
   - `RIPPLING_ACCOUNT_EMAIL` - Required for Snowflake SSO
4. If `DATABASE_URL` is missing:
   - Tell user: "You need a DATABASE_URL from Vercel Postgres. Contact the admin for the connection string."
   - Provide the format: `postgres://user:password@host:5432/database?sslmode=require`
5. Ensure `BYPASS_AUTH=true` is set for local development (skips email magic link auth)
6. If `RIPPLING_ACCOUNT_EMAIL` is missing:
   - Ask user for their Rippling email
   - Update `.env`

### Step 2: Install Dependencies (if any `node_modules/` missing)

1. Check if root `node_modules/` exists
2. If missing, run:
   ```bash
   npm install
   ```
3. Check if `web/node_modules/` exists
4. If missing, run:
   ```bash
   npm install --prefix web
   ```

### Step 3: Generate Prisma Client (if missing)

```bash
npx prisma generate
```

### Step 4: Verify/Create User in Database

1. Get git email:
   ```bash
   git config user.email
   ```

2. Validate email ends with `@rippling.com`:
   - If not: Show error "Your git email must be @rippling.com to use Rippling OS"
   - Tell user to run: `git config user.email "you@rippling.com"`

3. Check if user exists in database and create if not:
   ```typescript
   // Using Prisma in a script or directly
   const user = await prisma.user.upsert({
     where: { email: gitEmail },
     create: { email: gitEmail },
     update: {},
   });
   ```
   
   Note: This can be done by running a simple script or inline with tsx.

### Step 5: Output Summary

```
✅ Setup complete!

What was configured:
  [✓] Environment: .env file configured
  [✓] Dependencies: root & web node_modules installed
  [✓] Prisma: Client generated
  [✓] User: will.smith@rippling.com (auto-created in database)

Next steps:
  1. /create-project  - Start a new analysis
  2. /query           - Run SQL queries
  3. /start           - Launch the dashboard

To view dashboards in browser, visit the web app and sign in 
with your email (one-time magic link for web access).
```

## Partial Setup

If some steps are already complete, skip them and only run what's needed:

| State | Action |
|-------|--------|
| `.env` exists with DATABASE_URL | Skip Step 1 |
| `node_modules/` exists | Skip root install in Step 2 |
| `web/node_modules/` exists | Skip web install in Step 2 |
| `.prisma` client exists | Skip Step 3 |
| User already in database | Skip user creation in Step 4 |

## No More Branches

**Important:** We no longer use user branches. Everyone works on `main` branch. 
User data is isolated in the database, not via git branches.

If user is on a `user/*` branch, suggest:
```
git checkout main
git pull origin main
```

## Error Handling

| Error | Solution |
|-------|----------|
| `.env.template` doesn't exist | Create `.env` manually with DATABASE_URL and RIPPLING_ACCOUNT_EMAIL |
| `DATABASE_URL` not set | Contact admin for Vercel Postgres connection string |
| `npm install` fails | Check Node.js is installed, try `npm cache clean --force` |
| Prisma generate fails | Check DATABASE_URL is valid, try `npx prisma generate --schema=prisma/schema.prisma` |
| Git email not @rippling.com | Run `git config user.email "you@rippling.com"` |
| Database connection fails | Verify DATABASE_URL, check network access |

## Environment Variables Reference

Required in `.env`:
```
DATABASE_URL=postgres://...          # From Vercel Postgres dashboard
RIPPLING_ACCOUNT_EMAIL=you@rippling.com  # For Snowflake SSO
BYPASS_AUTH=true                     # For local development (skip magic link auth)
```

Optional (for auth, only needed for production):
```
AUTH_SECRET=...                      # For NextAuth (generate with: openssl rand -base64 32)
AUTH_RESEND_KEY=re_...               # For magic link emails
```

Optional (have defaults):
```
SNOWFLAKE_ACCOUNT=RIPPLINGORG-RIPPLING
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_INTEGRATION_DWH
```

## User Creation Script

For auto-creating the user, you can run this inline:

```bash
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const prisma = new PrismaClient();
const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
if (!email.endsWith('@rippling.com')) {
  console.error('Error: Git email must be @rippling.com');
  process.exit(1);
}
prisma.user.upsert({
  where: { email },
  create: { email },
  update: {},
}).then(user => {
  console.log('User ready:', user.email);
  prisma.\$disconnect();
}).catch(err => {
  console.error('Error:', err);
  prisma.\$disconnect();
  process.exit(1);
});
"
```
