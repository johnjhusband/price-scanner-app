#!/bin/bash
# Fix divergent staging branch issue
# This script should be run on the server when deployment fails due to divergent branches

echo "=== Fixing divergent staging branch ==="
echo "Current directory: $(pwd)"

# Ensure we're in the right directory
if [[ ! -d ".git" ]]; then
    echo "ERROR: Not in a git repository!"
    exit 1
fi

# Show current status
echo "Current branch status:"
git status --short
git branch -v

# Fetch latest from origin
echo ""
echo "Fetching latest from origin..."
git fetch origin

# Force reset to origin/staging
echo ""
echo "Force resetting to origin/staging..."
git reset --hard origin/staging

# Clean any untracked files
echo ""
echo "Cleaning untracked files..."
git clean -fd

# Verify the reset
echo ""
echo "Verification:"
git log --oneline -1
git status

echo ""
echo "=== Divergent branch fixed! ==="
echo "You can now run the deployment again."