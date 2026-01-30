# Start Skill Reference

Detailed reference for the `/start` skill. For basic usage, see [SKILL.md](SKILL.md).

## What the Server Shows

- **Home page**: List of all projects from the database
- **Project pages**: Overview showing dashboards, queries, and reports
- **Dashboard pages**: Interactive visualizations with data from query results
- **Query pages**: SQL query content with syntax highlighting
- **Report pages**: Rendered markdown reports

### URL Structure

```
http://localhost:3000                                    # Home
http://localhost:3000/projects/[slug]                   # Project overview
http://localhost:3000/projects/[slug]/dashboards/[name] # Dashboard
http://localhost:3000/projects/[slug]/queries/[name]    # Query
http://localhost:3000/projects/[slug]/reports/[name]    # Report
```

## Available npm Scripts

Run from the repository root:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run query` | Run Snowflake queries |

## Local Auth Setup

For local development, your `.env` needs:

```
AUTH_SECRET=your-generated-secret    # Required: openssl rand -base64 32
BYPASS_AUTH=true                      # Skips magic link email flow
```

**Note:** Even with `BYPASS_AUTH=true`, `AUTH_SECRET` is required for NextAuth to function.

## Restart Commands

If you need to restart the server (user confirms):

```bash
# Kill existing, clear cache, start fresh
pkill -f "next dev" || true
rm -rf web/.next
npm run dev
```

## Troubleshooting

### Port 3000 in use

Kill the existing process or check terminals:

```bash
lsof -ti:3000 | xargs kill -9
```

### Module not found

Run `npm install` in both root and `web/` directories:

```bash
npm install
cd web && npm install
```

### Database errors

Check `DATABASE_URL` is set in `.env`.

### Prisma errors

Run Prisma generate first:

```bash
npx prisma generate
```

### Turbopack cache corruption

Symptoms: panics, "corrupted database" errors, constant error spam.

This happens when multiple dev servers run simultaneously and fight over the `.next` cache.

```bash
# Kill all dev servers and clear cache
pkill -f "next dev" || true
rm -rf web/.next
npm run dev
```

**Prevention:** Always check if a server is running before starting another one.
