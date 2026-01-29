#!/bin/bash

# Save (commit and push) changes
# Usage: ./scripts/save.sh ["optional commit message"]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check for changes
if [ -z "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}No changes to commit${NC}"
    exit 0
fi

# Show what will be committed
echo -e "${YELLOW}Changes to be committed:${NC}"
git status --short
echo ""

# Stage all changes
git add -A

# Get commit message
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
else
    # Generate a simple commit message based on changed files
    CHANGED_FILES=$(git diff --cached --name-only | head -5)
    if echo "$CHANGED_FILES" | grep -q "^projects/"; then
        PROJECT=$(echo "$CHANGED_FILES" | grep "^projects/" | head -1 | cut -d'/' -f2)
        COMMIT_MSG="Update project: $PROJECT"
    else
        COMMIT_MSG="Update files: $(echo "$CHANGED_FILES" | tr '\n' ', ' | sed 's/,$//')"
    fi
    
    echo -e "${YELLOW}Generated commit message: $COMMIT_MSG${NC}"
    read -p "Use this message? (Y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "Enter commit message: " COMMIT_MSG
    fi
fi

# Commit
echo ""
echo "Committing..."
git commit -m "$COMMIT_MSG"

# Push
echo ""
echo "Pushing to origin..."
git push origin "$CURRENT_BRANCH"

# Get commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)

echo ""
echo -e "${GREEN}✅ Changes saved!${NC}"
echo ""
echo "Committed: $COMMIT_HASH"
echo "Branch: $CURRENT_BRANCH"
echo ""
