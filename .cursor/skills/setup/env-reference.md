# Environment Reference

This document covers environment variables, Snowflake configuration, and troubleshooting for Rippling OS setup.

## Required Environment Variables

Create a `.env` file in the repository root with these variables:

```bash
# Database (from Vercel/Prisma Postgres)
DATABASE_URL=postgres://...          # Direct Postgres connection
POSTGRES_URL=postgres://...          # Same as DATABASE_URL (for migrations)
PRISMA_DATABASE_URL=prisma+postgres://...  # Prisma Accelerate URL

# Authentication
AUTH_SECRET=...                      # Generate with: openssl rand -base64 32
BYPASS_AUTH=true                     # For local development (skip magic link auth)
```

**Where to get database URLs:** Contact the admin or check the Vercel dashboard under Prisma Postgres connections. All three URLs come from the same place.

## Snowflake Connection

Choose ONE of these options:

### Option 1: Environment Variable

```bash
RIPPLING_ACCOUNT_EMAIL=you@rippling.com
```

### Option 2: Shared TOML Config (Recommended)

If you use the Snowflake VSCode extension, create `~/.snowflake/connections.toml`:

```toml
[rippling]
account = "RIPPLINGORG-RIPPLING"
user = "your.email@rippling.com"
authenticator = "externalbrowser"
database = "PROD_RIPPLING_DWH"
schema = "MARKETING_OPS"
warehouse = "PROD_RIPPLING_INTEGRATION_DWH"
role = "PROD_RIPPLING_MARKETING"
```

This way you configure credentials once and both the CLI and VSCode extension use them.

**Credential lookup order:**
1. `RIPPLING_ACCOUNT_EMAIL` in `.env`
2. `~/.snowflake/connections.toml` (`[rippling]` or `[default]` section)

## Optional Variables (Have Defaults)

```bash
SNOWFLAKE_ACCOUNT=RIPPLINGORG-RIPPLING
SNOWFLAKE_DATABASE=PROD_RIPPLING_DWH
SNOWFLAKE_ROLE=PROD_RIPPLING_MARKETING
SNOWFLAKE_WAREHOUSE=PROD_RIPPLING_INTEGRATION_DWH
```

## Production Variables (Vercel Only)

```bash
AUTH_RESEND_KEY=re_...               # For magic link emails (from Resend dashboard)
```

## Web App Symlink

The `.env` file must be symlinked to `web/.env` for Next.js to load it:

```bash
ln -sf ../.env web/.env
```

## Error Handling

| Error | Solution |
|-------|----------|
| `.env.template` doesn't exist | Create `.env` manually with required variables |
| `DATABASE_URL` not set | Contact admin for Vercel Postgres connection string |
| `npm install` fails | Check Node.js is installed, try `npm cache clean --force` |
| Prisma generate fails | Check DATABASE_URL is valid, try `npx prisma generate --schema=prisma/schema.prisma` |
| Git email not @rippling.com | Run `git config user.email "you@rippling.com"` |
| Database connection fails | Verify DATABASE_URL, check network access |
| Snowflake connection fails | Check RIPPLING_ACCOUNT_EMAIL or TOML config exists |
| "Query runner failed in sandbox" | Agent needs `all` permissions - approve the prompt |

## Snowflake SSO Notes

The query runner uses `externalbrowser` authentication:
- First-time auth opens a browser window for Okta/SSO login
- User must complete the login manually
- SSO tokens are cached locally after successful login
- Subsequent queries use the cached token

**For Cursor agents:** The agent MUST request `all` permissions when running queries. Without permissions, the sandbox blocks network access and SSO browser authentication.
