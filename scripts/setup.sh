#!/bin/bash

# Complete setup script for Rippling OS
# Usage: ./scripts/setup.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT"

echo -e "${YELLOW}Setting up Rippling OS...${NC}"
echo ""

# Step 1: Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.template .env
    echo -e "${GREEN}✅ Created .env file${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Step 2: Load environment and check for email
export $(grep -v '^#' .env | grep -v '^$' | xargs 2>/dev/null) || true

if [ -z "$RIPPLING_ACCOUNT_EMAIL" ] || [ "$RIPPLING_ACCOUNT_EMAIL" = "your.email@rippling.com" ]; then
    echo ""
    echo -e "${YELLOW}Please enter your Rippling email:${NC}"
    read -r USER_EMAIL
    
    if [ -z "$USER_EMAIL" ]; then
        echo -e "${RED}Error: Email is required${NC}"
        exit 1
    fi
    
    # Update .env file with the email
    if grep -q "^RIPPLING_ACCOUNT_EMAIL=" .env; then
        sed -i.bak "s/^RIPPLING_ACCOUNT_EMAIL=.*/RIPPLING_ACCOUNT_EMAIL=$USER_EMAIL/" .env
        rm -f .env.bak
    else
        echo "RIPPLING_ACCOUNT_EMAIL=$USER_EMAIL" >> .env
    fi
    
    export RIPPLING_ACCOUNT_EMAIL="$USER_EMAIL"
    echo -e "${GREEN}✅ Email set to $USER_EMAIL${NC}"
else
    echo -e "${GREEN}✅ Email already configured: $RIPPLING_ACCOUNT_EMAIL${NC}"
fi

# Step 3: Install root dependencies
echo ""
echo "Installing root dependencies..."
npm install
echo -e "${GREEN}✅ Root dependencies installed${NC}"

# Step 4: Install web dependencies
echo ""
echo "Installing web dependencies..."
cd web
npm install
cd "$REPO_ROOT"
echo -e "${GREEN}✅ Web dependencies installed${NC}"

# Step 5: Generate MCP configuration
MCP_TEMPLATE="$REPO_ROOT/.cursor/mcp.json.template"
MCP_CONFIG="$REPO_ROOT/.cursor/mcp.json"

if [ -f "$MCP_TEMPLATE" ]; then
    echo ""
    echo "Generating MCP configuration..."
    sed "s|{{REPO_ROOT}}|$REPO_ROOT|g" "$MCP_TEMPLATE" > "$MCP_CONFIG"
    echo -e "${GREEN}✅ MCP config generated at .cursor/mcp.json${NC}"
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Restart Cursor to load the Snowflake MCP"
echo "  2. Run /create-project to start a new analysis"
echo "  3. Run /start to launch the dashboard"
echo ""
