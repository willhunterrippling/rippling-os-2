#!/bin/bash

# Sync Prisma schema from root to web directory
# Usage: ./scripts/sync-prisma.sh

set -e

ROOT_SCHEMA="prisma/schema.prisma"
WEB_SCHEMA="web/prisma/schema.prisma"

# Check if root schema exists
if [ ! -f "$ROOT_SCHEMA" ]; then
    echo "Error: Root schema not found at $ROOT_SCHEMA"
    exit 1
fi

# Create web/prisma directory if it doesn't exist
mkdir -p "$(dirname "$WEB_SCHEMA")"

# Copy the schema
cp "$ROOT_SCHEMA" "$WEB_SCHEMA"

echo "✅ Prisma schema synced to $WEB_SCHEMA"
