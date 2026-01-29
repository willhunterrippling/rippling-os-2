#!/bin/bash

# Start Snowflake MCP Server
# This script reads from .env and starts the MCP with user-specific config
#
# Called by Cursor via .cursor/mcp.json

# Get the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env if it exists
if [ -f "$REPO_ROOT/.env" ]; then
    export $(grep -v '^#' "$REPO_ROOT/.env" | grep -v '^$' | xargs)
fi

# Check for required email
if [ -z "$RIPPLING_ACCOUNT_EMAIL" ]; then
    echo "Error: RIPPLING_ACCOUNT_EMAIL is not set in .env" >&2
    exit 1
fi

# Set defaults from .env or use fallbacks
SNOWFLAKE_ACCOUNT="${SNOWFLAKE_ACCOUNT:-RIPPLINGORG-RIPPLING}"
SNOWFLAKE_WAREHOUSE="${SNOWFLAKE_WAREHOUSE:-PROD_RIPPLING_INTEGRATION_DWH}"
SNOWFLAKE_ROLE="${SNOWFLAKE_ROLE:-PROD_RIPPLING_MARKETING}"

# Start the MCP server
exec uvx snowflake-labs-mcp \
    --service-config-file "$REPO_ROOT/services/snowflake-config.yaml" \
    --account "$SNOWFLAKE_ACCOUNT" \
    --user "$RIPPLING_ACCOUNT_EMAIL" \
    --authenticator externalbrowser \
    --warehouse "$SNOWFLAKE_WAREHOUSE" \
    --role "$SNOWFLAKE_ROLE"
