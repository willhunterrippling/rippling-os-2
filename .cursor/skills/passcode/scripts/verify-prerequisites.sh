#!/bin/bash
# Verify prerequisites for passcode generation
# Run this before generating a passcode to check if everything is configured

set -e

echo "🔍 Checking passcode generation prerequisites..."
echo ""

# Check 1: Git email
echo "1. Git email configuration"
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
if [ -z "$GIT_EMAIL" ]; then
    echo "   ❌ Git email not configured"
    echo "   Fix: git config user.email \"you@rippling.com\""
    exit 1
fi

if [[ "$GIT_EMAIL" != *"@rippling.com" ]]; then
    echo "   ❌ Git email is not @rippling.com: $GIT_EMAIL"
    echo "   Fix: git config user.email \"you@rippling.com\""
    exit 1
fi
echo "   ✅ Git email: $GIT_EMAIL"

# Check 2: Snowflake configuration
echo ""
echo "2. Snowflake configuration"

SNOWFLAKE_USER=""
CONFIG_SOURCE=""

# Check .env file
if [ -f ".env" ]; then
    ENV_EMAIL=$(grep "^RIPPLING_ACCOUNT_EMAIL=" .env 2>/dev/null | cut -d'=' -f2 || echo "")
    if [ -n "$ENV_EMAIL" ]; then
        SNOWFLAKE_USER="$ENV_EMAIL"
        CONFIG_SOURCE=".env"
    fi
fi

# Check ~/.snowflake/connections.toml
if [ -z "$SNOWFLAKE_USER" ] && [ -f "$HOME/.snowflake/connections.toml" ]; then
    TOML_USER=$(grep -E "^user\s*=" "$HOME/.snowflake/connections.toml" 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d ' "' || echo "")
    if [ -n "$TOML_USER" ]; then
        SNOWFLAKE_USER="$TOML_USER"
        CONFIG_SOURCE="~/.snowflake/connections.toml"
    fi
fi

# Check ~/.snowflake/config.toml
if [ -z "$SNOWFLAKE_USER" ] && [ -f "$HOME/.snowflake/config.toml" ]; then
    TOML_USER=$(grep -E "^user\s*=" "$HOME/.snowflake/config.toml" 2>/dev/null | head -1 | cut -d'=' -f2 | tr -d ' "' || echo "")
    if [ -n "$TOML_USER" ]; then
        SNOWFLAKE_USER="$TOML_USER"
        CONFIG_SOURCE="~/.snowflake/config.toml"
    fi
fi

if [ -z "$SNOWFLAKE_USER" ]; then
    echo "   ⚠️  No Snowflake configuration found"
    echo "   Will use git email for Snowflake SSO"
    SNOWFLAKE_USER="$GIT_EMAIL"
    CONFIG_SOURCE="git email (fallback)"
fi

echo "   ✅ Snowflake user: $SNOWFLAKE_USER"
echo "   📄 Source: $CONFIG_SOURCE"

# Check 3: Database configuration
echo ""
echo "3. Database configuration"

if [ -f ".env" ]; then
    HAS_DB=$(grep -E "^(DATABASE_URL|PRISMA_DATABASE_URL)=" .env 2>/dev/null | head -1 || echo "")
    if [ -n "$HAS_DB" ]; then
        echo "   ✅ Database URL configured in .env"
    else
        echo "   ❌ No DATABASE_URL in .env"
        echo "   Fix: Add DATABASE_URL to your .env file"
        exit 1
    fi
else
    echo "   ❌ No .env file found"
    echo "   Fix: Run /setup first"
    exit 1
fi

# Check 4: Dependencies
echo ""
echo "4. Dependencies"

if [ -d "node_modules" ] && [ -d "node_modules/bcrypt" ]; then
    echo "   ✅ bcrypt installed"
else
    echo "   ⚠️  bcrypt may not be installed"
    echo "   Fix: npm install"
fi

if [ -d "node_modules/@prisma/client" ]; then
    echo "   ✅ Prisma client installed"
else
    echo "   ⚠️  Prisma client may not be installed"
    echo "   Fix: npm install && npx prisma generate"
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "✅ All prerequisites met!"
echo ""
echo "Ready to generate a passcode:"
echo "   npm run passcode generate"
echo ""
echo "Note: First-time Snowflake access will open a browser for SSO."
echo ""
