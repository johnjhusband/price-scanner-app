# DevOps Best Practices - v2.0

## Overview
This document outlines DevOps best practices for the My Thrifting Buddy application using PM2 process management and Nginx reverse proxy.

## 1. Process Management Best Practices

### PM2 Configuration
- Use ecosystem files for consistent deployments
- Define environment variables in ecosystem config
- Set proper working directories for each app
- Use descriptive process names

```javascript
// ecosystem.config.js example
module.exports = {
  apps: [{
    name: 'prod-backend',
    script: './server.js',
    cwd: '/var/www/app.flippi.ai/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### Process Monitoring
- Use `pm2 monit` for real-time monitoring
- Set up `pm2-logrotate` to manage log files
- Configure alerts for process failures
- Monitor memory and CPU usage

```bash
# Install log rotation
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## 2. Configuration Management

### Environment Variables
- Store sensitive data in `.env` files
- Never commit `.env` files to Git
- Use environment-specific configurations
- Document all required variables

```bash
# Production .env
OPENAI_API_KEY=prod_key_here
PORT=3000
NODE_ENV=production
LOG_LEVEL=error

# Staging .env
OPENAI_API_KEY=staging_key_here
PORT=3001
NODE_ENV=staging
LOG_LEVEL=info
```

### Nginx Configuration
- Use separate config files per domain
- Enable gzip compression
- Configure proper timeouts
- Implement security headers

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

## 3. Deployment Best Practices

### Pre-deployment Checks
1. Verify all services are healthy
2. Check disk space availability
3. Validate configuration files
4. Test database connections (if applicable)
5. Ensure SSL certificates are valid

```bash
#!/bin/bash
# pre-deploy-check.sh

# Check disk space
df -h | grep -E "(/$|/var)"

# Verify PM2 is running
pm2 status

# Test nginx config
nginx -t

# Check SSL certificates
certbot certificates
```

### Zero-Downtime Deployment
- Use PM2's reload feature instead of restart
- Deploy to staging first
- Run health checks after deployment
- Keep previous version for quick rollback

```bash
# Zero-downtime reload
pm2 reload prod-backend --update-env
pm2 reload prod-frontend --update-env
```

## 4. Security Best Practices

### Server Hardening
- Enable UFW firewall
- Disable root SSH login
- Use SSH key authentication only
- Regular security updates

```bash
# Firewall setup
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Application Security
- Run processes as non-root user
- Implement rate limiting in Nginx
- Use HTTPS everywhere
- Sanitize all inputs
- Keep dependencies updated

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

location /api {
    limit_req zone=api burst=20 nodelay;
    proxy_pass http://localhost:3000;
}
```

## 5. Monitoring and Alerting

### Health Checks
- Implement comprehensive health endpoints
- Monitor all critical services
- Set up automated alerts
- Track response times

```javascript
// Health check endpoint
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV
  };
  res.json(health);
});
```

### Logging Best Practices
- Use structured logging (JSON)
- Include request IDs
- Log appropriate levels
- Centralize logs when possible

```javascript
// Structured logging example
const logger = {
  info: (msg, meta = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      timestamp: new Date().toISOString(),
      message: msg,
      ...meta
    }));
  }
};
```

## 6. Resource Management

### PM2 Resource Limits
```javascript
// Set memory limits in ecosystem file
{
  name: 'backend',
  script: './server.js',
  max_memory_restart: '500M',
  min_uptime: '10s',
  max_restarts: 10
}
```

### System Resource Monitoring
```bash
# Monitor resources
htop
pm2 monit
pm2 info <app-name>

# Check memory usage
free -h
pm2 status
```

## 7. Backup and Recovery

### Backup Strategy
- Daily backups of application code
- Configuration file backups
- SSL certificate backups
- Database backups (when implemented)

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/

# Backup PM2 configuration
pm2 save
cp ~/.pm2/dump.pm2 $BACKUP_DIR/pm2_$DATE.json

# Backup nginx configs
tar -czf $BACKUP_DIR/nginx_$DATE.tar.gz /etc/nginx/

# Keep only last 30 days
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Disaster Recovery Plan
1. Maintain offsite backups
2. Document recovery procedures
3. Test recovery regularly
4. Keep infrastructure as code

## 8. Performance Optimization

### Nginx Optimization
```nginx
# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Gzip compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;
```

### Node.js Optimization
- Use PM2 cluster mode for multiple CPUs
- Implement proper caching strategies
- Optimize database queries (when applicable)
- Monitor memory leaks

## 9. CI/CD Best Practices

### Git Workflow
- Use feature branches
- Code review all changes
- Automate testing
- Tag releases properly

### Automated Deployment Pipeline
1. Push to Git branch
2. GitHub Actions runs tests
3. Deploy to appropriate environment
4. Run post-deployment tests
5. Monitor for issues

## 10. Documentation and Knowledge Sharing

### Maintain Documentation
- Keep README files updated
- Document all procedures
- Create runbooks for common tasks
- Share knowledge with team

### Incident Response
- Document all incidents
- Conduct post-mortems
- Update procedures based on learnings
- Maintain on-call documentation

## Quick Reference

### Common PM2 Commands
```bash
pm2 start ecosystem.config.js
pm2 reload all
pm2 logs
pm2 monit
pm2 save
pm2 startup
```

### Common Nginx Commands
```bash
nginx -t                    # Test configuration
systemctl reload nginx      # Reload configuration
systemctl status nginx      # Check status
tail -f /var/log/nginx/error.log
```

### Health Check Script
```bash
#!/bin/bash
for env in app green blue; do
  curl -s https://$env.flippi.ai/health | jq .
done
```

Remember: Simplicity and reliability over complexity. PM2 + Nginx provides a robust, easy-to-manage infrastructure.