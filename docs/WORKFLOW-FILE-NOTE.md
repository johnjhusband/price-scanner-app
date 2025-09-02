# GitHub Workflow File Creation Note

## Issue #158: Clean Frontend Architecture

The GitHub Actions workflow file `.github/workflows/deploy-develop-v2.yml` could not be automatically created due to OAuth scope restrictions.

### Manual Steps Required

1. The workflow file content has been saved here for manual creation
2. A user with appropriate GitHub permissions needs to:
   - Go to the GitHub repository
   - Create `.github/workflows/deploy-develop-v2.yml`
   - Copy the content below into the file

### Workflow File Content

```yaml
name: Deploy to Blue (Clean Architecture)

on:
  push:
    branches: [ develop ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: mobile-app/package-lock.json
    
    - name: Install frontend dependencies
      working-directory: ./mobile-app
      run: npm ci
    
    - name: Build frontend for production
      working-directory: ./mobile-app
      run: |
        # Clean any previous builds
        rm -rf dist
        
        # Build with production environment
        NODE_ENV=production npm run build:web
        
        # Verify build output
        echo "Build complete. Contents of dist:"
        ls -la dist/
        
        # Create build info
        echo "{\"buildTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\", \"commit\": \"$GITHUB_SHA\"}" > dist/build-info.json
    
    - name: Deploy to Blue Server
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY_BLUE }}
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST_BLUE }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER_BLUE }}
      run: |
        # Setup SSH
        mkdir -p ~/.ssh
        echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
        chmod 600 ~/.ssh/deploy_key
        ssh-keyscan -H $DEPLOY_HOST >> ~/.ssh/known_hosts
        
        # Create deployment script
        cat > deploy.sh << 'EOF'
        #!/bin/bash
        set -e
        
        echo "Starting frontend deployment..."
        
        # Backup current frontend (if exists)
        if [ -d /var/www/blue.flippi.ai/frontend ]; then
          sudo mv /var/www/blue.flippi.ai/frontend /var/www/blue.flippi.ai/frontend.backup.$(date +%Y%m%d_%H%M%S)
        fi
        
        # Create clean frontend directory
        sudo mkdir -p /var/www/blue.flippi.ai/frontend
        sudo chown $USER:$USER /var/www/blue.flippi.ai/frontend
        
        # Extract new frontend files
        cd /var/www/blue.flippi.ai/frontend
        tar -xzf /tmp/frontend-dist.tar.gz
        
        # Set proper permissions
        sudo chown -R www-data:www-data /var/www/blue.flippi.ai/frontend
        sudo chmod -R 755 /var/www/blue.flippi.ai/frontend
        
        # Update PM2 to serve from new location
        pm2 stop prod-frontend || true
        pm2 delete prod-frontend || true
        
        # Start static file server
        cd /var/www/blue.flippi.ai/frontend
        pm2 serve . 8082 --name prod-frontend --spa
        pm2 save
        
        # Update nginx to point to new frontend location
        sudo sed -i 's|/var/www/blue.flippi.ai/mobile-app|/var/www/blue.flippi.ai/frontend|g' /etc/nginx/sites-available/blue.flippi.ai
        
        # Test and reload nginx
        sudo nginx -t && sudo nginx -s reload
        
        # Cleanup
        rm /tmp/frontend-dist.tar.gz
        
        echo "Frontend deployment complete!"
        echo "Build info:"
        cat /var/www/blue.flippi.ai/frontend/build-info.json
        EOF
        
        # Create tarball of dist directory
        cd mobile-app
        tar -czf frontend-dist.tar.gz dist/
        
        # Copy files to server
        scp -i ~/.ssh/deploy_key frontend-dist.tar.gz $DEPLOY_USER@$DEPLOY_HOST:/tmp/
        scp -i ~/.ssh/deploy_key ../deploy.sh $DEPLOY_USER@$DEPLOY_HOST:/tmp/
        
        # Execute deployment
        ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST 'chmod +x /tmp/deploy.sh && /tmp/deploy.sh'
        
        # Cleanup
        rm -f ~/.ssh/deploy_key frontend-dist.tar.gz
    
    - name: Verify deployment
      env:
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST_BLUE }}
      run: |
        echo "Waiting for deployment to settle..."
        sleep 10
        
        # Check if site is accessible
        response=$(curl -s -o /dev/null -w "%{http_code}" https://blue.flippi.ai || echo "000")
        
        if [ "$response" = "200" ]; then
          echo "✅ Deployment successful! Site is accessible."
          
          # Check build info
          curl -s https://blue.flippi.ai/build-info.json || echo "Build info not accessible"
        else
          echo "❌ Deployment verification failed. HTTP response: $response"
          exit 1
        fi
    
    - name: Deploy backend (if needed)
      env:
        DEPLOY_KEY: ${{ secrets.DEPLOY_KEY_BLUE }}
        DEPLOY_HOST: ${{ secrets.DEPLOY_HOST_BLUE }}
        DEPLOY_USER: ${{ secrets.DEPLOY_USER_BLUE }}
      run: |
        # This step only runs if backend files changed
        if git diff --name-only HEAD~1 | grep -q "^backend/"; then
          echo "Backend changes detected, deploying..."
          
          # Setup SSH
          mkdir -p ~/.ssh
          echo "$DEPLOY_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          
          # Deploy backend
          rsync -avz --delete \
            -e "ssh -i ~/.ssh/deploy_key" \
            --exclude 'node_modules' \
            --exclude '.env' \
            --exclude 'logs' \
            ./backend/ $DEPLOY_USER@$DEPLOY_HOST:/var/www/blue.flippi.ai/backend/
          
          # Restart backend
          ssh -i ~/.ssh/deploy_key $DEPLOY_USER@$DEPLOY_HOST "cd /var/www/blue.flippi.ai/backend && npm install --production && pm2 restart prod-backend"
          
          rm -f ~/.ssh/deploy_key
        else
          echo "No backend changes detected, skipping backend deployment"
        fi
```

### Required GitHub Secrets

The following secrets need to be configured in the repository settings:
- `DEPLOY_KEY_BLUE` - SSH private key for blue server
- `DEPLOY_HOST_BLUE` - Hostname/IP of blue server
- `DEPLOY_USER_BLUE` - Username for SSH access

### Note

This workflow file is essential for completing Issue #158. Once manually created, it will enable clean, reproducible builds that eliminate the Expo cache contamination issues.