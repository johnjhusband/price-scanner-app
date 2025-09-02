# Flippi.ai Operations Manual

## Table of Contents
1. [Daily Operations](#daily-operations)
2. [Monitoring](#monitoring)
3. [Networking & Infrastructure](#networking--infrastructure)
4. [Common Issues & Solutions](#common-issues--solutions)
5. [Performance Management](#performance-management)
6. [Cost Management](#cost-management)
7. [Backup & Recovery](#backup--recovery)
8. [Emergency Procedures](#emergency-procedures)
9. [Deployment Operations](#deployment-operations)
10. [Maintenance Tasks](#maintenance-tasks)

## Daily Operations

### Quick Health Check
Run this every morning to verify all systems operational:
```bash
# Check all environments
for env in app green blue; do
  echo "Checking $env.flippi.ai..."
  curl -s https://$env.flippi.ai/health | jq '.'
done

# SSH to server for detailed check
ssh root@157.245.142.145

# Check PM2 processes
pm2 list

# Check disk space
df -h

# Exit SSH
exit
```

### Process Management
All services managed by PM2:
```bash
# View all processes
pm2 list

# View specific process details
pm2 show dev-backend

# View real-time logs
pm2 logs dev-backend --lines 50

# Monitor resources
pm2 monit
```

### Service Names
- **Production**: prod-backend, prod-frontend
- **Staging**: staging-backend, staging-frontend  
- **Development**: dev-backend, dev-frontend

## Monitoring

### Health Endpoints
Monitor these endpoints regularly:
- https://app.flippi.ai/health (Production)
- https://green.flippi.ai/health (Staging)
- https://blue.flippi.ai/health (Development)

Expected response:
```json
{
  "status": "OK",
  "version": "2.0",
  "features": {
    "imageAnalysis": true,
    "cameraSupport": true,
    "pasteSupport": true,
    "dragDropSupport": true,
    "enhancedAI": true
  }
}
```

### PM2 Monitoring Commands
```bash
# Real-time monitoring
pm2 monit

# Check memory usage
pm2 list

# View error logs
pm2 logs --err

# Check restart count (should be 0)
pm2 describe [app-name] | grep restarts
```

### Log Locations
- **PM2 logs**: `pm2 logs [app-name]`
- **Nginx access**: `/var/log/nginx/access.log`
- **Nginx errors**: `/var/log/nginx/error.log`
- **System logs**: `/var/log/syslog`

### Key Metrics to Monitor
1. **Response Time**: Should be <3 seconds for image analysis
2. **Memory Usage**: Each process should use <100MB
3. **CPU Usage**: Spikes during analysis are normal
4. **Disk Space**: Keep >20% free
5. **Error Rate**: Should be <1%

## Networking & Infrastructure

### Port Mapping
Each environment uses different ports to avoid conflicts:

| Environment | Backend Port | Frontend Port | Domain |
|-------------|--------------|---------------|---------|
| Production | 3000 | 8080 | app.flippi.ai |
| Staging | 3001 | 8081 | green.flippi.ai |
| Development | 3002 | 8082 | blue.flippi.ai |

### Nginx Configuration
All SSL termination and routing handled by Nginx:

```bash
# Test nginx configuration
sudo nginx -t

# Reload after changes
sudo nginx -s reload

# Main config location
/etc/nginx/sites-available/[domain-name]
```

### SSL Certificate Management
Certificates auto-renew via Let's Encrypt:

```bash
# Check certificate status
sudo certbot certificates

# Manual renewal (if needed)
sudo certbot renew

# Force renewal
sudo certbot renew --force-renewal

# Certificate locations
/etc/letsencrypt/live/[domain]/fullchain.pem
/etc/letsencrypt/live/[domain]/privkey.pem
```

### Network Diagnostics
Common network troubleshooting commands:

```bash
# Check port usage
sudo netstat -tlnp | grep -E ':(3000|3001|3002|8080|8081|8082)'

# Test backend directly (bypass nginx)
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Find process using a port
sudo lsof -i :3000

# Test SSL from outside
curl -I https://app.flippi.ai
openssl s_client -connect app.flippi.ai:443 -servername app.flippi.ai
```

### PM2 Process Configuration
Each environment has its own PM2 ecosystem config:

```bash
# Location
/var/www/[domain]/ecosystem.config.js

# Start with ecosystem file
pm2 start ecosystem.config.js

# Delete and restart all
pm2 delete all
pm2 start ecosystem.config.js

# Save configuration
pm2 save
pm2 startup  # Generate startup script
```

### PM2 Best Practices

#### Log Management
Set up automatic log rotation to prevent disk space issues:

```bash
# Install log rotation module
pm2 install pm2-logrotate

# Configure rotation settings
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

#### Process Monitoring
Monitor for memory leaks and crashes:

```bash
# Set memory limit and auto-restart
pm2 start app.js --max-memory-restart 300M

# Watch for file changes (dev only)
pm2 start app.js --watch

# Set up error notifications
pm2 set pm2:error_mail your-email@example.com
```

#### Zero-Downtime Deployments
Use PM2's reload feature for seamless updates:

```bash
# Graceful reload (zero downtime)
pm2 reload prod-backend

# Force restart if needed
pm2 restart prod-backend

# Update environment variables
pm2 restart prod-backend --update-env
```

## Common Issues & Solutions

### 502 Bad Gateway Error

**Symptoms**: Website shows 502 error

**Diagnosis**:
```bash
ssh root@157.245.142.145
pm2 list  # Check if backend is running
pm2 logs dev-backend --lines 50  # Check for errors
```

**Solutions**:
1. **Backend crashed**:
   ```bash
   pm2 restart dev-backend
   pm2 logs dev-backend --lines 20
   ```

2. **Missing environment variables**:
   ```bash
   cat /var/www/shared/.env  # Verify OPENAI_API_KEY exists
   pm2 restart dev-backend --update-env
   ```

3. **Port conflict**:
   ```bash
   netstat -tulpn | grep 3002  # Check if port in use
   pm2 delete dev-backend
   pm2 start ecosystem.config.js --only dev-backend
   ```

### Frontend Shows "Index of dist/"

**Symptoms**: Frontend shows directory listing instead of app

**Diagnosis**:
```bash
cd /var/www/blue.flippi.ai/mobile-app
ls -la dist/  # Check if build exists
```

**Solutions**:
1. **Build failed**:
   ```bash
   cd /var/www/blue.flippi.ai/mobile-app
   npm install
   npx expo export --platform web --output-dir dist
   pm2 restart dev-frontend
   ```

2. **Syntax error in App.js**:
   - Check deployment logs in GitHub Actions
   - Fix syntax error and push to repository
   - Wait for auto-deployment

### High Memory Usage

**Symptoms**: PM2 shows high memory for a process

**Solutions**:
```bash
# Restart the specific process
pm2 restart [app-name]

# If persists, check for memory leaks
pm2 describe [app-name]  # Check uptime and restart count

# Force garbage collection
pm2 restart [app-name] --update-env
```

### SSL Certificate Issues

**Symptoms**: Browser shows certificate warnings

**Diagnosis**:
```bash
certbot certificates  # Check expiration dates
```

**Solutions**:
```bash
# Renew certificates
certbot renew

# Force renewal if needed
certbot renew --force-renewal

# Reload nginx
nginx -s reload
```

### Deployment Not Working

**Symptoms**: Code pushed but changes not visible

**Diagnosis**:
1. Check GitHub Actions tab for deployment status
2. SSH and verify git log:
   ```bash
   cd /var/www/blue.flippi.ai
   git log --oneline -5  # Should show your commit
   ```

**Solutions**:
1. **Deployment failed**: Check GitHub Actions logs
2. **Branch diverged**: Fixed in deployment script
3. **Build cache**: Clear and rebuild:
   ```bash
   cd mobile-app
   rm -rf dist/
   npx expo export --platform web --output-dir dist
   pm2 restart dev-frontend
   ```

## Performance Management

### Optimize Response Times
1. **Monitor slow requests**:
   ```bash
   pm2 logs prod-backend | grep "Analysis completed in"
   ```

2. **Check OpenAI API response times**:
   - Normal: 2-3 seconds
   - Slow: >5 seconds (check OpenAI status)

3. **Reduce image sizes**:
   - Frontend already compresses to 80% quality
   - Monitor average upload sizes in logs

### Resource Optimization
```bash
# Check current usage
pm2 list  # Memory column
htop      # Overall system resources

# Restart if memory growing
pm2 restart all

# Save PM2 configuration
pm2 save
```

### Scaling Considerations
Current setup handles ~100 concurrent users. To scale:
1. Upgrade droplet size (more RAM/CPU)
2. Implement caching layer
3. Add CDN for static assets
4. Consider load balancer for multiple droplets

## Cost Management

### Monitor Costs
1. **DigitalOcean**: Check monthly usage in dashboard
2. **OpenAI API**: Monitor at platform.openai.com/usage
3. **Domains**: Set auto-renewal to avoid expiration

### Cost Optimization
1. **Reduce OpenAI costs**:
   - Implement response caching
   - Shorter prompts
   - Rate limiting per IP

2. **Reduce infrastructure costs**:
   - Downsize droplet if underutilized
   - Disable automated backups if not needed
   - Use single environment for dev/staging

3. **Monitor usage patterns**:
   ```bash
   # Count daily API calls
   pm2 logs prod-backend | grep "Analysis completed" | wc -l
   ```

### Monthly Cost Review Checklist
- [ ] Check DigitalOcean invoice
- [ ] Review OpenAI usage and costs
- [ ] Verify domain renewals
- [ ] Analyze traffic patterns
- [ ] Identify cost-saving opportunities

## Backup & Recovery

### Daily Backup Checklist
1. **Code**: Already in GitHub (no action needed)
2. **Configuration files**:
   ```bash
   # Backup .env file
   cp /var/www/shared/.env ~/backups/.env.$(date +%Y%m%d)
   ```

3. **PM2 configuration**:
   ```bash
   pm2 save
   cp ~/.pm2/dump.pm2 ~/backups/pm2-$(date +%Y%m%d).json
   ```

4. **Nginx configs**:
   ```bash
   tar -czf ~/backups/nginx-$(date +%Y%m%d).tar.gz /etc/nginx/sites-available/
   ```

### Disaster Recovery

#### Scenario: Server Crash
1. Create new droplet from backup/snapshot
2. Update DNS to point to new IP
3. Restore configurations:
   ```bash
   # Restore .env
   cp ~/backups/.env.latest /var/www/shared/.env
   
   # Restore PM2
   pm2 resurrect ~/backups/pm2-latest.json
   
   # Restore Nginx
   tar -xzf ~/backups/nginx-latest.tar.gz -C /
   nginx -s reload
   ```

#### Scenario: Corrupted Deployment
1. Revert to previous commit:
   ```bash
   cd /var/www/blue.flippi.ai
   git log --oneline -10  # Find good commit
   git reset --hard [commit-hash]
   
   # Rebuild
   cd backend && npm install
   cd ../mobile-app && npm install
   npx expo export --platform web --output-dir dist
   pm2 restart dev-backend dev-frontend
   ```

## Emergency Procedures

### Service Completely Down
1. **Immediate Response**:
   ```bash
   ssh root@157.245.142.145
   pm2 list  # Check what's running
   pm2 restart all  # Quick fix attempt
   ```

2. **If restart fails**:
   ```bash
   pm2 delete all
   pm2 resurrect  # Restore saved config
   ```

3. **If still broken**:
   ```bash
   # Check system resources
   df -h     # Disk space
   free -m   # Memory
   htop      # CPU/processes
   
   # Check logs for errors
   pm2 logs --err --lines 100
   tail -f /var/log/nginx/error.log
   ```

### High Traffic Event
1. **Monitor in real-time**:
   ```bash
   pm2 monit  # Watch CPU/memory
   tail -f /var/log/nginx/access.log  # Watch requests
   ```

2. **Quick scaling**:
   ```bash
   # Add more PM2 instances
   pm2 scale prod-backend 2
   pm2 scale prod-frontend 2
   ```

3. **Emergency rate limiting**:
   - Edit Nginx config to add rate limiting
   - Reload: `nginx -s reload`

### Security Incident
1. **Suspicious activity**:
   ```bash
   # Check access logs
   tail -n 1000 /var/log/nginx/access.log | grep -v "200\|304"
   
   # Check for unauthorized SSH
   last -20
   
   # Block suspicious IP
   ufw deny from [IP-ADDRESS]
   ```

2. **Compromised API key**:
   - Immediately revoke key in OpenAI dashboard
   - Generate new key
   - Update on server: `/var/www/shared/.env`
   - Restart all backends

## Deployment Operations

### New Server Setup
For setting up a new server, use the GitHub Actions workflow:
```bash
gh workflow run setup-new-server.yml \
  -f target_server_ip="YOUR_SERVER_IP" \
  -f environment="blue|green|production" \
  -f root_password="YOUR_ROOT_PASSWORD"
```

**Key implementation notes:**
1. **Directory Creation**: The `/var/www/[env].flippi.ai` directory is created by git clone, NOT by the setup script
2. **File Permissions**: Set AFTER npm install/build completes to avoid permission conflicts
3. **Static Files**: Nginx serves frontend directly from `/mobile-app/dist/` - no PM2 frontend process needed
4. **Legal Pages**: Located at `/mobile-app/*.html` NOT `/legal/*.html`
5. **Shell Scripts**: Made executable after clone with `chmod +x`

### Automated Deployment
Deployments trigger automatically on branch push:
- `develop` → blue.flippi.ai
- `staging` → green.flippi.ai
- `master` → app.flippi.ai

### Manual Deployment Process
If automation fails:

```bash
# 1. SSH to server
ssh root@157.245.142.145

# 2. Navigate to environment
cd /var/www/blue.flippi.ai    # Development
cd /var/www/green.flippi.ai   # Staging
cd /var/www/app.flippi.ai     # Production

# 3. Update code
git reset --hard HEAD
git clean -fd
git pull origin [branch-name]

# 4. Install dependencies
cd backend && npm install --production
cd ../mobile-app && npm install

# 5. Build frontend
npx expo export --platform web --output-dir dist

# 6. Restart services
pm2 restart dev-backend dev-frontend      # Development
pm2 restart staging-backend staging-frontend  # Staging
pm2 restart prod-backend prod-frontend    # Production

# 7. Reload nginx
nginx -s reload
```

### Database Management

#### SQLite Database Locations
Each environment has its own feedback database:
- Production: `/var/lib/flippi/feedback.db`
- Staging: `/var/lib/flippi-staging/feedback.db`
- Development: `/var/lib/flippi-dev/feedback.db`

#### Database Backup
```bash
# Backup databases
cp /var/lib/flippi/feedback.db /backup/feedback-prod-$(date +%Y%m%d).db
cp /var/lib/flippi-staging/feedback.db /backup/feedback-staging-$(date +%Y%m%d).db
cp /var/lib/flippi-dev/feedback.db /backup/feedback-dev-$(date +%Y%m%d).db
```

**Note**: Databases persist between deployments and are NOT in Git.

### Nginx Configuration Updates

#### Increase Upload Size Limit
```bash
# Edit nginx config
sudo nano /etc/nginx/sites-available/[domain]

# Add after server_name:
client_max_body_size 50M;

# Test and reload
sudo nginx -t
sudo nginx -s reload
```

## Maintenance Tasks

### Weekly Tasks
1. **Monday - Health Check**:
   ```bash
   # Run full health check script
   for env in app green blue; do
     curl -sf https://$env.flippi.ai/health || echo "$env is DOWN!"
   done
   ```

2. **Wednesday - Resource Check**:
   ```bash
   # Check disk usage
   df -h
   
   # Clean if needed
   docker system prune -f 2>/dev/null || true
   rm -f /tmp/*.db-journal
   
   # Check PM2 logs size
   pm2 flush  # Clear old logs if large
   ```

3. **Friday - Performance Review**:
   - Check PM2 restart counts
   - Review error logs for patterns
   - Monitor response times

### Monthly Tasks
1. **First Monday - Updates**:
   ```bash
   # Update system packages
   apt update
   apt upgrade -y
   
   # Update Node.js if needed
   npm install -g npm@latest
   ```

2. **Mid-month - Backup Verification**:
   - Test restore procedure
   - Verify backup completeness
   - Clean old backups

3. **End of month - Cost Review**:
   - Check all service bills
   - Analyze usage patterns
   - Plan optimizations

### Quarterly Tasks
1. **SSL Certificate Check**:
   ```bash
   certbot certificates
   # Should auto-renew, but verify
   ```

2. **Security Audit**:
   ```bash
   # Check for unauthorized changes
   git status
   
   # Review SSH keys
   cat ~/.ssh/authorized_keys
   
   # Update passwords if needed
   passwd
   ```

3. **Performance Baseline**:
   - Document average response times
   - Note typical resource usage
   - Plan capacity for growth

### Log Rotation
PM2 handles log rotation automatically, but if needed:
```bash
# Install log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress false
```

### Monitoring Checklist
Daily:
- [ ] Check health endpoints
- [ ] Review error logs
- [ ] Monitor disk space

Weekly:
- [ ] Check PM2 restart counts
- [ ] Review resource usage
- [ ] Clean temporary files

Monthly:
- [ ] Apply security updates
- [ ] Review costs
- [ ] Test backup procedures
- [ ] Analyze performance metrics