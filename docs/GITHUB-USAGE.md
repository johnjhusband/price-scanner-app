# GitHub Usage Guide

This document outlines how the My Thrifting Buddy project uses GitHub for version control, branching strategy, and deployment workflows.

## Branch Strategy

The project follows a three-branch strategy aligned with the blue-green deployment model:

### Primary Branches

1. **`master`** (Production)
   - Maps to: `app.flippi.ai`
   - Protected branch - requires management approval
   - Only accepts PRs from `staging` branch
   - Automatically deploys via GitHub Actions on push

2. **`staging`** (Test Environment)
   - Maps to: `green.flippi.ai`
   - For thorough testing before production
   - Accepts PRs from `develop` branch
   - Automatically deploys via GitHub Actions on push

3. **`develop`** (Development Environment)
   - Maps to: `blue.flippi.ai`
   - Active development branch
   - Feature branches merge here first
   - Automatically deploys via GitHub Actions on push

### Feature Branches
- Create from: `develop`
- Naming: `feature/description-of-feature`
- Merge back to: `develop` via PR

## Current Deployment Approach (Manual)

Currently, deployments are done manually using shell scripts that:

1. Build Docker images locally
2. Save images to tar files
3. SCP transfer to server
4. Load and restart containers

### Manual Deployment Scripts
```bash
# Deploy to specific environment
./deploy-to-server.sh production master
./deploy-to-server.sh staging staging
./deploy-to-server.sh development develop

# Other deployment variants
./deploy-all-environments.sh  # Deploy all three environments
./deploy-production-now.sh    # Quick production deployment
```

### Issues with Manual Approach
- Requires local Docker builds
- Large file transfers (Docker images)
- No automatic rollback
- Inconsistent deployment environments
- Time-consuming process

## Intended Approach (Git-Based)

The project has GitHub Actions workflows configured but requires server-side setup to fully utilize them.

### GitHub Actions Workflows

1. **`.github/workflows/deploy-production.yml`**
   - Triggers on push to `master`
   - SSHs to server and runs git pull
   - Rebuilds and restarts production

2. **`.github/workflows/deploy-staging.yml`**
   - Triggers on push to `staging`
   - Deploys to green.flippi.ai

3. **`.github/workflows/deploy-develop.yml`**
   - Triggers on push to `develop`
   - Deploys to blue.flippi.ai

### Required Server Setup for Git-Based Deployment

To enable git-based deployments, the server needs:

```bash
# 1. Clone repositories to appropriate directories
cd /var/www
git clone https://github.com/your-org/price-scanner-app.git app.flippi.ai
git clone https://github.com/your-org/price-scanner-app.git green.flippi.ai
git clone https://github.com/your-org/price-scanner-app.git blue.flippi.ai

# 2. Checkout appropriate branches
cd app.flippi.ai && git checkout master
cd ../green.flippi.ai && git checkout staging
cd ../blue.flippi.ai && git checkout develop

# 3. Install PM2 for process management
npm install -g pm2

# 4. Create PM2 ecosystem file for each environment
```

## Blue-Green Deployment with Git

### Development Cycle

1. **Development Phase** (Blue Environment)
   ```bash
   git checkout develop
   # Make changes
   git add .
   git commit -m "feat: add new feature"
   git push origin develop
   # Automatically deploys to blue.flippi.ai
   ```

2. **Testing Phase** (Green Environment)
   ```bash
   git checkout staging
   git merge develop
   git push origin staging
   # Automatically deploys to green.flippi.ai
   ```

3. **Production Release** (Production)
   ```bash
   git checkout master
   git merge staging
   git push origin master
   # Automatically deploys to app.flippi.ai
   ```

### Environment Rotation
When blue becomes stable and green becomes dev:
1. Update branch mappings in workflows
2. Switch nginx configurations
3. Update DNS if needed

## Best Practices for Commits

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

### Examples
```bash
# Good commits
git commit -m "feat(backend): add price estimation endpoint"
git commit -m "fix(mobile): resolve camera permission issue on iOS"
git commit -m "docs: update deployment instructions"

# Bad commits
git commit -m "fixed stuff"
git commit -m "WIP"
git commit -m "asdfasdf"
```

## Pull Request Guidelines

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Tested on mobile device
- [ ] API endpoints verified

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

### PR Process
1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR to `develop`
4. Request review
5. Address feedback
6. Merge when approved

## Transitioning to Git-Based Deployment

### Phase 1: Server Preparation
```bash
# On the server
mkdir -p /var/www/{app.flippi.ai,green.flippi.ai,blue.flippi.ai}
cd /var/www

# Clone repos
git clone git@github.com:your-org/price-scanner-app.git app.flippi.ai
git clone git@github.com:your-org/price-scanner-app.git green.flippi.ai
git clone git@github.com:your-org/price-scanner-app.git blue.flippi.ai

# Setup branches
(cd app.flippi.ai && git checkout master)
(cd green.flippi.ai && git checkout staging)
(cd blue.flippi.ai && git checkout develop)
```

### Phase 2: Install Dependencies
```bash
# Install Node.js and PM2
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pm2

# Setup PM2 startup
pm2 startup
```

### Phase 3: Create PM2 Ecosystem Files
```javascript
// /var/www/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'prod-backend',
      script: '/var/www/app.flippi.ai/backend/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'prod-frontend',
      script: 'serve',
      args: '-s /var/www/app.flippi.ai/mobile-app/web-build -l 8080',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'staging-backend',
      script: '/var/www/green.flippi.ai/backend/server.js',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      }
    },
    {
      name: 'staging-frontend',
      script: 'serve',
      args: '-s /var/www/green.flippi.ai/mobile-app/web-build -l 8081',
      env: {
        NODE_ENV: 'staging'
      }
    },
    {
      name: 'dev-backend',
      script: '/var/www/blue.flippi.ai/backend/server.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      }
    },
    {
      name: 'dev-frontend',
      script: 'serve',
      args: '-s /var/www/blue.flippi.ai/mobile-app/web-build -l 8082',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
};
```

### Phase 4: Update GitHub Actions
Add the SSH_PRIVATE_KEY secret to GitHub:
1. Go to Settings → Secrets → Actions
2. Add `SSH_PRIVATE_KEY` with server's private key

### Phase 5: Test Deployment
```bash
# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify automated deployment"
git push origin develop

# Watch GitHub Actions and verify deployment
```

### Phase 6: Remove Docker Dependencies
Once git-based deployment is working:
1. Stop Docker containers
2. Remove Docker images
3. Update nginx to proxy to PM2 processes
4. Archive manual deployment scripts

## Monitoring Deployments

### GitHub Actions
- Check Actions tab for deployment status
- Enable notifications for failed deployments
- Review logs for any issues

### Server Monitoring
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs prod-backend
pm2 logs staging-backend
pm2 logs dev-backend

# Monitor resources
pm2 monit
```

### Health Checks
Each environment has health endpoints:
- https://app.flippi.ai/health
- https://green.flippi.ai/health
- https://blue.flippi.ai/health

## Rollback Procedures

### Quick Rollback (Git-Based)
```bash
# On server
cd /var/www/app.flippi.ai
git log --oneline -10  # Find previous good commit
git checkout <commit-hash>
pm2 restart prod-backend prod-frontend
```

### Full Rollback
```bash
# Revert on GitHub
git revert <bad-commit>
git push origin master
# Let GitHub Actions redeploy
```

## Security Considerations

1. **SSH Keys**: Use deployment-specific SSH keys
2. **Secrets**: Store in GitHub Secrets, not in code
3. **Branch Protection**: Enable for master and staging
4. **Review Requirements**: Require PR reviews for production
5. **Environment Variables**: Use .env files on server, not in repo

## Troubleshooting

### GitHub Actions Failing
1. Check SSH key is correct
2. Verify server connectivity
3. Check file permissions on server
4. Review action logs for specific errors

### Deployment Not Reflecting Changes
1. Verify correct branch is checked out
2. Check git pull succeeded
3. Ensure PM2 restarted processes
4. Clear any caches (CDN, browser)

### Port Conflicts
Ensure each environment uses different ports:
- Production: 3000 (backend), 8080 (frontend)
- Staging: 3001 (backend), 8081 (frontend)
- Development: 3002 (backend), 8082 (frontend)