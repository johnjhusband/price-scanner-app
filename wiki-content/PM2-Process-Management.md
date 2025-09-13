# PM2 Process Management

## 🔧 Overview

PM2 manages all Node.js processes for Flippi, providing automatic restarts, logging, and monitoring. We run 6 processes total across three environments.

## 📊 Process Structure

### Current Processes
```
┌─────┬─────────────────────┬─────────┬─────────┬──────────┐
│ id  │ name               │ status  │ cpu     │ memory   │
├─────┼─────────────────────┼─────────┼─────────┼──────────┤
│ 0   │ prod-backend       │ online  │ 0.3%    │ 89.2mb   │
│ 1   │ prod-frontend      │ online  │ 0.1%    │ 67.4mb   │
│ 2   │ staging-backend    │ online  │ 0.2%    │ 87.1mb   │
│ 3   │ staging-frontend   │ online  │ 0.1%    │ 65.8mb   │
│ 4   │ dev-backend        │ online  │ 0.4%    │ 91.3mb   │
│ 5   │ dev-frontend       │ online  │ 0.2%    │ 68.9mb   │
└─────┴─────────────────────┴─────────┴─────────┴──────────┘
```

### Port Mapping
| Process | Type | Port | URL |
|---------|------|------|-----|
| prod-backend | API | 3000 | app.flippi.ai/api |
| prod-frontend | Web | 8080 | app.flippi.ai |
| staging-backend | API | 3001 | green.flippi.ai/api |
| staging-frontend | Web | 8081 | green.flippi.ai |
| dev-backend | API | 3002 | blue.flippi.ai/api |
| dev-frontend | Web | 8082 | blue.flippi.ai |

## 🚀 Common Commands

### Check Status
```bash
pm2 status
pm2 list
pm2 monit  # Real-time monitoring
```

### View Logs
```bash
# All logs
pm2 logs

# Specific process
pm2 logs dev-backend
pm2 logs prod-frontend

# Last 100 lines
pm2 logs --lines 100

# Real-time
pm2 logs -f
```

### Restart Processes
```bash
# DON'T DO THIS ON PRODUCTION!
# Use deployment instead

# For debugging only:
pm2 restart dev-backend
pm2 restart all
```

### Process Details
```bash
pm2 show dev-backend
pm2 info prod-frontend
```

## 🔍 Debugging

### Common Issues

#### Process Keeps Restarting
```bash
# Check error logs
pm2 logs dev-backend --err

# Check restart count
pm2 status

# Common causes:
# - Port already in use
# - Missing environment variables
# - Syntax errors
```

#### High Memory Usage
```bash
# Check memory
pm2 status

# See detailed metrics
pm2 monit

# Restart if needed (dev only)
pm2 restart dev-backend
```

#### Process Not Starting
```bash
# Check ecosystem.config.js
cat ecosystem.config.js

# Verify script path
ls backend/server.js

# Check environment
pm2 env dev-backend
```

## 📝 Configuration

### Ecosystem File
Location: `/var/www/{domain}/ecosystem.config.js`

```javascript
module.exports = {
  apps: [
    {
      name: 'dev-backend',
      script: './backend/server.js',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M'
    },
    // ... other processes
  ]
};
```

### Environment Variables
Set in ecosystem.config.js:
- `NODE_ENV`: production/staging/development
- `PORT`: Process port
- `OPENAI_API_KEY`: AI service key
- `GOOGLE_CLIENT_ID`: OAuth credentials

## 🛡️ Best Practices

### DO's
- ✅ Use PM2 for process monitoring
- ✅ Check logs when debugging
- ✅ Monitor memory usage
- ✅ Let PM2 handle restarts

### DON'Ts
- ❌ Don't manually restart production
- ❌ Don't kill PM2 daemon
- ❌ Don't modify ecosystem.config.js on server
- ❌ Don't use `pm2 delete`

## 🚨 Emergency Procedures

### If Backend Crashes
1. Check logs: `pm2 logs prod-backend --err`
2. Look for error patterns
3. Fix in code and deploy
4. DO NOT manually restart

### If Memory Leak
1. Monitor with: `pm2 monit`
2. Check for growing memory
3. Identify leaking process
4. Fix code and deploy

### If PM2 Daemon Dies
```bash
# This rarely happens
pm2 resurrect
pm2 status
```

## 📊 Monitoring

### Real-time Monitoring
```bash
pm2 monit
```

Shows:
- CPU usage
- Memory usage
- Request/min
- Active handles
- Event loop latency

### Log Rotation
PM2 automatically rotates logs. Configuration:
- Max size: 10MB
- Keep: 10 files
- Compress: Yes

### Health Checks
```bash
# Quick health check
curl http://localhost:3002/health

# All backends
for port in 3000 3001 3002; do
  echo "Port $port: $(curl -s http://localhost:$port/health)"
done
```

## 🔧 Fix Scripts

### PM2 Process Fix
Location: `scripts/fix-pm2-processes.sh`

This script:
1. Saves current PM2 state
2. Ensures all processes defined
3. Removes orphaned processes
4. Restores correct state

### When to Use
- After deployment issues
- When processes missing
- During troubleshooting only

## 📋 PM2 Cheatsheet

```bash
# Status
pm2 status          # Process list
pm2 show NAME       # Process details
pm2 env NAME        # Environment vars

# Logs
pm2 logs           # All logs
pm2 logs NAME      # Specific process
pm2 flush          # Clear logs

# Monitoring
pm2 monit          # Dashboard
pm2 web            # Web dashboard

# Management (Dev Only)
pm2 restart NAME   # Restart process
pm2 reload NAME    # Graceful reload
pm2 stop NAME      # Stop process
```

## 🔗 Related Pages

- [[Tech Stack]] - Technology overview
- [[Deployment-Guide]] - How PM2 fits deployment
- [[Troubleshooting]] - Common issues

[[Home]] | [[Tech Stack]] | [[Troubleshooting]]