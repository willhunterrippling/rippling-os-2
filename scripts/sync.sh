#!/bin/bash

# Sync with latest from origin
# Usage: ./scripts/sync.sh

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

echo -e "${YELLOW}Syncing $CURRENT_BRANCH with origin...${NC}"
echo ""

# Check for uncommitted changes
STASHED=false
if [ -n "$(git status --porcelain)" ]; then
    echo "Stashing local changes..."
    git stash
    STASHED=true
fi

# Fetch and pull latest
echo "Fetching latest from origin..."
git fetch origin

echo "Pulling latest changes..."
if git pull origin "$CURRENT_BRANCH" --rebase; then
    echo -e "${GREEN}Pull successful${NC}"
else
    echo -e "${RED}Pull failed - conflicts detected${NC}"
    echo ""
    echo "Conflicting files:"
    git diff --name-only --diff-filter=U
    echo ""
    echo "To resolve:"
    echo "  1. Edit the conflicting files"
    echo "  2. Run: git add <files>"
    echo "  3. Run: git rebase --continue"
    echo ""
    echo "Or to abort: git rebase --abort"
    
    # Pop stash if we stashed
    if [ "$STASHED" = true ]; then
        echo ""
        echo -e "${YELLOW}Note: Your local changes are still stashed.${NC}"
        echo "Run 'git stash pop' after resolving conflicts."
    fi
    
    exit 1
fi

# Restore stashed changes
if [ "$STASHED" = true ]; then
    echo "Restoring stashed changes..."
    git stash pop || {
        echo -e "${YELLOW}Warning: Could not auto-apply stashed changes${NC}"
        echo "Your changes are saved in stash. Run 'git stash pop' to apply them."
    }
fi

echo ""
echo -e "${GREEN}✅ Branch updated!${NC}"
echo ""
echo "Your branch is now up to date with origin."
echo "Branch: $CURRENT_BRANCH"
