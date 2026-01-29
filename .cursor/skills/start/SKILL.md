---
name: start
description: Start the web dashboard development server. Use when the user says "/start", wants to preview dashboards, run the dev server, or view projects locally.
---

# /start - Start Development Server

Start the Rippling OS web dashboard for viewing projects and dashboards.

## Trigger

User says "start", "/start", "start the server", "run dev", or wants to preview dashboards.

## Quick Command

From the repository root, run:

```bash
npm run dev
```

This starts the Next.js development server at **http://localhost:3000**.

## Workflow

1. **Check if Server is Already Running (CRITICAL)**
   
   **ALWAYS check before starting.** Running multiple dev servers causes Turbopack cache corruption.
   
   ```bash
   # Check what's using port 3000
   lsof -ti:3000
   ```
   
   **If port 3000 is in use:**
   - Tell the user a server is already running
   - Provide the URL (http://localhost:3000)
   - Ask if they want you to restart it (kill + start fresh)
   - **DO NOT start a second server** - this corrupts the `.next` cache
   
   **Also check terminals folder** for any running `npm run dev` processes.

2. **Start the Server (only if nothing running)**
   ```bash
   npm run dev
   ```
   
   **If you need to restart** (user confirms):
   ```bash
   # Kill existing, clear cache, start fresh
   pkill -f "next dev" || true
   rm -rf web/.next
   npm run dev
   ```

3. **Provide Access Information**
   ```
   🚀 Dev server started!
   
   Local:    http://localhost:3000
   
   Pages:
   - Home:       http://localhost:3000
   - Projects:   http://localhost:3000/projects/[slug]
   - Dashboards: http://localhost:3000/projects/[slug]/dashboards/[name]
   - Queries:    http://localhost:3000/projects/[slug]/queries/[name]
   - Reports:    http://localhost:3000/projects/[slug]/reports/[name]
   
   Note: Set BYPASS_AUTH=true in .env for local development.
   ```

4. **Open Browser in Side Panel**
   After the server starts, open the browser within Cursor using the `cursor-ide-browser` MCP:
   
   ```
   Tool: browser_navigate
   Server: cursor-ide-browser
   Arguments:
     url: "http://localhost:3000"
     position: "side"
   ```
   
   This opens the app in a side panel so the user can see the dashboard while coding.

## What the Server Shows

- **Home page**: List of all projects from the database
- **Project pages**: Overview showing dashboards, queries, and reports
- **Dashboard pages**: Interactive visualizations with data from query results
- **Query pages**: SQL query content with syntax highlighting
- **Report pages**: Rendered markdown reports

## Available npm Scripts (from root)

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

## Troubleshooting

- **Port 3000 in use**: Kill the existing process or check terminals
- **Module not found**: Run `npm install` in both root and `web/` directories
- **Database errors**: Check `DATABASE_URL` is set in `.env`
- **Prisma errors**: Run `npx prisma generate` first
- **Turbopack cache corruption** (panics, "corrupted database" errors, constant error spam):
  ```bash
  # Kill all dev servers and clear cache
  pkill -f "next dev" || true
  rm -rf web/.next
  npm run dev
  ```
  This happens when multiple dev servers run simultaneously and fight over the `.next` cache.

## Related Skills

- `/setup` - Set up your environment and user
- `/create-project` - Create a new analysis project
- `/query` - Run SQL queries against Snowflake
- `/report` - Create written reports
- `/share` - Share projects with others
