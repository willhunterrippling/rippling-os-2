# Rippling OS 2.0 - Personal Setup Guide

Step-by-step instructions for setting up the infrastructure for Rippling OS 2.0.

---

## Overview

You'll need to complete three main setup tasks:
1. **GitHub Repository** - Create and configure the repo
2. **Next.js Project** - Initialize or let Cursor create it
3. **Vercel Deployment** - Connect for automatic deployments

---

## 1. GitHub Repository Setup

### 1.1 Create Repository

1. Go to [github.com/new](https://github.com/new)
2. Configure:
   - **Repository name:** `rippling-os-2` (or `growth-data-platform`)
   - **Description:** "Rippling OS 2.0 - Data exploration and dashboard platform"
   - **Visibility:** Private
   - **Initialize:** Check "Add a README file"
   - **Add .gitignore:** Select "Node"
   - **License:** None (private repo)
3. Click "Create repository"

### 1.2 Clone Repository

```bash
# Clone the new repo
git clone git@github.com:YOUR-ORG/rippling-os-2.git
cd rippling-os-2

# Or if using HTTPS
git clone https://github.com/YOUR-ORG/rippling-os-2.git
```

### 1.3 Configure Branch Protection

1. Go to repository **Settings** > **Branches**
2. Click **Add branch protection rule**
3. Configure for `main` branch:

| Setting | Value |
|---------|-------|
| Branch name pattern | `main` |
| Require a pull request before merging | ✅ Enabled |
| Require approvals | 1 (optional for solo use) |
| Require status checks to pass | ✅ Enabled |
| Status checks | Add "Vercel" after connecting |
| Require branches to be up to date | ✅ Enabled |
| Do not allow bypassing settings | ✅ Enabled |
| Allow force pushes | ❌ Disabled |
| Allow deletions | ❌ Disabled |

4. Click **Create**

### 1.4 Branch Naming Convention

Document these conventions in your README:

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| User branches | `user/[name]` | `user/will`, `user/jane` |
| Feature branches | `feature/[name]` | `feature/dashboard-v2` |
| Fix branches | `fix/[name]` | `fix/query-timeout` |

---

## 2. Next.js Project Setup

### Option A: Let Cursor Create It (Recommended)

When you give the AGENT_PROMPT.md to the 2.0 Cursor agent, include:

> "Create a new Next.js 14+ app in the `web/` directory with App Router, TypeScript, and Tailwind CSS."

The agent will run the appropriate `create-next-app` command and configure everything.

### Option B: Manual Creation

If you prefer to set up manually:

```bash
# Navigate to repo root
cd rippling-os-2

# Create Next.js app in web/ directory
npx create-next-app@latest web \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

When prompted:
- Would you like to use TypeScript? **Yes**
- Would you like to use ESLint? **Yes**
- Would you like to use Tailwind CSS? **Yes**
- Would you like to use `src/` directory? **Yes**
- Would you like to use App Router? **Yes**
- Would you like to customize the default import alias? **Yes** (`@/*`)

### 2.1 Install Additional Dependencies

```bash
cd web

# shadcn/ui setup
npx shadcn-ui@latest init

# Select defaults when prompted, or:
# - Style: Default
# - Base color: Slate
# - CSS variables: Yes

# Install common components
npx shadcn-ui@latest add button card table tabs

# Install other dependencies
npm install @octokit/rest     # GitHub API
npm install recharts          # Charts
npm install lucide-react      # Icons
npm install date-fns          # Date utilities
```

### 2.2 Snowflake Integration Options

**Option 1: Node.js SDK (for server-side)**
```bash
npm install snowflake-sdk
```

**Option 2: HTTP API (for serverless)**
- Use Snowflake's REST API through fetch
- Better for Vercel Edge Functions

**Option 3: External Python Service**
- Keep existing Python clients
- Call via API route proxy

### 2.3 Verify Local Development

```bash
cd web
npm run dev
```

Open http://localhost:3000 - you should see the Next.js starter page.

---

## 3. Vercel Setup

### 3.1 Connect Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select your GitHub account and find `rippling-os-2`
4. Click "Import"

### 3.2 Configure Project

| Setting | Value |
|---------|-------|
| Project Name | `rippling-os-2` (or custom) |
| Framework Preset | Next.js |
| Root Directory | `web` |
| Build Command | (leave default) |
| Output Directory | (leave default) |
| Install Command | (leave default) |

### 3.3 Environment Variables

Add these environment variables in Vercel:

**Required:**
```
SNOWFLAKE_ACCOUNT=rippling
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
```

**For GitHub integration (optional, for skills):**
```
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=rippling-os-2
```

**Notes:**
- For `GITHUB_TOKEN`, create a Personal Access Token at [github.com/settings/tokens](https://github.com/settings/tokens)
- Required scopes: `repo` (full control)
- Snowflake credentials may need additional setup for server-side auth (see Snowflake OAuth/Key Pair docs)

### 3.4 Preview Deployments

Vercel automatically creates preview deployments for every branch push:

| Branch | Preview URL |
|--------|-------------|
| `main` | `rippling-os-2.vercel.app` (production) |
| `user/will` | `rippling-os-2-git-user-will-yourorg.vercel.app` |
| `user/jane` | `rippling-os-2-git-user-jane-yourorg.vercel.app` |

This is key to the per-user branch workflow!

### 3.5 Custom Domain (Optional)

1. Go to Project Settings > Domains
2. Add your domain: `growth-os.rippling.com`
3. Configure DNS per Vercel instructions

---

## 4. Post-Setup Verification

### Checklist

- [ ] GitHub repo created at `github.com/YOUR-ORG/rippling-os-2`
- [ ] Branch protection enabled on `main`
- [ ] Local clone works: `git clone ...`
- [ ] Next.js app runs locally: `cd web && npm run dev`
- [ ] Vercel connected to repository
- [ ] Production deployment works (push to main)
- [ ] Preview deployments work (create branch, push)
- [ ] Environment variables set in Vercel

### Test Branch Workflow

```bash
# Create a test user branch
git checkout -b user/test-user
echo "# Test" > test.md
git add test.md
git commit -m "Test commit"
git push -u origin user/test-user

# Check Vercel for preview deployment
# Delete test branch when done
git checkout main
git branch -D user/test-user
git push origin --delete user/test-user
```

---

## 5. Copying Context Resources

After setup, copy the exported resources to the new repo:

```bash
# From this repo (rippling-os)
cd /Users/will/Documents/rippling-os

# Copy exported resources to new repo
cp -r rippling-os-2.0/exported-resources/* /path/to/rippling-os-2/context/global/

# Or selectively:
cp -r rippling-os-2.0/exported-resources/schemas/* /path/to/rippling-os-2/context/global/schemas/
cp -r rippling-os-2.0/exported-resources/sql-functions/* /path/to/rippling-os-2/context/global/sql-patterns/
```

---

## 6. Next Steps

Once infrastructure is set up:

1. **Copy AGENT_PROMPT.md** to the new repo
2. **Open in Cursor** and start a new agent conversation
3. **Paste the prompt** and let the agent build the system
4. **Test the `/setup` skill** to create your first user branch
5. **Verify end-to-end** workflow

---

## Troubleshooting

### Vercel Build Fails

- Check that root directory is set to `web/`
- Verify `package.json` exists in `web/`
- Check build logs for missing dependencies

### Preview URLs Not Working

- Ensure branch name follows pattern (no special characters)
- Check Vercel project settings for preview deployment settings
- Wait 2-3 minutes for deployment to complete

### Snowflake Connection Issues

- For server-side: Consider using Key Pair authentication instead of SSO
- For client-side: You'll need a proxy API route
- Check Snowflake IP allowlisting for Vercel's IPs

### GitHub Token Permissions

- Ensure token has `repo` scope
- For org repos, may need SSO authorization
- Token must not be expired

---

## Reference Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Snowflake Node.js Driver](https://docs.snowflake.com/en/developer-guide/node-js/nodejs-driver)
- [GitHub REST API](https://docs.github.com/en/rest)

---

*Last Updated: January 2026*
