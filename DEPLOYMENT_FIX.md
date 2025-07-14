# Deployment Fix Instructions

## For Other AI Developers

### How to Deploy Your Changes

1. **Create your feature branch from develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request**:
   ```bash
   gh pr create --base develop --title "Your PR title" --body "Description"
   ```

4. **Merge when ready**:
   ```bash
   gh pr merge --merge
   ```

### Deployment will happen automatically when:
- Push to `develop` → deploys to blue.flippi.ai (dev)
- Push to `staging` → deploys to green.flippi.ai (test)
- Push to `master` → deploys to app.flippi.ai (prod)

## Server Git Setup (One-time fix)

Run this on the server to prevent git conflicts:

```bash
# For each environment
cd /var/www/blue.flippi.ai
git config pull.rebase false
git config pull.ff only

cd /var/www/green.flippi.ai  
git config pull.rebase false
git config pull.ff only

cd /var/www/app.flippi.ai
git config pull.rebase false
git config pull.ff only
```

## If Deployment Fails

The deployment workflow should handle everything, but if needed:

```bash
ssh root@157.245.142.145
cd /var/www/blue.flippi.ai
git reset --hard origin/develop
cd mobile-app
npx expo export --platform web
pm2 restart dev-frontend
```