# Prerequisites for Rippling OS

This guide covers the software you need to install before running `/setup`. The Cursor agent cannot install these tools for you - you must install them yourself.

## Platform Requirements

**macOS required.** All scripts assume a Unix environment with bash.

---

## Quick Check

Run this command to check all prerequisites at once:

```bash
bash .cursor/skills/setup/scripts/check-prerequisites.sh
```

If anything is missing, follow the installation instructions below.

---

## 1. Homebrew

Homebrew is a package manager for macOS that makes it easy to install development tools.

**Check if installed:**
```bash
brew --version
```

**Install Homebrew:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

After installation, follow the instructions printed to add Homebrew to your PATH.

For more information: [brew.sh](https://brew.sh)

---

## 2. Node.js (v18 or higher)

Node.js is required to run npm (package manager), npx (package runner), and tsx (TypeScript executor). These are used throughout Rippling OS for installing dependencies and running scripts.

**Check if installed:**
```bash
node --version
```

You need version 18 or higher.

**Install Node.js:**
```bash
brew install node
```

Alternatively, download from [nodejs.org](https://nodejs.org).

---

## 3. Git

Git is required for version control and to identify you as a user. Your commits must be associated with your @rippling.com email address.

**Check if installed:**
```bash
git --version
```

Git is usually pre-installed on macOS. If not:
```bash
brew install git
```

**Configure your identity (REQUIRED):**

Your git email **must** be your @rippling.com address. This is mandatory per Rippling policy.

```bash
git config --global user.name "Your Name"
git config --global user.email "your.name@rippling.com"
```

**Verify configuration:**
```bash
git config --global user.email
```

For more details, see: [GitHub at Rippling](https://rippling.atlassian.net/wiki/spaces/I/pages/5198086415/GitHub+at+Rippling)

---

## 4. Python (v3.8 or higher)

Python is required to run the Snowflake MCP server via the `uvx` command.

**Check if installed:**
```bash
python3 --version
```

You need version 3.8 or higher.

### Installing Python with pyenv (Recommended)

Rippling recommends using pyenv to manage Python versions. This gives you better control over which Python version is used.

**Step 1: Install pyenv**
```bash
brew install pyenv readline xz
```

**Step 2: Install Python 3.11.8**
```bash
pyenv install 3.11.8
pyenv global 3.11.8
```

If you get "definition not found", run:
```bash
git clone https://github.com/pyenv/pyenv-update.git $(pyenv root)/plugins/pyenv-update
pyenv update
```

**Step 3: Add to your shell configuration**

Add these lines to **both** `~/.zshrc` and `~/.bashrc`:

```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

**Step 4: Restart your terminal**

Open a new terminal window and verify:
```bash
python3 --version
# Should show: Python 3.11.8
```

For more details, see: [Setting Up a Laptop](https://rippling.atlassian.net/wiki/spaces/I/pages/4138369063/Setting+Up+a+Laptop)

---

## 5. uv (for uvx command)

uv is a fast Python package manager. The `uvx` command is used to run the Snowflake MCP server (`snowflake-labs-mcp`) which enables Cursor to query Snowflake directly.

**Check if installed:**
```bash
uvx --version
```

**Install uv:**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**IMPORTANT:** After installing, you **must restart your terminal** for the `uvx` command to be available.

---

## 6. Environment File (.env)

The `.env` file contains database connection strings and other configuration. You need to get this from your admin.

**What's in the .env file:**
- `DATABASE_URL` - Postgres connection string
- `PRISMA_DATABASE_URL` - Prisma Accelerate URL
- `AUTH_SECRET` - Session encryption key
- `RIPPLING_ACCOUNT_EMAIL` - Your Snowflake email

**How to get it:**

1. Ask your admin for the `.env` file
2. Copy the file to the repository root
3. Update `RIPPLING_ACCOUNT_EMAIL` with your @rippling.com email
4. Create a symlink for the web app:
   ```bash
   ln -sf ../.env web/.env
   ```

---

## Troubleshooting

### "command not found"

This usually means the tool isn't in your PATH. Try:
1. Restart your terminal
2. Check if the tool is installed: `which <tool-name>`
3. If using pyenv or uv, make sure you added them to your shell config

### "permission denied"

You may need to fix directory ownership:
```bash
sudo chown -R $(whoami) /usr/local/bin /usr/local/lib
```

### Homebrew issues

If Homebrew commands fail, try:
```bash
brew update
brew doctor
```

### pyenv "definition not found"

Update pyenv's available versions:
```bash
pyenv update
# Then try the install again
pyenv install 3.11.8
```

---

## Verification Checklist

Run these commands to verify everything is set up correctly:

```bash
# Should all succeed without errors
brew --version
node --version        # Should be v18 or higher
git --version
git config --global user.email  # Should be @rippling.com
python3 --version     # Should be 3.8 or higher
uvx --version
```

Once all checks pass, you're ready to run `/setup` in Cursor.

---

## Additional Resources

- [Setting Up a Laptop](https://rippling.atlassian.net/wiki/spaces/I/pages/4138369063/Setting+Up+a+Laptop) - Official Rippling laptop setup guide
- [GitHub at Rippling](https://rippling.atlassian.net/wiki/spaces/I/pages/5198086415/GitHub+at+Rippling) - Git and GitHub configuration
- [Snowflake](https://rippling.atlassian.net/wiki/spaces/GP1/pages/3532228680/Snowflake) - Snowflake access and SSO
- [Cursor Onboarding Guide](https://rippling.atlassian.net/wiki/spaces/I/pages/4721967141) - Cursor setup for Rippling
