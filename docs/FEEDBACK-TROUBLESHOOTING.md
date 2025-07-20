# Feedback System Troubleshooting Guide

## Overview

This guide documents all the issues encountered during the user feedback feature deployment and their solutions.

## Common Issues & Solutions

### 1. "Internal Server Error" When Submitting Feedback

**Symptoms**:
- Frontend shows "Failed to submit feedback: Internal server error"
- 500 error in network tab

**Root Causes**:
1. Database file cannot be created (permission issue)
2. Database path is incorrect
3. Base64 image data validation failing

**Solutions**:
1. Check database path is writable:
   ```bash
   ssh root@157.245.142.145
   ls -la /tmp/flippi-feedback.db
   ```

2. Check backend logs:
   ```bash
   pm2 logs dev-backend --lines 50
   ```

3. Verify feedback endpoint:
   ```bash
   curl https://blue.flippi.ai/api/feedback/health
   ```

### 2. Backend Shows 502 Bad Gateway

**Symptoms**:
- All API calls return 502
- Nginx error: "upstream prematurely closed connection"

**Root Cause**: PM2 process crashed or not running

**Solution**:
```bash
# Check PM2 status
pm2 list

# If dev-backend is "errored" or not listed:
cd /var/www
pm2 delete dev-backend
pm2 start ecosystem.config.js --only dev-backend
```

### 3. Wrong PORT Being Used (EADDRINUSE Error)

**Symptoms**:
- PM2 logs show "Error: listen EADDRINUSE :::3000"
- Dev backend trying to use production port

**Root Cause**: Environment variables not loaded from ecosystem.config.js

**Solution**:
```bash
# Never use pm2 restart!
cd /var/www
pm2 delete dev-backend
pm2 start ecosystem.config.js --only dev-backend

# Or use reload:
pm2 reload ecosystem.config.js --only dev-backend
```

### 4. Old Code Still Running After Deployment

**Symptoms**:
- Changes not reflected after GitHub Actions deployment
- API responses show old behavior

**Root Cause**: PM2 caching or not properly reloading

**Solutions**:
1. Force PM2 reload:
   ```bash
   cd /var/www
   pm2 reload ecosystem.config.js --only dev-backend
   ```

2. Nuclear option - delete and restart:
   ```bash
   pm2 delete dev-backend
   pm2 start ecosystem.config.js --only dev-backend
   ```

### 5. Database Permission Errors

**Original Issue**: Could not write to `/var/lib/flippi-dev/feedback.db`

**Solution**: Changed to use `/tmp/flippi-feedback.db` for all environments

**Warning**: `/tmp` is cleared on reboot - not suitable for production!

## Testing the Feedback System

### 1. Check Backend Health
```bash
# Basic connectivity
curl https://blue.flippi.ai/api/feedback/test

# Database health
curl https://blue.flippi.ai/api/feedback/health
```

### 2. Test Feedback Submission via CLI
```bash
curl -X POST https://blue.flippi.ai/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "helped_decision": true,
    "feedback_text": "Test feedback",
    "user_description": "Test item",
    "image_data": "dGVzdA==",
    "scan_data": {"item_name": "Test"}
  }'
```

### 3. Check Database Contents
```bash
ssh root@157.245.142.145
sqlite3 /tmp/flippi-feedback.db
.tables
SELECT COUNT(*) FROM feedback;
.quit
```

## Environment Variable Issues

### Current Setup
- **Problem**: Application loads .env from `/var/www/shared/.env` but PORT comes from PM2
- **Solution**: PM2 ecosystem.config.js sets PORT for each environment

### Checking Environment Variables
```bash
# See what PM2 is using
pm2 describe dev-backend | grep -A 10 "Environment"

# Check what the app sees
pm2 logs dev-backend | grep "Environment check"
```

## Frontend Issues

### Button Visibility (Grey on Grey)
**Problem**: Used `brandColors.primary` which doesn't exist

**Solution**: Changed to `brandColors.actionBlue`

### Auto-scroll Not Working
**Problem**: Results don't scroll into view after analysis

**Solution**: Added ref-based scrolling with platform detection

## Deployment Workflow Issues

### GitHub Actions Not Reloading PM2 Properly
**Original**: Used `pm2 restart`

**Fixed**: Now uses `pm2 reload ecosystem.config.js`

### Key Learnings
1. Always use `pm2 reload ecosystem.config.js`, never `pm2 restart`
2. Check PM2 logs immediately after deployment
3. Verify environment variables are loaded correctly
4. Test health endpoints before assuming deployment succeeded

## Future Improvements

1. **Move database to persistent location**:
   ```bash
   # Create proper directory
   mkdir -p /var/flippi/data
   chown www-data:www-data /var/flippi/data
   
   # Update FEEDBACK_DB_PATH in .env
   FEEDBACK_DB_PATH=/var/flippi/data/feedback.db
   ```

2. **Add monitoring**:
   - Set up alerts for 502 errors
   - Monitor database size
   - Track feedback submission rate

3. **Improve deployment**:
   - Add post-deployment health checks
   - Automatically verify services started correctly
   - Add rollback capability

## Emergency Fixes

### If Everything is Broken
```bash
# SSH to server
ssh root@157.245.142.145

# Stop everything
pm2 stop all

# Pull latest code
cd /var/www/blue.flippi.ai
git pull origin develop

# Install dependencies
cd backend && npm install

# Start fresh
cd /var/www
pm2 delete all
pm2 start ecosystem.config.js

# Check status
pm2 list
pm2 logs --lines 50
```

### Quick Health Check
```bash
# All in one command
ssh root@157.245.142.145 "pm2 list && curl -s localhost:3002/health && curl -s localhost:3002/api/feedback/health"
```

---

*Last Updated: July 2025*
*Feature: User Feedback Collection*
*Key Issues: Database permissions, PM2 environment variables, deployment process*