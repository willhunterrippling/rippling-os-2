# Cursor Settings for Rippling OS

This guide explains the Cursor IDE settings you need to configure for Rippling OS to work properly. The Cursor agent cannot change these settings for you - you must configure them yourself.

## How to Open Settings

1. **Keyboard shortcut:** Press `Cmd + ,`
2. **Menu:** Click `Cursor` in the menu bar, then `Settings`
3. Scroll down to find the **Features** section

---

## Required Settings

### Web and Search Settings

These settings allow the agent to search for documentation and fetch web content.

| Setting | Value | Why |
|---------|-------|-----|
| **Web Search Tool** | ON | Allows agent to look up documentation and best practices |
| **Auto-Accept Web Search** | ON | Reduces interruptions during research |
| **Web Fetch Tool** | ON | Allows agent to fetch content from URLs |

---

### Auto-Run Settings

These settings control how the agent runs commands in your terminal.

| Setting | Value | Why |
|---------|-------|-----|
| **Auto-Run Mode** | "Auto-Run in Sandbox" | Allows safe command execution with restrictions |
| **Auto-Run Network Access** | "Enabled by Default" | Required for npm install, database connections |
| **Allow Git Writes Without Approval** | ON | Allows git commits without prompts |

---

### Fetch Domain Allowlist

Add these domains to allow the agent to fetch content from them:

- `github.com`
- `docs.snowflake.com`

This allows the agent to look up GitHub files and Snowflake documentation.

---

### Protection Settings

These settings control what the agent can and cannot do automatically.

| Setting | Value | Why |
|---------|-------|-----|
| **MCP Tools Protection** | OFF | **Required for Snowflake MCP to work** |
| **Dotfile Protection** | ON | Keep enabled - protects .gitignore, etc. |
| **External-File Protection** | ON | Keep enabled - prevents changes outside workspace |

**Important:** MCP Tools Protection must be **OFF** for the Snowflake MCP server to work. This allows the agent to run queries against Snowflake.

---

## After Changing Settings

1. **Restart Cursor** - Some settings require a restart to take effect
2. **Verify MCP servers** - Go to `Settings > Tools & Integrations > MCP Tools` and check that servers appear

---

## Quick Checklist

Before running `/setup`, verify these settings:

- [ ] Web Search Tool: ON
- [ ] Auto-Accept Web Search: ON
- [ ] Web Fetch Tool: ON
- [ ] Auto-Run Mode: "Auto-Run in Sandbox"
- [ ] Auto-Run Network Access: "Enabled by Default"
- [ ] Allow Git Writes Without Approval: ON
- [ ] Fetch Domain Allowlist includes: `github.com`, `docs.snowflake.com`
- [ ] MCP Tools Protection: OFF
- [ ] Cursor restarted after changes

---

## Additional Resources

- [Cursor Onboarding Guide for Rippling Developers](https://rippling.atlassian.net/wiki/spaces/I/pages/4721967141) - Official Rippling Cursor setup guide
- Install Cursor: `brew install --cask cursor`
- Sign in with your @rippling.com email
