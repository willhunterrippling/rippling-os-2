# /create-project - Create New Project

Create a new analysis project with proper structure.

## Trigger

User says "create project", "/create-project [name]", or "new project".

## Workflow

1. **Get Project Name**
   - If user provided name, use it
   - Otherwise, ask for project name
   - Convert to slug format (lowercase, hyphens): "My Analysis" → "my-analysis"

2. **Check for Existing Project**
   - Check if `projects/[slug]` already exists
   - If yes, warn and ask for different name

3. **Create Project Structure**
   ```bash
   mkdir -p projects/[slug]/dashboards
   mkdir -p projects/[slug]/queries
   mkdir -p projects/[slug]/reports
   mkdir -p projects/[slug]/data
   ```

4. **Copy Template Files**
   - Copy from `projects/_templates/basic-analysis/`:
     - `README.md` → customize with project name
     - `dashboards/main.yaml` → empty dashboard template
   - Create `.gitkeep` files in empty directories:
     - `projects/[slug]/reports/.gitkeep`

5. **Update projects.json**
   - Read current `projects.json`
   - Add new project entry:
     ```json
     {
       "slug": "[slug]",
       "name": "[Project Name]",
       "description": "",
       "createdAt": "[ISO date]",
       "author": "[email-prefix from RIPPLING_ACCOUNT_EMAIL]"
     }
     ```
   - Write back to `projects.json`

6. **Output Confirmation**
   ```
   ✅ Project created!
   
   Project: [Project Name]
   Location: projects/[slug]/
   
   Structure:
   ├── README.md
   ├── dashboards/
   │   └── main.yaml
   ├── queries/
   ├── reports/
   └── data/
   
   Next steps:
   1. Add SQL queries to queries/ folder
   2. Run /query to execute SQL and cache results
   3. Configure widgets in dashboards/main.yaml
   4. Add written reports to reports/ folder
   5. Run /save to commit your project
   ```

## Project Structure

```
projects/[slug]/
├── README.md           # Project description
├── dashboards/         # Dashboard YAML configs
│   └── main.yaml       # Main dashboard
├── queries/            # SQL query files
│   └── example.sql
├── reports/            # Written reports (markdown)
│   └── findings.md
└── data/               # Cached JSON results
    └── example.json
```

## URL Routes

After creating a project, it will be accessible at:
- Project overview: `/projects/[slug]`
- Dashboards: `/projects/[slug]/dashboards/[name]`
- Queries: `/projects/[slug]/queries/[name]`
- Reports: `/projects/[slug]/reports/[name]`

## Error Handling

- If project name is empty, prompt for name
- If project already exists, suggest different name
- If not on user branch, **ask the user** if they'd like to set up their personal branch first (run `/setup`), then continue after setup
