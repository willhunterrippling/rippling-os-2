#!/bin/bash
# check-prerequisites.sh - Check all prerequisites for Rippling OS
# 
# This script checks each prerequisite sequentially and offers
# installation instructions for any that are missing.
#
# Usage: bash .cursor/skills/setup/scripts/check-prerequisites.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MISSING_COUNT=0

echo ""
echo -e "${BLUE}=== Rippling OS Prerequisites Check ===${NC}"
echo ""

# Function to ask user if they want install instructions
ask_for_instructions() {
    local tool_name=$1
    local install_cmd=$2
    local explanation=$3
    
    echo ""
    echo -e "${YELLOW}Would you like installation instructions for $tool_name? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}--- $tool_name Installation ---${NC}"
        echo ""
        echo "$explanation"
        echo ""
        echo -e "Run this command:"
        echo -e "  ${GREEN}$install_cmd${NC}"
        echo ""
        echo -e "${YELLOW}After installing, restart your terminal and run this check again.${NC}"
        echo ""
    fi
}

# =============================================================================
# Check 1: Homebrew
# =============================================================================
echo -e "${BLUE}[1/6] Checking Homebrew...${NC}"

if command -v brew &> /dev/null; then
    BREW_VERSION=$(brew --version | head -n1)
    echo -e "${GREEN}[✓] Homebrew: $BREW_VERSION${NC}"
else
    echo -e "${RED}[✗] Homebrew not found${NC}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    
    ask_for_instructions "Homebrew" \
        '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"' \
        "Homebrew is a package manager for macOS that makes it easy to install
development tools. It's required to install Node.js, Python, and other tools.

Visit https://brew.sh for more information."
fi

echo ""

# =============================================================================
# Check 2: Node.js (version 18+)
# =============================================================================
echo -e "${BLUE}[2/6] Checking Node.js...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | sed 's/v//')
    MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
    
    if [ "$MAJOR_VERSION" -ge 18 ]; then
        echo -e "${GREEN}[✓] Node.js: v$NODE_VERSION${NC}"
    else
        echo -e "${RED}[✗] Node.js: v$NODE_VERSION (need v18 or higher)${NC}"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        
        ask_for_instructions "Node.js 18+" \
            "brew install node" \
            "Node.js v18+ is required to run npm, npx, and tsx commands.
Your current version ($NODE_VERSION) is too old.

You can also download directly from https://nodejs.org"
    fi
else
    echo -e "${RED}[✗] Node.js not found${NC}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    
    ask_for_instructions "Node.js" \
        "brew install node" \
        "Node.js is required to run npm (package manager), npx (package runner),
and tsx (TypeScript executor). These are used throughout Rippling OS.

You can also download directly from https://nodejs.org"
fi

echo ""

# =============================================================================
# Check 3: Git
# =============================================================================
echo -e "${BLUE}[3/6] Checking Git...${NC}"

if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | sed 's/git version //')
    echo -e "${GREEN}[✓] Git: $GIT_VERSION${NC}"
    
    # Check git email configuration
    GIT_EMAIL=$(git config --global user.email 2>/dev/null || echo "")
    
    if [ -n "$GIT_EMAIL" ]; then
        if [[ "$GIT_EMAIL" == *"@rippling.com" ]]; then
            echo -e "${GREEN}    [✓] Git email: $GIT_EMAIL${NC}"
        else
            echo -e "${RED}    [✗] Git email: $GIT_EMAIL (must be @rippling.com)${NC}"
            MISSING_COUNT=$((MISSING_COUNT + 1))
            
            echo ""
            echo -e "${YELLOW}Would you like instructions to fix your git email? (y/n)${NC}"
            read -r response
            
            if [[ "$response" =~ ^[Yy]$ ]]; then
                echo ""
                echo -e "${BLUE}--- Git Email Configuration ---${NC}"
                echo ""
                echo "Your git email must be your @rippling.com address."
                echo "This is mandatory per Rippling policy."
                echo ""
                echo -e "Run this command (replace with your email):"
                echo -e "  ${GREEN}git config --global user.email \"your.name@rippling.com\"${NC}"
                echo ""
                echo "See: https://rippling.atlassian.net/wiki/spaces/I/pages/5198086415/GitHub+at+Rippling"
                echo ""
            fi
        fi
    else
        echo -e "${RED}    [✗] Git email not configured${NC}"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        
        echo ""
        echo -e "${YELLOW}Would you like instructions to configure your git email? (y/n)${NC}"
        read -r response
        
        if [[ "$response" =~ ^[Yy]$ ]]; then
            echo ""
            echo -e "${BLUE}--- Git Email Configuration ---${NC}"
            echo ""
            echo "Git needs your email to identify your commits."
            echo "You must use your @rippling.com email address."
            echo ""
            echo -e "Run these commands (replace with your info):"
            echo -e "  ${GREEN}git config --global user.name \"Your Name\"${NC}"
            echo -e "  ${GREEN}git config --global user.email \"your.name@rippling.com\"${NC}"
            echo ""
            echo "See: https://rippling.atlassian.net/wiki/spaces/I/pages/5198086415/GitHub+at+Rippling"
            echo ""
        fi
    fi
else
    echo -e "${RED}[✗] Git not found${NC}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    
    ask_for_instructions "Git" \
        "brew install git" \
        "Git is required for version control and to identify you as a user.
It's usually pre-installed on macOS, but can be installed via Homebrew."
fi

echo ""

# =============================================================================
# Check 4: Python (version 3.8+)
# =============================================================================
echo -e "${BLUE}[4/6] Checking Python...${NC}"

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version | sed 's/Python //')
    MAJOR_VERSION=$(echo "$PYTHON_VERSION" | cut -d. -f1)
    MINOR_VERSION=$(echo "$PYTHON_VERSION" | cut -d. -f2)
    
    if [ "$MAJOR_VERSION" -ge 3 ] && [ "$MINOR_VERSION" -ge 8 ]; then
        echo -e "${GREEN}[✓] Python: $PYTHON_VERSION${NC}"
    else
        echo -e "${RED}[✗] Python: $PYTHON_VERSION (need 3.8 or higher)${NC}"
        MISSING_COUNT=$((MISSING_COUNT + 1))
        
        ask_for_instructions "Python 3.8+" \
            "brew install pyenv && pyenv install 3.11.8 && pyenv global 3.11.8" \
            "Python 3.8+ is required to run the Snowflake MCP server.
Your current version ($PYTHON_VERSION) is too old.

Rippling recommends using pyenv to manage Python versions:

  1. Install pyenv:
     brew install pyenv readline xz

  2. Install Python 3.11.8:
     pyenv install 3.11.8
     pyenv global 3.11.8

  3. Add to ~/.zshrc and ~/.bashrc:
     export PYENV_ROOT=\"\$HOME/.pyenv\"
     export PATH=\"\$PYENV_ROOT/bin:\$PATH\"
     eval \"\$(pyenv init -)\"

  4. Restart your terminal

See: https://rippling.atlassian.net/wiki/spaces/I/pages/4138369063/Setting+Up+a+Laptop"
    fi
else
    echo -e "${RED}[✗] Python not found${NC}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    
    ask_for_instructions "Python" \
        "brew install pyenv && pyenv install 3.11.8 && pyenv global 3.11.8" \
        "Python is required to run the Snowflake MCP server (via uvx).

Rippling recommends using pyenv to manage Python versions:

  1. Install pyenv:
     brew install pyenv readline xz

  2. Install Python 3.11.8:
     pyenv install 3.11.8
     pyenv global 3.11.8

  3. Add to ~/.zshrc and ~/.bashrc:
     export PYENV_ROOT=\"\$HOME/.pyenv\"
     export PATH=\"\$PYENV_ROOT/bin:\$PATH\"
     eval \"\$(pyenv init -)\"

  4. Restart your terminal

See: https://rippling.atlassian.net/wiki/spaces/I/pages/4138369063/Setting+Up+a+Laptop"
fi

echo ""

# =============================================================================
# Check 5: uv (for uvx command)
# =============================================================================
echo -e "${BLUE}[5/6] Checking uv (uvx)...${NC}"

if command -v uvx &> /dev/null; then
    UV_VERSION=$(uvx --version 2>/dev/null || echo "installed")
    echo -e "${GREEN}[✓] uv/uvx: $UV_VERSION${NC}"
else
    echo -e "${RED}[✗] uv/uvx not found${NC}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    
    ask_for_instructions "uv" \
        'curl -LsSf https://astral.sh/uv/install.sh | sh' \
        "uv is a fast Python package manager. The uvx command is used to run
the Snowflake MCP server (snowflake-labs-mcp) which enables Cursor to
query Snowflake directly.

After installing, you MUST restart your terminal for the command to be available."
fi

echo ""

# =============================================================================
# Check 6: .env file
# =============================================================================
echo -e "${BLUE}[6/6] Checking .env file...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")")"

if [ -f "$REPO_ROOT/.env" ]; then
    # Check for required variables
    if grep -q "DATABASE_URL=" "$REPO_ROOT/.env" && ! grep -q "DATABASE_URL=$" "$REPO_ROOT/.env"; then
        echo -e "${GREEN}[✓] .env file exists with DATABASE_URL${NC}"
    else
        echo -e "${YELLOW}[!] .env file exists but DATABASE_URL is not set${NC}"
        echo ""
        echo -e "${YELLOW}You need a complete .env file from your admin.${NC}"
        echo "Ask your admin for the .env file, then copy it to the repository root."
        MISSING_COUNT=$((MISSING_COUNT + 1))
    fi
else
    echo -e "${RED}[✗] .env file not found${NC}"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    
    echo ""
    echo -e "${YELLOW}Would you like instructions on getting the .env file? (y/n)${NC}"
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${BLUE}--- .env File Setup ---${NC}"
        echo ""
        echo "The .env file contains database connection strings and configuration."
        echo "You need to get this from your admin - it includes:"
        echo "  - DATABASE_URL (Postgres connection)"
        echo "  - PRISMA_DATABASE_URL (Prisma Accelerate)"
        echo "  - AUTH_SECRET (session encryption)"
        echo "  - RIPPLING_ACCOUNT_EMAIL (your Snowflake email)"
        echo ""
        echo "Ask your admin for the .env file, then:"
        echo "  1. Copy the file to: $REPO_ROOT/.env"
        echo "  2. Update RIPPLING_ACCOUNT_EMAIL with your email"
        echo "  3. Create symlink: ln -sf ../.env web/.env"
        echo ""
    fi
fi

echo ""

# =============================================================================
# Summary
# =============================================================================
echo -e "${BLUE}=== Summary ===${NC}"
echo ""

if [ "$MISSING_COUNT" -eq 0 ]; then
    echo -e "${GREEN}All prerequisites are met! You're ready to run /setup.${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}$MISSING_COUNT prerequisite(s) need attention.${NC}"
    echo ""
    echo "After fixing the issues above:"
    echo "  1. Restart your terminal"
    echo "  2. Run this check again to verify"
    echo "  3. Then run /setup in Cursor"
    echo ""
    exit 1
fi
