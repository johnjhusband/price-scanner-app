# DEPLOYMENT INSTRUCTIONS - v2.0

## Overview
Deployment uses PM2 process manager and Nginx on a single DigitalOcean droplet with three environments.

## Prerequisites
- Ubuntu 24.10 server
- Node.js 18.x installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed
- Git installed
- SSL certificates (Let's Encrypt)
- OpenAI API key

## Server Architecture
```
Single Server (157.245.142.145)
├── Production (app.flippi.ai) - Port 3000/8080
├── Staging (green.flippi.ai) - Port 3001/8081
└── Development (blue.flippi.ai) - Port 3002/8082
```

## Initial Server Setup

### 1. Install Dependencies
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

## Environment Configuration

### Backend .env Files
Create `.env` file for each environment:

```bash
# /var/www/app.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=production

# /var/www/green.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=staging

# /var/www/blue.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3002
NODE_ENV=development
```

## Deployment Process

### Current Manual Process

#### 1. Copy Files to Server
From your local machine:
```bash
# Copy backend and frontend to production
scp -r backend mobile-app root@157.245.142.145:/var/www/app.flippi.ai/

# Repeat for staging and development
scp -r backend mobile-app root@157.245.142.145:/var/www/green.flippi.ai/
scp -r backend mobile-app root@157.245.142.145:/var/www/blue.flippi.ai/
```

#### 2. Install Dependencies on Server
```bash
ssh root@157.245.142.145

# Production
cd /var/www/app.flippi.ai/backend
npm install --production
cd ../mobile-app
npm install
npx expo install react-native-web react-dom @expo/metro-runtime

# Repeat for staging and development environments
```

#### 3. Build Frontend
```bash
# Production
cd /var/www/app.flippi.ai/mobile-app
npx expo export:web

# Staging
cd /var/www/green.flippi.ai/mobile-app
npx expo export:web

# Development
cd /var/www/blue.flippi.ai/mobile-app
npx expo export:web
```

#### 4. Start Services with PM2
```bash
# Start all services using ecosystem file
pm2 start /var/www/ecosystem.config.js

# Or start individually:
# Production
cd /var/www/app.flippi.ai/backend
pm2 start server.js --name prod-backend
cd ../mobile-app
pm2 start "npx serve -s dist -l 8080" --name prod-frontend

# Save PM2 configuration
pm2 save
pm2 startup
```

### Future Git-Based Process (Recommended)

#### 1. Set Up Git Repository on Server
```bash
# Production
cd /var/www/app.flippi.ai
git init
git remote add origin git@github.com:yourusername/price-scanner-app.git
git checkout master

# Staging
cd /var/www/green.flippi.ai
git init
git remote add origin git@github.com:yourusername/price-scanner-app.git
git checkout staging

# Development
cd /var/www/blue.flippi.ai
git init
git remote add origin git@github.com:yourusername/price-scanner-app.git
git checkout develop
```

#### 2. Deploy with Git Pull
```bash
# Example: Deploy to production
cd /var/www/app.flippi.ai
git pull origin master

# Update backend
cd backend
npm install --production
pm2 restart prod-backend

# Update frontend
cd ../mobile-app
npm install
npx expo export:web
pm2 restart prod-frontend
```

## Nginx Configuration

### 1. Create Site Configuration
Create `/etc/nginx/sites-available/app.flippi.ai`:
```nginx
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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000;
    }

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Repeat for green.flippi.ai (ports 3001/8081) and blue.flippi.ai (ports 3002/8082).

### 2. Enable Sites
```bash
ln -s /etc/nginx/sites-available/app.flippi.ai /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/green.flippi.ai /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/blue.flippi.ai /etc/nginx/sites-enabled/

# Remove default site
rm -f /etc/nginx/sites-enabled/default

# Test and reload
nginx -t
systemctl reload nginx
```

## SSL Certificate Setup
```bash
# Install certbot
apt install -y certbot python3-certbot-nginx

# Generate certificates
certbot --nginx -d app.flippi.ai
certbot --nginx -d green.flippi.ai
certbot --nginx -d blue.flippi.ai

# Certificates auto-renew via cron
```

## PM2 Ecosystem Configuration
Create `/var/www/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    // Production
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
    // Staging
    {
      name: 'staging-backend',
      script: '/var/www/green.flippi.ai/backend/server.js',
      cwd: '/var/www/green.flippi.ai/backend',
      env: {
        NODE_ENV: 'staging',
        PORT: 3001
      }
    },
    {
      name: 'staging-frontend',
      script: 'serve',
      args: '-s /var/www/green.flippi.ai/mobile-app/dist -l 8081',
      interpreter: 'npx'
    },
    // Development
    {
      name: 'dev-backend',
      script: '/var/www/blue.flippi.ai/backend/server.js',
      cwd: '/var/www/blue.flippi.ai/backend',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      }
    },
    {
      name: 'dev-frontend',
      script: 'serve',
      args: '-s /var/www/blue.flippi.ai/mobile-app/dist -l 8082',
      interpreter: 'npx'
    }
  ]
};
```

## Verify Deployment

### Check Service Status
```bash
# PM2 status
pm2 status

# Nginx status
systemctl status nginx

# Check logs
pm2 logs
tail -f /var/log/nginx/error.log
```

### Test Endpoints
```bash
# Health checks
curl https://app.flippi.ai/health
curl https://green.flippi.ai/health
curl https://blue.flippi.ai/health

# Test API
curl -X POST -F "image=@test.jpg" https://app.flippi.ai/api/scan
```

## Troubleshooting

### Backend Issues
```bash
# Check logs
pm2 logs prod-backend

# Common issues:
# - Missing OPENAI_API_KEY in .env
# - Port already in use
# - Missing dependencies

# Restart service
pm2 restart prod-backend
```

### Frontend 404 Errors
```bash
# Rebuild frontend
cd /var/www/app.flippi.ai/mobile-app
npx expo export:web
pm2 restart prod-frontend
```

### SSL Certificate Issues
```bash
# Check certificates
certbot certificates

# Renew manually if needed
certbot renew
```

### Port Conflicts
```bash
# Check what's using ports
netstat -tlnp | grep -E "(3000|3001|3002|8080|8081|8082)"

# Kill process if needed
kill -9 <PID>
```

## Rollback Procedure

### Quick Rollback
1. Keep previous version backed up
2. Copy old files back
3. Restart PM2 services

### Git-Based Rollback
```bash
cd /var/www/app.flippi.ai
git log --oneline -10
git checkout <previous-commit>
cd backend && npm install --production
cd ../mobile-app && npm install && npx expo export:web
pm2 restart prod-backend prod-frontend
```

## Monitoring

### Real-time Monitoring
```bash
# PM2 monitoring
pm2 monit

# Watch logs
pm2 logs --lines 100

# System resources
htop
```

### Health Monitoring Script
```bash
#!/bin/bash
# /root/health-check.sh

for env in app green blue; do
  echo "Checking $env.flippi.ai..."
  curl -s https://$env.flippi.ai/health | jq .
done
```

## Security Best Practices

1. **Firewall Setup**
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

2. **Regular Updates**
```bash
apt update && apt upgrade -y
npm update -g pm2
```

3. **Backup Strategy**
- Daily backups of /var/www
- Weekly server snapshots
- Store backups off-site

## Quick Reference

### SSH Access
```bash
ssh root@157.245.142.145
```

### Common PM2 Commands
```bash
pm2 list              # List all processes
pm2 restart all       # Restart everything
pm2 logs             # View all logs
pm2 save             # Save current state
pm2 monit            # Real-time monitor
```

### Service Names
- prod-backend, prod-frontend
- staging-backend, staging-frontend
- dev-backend, dev-frontend

Remember: NO DOCKER! We use PM2 and native services for simpler management and better performance.