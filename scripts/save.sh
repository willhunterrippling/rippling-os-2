#!/bin/bash

# Save (commit and push) changes to user branch
# Usage: ./scripts/save.sh ["optional commit message"]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Safety check: don't commit to main
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo -e "${RED}Error: Cannot commit directly to main branch${NC}"
    echo ""
    echo "Run ./scripts/setup-branch.sh first to create your user branch"
    exit 1
fi

# Check if on a user branch
if [[ ! "$CURRENT_BRANCH" =~ ^user/ ]]; then
    echo -e "${YELLOW}Warning: Not on a user branch (current: $CURRENT_BRANCH)${NC}"
    echo "Consider running ./scripts/setup-branch.sh to set up your user branch"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

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

# Extract username for preview URL
USERNAME=$(echo "$CURRENT_BRANCH" | sed 's/user\///')

echo ""
echo -e "${GREEN}✅ Changes saved!${NC}"
echo ""
echo "Committed: $COMMIT_HASH"
echo "Branch: $CURRENT_BRANCH"
echo "Preview URL: https://rippling-os-2-git-${USERNAME//./-}.vercel.app"
echo ""
echo "Changes will be deployed in ~1-2 minutes."
