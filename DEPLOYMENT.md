# Deployment Guide

Step-by-step guide for deploying Rippling OS to Vercel with Postgres and Resend.

## Prerequisites

- GitHub account with access to this repo
- Vercel account (can use GitHub SSO)
- Resend account (free tier available)

## Step 1: Create Vercel Account and Import Repo

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "Add New..." → "Project"
3. Import the `rippling-os-2` repository
4. Configure project settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `web`
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
5. Click "Deploy" (it will fail without env vars, that's OK)

## Step 2: Create Vercel Postgres Database

1. In Vercel dashboard, go to your project
2. Click "Storage" tab
3. Click "Create Database" → "Postgres"
4. Choose a name (e.g., "rippling-os-db")
5. Select your region (closest to users)
6. Click "Create"
7. After creation, go to the database → "Settings" tab
8. Copy the `POSTGRES_URL` (this is your `DATABASE_URL`)

## Step 3: Create Resend Account

1. Go to [resend.com](https://resend.com) and sign up
2. Go to "API Keys" in the sidebar
3. Click "Create API Key"
4. Name it (e.g., "rippling-os-prod")
5. Copy the key (starts with `re_`)

Note: Free tier gives you 3,000 emails/month, which is plenty for magic link auth.

## Step 4: Configure Environment Variables

In Vercel, go to your project → "Settings" → "Environment Variables".

Add the following variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgres://...` | Auto-set by Prisma Postgres |
| `POSTGRES_URL` | `postgres://...` | Auto-set by Prisma Postgres |
| `AUTH_SECRET` | (generate) | Run: `openssl rand -base64 32` |
| `AUTH_RESEND_KEY` | `re_...` | From Resend dashboard |

**Important:** Make sure to set these for "Production", "Preview", AND "Development" environments.

## Step 5: Run Database Migration

After setting environment variables:

1. In Vercel, click "Redeploy" to trigger a new build
2. Or locally, run:
   ```bash
   npx prisma db push
   ```

The Prisma schema will create all necessary tables.

## Step 6: Verify Deployment

1. Wait for deployment to complete (~2-3 minutes)
2. Visit your Vercel URL (e.g., `rippling-os-2.vercel.app`)
3. You should see the login page
4. Try signing in with a `@rippling.com` email
5. Check your email for the magic link
6. Click the link to verify auth works

## Step 7: Share with Team

Share the Vercel URL with your team. They'll need to:

1. Sign in with their `@rippling.com` email
2. Click the magic link in their email
3. They'll then have access to all dashboards

## Local Development Setup

For team members working locally:

1. Clone the repo
2. Run `npm install` and `npm install --prefix web`
3. Copy `.env.template` to `.env`
4. Get the `DATABASE_URL` from admin (or Vercel dashboard if you have access)
5. Set `BYPASS_AUTH=true` for local development
6. Run `npx prisma generate`
7. Run `/setup` in Cursor to verify everything works

## Troubleshooting

### Auth Issues

| Problem | Solution |
|---------|----------|
| Magic link not received | Check spam folder, verify Resend key |
| "Invalid email" error | Only @rippling.com emails allowed |
| Session expires quickly | Check AUTH_SECRET is set |

### Database Issues

| Problem | Solution |
|---------|----------|
| Connection refused | Check DATABASE_URL is correct |
| SSL error | Add `?sslmode=require` to URL |
| Table not found | Run `npx prisma db push` |

### Build Issues

| Problem | Solution |
|---------|----------|
| Build fails | Check web/package.json dependencies |
| Type errors | Run `npx prisma generate` first |
| Module not found | Clear .next and rebuild |

## Environment Variable Reference

### Required (Production)

```
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...
AUTH_SECRET=base64-random-string
AUTH_RESEND_KEY=re_...
```

### Required (Local)

```
DATABASE_URL=postgres://...
RIPPLING_ACCOUNT_EMAIL=you@rippling.com
BYPASS_AUTH=true
```

### Optional

```
SNOWFLAKE_ACCOUNT=RIPPLINGORG-RIPPLING
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_INTEGRATION_DWH
```

## Security Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Database access** - Only admins should have direct database access
3. **API keys** - Rotate if compromised
4. **Email restriction** - Only @rippling.com emails can access

## Updating the Schema

If you need to change the database schema:

1. Edit `prisma/schema.prisma`
2. Run `npx prisma db push` (for dev/staging)
3. Or create migration: `npx prisma migrate dev --name description`
4. Deploy to production

## Monitoring

Vercel provides:
- Function logs (for API routes)
- Analytics (page views, performance)
- Error tracking

Check the "Analytics" tab in your Vercel project dashboard.
