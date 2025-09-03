#!/bin/bash

# Deploy to blue.flippi.ai using GitHub Actions
# This script triggers the deployment workflow manually

echo "🚀 Deploying to blue.flippi.ai..."
echo

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "Install it with: brew install gh"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d ".github" ]; then
    echo "❌ Please run this from the price-scanner-app root directory"
    exit 1
fi

# Get current branch
BRANCH=$(git branch --show-current)
echo "Current branch: $BRANCH"

# Get latest commit
COMMIT=$(git rev-parse --short HEAD)
echo "Latest commit: $COMMIT"

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: You have uncommitted changes"
    read -p "Continue anyway? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo
echo "Triggering deployment workflow..."

# Trigger the workflow
gh workflow run "Deploy Development (Clean Build)" \
    --repo johnjhusband/price-scanner-app \
    --ref develop \
    || echo "Note: If workflow not found, push the workflow file first"

echo
echo "✅ Deployment triggered!"
echo
echo "Monitor progress:"
echo "  gh run list --workflow='Deploy Development (Clean Build)' --repo johnjhusband/price-scanner-app"
echo
echo "Or view in browser:"
echo "  https://github.com/johnjhusband/price-scanner-app/actions"
echo
echo "After deployment completes, test with:"
echo "  cd ../playclone && node ralph-test-legal-pages.js"