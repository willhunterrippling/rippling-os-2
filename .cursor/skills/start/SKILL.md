---
name: start
description: Start the web dashboard development server. Use when the user says "/start", wants to preview dashboards, run the dev server, or view projects locally.
---

# /start - Start Development Server

Start the Rippling OS web dashboard for viewing projects and dashboards.

## Before Starting

**Check these first:**
- If setup hasn't been run, run `/setup` first
- Check if server is already running (port 3000)

## Trigger

User says "start", "/start", "start the server", "run dev", or wants to preview dashboards.

## Quick Command

From the repository root:

```bash
npm run dev
```

This starts the Next.js development server at **http://localhost:3000**.

## Workflow

1. **Check if Server is Already Running (CRITICAL)**
   
   **ALWAYS check before starting.** Running multiple dev servers causes Turbopack cache corruption.
   
   ```bash
   lsof -ti:3000
   ```
   
   **If port 3000 is in use:**
   - Tell the user a server is already running at http://localhost:3000
   - Ask if they want you to restart it
   - **DO NOT start a second server**
   
   Also check the terminals folder for running `npm run dev` processes.

2. **Start the Server**
   ```bash
   npm run dev
   ```

3. **Provide URL**: http://localhost:3000

4. **Open Browser in Side Panel**
   
   Use the `cursor-ide-browser` MCP to open in Cursor:
   ```
   Tool: browser_navigate
   Server: cursor-ide-browser
   Arguments:
     url: "http://localhost:3000"
     position: "side"
   ```

For restart commands, auth setup, troubleshooting, and npm scripts, see [reference.md](reference.md).

## Related Skills

- `/setup` - Set up your environment and user
- `/create-project` - Create a new analysis project
- `/query` - Run SQL queries against Snowflake
- `/report` - Create written reports
- `/share` - Share projects with others
