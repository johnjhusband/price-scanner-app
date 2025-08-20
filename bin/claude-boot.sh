#!/bin/bash
# Claude Code Session Startup Script
# This script ensures CLAUDE.md is loaded at the start of every session

CLAUDE_MD_PATH="/Users/flippi/Documents/FlippiGitHub/CLAUDE.md"
FALLBACK_PATHS=(
    "$HOME/Documents/FlippiGitHub/CLAUDE.md"
    "$HOME/FlippiGitHub/CLAUDE.md"
    "./CLAUDE.md"
)

echo "🚀 Claude Code Session Initialization"
echo "===================================="

# Function to check if file exists and is readable
check_claude_md() {
    local path="$1"
    if [ -f "$path" ] && [ -r "$path" ]; then
        echo "✅ Found CLAUDE.md at: $path"
        echo ""
        echo "📋 Copy this message to Claude:"
        echo "----------------------------------------"
        echo "Please read the CLAUDE.md file at: $path"
        echo "This file contains critical behavior instructions for the Flippi.ai project."
        echo "After reading, confirm you've loaded all directives and linked documentation."
        echo "----------------------------------------"
        return 0
    fi
    return 1
}

# Check primary path first
if check_claude_md "$CLAUDE_MD_PATH"; then
    exit 0
fi

# Check fallback paths
echo "⚠️  CLAUDE.md not found at primary location: $CLAUDE_MD_PATH"
echo "Checking fallback locations..."
echo ""

for path in "${FALLBACK_PATHS[@]}"; do
    if check_claude_md "$path"; then
        echo ""
        echo "🔧 Consider updating the primary path in this script to: $path"
        exit 0
    fi
done

# If we get here, CLAUDE.md wasn't found anywhere
echo "❌ ERROR: CLAUDE.md not found in any expected location!"
echo ""
echo "Expected locations checked:"
echo "  - $CLAUDE_MD_PATH (primary)"
for path in "${FALLBACK_PATHS[@]}"; do
    echo "  - $path"
done
echo ""
echo "⚡ Quick fix - copy this to Claude:"
echo "----------------------------------------"
echo "CLAUDE.md file is missing. Please help me locate it using:"
echo "find ~ -name 'CLAUDE.md' -type f 2>/dev/null | grep -v node_modules"
echo "----------------------------------------"

exit 1