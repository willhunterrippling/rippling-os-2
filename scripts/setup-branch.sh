#!/bin/bash

# Setup user branch for Rippling OS
# Usage: ./scripts/setup-branch.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

# Check for required email
if [ -z "$RIPPLING_ACCOUNT_EMAIL" ]; then
    echo -e "${RED}Error: RIPPLING_ACCOUNT_EMAIL is not set${NC}"
    echo ""
    echo "Please set your Rippling email in .env file:"
    echo "  RIPPLING_ACCOUNT_EMAIL=your.email@rippling.com"
    exit 1
fi

# Extract username from email (part before @)
USERNAME=$(echo "$RIPPLING_ACCOUNT_EMAIL" | cut -d'@' -f1)
BRANCH_NAME="user/$USERNAME"

echo -e "${YELLOW}Setting up branch: $BRANCH_NAME${NC}"
echo ""

# Fetch latest from remote
echo "Fetching latest from remote..."
git fetch origin

# Check if branch exists remotely
if git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
    echo -e "${GREEN}Branch $BRANCH_NAME exists. Checking out...${NC}"
    git checkout "$BRANCH_NAME" 2>/dev/null || git checkout -b "$BRANCH_NAME" "origin/$BRANCH_NAME"
    git pull origin "$BRANCH_NAME"
else
    echo -e "${YELLOW}Branch $BRANCH_NAME does not exist. Creating from main...${NC}"
    
    # Make sure we have latest main
    git checkout main
    git pull origin main
    
    # Create and push new branch
    git checkout -b "$BRANCH_NAME"
    git push -u origin "$BRANCH_NAME"
fi

# Generate MCP configuration from template
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
MCP_TEMPLATE="$REPO_ROOT/.cursor/mcp.json.template"
MCP_CONFIG="$REPO_ROOT/.cursor/mcp.json"

if [ -f "$MCP_TEMPLATE" ]; then
    echo "Generating MCP configuration..."
    sed "s|{{REPO_ROOT}}|$REPO_ROOT|g" "$MCP_TEMPLATE" > "$MCP_CONFIG"
    echo -e "${GREEN}✅ MCP config generated at .cursor/mcp.json${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Your branch: $BRANCH_NAME"
echo "Preview URL: https://rippling-os-2-git-${USERNAME//./-}.vercel.app"
echo ""
echo "Next steps:"
echo "  1. Restart Cursor to load the Snowflake MCP"
echo "  2. Run /create-project to start a new analysis"
echo "  3. Run /query to execute SQL and cache results"
echo "  4. Run /save to commit your work"
