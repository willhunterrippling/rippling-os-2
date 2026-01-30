#!/bin/bash
# verify-setup.sh - Check what setup steps are needed
# Run from the repository root

echo "=== Rippling OS Setup Status ==="
echo ""

# Check for .env file
if [ -f .env ]; then
    echo "[✓] .env file exists"
    
    # Check for required variables
    if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=$" .env; then
        echo "    [✓] DATABASE_URL is set"
    else
        echo "    [✗] DATABASE_URL is missing"
    fi
    
    if grep -q "PRISMA_DATABASE_URL=" .env && ! grep -q "PRISMA_DATABASE_URL=$" .env; then
        echo "    [✓] PRISMA_DATABASE_URL is set"
    else
        echo "    [✗] PRISMA_DATABASE_URL is missing"
    fi
    
    if grep -q "AUTH_SECRET=" .env && ! grep -q "AUTH_SECRET=$" .env; then
        echo "    [✓] AUTH_SECRET is set"
    else
        echo "    [✗] AUTH_SECRET is missing"
    fi
else
    echo "[✗] .env file is missing"
fi

echo ""

# Check for root node_modules
if [ -d node_modules ]; then
    echo "[✓] Root node_modules installed"
else
    echo "[✗] Root node_modules missing (run: npm install)"
fi

# Check for web node_modules
if [ -d web/node_modules ]; then
    echo "[✓] Web node_modules installed"
else
    echo "[✗] Web node_modules missing (run: npm install --prefix web)"
fi

# Check for Prisma client
if [ -d node_modules/.prisma ]; then
    echo "[✓] Prisma client generated"
else
    echo "[✗] Prisma client missing (run: npx prisma generate)"
fi

echo ""

# Check for Snowflake TOML config
if [ -f ~/.snowflake/connections.toml ]; then
    echo "[✓] Snowflake TOML config exists at ~/.snowflake/connections.toml"
else
    echo "[○] Snowflake TOML config not found (optional - can use RIPPLING_ACCOUNT_EMAIL instead)"
fi

echo ""

# Check git email
GIT_EMAIL=$(git config user.email 2>/dev/null)
if [ -n "$GIT_EMAIL" ]; then
    echo "[✓] Git email: $GIT_EMAIL"
    if [[ "$GIT_EMAIL" == *"@rippling.com" ]]; then
        echo "    [✓] Valid Rippling email"
    else
        echo "    [✗] Must be @rippling.com (run: git config user.email \"you@rippling.com\")"
    fi
else
    echo "[✗] Git email not configured"
fi

echo ""
echo "=== End Status ==="
