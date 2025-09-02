#!/bin/bash
# Safe git pull that handles divergent branches
# Use this instead of git pull in deployment scripts

echo "=== Safe Git Pull ==="

# Fetch latest
git fetch origin

# Get current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"

# Check if we have diverged
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/$CURRENT_BRANCH)
BASE=$(git merge-base HEAD origin/$CURRENT_BRANCH)

if [ "$LOCAL" = "$REMOTE" ]; then
    echo "Already up-to-date!"
elif [ "$LOCAL" = "$BASE" ]; then
    echo "Fast-forward possible"
    git pull origin $CURRENT_BRANCH
elif [ "$REMOTE" = "$BASE" ]; then
    echo "Local is ahead of remote (unusual for deployment)"
    git pull origin $CURRENT_BRANCH
else
    echo "Branches have diverged! Force resetting to remote..."
    git reset --hard origin/$CURRENT_BRANCH
    echo "Reset complete"
fi

echo "Final status:"
git log --oneline -1