#!/bin/bash

# Migration script: Folders to Git branches
# This script will convert your blue/green/prod folders into Git branches

set -e  # Exit on any error

echo "🚀 Starting migration from folders to Git branches..."
echo ""

# Check if we're in the right directory
if [ ! -d "blue" ] || [ ! -d "green" ] || [ ! -d "prod" ]; then
    echo "❌ Error: blue, green, or prod folders not found!"
    echo "Make sure you're in the price-scanner-app directory"
    exit 1
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Error: You have uncommitted changes!"
    echo "Please commit or stash your changes first"
    exit 1
fi

echo "📋 Current setup:"
echo "- prod folder → will become master branch"
echo "- green folder → will become staging branch"
echo "- blue folder → will be archived (green is newer)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Create a backup branch of current state
echo ""
echo "1️⃣ Creating backup of current state..."
git checkout -b backup-folder-structure-$(date +%Y%m%d-%H%M%S)
git add -A
git commit -m "Backup: Final folder structure before migration" || true
git checkout master

# Step 2: Create staging branch from green folder
echo ""
echo "2️⃣ Creating staging branch from green folder..."
git checkout -b staging

# Remove everything except .git and folders
find . -maxdepth 1 -not -name '.git' -not -name 'blue' -not -name 'green' -not -name 'prod' -not -name '.' -exec rm -rf {} \;

# Copy green contents to root
cp -r green/* . 2>/dev/null || true
cp -r green/.[^.]* . 2>/dev/null || true

# Remove the folders from this branch
rm -rf blue green prod

git add -A
git commit -m "Create staging branch from green folder (latest code)"
git push -u origin staging

echo "✅ Staging branch created and pushed"

# Step 3: Create develop branch from staging
echo ""
echo "3️⃣ Creating develop branch for future development..."
git checkout -b develop
git push -u origin develop

echo "✅ Develop branch created and pushed"

# Step 4: Update master branch from prod folder
echo ""
echo "4️⃣ Updating master branch from prod folder..."
git checkout master

# Remove everything except .git and folders
find . -maxdepth 1 -not -name '.git' -not -name 'blue' -not -name 'green' -not -name 'prod' -not -name '.' -exec rm -rf {} \;

# Copy prod contents to root
cp -r prod/* . 2>/dev/null || true
cp -r prod/.[^.]* . 2>/dev/null || true

# Remove the folders from this branch
rm -rf blue green prod

git add -A
git commit -m "Update master branch from prod folder (production code)"
git push

echo "✅ Master branch updated and pushed"

# Step 5: Create deployment workflows
echo ""
echo "5️⃣ Creating deployment workflows..."
mkdir -p .github/workflows

# Create develop deployment workflow
cat > .github/workflows/deploy-develop.yml << 'EOF'
name: Deploy Develop to Blue

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to blue.flippi.ai
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: blue.flippi.ai
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/app
            git fetch origin
            git checkout develop
            git pull origin develop
            docker-compose down
            docker-compose up -d --build
EOF

# Create staging deployment workflow  
cat > .github/workflows/deploy-staging.yml << 'EOF'
name: Deploy Staging to Green

on:
  push:
    branches: [staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to green.flippi.ai
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: green.flippi.ai
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/app
            git fetch origin
            git checkout staging
            git pull origin staging
            docker-compose down
            docker-compose up -d --build
EOF

# Create production deployment workflow
cat > .github/workflows/deploy-production.yml << 'EOF'
name: Deploy Production

on:
  push:
    branches: [master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to app.flippi.ai
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: app.flippi.ai
          username: root
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/app
            git fetch origin
            git checkout master
            git pull origin master
            docker-compose down
            docker-compose up -d --build
EOF

git add .github/workflows/
git commit -m "Add deployment workflows for each branch"
git push

echo "✅ Deployment workflows created"

# Summary
echo ""
echo "🎉 Migration complete!"
echo ""
echo "📚 Your new branch structure:"
echo "- master (production) → deploys to app.flippi.ai"
echo "- staging (testing) → deploys to green.flippi.ai"  
echo "- develop (active dev) → deploys to blue.flippi.ai"
echo ""
echo "🔄 Your new workflow:"
echo "1. git checkout develop  # Work on new features"
echo "2. git checkout staging && git merge develop  # Test features"
echo "3. git checkout master && git merge staging  # Deploy to production"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Add SSH_PRIVATE_KEY to GitHub Secrets"
echo "2. Update /path/to/app in the workflow files"
echo "3. Configure your servers to pull the correct branch"
echo ""
echo "Current branch: $(git branch --show-current)"