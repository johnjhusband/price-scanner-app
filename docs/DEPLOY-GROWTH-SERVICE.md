# Growth Service Deployment Guide

## Overview
This guide explains how to deploy the new Growth Automation Service alongside the existing backend.

## Prerequisites
- Access to blue.flippi.ai server
- PM2 installed
- Nginx configured

## Deployment Steps

### 1. Deploy Code
```bash
# On your local machine
git add growth.js ecosystem.config.js docs/
git commit -m "Add Growth Automation Service

- Create standalone growth.js microservice
- Separate growth features from main backend
- Add PM2 configuration for growth service
- Include PRD and deployment documentation"
git push origin develop
```

### 2. Update Server
```bash
# SSH into blue.flippi.ai
ssh flippi@blue.flippi.ai

# Navigate to project
cd /var/www/blue.flippi.ai

# Pull latest code
git pull origin develop

# Install any new dependencies
npm install
```

### 3. Update Nginx Configuration
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/blue.flippi.ai

# Add the growth service locations (from docs/nginx-growth-config.conf)
# Save and exit

# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 4. Start Growth Service
```bash
# Start the growth service
pm2 start ecosystem.config.js --only dev-growth

# Save PM2 configuration
pm2 save

# Check status
pm2 status
```

### 5. Verify Deployment
```bash
# Test health endpoint
curl http://localhost:3003/health

# Test from outside
curl https://blue.flippi.ai/api/growth/status

# Check logs
pm2 logs dev-growth
```

## Rollback Plan

If issues occur:
```bash
# Stop growth service
pm2 stop dev-growth

# Remove from PM2
pm2 delete dev-growth

# Revert nginx changes
sudo nano /etc/nginx/sites-available/blue.flippi.ai
# Remove growth location blocks
sudo systemctl reload nginx
```

## Monitoring

### Check Service Health
```bash
pm2 status dev-growth
pm2 logs dev-growth --lines 50
```

### Monitor Reddit Automation
```bash
# Watch live logs
pm2 logs dev-growth --lines 100 -f | grep Reddit
```

### Check Database
```bash
# Count Reddit posts
sqlite3 /var/www/blue.flippi.ai/backend/data/scanner.db \
  "SELECT COUNT(*) FROM reddit_questions;"
```

## Environment Variables

Add to `/var/www/blue.flippi.ai/../shared/.env`:
```
GROWTH_PORT=3003
ENABLE_REDDIT_AUTOMATION=true
REDDIT_AUTOMATION_INTERVAL=30
```

## Troubleshooting

### Service Won't Start
- Check port 3003 is available: `sudo lsof -i :3003`
- Verify environment variables are set
- Check PM2 logs: `pm2 logs dev-growth --err`

### Reddit Monitoring Not Working
- Verify ENABLE_REDDIT_AUTOMATION=true
- Check Reddit API is accessible
- Review logs for rate limiting

### Database Errors
- Ensure database file has write permissions
- Check disk space
- Verify tables exist

## Notes
- Growth service runs independently on port 3003
- Main backend remains on port 3000/3002
- Both services share the same database
- Nginx routes /api/growth/* to growth service