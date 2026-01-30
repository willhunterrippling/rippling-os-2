---
name: setup
description: Complete repository setup including environment, dependencies, and database connection. Use when the user says "/setup", needs initial configuration, or the repo hasn't been set up yet.
---

# /setup - Complete Repository Setup

Set up everything needed to work in Rippling OS: environment, dependencies, and database connection.

## STOP - Verify Before Proceeding

**Check these BEFORE running setup:**

| Check | Why |
|-------|-----|
| Is `.env` already configured? | Don't overwrite existing config |
| Does user have database URLs? | They need these from admin/Vercel |
| Does user have Snowflake access? | They'll need to SSO authenticate |

**If `.env` exists with valid URLs, setup may not be needed.** Ask the user what issue they're trying to solve.

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
   - `POSTGRES_URL` - **Required** for Prisma migrations (same as DATABASE_URL)
   - `PRISMA_DATABASE_URL` - **Required** for Prisma Accelerate connection
   - `AUTH_SECRET` - **Required** for NextAuth session encryption
   - `RIPPLING_ACCOUNT_EMAIL` - Required for Snowflake SSO
4. If database URLs are missing:
   - Tell user: "You need database URLs from Vercel/Prisma Postgres. Contact the admin for the connection strings."
   - All three URLs come from the Vercel dashboard when you connect Prisma Postgres
5. If `AUTH_SECRET` is missing:
   - Generate one: `openssl rand -base64 32`
   - Add to `.env`
6. Ensure `BYPASS_AUTH=true` is set for local development (skips email magic link auth)
7. If `RIPPLING_ACCOUNT_EMAIL` is missing:
   - Ask user for their Rippling email
   - Update `.env`
8. Create symlink for Next.js to read `.env`:
   ```bash
   ln -sf ../.env web/.env
   ```

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

### Step 5: Test Snowflake Connection

Before proceeding, verify Snowflake connectivity works. This is critical because:
- The query runner uses `externalbrowser` SSO (opens a browser for Okta login)
- First-time auth requires human interaction to complete the SSO flow
- SSO tokens are cached after the first successful login

**Run a test query:**

```bash
npm run query -- --project example-analysis --name test_connection --sql /dev/stdin <<< "SELECT CURRENT_USER(), CURRENT_ROLE(), CURRENT_DATABASE() LIMIT 1"
```

**What happens:**
1. A browser window opens for Okta/SSO authentication
2. User completes SSO login
3. Token is cached locally for future queries
4. Query executes and shows results

**If the user is using Cursor agent to run queries:**
- The agent MUST request `all` permissions when running `npm run query`
- User should **approve** the permission prompt when it appears
- Without permissions, the agent cannot connect to Snowflake or run tsx scripts

**Important:** Tell the user:
> "When the Cursor agent runs queries, you'll see a permission prompt asking for 'all' access. You need to approve this for Snowflake queries to work. The first time you run a query, a browser window will open for Okta login."

### Step 6: Create Example Project

Create a starter example project to help the user get familiar with the system:

1. Check if user already has an example project (slug: `example-[username]`)
2. If not, create one with sample queries and dashboard widgets

```typescript
// Get username from email (before @)
const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
const exampleSlug = `example-${username}`;
const exampleName = `Example Project (${username})`;

// Check if already exists
const existing = await prisma.project.findUnique({
  where: { slug: exampleSlug },
});

if (!existing) {
  // Create the example project
  const project = await prisma.project.create({
    data: {
      slug: exampleSlug,
      name: exampleName,
      description: 'A starter project with example queries and dashboard widgets',
      ownerId: user.id,
    },
  });

  // Create example queries
  const metricsQuery = await prisma.query.create({
    data: {
      projectId: project.id,
      name: 'pipeline_metrics',
      sql: `-- Pipeline metrics overview
SELECT
    COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END) as total_opportunities,
    COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) as qualified_opportunities,
    ROUND(
        COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) * 100.0 /
        NULLIF(COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END), 0),
        1
    ) as conversion_rate
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND created_date >= DATEADD(day, -30, CURRENT_DATE())
LIMIT 1;`,
    },
  });

  const weeklyTrendQuery = await prisma.query.create({
    data: {
      projectId: project.id,
      name: 'weekly_trend',
      sql: `-- Weekly opportunity creation trend
SELECT
    DATE_TRUNC('week', created_date) as week,
    COUNT(DISTINCT id) as new_opportunities
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND created_date >= DATEADD(day, -90, CURRENT_DATE())
GROUP BY DATE_TRUNC('week', created_date)
ORDER BY week DESC
LIMIT 12;`,
    },
  });

  // Create dashboard with widgets referencing the queries
  // NOTE: Use UPPERCASE keys to match Snowflake column names
  await prisma.dashboard.create({
    data: {
      projectId: project.id,
      name: 'main',
      config: {
        title: exampleName,
        widgets: [
          {
            type: 'metric',
            queryName: 'pipeline_metrics',
            title: 'Total Opportunities (30d)',
            valueKey: 'TOTAL_OPPORTUNITIES',
          },
          {
            type: 'metric',
            queryName: 'pipeline_metrics',
            title: 'Qualified (30d)',
            valueKey: 'QUALIFIED_OPPORTUNITIES',
          },
          {
            type: 'metric',
            queryName: 'pipeline_metrics',
            title: 'Conversion Rate',
            valueKey: 'CONVERSION_RATE',
            suffix: '%',
          },
          {
            type: 'chart',
            queryName: 'weekly_trend',
            title: 'Weekly New Opportunities',
            chartType: 'bar',
            xKey: 'WEEK',
            yKey: 'NEW_OPPORTUNITIES',
          },
        ],
      },
    },
  });

  console.log('Created example project:', exampleSlug);
}
```

### Step 7: Output Summary

```
✅ Setup complete!

What was configured:
  [✓] Environment: .env file configured
  [✓] Dependencies: root & web node_modules installed
  [✓] Prisma: Client generated
  [✓] User: will.smith@rippling.com (auto-created in database)
  [✓] Snowflake: Connection tested (SSO token cached)
  [✓] Example Project: example-will-smith created with sample queries

Next steps:
  1. /start           - Launch the dashboard and explore your example project
  2. /query           - Run SQL queries against Snowflake
  3. /create-project  - Start a new analysis project

Your example project includes:
  - Sample pipeline metrics query
  - Weekly trend query
  - Dashboard with metric cards and chart

View it at: /projects/example-will-smith
```

**IMPORTANT for Cursor Agents:**
When the agent runs `/query`, it needs full system access. You'll see a permission prompt - approve it to allow Snowflake queries to work.

## Partial Setup

If some steps are already complete, skip them and only run what's needed:

| State | Action |
|-------|--------|
| `.env` exists with DATABASE_URL | Skip Step 1 |
| `node_modules/` exists | Skip root install in Step 2 |
| `web/node_modules/` exists | Skip web install in Step 2 |
| `.prisma` client exists | Skip Step 3 |
| User already in database | Skip user creation in Step 4 |
| SSO token already cached | Skip Step 5 (test query) |
| Example project exists | Skip example project creation in Step 6 |

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
DATABASE_URL=postgres://...          # From Vercel/Prisma Postgres
POSTGRES_URL=postgres://...          # Same as DATABASE_URL (for migrations)
PRISMA_DATABASE_URL=prisma+postgres://...  # Prisma Accelerate URL
AUTH_SECRET=...                      # Generate with: openssl rand -base64 32
RIPPLING_ACCOUNT_EMAIL=you@rippling.com  # For Snowflake SSO
BYPASS_AUTH=true                     # For local development (skip magic link auth)
```

For production (Vercel):
```
AUTH_RESEND_KEY=re_...               # For magic link emails (from Resend dashboard)
```

Optional (have defaults):
```
SNOWFLAKE_ACCOUNT=RIPPLINGORG-RIPPLING
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_INTEGRATION_DWH
```

**Note:** The `.env` file must be symlinked to `web/.env` for Next.js to load it:
```bash
ln -sf ../.env web/.env
```

## User Creation Script

For auto-creating the user, you can run this inline:

```bash
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

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

## Example Project Creation Script

For creating the example project with sample queries:

```bash
npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
});

async function createExampleProject() {
  const email = execSync('git config user.email', { encoding: 'utf-8' }).trim();
  if (!email.endsWith('@rippling.com')) {
    console.error('Error: Git email must be @rippling.com');
    process.exit(1);
  }
  
  const user = await prisma.user.upsert({
    where: { email },
    create: { email },
    update: {},
  });
  
  const username = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase();
  const exampleSlug = 'example-' + username;
  const exampleName = 'Example Project (' + username + ')';
  
  const existing = await prisma.project.findUnique({
    where: { slug: exampleSlug },
  });
  
  if (existing) {
    console.log('Example project already exists:', exampleSlug);
    await prisma.\$disconnect();
    return;
  }
  
  const project = await prisma.project.create({
    data: {
      slug: exampleSlug,
      name: exampleName,
      description: 'A starter project with example queries and dashboard widgets',
      ownerId: user.id,
    },
  });
  
  await prisma.query.create({
    data: {
      projectId: project.id,
      name: 'pipeline_metrics',
      sql: \`SELECT
    COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END) as total_opportunities,
    COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) as qualified_opportunities,
    ROUND(
        COUNT(DISTINCT CASE WHEN sqo_qualified_date_c IS NOT NULL AND is_deleted = FALSE THEN id END) * 100.0 /
        NULLIF(COUNT(DISTINCT CASE WHEN is_deleted = FALSE THEN id END), 0),
        1
    ) as conversion_rate
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND created_date >= DATEADD(day, -30, CURRENT_DATE())
LIMIT 1;\`,
    },
  });
  
  await prisma.query.create({
    data: {
      projectId: project.id,
      name: 'weekly_trend',
      sql: \`SELECT
    DATE_TRUNC('week', created_date) as week,
    COUNT(DISTINCT id) as new_opportunities
FROM prod_rippling_dwh.sfdc.opportunity
WHERE is_deleted = FALSE
  AND _fivetran_deleted = FALSE
  AND created_date >= DATEADD(day, -90, CURRENT_DATE())
GROUP BY DATE_TRUNC('week', created_date)
ORDER BY week DESC
LIMIT 12;\`,
    },
  });
  
  // NOTE: Use UPPERCASE keys to match Snowflake column names
  await prisma.dashboard.create({
    data: {
      projectId: project.id,
      name: 'main',
      config: {
        title: exampleName,
        widgets: [
          { type: 'metric', queryName: 'pipeline_metrics', title: 'Total Opportunities (30d)', valueKey: 'TOTAL_OPPORTUNITIES' },
          { type: 'metric', queryName: 'pipeline_metrics', title: 'Qualified (30d)', valueKey: 'QUALIFIED_OPPORTUNITIES' },
          { type: 'metric', queryName: 'pipeline_metrics', title: 'Conversion Rate', valueKey: 'CONVERSION_RATE', suffix: '%' },
          { type: 'chart', queryName: 'weekly_trend', title: 'Weekly New Opportunities', chartType: 'bar', xKey: 'WEEK', yKey: 'NEW_OPPORTUNITIES' },
        ],
      },
    },
  });
  
  console.log('Created example project:', exampleSlug);
  console.log('View at: /projects/' + exampleSlug);
  await prisma.\$disconnect();
}

createExampleProject().catch(e => {
  console.error(e);
  process.exit(1);
});
"
```
