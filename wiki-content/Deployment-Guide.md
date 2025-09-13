# Deployment Guide

## 🚀 How It Works

```
Developer pushes → GitHub Actions → Auto-deploy
```

## Branch Mapping
- `develop` → blue.flippi.ai
- `staging` → green.flippi.ai
- `master` → app.flippi.ai

## Key Principles
1. **No manual deployments** - Everything through GitHub Actions
2. **No SSH edits** - All changes via Git  
3. **Build locally** - Push to server
4. **Test before claiming success**

## Deploy Commands
```bash
# Work in FlippiMaster directory
cd /Users/flippi/Documents/FlippiMaster/price-scanner-app

# Make changes, then:
git add .
git commit -m "feat: your change"
git push origin develop
```

## Workflow Files
- `.github/workflows/deploy-develop.yml` → Blue
- `.github/workflows/deploy-staging.yml` → Green
- `.github/workflows/deploy-production.yml` → Production

[[GitHub-Actions-Details]]