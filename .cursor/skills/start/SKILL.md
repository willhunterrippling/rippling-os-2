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

1. **Check if Server is Already Running**
   - List terminals to see if a dev server is already running
   - If running, just provide the URL

2. **Start the Server**
   ```bash
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

## Related Skills

- `/setup` - Set up your environment and user
- `/create-project` - Create a new analysis project
- `/query` - Run SQL queries against Snowflake
- `/report` - Create written reports
- `/share` - Share projects with others
