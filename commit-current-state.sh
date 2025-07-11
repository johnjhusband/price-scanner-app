#!/bin/bash

echo "=== Committing current state to GitHub ==="

cd /mnt/c/Users/jhusband/price-scanner-app

# Add all files
git add -A

# Create commit
git commit -m "Backup current state before restructuring to prod/blue/green folders

- Production working at app.flippi.ai
- Enhanced features ready in -enhanced files
- Multiple deployment scripts and fixes
- About to reorganize into cleaner structure

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Show status
git status

echo "=== Commit complete. Push when ready with: git push ==="