# Deployment Guide v2.0

Complete deployment instructions for My Thrifting Buddy application.

## Overview

The application runs on a single DigitalOcean droplet with three environments:
- **Production** (app.flippi.ai) - Master branch
- **Staging** (green.flippi.ai) - Staging branch  
- **Development** (blue.flippi.ai) - Develop branch

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Nginx (Port 80/443)               │
├─────────────┬──────────────┬───────────────────────┤
│   app.flippi.ai  │ green.flippi.ai │ blue.flippi.ai │
├─────────────┴──────────────┴───────────────────────┤
│                      PM2 Process Manager            │
├─────────────┬──────────────┬───────────────────────┤
│ Backend:3000│ Backend:3001 │ Backend:3002          │
│ Frontend:8080│ Frontend:8081│ Frontend:8082         │
└─────────────┴──────────────┴───────────────────────┘
```

## Prerequisites

- DigitalOcean droplet with Ubuntu 24.10
- Root access to server (157.245.142.145)
- Domain names configured with DNS pointing to server
- Git installed on server
- Node.js 18+ installed
- PM2 installed globally
- Nginx installed

## Initial Server Setup

### 1. Install Required Software
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git
```

### 2. Create Directory Structure
```bash
mkdir -p /var/www/app.flippi.ai
mkdir -p /var/www/green.flippi.ai
mkdir -p /var/www/blue.flippi.ai
```

### 3. Configure Git Access
```bash
# Generate SSH key for deployments
ssh-keygen -t rsa -b 4096 -C "deploy@flippi.ai"

# Add public key to GitHub repo as deploy key
cat ~/.ssh/id_rsa.pub
```

## Deployment Process

### Current Manual Process

1. **Copy code to server**
```bash
# From local machine
scp -r backend mobile-app root@157.245.142.145:/var/www/app.flippi.ai/
```

2. **Install dependencies**
```bash
ssh root@157.245.142.145
cd /var/www/app.flippi.ai/backend
npm install --production
cd ../mobile-app
npm install
```

3. **Build frontend**
```bash
cd /var/www/app.flippi.ai/mobile-app
npx expo export:web  # Creates dist/ folder
```

4. **Start services with PM2**
```bash
# Backend
cd /var/www/app.flippi.ai/backend
pm2 start server.js --name prod-backend

# Frontend
cd /var/www/app.flippi.ai/mobile-app
pm2 start "npx serve -s dist -l 8080" --name prod-frontend
```

### Intended Git-Based Process (TODO)

1. **Clone repositories**
```bash
cd /var/www/app.flippi.ai
git clone git@github.com:yourusername/price-scanner-app.git .
git checkout master

cd /var/www/green.flippi.ai
git clone git@github.com:yourusername/price-scanner-app.git .
git checkout staging

cd /var/www/blue.flippi.ai
git clone git@github.com:yourusername/price-scanner-app.git .
git checkout develop
```

2. **Create deployment script**
```bash
#!/bin/bash
# /root/deploy.sh

ENV=$1  # prod, staging, or dev

case $ENV in
  prod)
    DIR="/var/www/app.flippi.ai"
    BRANCH="master"
    BACKEND_NAME="prod-backend"
    FRONTEND_NAME="prod-frontend"
    ;;
  staging)
    DIR="/var/www/green.flippi.ai"
    BRANCH="staging"
    BACKEND_NAME="staging-backend"
    FRONTEND_NAME="staging-frontend"
    ;;
  dev)
    DIR="/var/www/blue.flippi.ai"
    BRANCH="develop"
    BACKEND_NAME="dev-backend"
    FRONTEND_NAME="dev-frontend"
    ;;
esac

cd $DIR
git pull origin $BRANCH

# Backend
cd backend
npm install --production
pm2 restart $BACKEND_NAME

# Frontend
cd ../mobile-app
npm install
npx expo export:web
pm2 restart $FRONTEND_NAME
```

## Nginx Configuration

### 1. Create site configurations
```bash
# /etc/nginx/sites-available/app.flippi.ai
server {
    listen 80;
    server_name app.flippi.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name app.flippi.ai;

    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /health {
        proxy_pass http://localhost:3000;
    }

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 2. Enable sites
```bash
ln -s /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-enabled/

nginx -t
systemctl reload nginx
```

## SSL Certificate Setup

### Using Let's Encrypt
```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Generate certificates
certbot --nginx -d app.flippi.ai
certbot --nginx -d green.flippi.ai
certbot --nginx -d blue.flippi.ai

# Auto-renewal is configured automatically
```

## PM2 Configuration

### 1. Create ecosystem file
```javascript
// /var/www/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'prod-backend',
      script: '/var/www/app.flippi.ai/backend/server.js',
      cwd: '/var/www/app.flippi.ai/backend',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'prod-frontend',
      script: 'serve',
      args: '-s /var/www/app.flippi.ai/mobile-app/dist -l 8080',
      interpreter: 'npx'
    },
    // Repeat for staging and dev
  ]
};
```

### 2. Start all services
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Configure auto-start on reboot
```

## Environment Variables

### Backend .env files
```bash
# /var/www/app.flippi.ai/backend/.env
OPENAI_API_KEY=your_api_key_here
PORT=3000
NODE_ENV=production

# /var/www/green.flippi.ai/backend/.env
OPENAI_API_KEY=your_api_key_here
PORT=3001
NODE_ENV=staging

# /var/www/blue.flippi.ai/backend/.env
OPENAI_API_KEY=your_api_key_here
PORT=3002
NODE_ENV=development
```

## Monitoring and Maintenance

### Health Checks
```bash
# Check all services
curl https://app.flippi.ai/health
curl https://green.flippi.ai/health
curl https://blue.flippi.ai/health

# PM2 status
pm2 status
pm2 monit
```

### Logs
```bash
# PM2 logs
pm2 logs
pm2 logs prod-backend
pm2 logs prod-frontend

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
# Individual service
pm2 restart prod-backend

# All services
pm2 restart all

# Nginx
systemctl restart nginx
```

## Rollback Procedure

### Quick Rollback
```bash
# If using git deployments
cd /var/www/app.flippi.ai
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>
pm2 restart prod-backend prod-frontend
```

### Full Rollback
1. Stop current services
2. Restore previous code version
3. Rebuild frontend if needed
4. Restart services
5. Verify functionality

## Security Considerations

1. **Firewall Configuration**
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

2. **Fail2ban** (optional)
```bash
apt install fail2ban
# Configure for SSH protection
```

3. **Regular Updates**
```bash
# Create update script
#!/bin/bash
apt update
apt upgrade -y
npm update -g pm2
pm2 update
```

## Troubleshooting

### Service not responding
```bash
# Check PM2
pm2 list
pm2 describe <service-name>
pm2 logs <service-name>

# Check ports
netstat -tlnp | grep -E "(3000|8080)"

# Restart service
pm2 restart <service-name>
```

### SSL issues
```bash
# Test certificate
certbot certificates

# Renew manually
certbot renew --dry-run
certbot renew
```

### Nginx errors
```bash
# Test configuration
nginx -t

# Check error log
tail -f /var/log/nginx/error.log

# Reload
systemctl reload nginx
```

## Backup Strategy

### Daily Backups
```bash
# Create backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
tar -czf /backups/app-$DATE.tar.gz /var/www/
tar -czf /backups/nginx-$DATE.tar.gz /etc/nginx/
tar -czf /backups/letsencrypt-$DATE.tar.gz /etc/letsencrypt/

# Keep only last 7 days
find /backups -name "*.tar.gz" -mtime +7 -delete
```

### Add to crontab
```bash
crontab -e
0 2 * * * /root/backup.sh
```

## Performance Optimization

1. **PM2 Cluster Mode** (for high traffic)
```javascript
{
  name: 'prod-backend',
  script: 'server.js',
  instances: 'max',
  exec_mode: 'cluster'
}
```

2. **Nginx Caching**
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **Gzip Compression**
```nginx
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

## Disaster Recovery

1. **Regular snapshots** via DigitalOcean
2. **Off-site backups** to S3 or similar
3. **Documentation** of all configurations
4. **Test restore procedures** quarterly

## Contact Information

- Server: 157.245.142.145
- Domains: app.flippi.ai, green.flippi.ai, blue.flippi.ai
- PM2 Web Monitor: `pm2 web` (if enabled)

Remember: Always test in development (blue) first, then staging (green), before deploying to production!