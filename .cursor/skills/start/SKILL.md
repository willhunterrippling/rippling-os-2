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
   - Dashboards: http://localhost:3000/dashboards/[id]
   ```

## What the Server Shows

- **Home page**: List of all projects from `projects.json`
- **Project pages**: Individual project details and dashboards
- **Dashboard pages**: Interactive visualizations from `dashboard.yaml` files

## Available npm Scripts (from root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run query` | Run Snowflake queries |
| `npm run save` | Save and commit changes |
| `npm run sync` | Sync with remote |

## Troubleshooting

- **Port 3000 in use**: Kill the existing process or check terminals
- **Module not found**: Run `npm install` in the `web/` directory first
- **Environment errors**: Check `.env` file exists with required variables

## Related Skills

- `/setup` - Set up your user branch
- `/create-project` - Create a new analysis project
- `/query` - Run SQL queries against Snowflake
- `/save` - Commit and push your work
