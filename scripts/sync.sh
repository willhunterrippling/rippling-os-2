#!/bin/bash

# Sync user branch with latest main
# Usage: ./scripts/sync.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Safety check: don't run on main
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${RED}Error: Already on main branch${NC}"
    echo ""
    echo "Run ./scripts/setup-branch.sh to create your user branch"
    exit 1
fi

# Check if on a user branch
if [[ ! "$CURRENT_BRANCH" =~ ^user/ ]]; then
    echo -e "${YELLOW}Warning: Not on a user branch (current: $CURRENT_BRANCH)${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${YELLOW}Syncing $CURRENT_BRANCH with main...${NC}"
echo ""

# Check for uncommitted changes
STASHED=false
if [ -n "$(git status --porcelain)" ]; then
    echo "Stashing local changes..."
    git stash
    STASHED=true
fi

# Fetch latest from origin
echo "Fetching latest from origin..."
git fetch origin main

# Rebase onto main
echo "Rebasing onto main..."
if git rebase origin/main; then
    echo -e "${GREEN}Rebase successful${NC}"
else
    echo -e "${RED}Rebase failed - conflicts detected${NC}"
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

# Push updated branch
echo ""
echo "Pushing updated branch..."
git push origin "$CURRENT_BRANCH" --force-with-lease

echo ""
echo -e "${GREEN}✅ Branch updated!${NC}"
echo ""
echo "Your branch is now up to date with main."
echo "Branch: $CURRENT_BRANCH"
