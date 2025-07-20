# Flippi.ai Deployment Guide (Consolidated)

Last Updated: July 19, 2025

## Overview

This is the consolidated deployment documentation for the Flippi.ai (My Thrifting Buddy) application. The app runs on a single DigitalOcean droplet with three environments using PM2 process manager and Nginx.

**Important**: The application now includes SQLite database support for user feedback collection. Each environment has its own database file that persists between deployments.

## Server Architecture

```
Single Server (157.245.142.145)
├── Production (app.flippi.ai) 
│   ├── Backend: Port 3000
│   ├── Frontend: Port 8080
│   └── Branch: master
├── Staging (green.flippi.ai)
│   ├── Backend: Port 3001
│   ├── Frontend: Port 8081
│   └── Branch: staging
└── Development (blue.flippi.ai)
    ├── Backend: Port 3002
    ├── Frontend: Port 8082
    └── Branch: develop
```

## Prerequisites

- Ubuntu 24.10 server
- Node.js 18.x
- PM2 (`npm install -g pm2`)
- Nginx
- Git
- SSL certificates (Let's Encrypt)
- OpenAI API key
- GitHub SSH deploy key configured

## Environment Configuration

### Backend .env Files

Each environment requires its own `.env` file:

```bash
# /var/www/app.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=production
FEEDBACK_DB_PATH=/var/lib/flippi/feedback.db

# /var/www/green.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=staging
FEEDBACK_DB_PATH=/var/lib/flippi-staging/feedback.db

# /var/www/blue.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3002
NODE_ENV=development
FEEDBACK_DB_PATH=/var/lib/flippi-dev/feedback.db
```

## Database Information

### SQLite Database Files

Each environment has its own SQLite database for storing user feedback:

- **Production**: `/var/lib/flippi/feedback.db`
- **Staging**: `/var/lib/flippi-staging/feedback.db`
- **Development**: `/var/lib/flippi-dev/feedback.db`

### Important Database Notes

1. **Not in Git**: Database files are listed in `.gitignore` and never committed
2. **Automatic Creation**: Database is created automatically on first feedback submission
3. **Persistence**: Database files persist between code deployments
4. **Permissions**: Database directories must be writable by the app user (www-data)

### Database Initialization

The application automatically creates the database on first use. The initialization logic is in the backend code:

```javascript
// Backend checks on startup
if (!fs.existsSync(process.env.FEEDBACK_DB_PATH)) {
  // Creates database with schema
  const db = new Database(process.env.FEEDBACK_DB_PATH);
  db.exec(`CREATE TABLE feedback (...)`);
}
```

## Automated Deployment (GitHub Actions)

### How It Works

Deployments are triggered automatically when pushing to specific branches:

- `develop` branch → blue.flippi.ai
- `staging` branch → green.flippi.ai  
- `master` branch → app.flippi.ai

### GitHub Actions Workflow

The deployment workflow (`.github/workflows/deploy-develop.yml`):

1. Connects to server via SSH
2. Resets local changes (`git reset --hard HEAD`)
3. Pulls latest code from branch
4. Installs backend dependencies
5. Builds frontend with Expo
6. Restarts PM2 services
7. Reloads Nginx

### For Developers

1. **Create feature branch**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make changes and push**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**:
   ```bash
   gh pr create --base develop --title "Your PR title" --body "Description"
   ```

4. **Merge to trigger deployment**:
   ```bash
   gh pr merge --merge
   ```

## Manual Deployment Process

If automated deployment fails, use these steps:

### 1. SSH to Server
```bash
ssh root@157.245.142.145
```

### 2. Navigate to Environment
```bash
cd /var/www/blue.flippi.ai    # Development
# OR
cd /var/www/green.flippi.ai   # Staging
# OR
cd /var/www/app.flippi.ai     # Production
```

### 3. Update Code
```bash
git reset --hard HEAD
git clean -fd
git pull origin [branch-name]
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install --production

# Frontend
cd ../mobile-app
npm install
npx expo install react-native-web react-dom @expo/metro-runtime
```

### 4a. Database Initialization (First Deployment Only)

The SQLite database will be automatically created on first use. To verify:

```bash
# Check if database directory exists
sudo mkdir -p /var/lib/flippi-dev  # or flippi-staging, flippi
sudo chown www-data:www-data /var/lib/flippi-dev

# Database will be created automatically when first feedback is submitted
# To manually verify database creation:
ls -la /var/lib/flippi-dev/feedback.db  # Should show file after first use
```

### 5. Build Frontend
```bash
npx expo export --platform web --output-dir dist
```

### 6. Restart Services
```bash
# Development
pm2 restart dev-backend dev-frontend

# Staging
pm2 restart staging-backend staging-frontend

# Production
pm2 restart prod-backend prod-frontend
```

### 7. Reload Nginx
```bash
nginx -s reload
```

## PM2 Configuration

The PM2 ecosystem is configured at `/var/www/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    // Production
    {
      name: 'prod-backend',
      script: '/var/www/app.flippi.ai/backend/server.js',
      cwd: '/var/www/app.flippi.ai/backend',
      env: { NODE_ENV: 'production', PORT: 3000 }
    },
    {
      name: 'prod-frontend',
      script: 'serve',
      args: '-s /var/www/app.flippi.ai/mobile-app/dist -l 8080',
      interpreter: 'npx'
    },
    // Staging and Development follow same pattern
  ]
};
```

### Common PM2 Commands

```bash
pm2 list                    # View all services
pm2 logs [service-name]     # View logs
pm2 restart [service-name]  # Restart service
pm2 show [service-name]     # Show service details
pm2 monit                   # Real-time monitoring
pm2 save                    # Save current configuration
```

## Nginx Configuration

Each domain has its own nginx config at `/etc/nginx/sites-available/[domain]`:

```nginx
server {
    server_name blue.flippi.ai;
    
    # API routes
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3002;
    }
    
    # Frontend
    location / {
        proxy_pass http://localhost:8082;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # SSL configuration (managed by Certbot)
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
}
```

## Troubleshooting

### Backend Not Responding (502 Error)

1. **Check PM2 status**:
   ```bash
   pm2 show dev-backend
   pm2 logs dev-backend --lines 50
   ```

2. **Verify .env file**:
   ```bash
   cat /var/www/blue.flippi.ai/backend/.env
   # Ensure OPENAI_API_KEY is set and PORT is correct
   ```

3. **Test backend directly**:
   ```bash
   curl http://localhost:3002/health
   ```

4. **Restart backend**:
   ```bash
   cd /var/www/blue.flippi.ai/backend
   npm install
   pm2 restart dev-backend
   ```

### Frontend Shows "Index of dist/"

This means the Expo build failed:

1. **Check build logs**:
   ```bash
   cd /var/www/blue.flippi.ai/mobile-app
   npx expo export --platform web --output-dir dist
   ```

2. **Common fixes**:
   - Fix any syntax errors in App.js
   - Ensure all dependencies are installed
   - Check for proper React Native Web setup

### SSL Certificate Issues

```bash
# Check certificates
certbot certificates

# Renew if needed
certbot renew
```

### Nginx Configuration Updates

When updating nginx configuration (e.g., to increase upload size limits):

1. **Manual Update via SSH**:
   ```bash
   # Run the update script
   bash /path/to/scripts/update-nginx-config.sh
   ```

2. **GitHub Actions Update**:
   - Go to Actions tab in GitHub
   - Select "Update Nginx Configuration" workflow
   - Click "Run workflow"
   - Type "yes" to confirm
   - Click "Run workflow"

3. **Manual Update**:
   ```bash
   # Edit nginx configs
   sudo nano /etc/nginx/sites-available/blue.flippi.ai
   
   # Add after server_name line:
   client_max_body_size 50M;
   
   # Test configuration
   sudo nginx -t
   
   # Reload if test passes
   sudo nginx -s reload
   ```

## Monitoring

### Check Service Health

```bash
# All environments
curl https://app.flippi.ai/health
curl https://green.flippi.ai/health
curl https://blue.flippi.ai/health

# Check logs
tail -f /var/log/nginx/error.log
pm2 logs --lines 100
```

### Performance Monitoring

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h
```

## Security Considerations

1. **Never commit sensitive data**:
   - OpenAI API keys
   - Database credentials
   - Private keys

2. **Use environment variables** for all secrets

3. **Keep dependencies updated**:
   ```bash
   npm audit
   npm audit fix
   ```

4. **Firewall configuration**:
   - Only ports 22, 80, 443 should be open
   - Backend ports (3000-3002) should only be accessible locally

## Backup and Recovery

### Database Backup

#### SQLite Feedback Database

Each environment has its own SQLite database for user feedback:

```bash
# Production backup
cp /var/lib/flippi/feedback.db /backup/feedback-prod-$(date +%Y%m%d).db

# Staging backup
cp /var/lib/flippi-staging/feedback.db /backup/feedback-staging-$(date +%Y%m%d).db

# Development backup
cp /var/lib/flippi-dev/feedback.db /backup/feedback-dev-$(date +%Y%m%d).db
```

**Note**: The SQLite database files are NOT stored in Git and persist between deployments.

### Code Backup
Code is versioned in Git. To restore:
```bash
git log --oneline
git reset --hard [commit-hash]
```

### Configuration Backup
```bash
# Backup PM2 config
pm2 save

# Backup Nginx config
cp -r /etc/nginx /backup/nginx-$(date +%Y%m%d)
```

## Future Improvements

1. **Automated Git-based deployment** (partially implemented)
2. **Health check monitoring**
3. **Automated backups**
4. **Load balancing for high availability**
5. **Container-based deployment (Docker/Kubernetes)**
6. **CI/CD pipeline with testing**

## Quick Reference

### Environment URLs
- Production: https://app.flippi.ai
- Staging: https://green.flippi.ai
- Development: https://blue.flippi.ai

### Server Access
```bash
ssh root@157.245.142.145
```

### Service Ports
- Production: Backend 3000, Frontend 8080
- Staging: Backend 3001, Frontend 8081
- Development: Backend 3002, Frontend 8082

### Common Issues & Solutions
- **502 Error**: Backend crashed - check PM2 logs
- **"Index of dist/"**: Frontend build failed - check syntax
- **"Analysis Failed"**: Check OpenAI API key in .env
- **SSL errors**: Run `certbot renew`

## Contact & Support

For deployment issues:
1. Check PM2 logs first
2. Verify environment variables
3. Test services individually
4. Check GitHub Actions logs for automated deployments