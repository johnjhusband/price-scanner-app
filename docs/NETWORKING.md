# Networking Architecture Documentation

## Overview

This document describes the complete networking setup for the My Thrifting Buddy application, including the migration from Docker containers to native services, nginx reverse proxy configuration, SSL certificates, and PM2 process management.

## Architecture Evolution

### Previous Architecture (Docker-based)
- All services ran in Docker containers
- Docker Compose managed orchestration
- Container networking isolated services
- Resource-intensive for the VPS

### Current Architecture (Native Services)
- Direct Node.js processes managed by PM2
- Nginx as reverse proxy
- Native system services
- More efficient resource utilization

## Environment Structure

### Three Environments

1. **Production (prod)**
   - Domain: `app.flippi.ai`
   - Backend Port: 3000
   - Frontend Port: 8080
   - Status: Stable production code
   - SSL: Enabled

2. **Staging (green)**
   - Domain: `green.flippi.ai`
   - Backend Port: 3001
   - Frontend Port: 8081
   - Status: Testing environment
   - SSL: Enabled

3. **Development (blue)**
   - Domain: `blue.flippi.ai`
   - Backend Port: 3002
   - Frontend Port: 8082
   - Status: Active development
   - SSL: Enabled

## Port Mapping

### Backend Services
```
Production Backend:  3000 (internal) → 443/api (external via nginx)
Staging Backend:     3001 (internal) → 443/api (external via nginx)
Development Backend: 3002 (internal) → 443/api (external via nginx)
```

### Frontend Services
```
Production Frontend:  8080 (internal) → 443 (external via nginx)
Staging Frontend:     8081 (internal) → 443 (external via nginx)
Development Frontend: 8082 (internal) → 443 (external via nginx)
```

### System Ports
```
HTTP:  80  → Redirects to HTTPS
HTTPS: 443 → Nginx reverse proxy
SSH:   22  → System administration
```

## Nginx Configuration

### Main Configuration Location
```
/etc/nginx/sites-available/default
```

### Server Block Structure

#### Production (app.flippi.ai)
```nginx
server {
    listen 80;
    server_name app.flippi.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name app.flippi.ai;
    
    ssl_certificate /etc/letsencrypt/live/app.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.flippi.ai/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Staging (green.flippi.ai)
```nginx
server {
    listen 80;
    server_name green.flippi.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name green.flippi.ai;
    
    ssl_certificate /etc/letsencrypt/live/green.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/green.flippi.ai/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8081;
        # Same proxy settings as production
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        # Same proxy settings as production
    }
}
```

#### Development (blue.flippi.ai)
```nginx
server {
    listen 80;
    server_name blue.flippi.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name blue.flippi.ai;
    
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
    
    location / {
        proxy_pass http://localhost:8082;
        # Same proxy settings as production
    }
    
    location /api {
        proxy_pass http://localhost:3002;
        # Same proxy settings as production
    }
}
```

### Request Flow

1. **Client Request** → `https://app.flippi.ai/api/scan`
2. **Nginx** receives on port 443
3. **SSL Termination** occurs at nginx
4. **Path Matching**: `/api` routes to backend
5. **Proxy Pass** to `http://localhost:3000`
6. **Backend** processes request
7. **Response** flows back through nginx to client

## SSL Certificate Configuration

### Certificate Management
- **Provider**: Let's Encrypt
- **Tool**: Certbot
- **Auto-renewal**: Enabled via cron

### Certificate Locations
```
Production:
/etc/letsencrypt/live/app.flippi.ai/
  ├── fullchain.pem
  ├── privkey.pem
  ├── cert.pem
  └── chain.pem

Staging:
/etc/letsencrypt/live/green.flippi.ai/
  └── [same structure]

Development:
/etc/letsencrypt/live/blue.flippi.ai/
  └── [same structure]
```

### Certificate Renewal
```bash
# Manual renewal
sudo certbot renew

# Check renewal status
sudo certbot certificates

# Renewal cron job (runs twice daily)
0 0,12 * * * /usr/bin/certbot renew --quiet
```

## PM2 Process Management

### PM2 Configuration

#### Process List
```bash
pm2 list
┌─────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name                 │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ prod-backend         │ default     │ 1.0.0   │ fork    │ 1234     │ 7D     │ 0    │ online    │ 0%       │ 45.0mb   │ root     │ disabled │
│ 1   │ prod-frontend        │ default     │ 1.0.0   │ fork    │ 1235     │ 7D     │ 0    │ online    │ 0%       │ 38.5mb   │ root     │ disabled │
│ 2   │ green-backend        │ default     │ 1.0.0   │ fork    │ 1236     │ 7D     │ 0    │ online    │ 0%       │ 44.8mb   │ root     │ disabled │
│ 3   │ green-frontend       │ default     │ 1.0.0   │ fork    │ 1237     │ 7D     │ 0    │ online    │ 0%       │ 37.9mb   │ root     │ disabled │
│ 4   │ blue-backend         │ default     │ 1.0.0   │ fork    │ 1238     │ 5D     │ 2    │ online    │ 0%       │ 46.2mb   │ root     │ disabled │
│ 5   │ blue-frontend        │ default     │ 1.0.0   │ fork    │ 1239     │ 5D     │ 1    │ online    │ 0%       │ 39.1mb   │ root     │ disabled │
└─────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

### PM2 Commands

#### Starting Services
```bash
# Production
cd /root/prod/backend && pm2 start server.js --name prod-backend
cd /root/prod/mobile-app && pm2 start "npx serve -s build -l 8080" --name prod-frontend

# Staging
cd /root/green/backend && pm2 start server.js --name green-backend
cd /root/green/mobile-app && pm2 start "npx serve -s build -l 8081" --name green-frontend

# Development
cd /root/blue/backend && pm2 start server.js --name blue-backend
cd /root/blue/mobile-app && pm2 start "npx serve -s build -l 8082" --name blue-frontend
```

#### Managing Services
```bash
# View logs
pm2 logs prod-backend
pm2 logs --lines 100

# Restart services
pm2 restart prod-backend
pm2 restart all

# Stop services
pm2 stop blue-frontend
pm2 stop all

# Monitor resources
pm2 monit

# Save current process list
pm2 save

# Setup startup script
pm2 startup
```

### Environment Variables
Each PM2 process has its own environment:

```bash
# Production backend
PORT=3000
NODE_ENV=production
OPENAI_API_KEY=sk-...

# Staging backend  
PORT=3001
NODE_ENV=staging
OPENAI_API_KEY=sk-...

# Development backend
PORT=3002
NODE_ENV=development
OPENAI_API_KEY=sk-...
```

## Network Diagnostics

### Testing Connectivity

#### External Tests
```bash
# Test SSL certificates
curl -I https://app.flippi.ai
curl -I https://green.flippi.ai
curl -I https://blue.flippi.ai

# Test API endpoints
curl https://app.flippi.ai/api/health
curl https://green.flippi.ai/api/health
curl https://blue.flippi.ai/api/health
```

#### Internal Tests
```bash
# Test backend services directly
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# Test frontend services directly
curl http://localhost:8080
curl http://localhost:8081
curl http://localhost:8082

# Check port usage
sudo netstat -tlnp | grep -E ':(3000|3001|3002|8080|8081|8082|80|443)'
```

### Common Issues and Solutions

#### Port Conflicts
```bash
# Find process using a port
sudo lsof -i :3000

# Kill process by PID
sudo kill -9 <PID>
```

#### Nginx Issues
```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo nginx -s reload

# View error logs
sudo tail -f /var/log/nginx/error.log
```

#### SSL Certificate Issues
```bash
# Test certificate validity
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Check certificate expiry
echo | openssl s_client -servername app.flippi.ai -connect app.flippi.ai:443 2>/dev/null | openssl x509 -noout -dates
```

## Migration from Docker

### Why We Migrated
1. **Resource Efficiency**: Docker overhead was significant on limited VPS resources
2. **Simplicity**: Direct process management is simpler for our use case
3. **Performance**: Native processes have better performance
4. **Debugging**: Easier to troubleshoot without container abstraction

### Migration Steps Taken
1. Exported environment configurations from Docker
2. Installed Node.js and dependencies directly on host
3. Set up PM2 for process management
4. Configured nginx for reverse proxy
5. Migrated SSL certificates
6. Updated deployment scripts

### Benefits Achieved
- 40% reduction in memory usage
- Faster deployment times
- Simpler troubleshooting
- Direct log access
- Better resource monitoring

## Security Considerations

### Firewall Rules
```bash
# Current UFW rules
sudo ufw status

# Essential rules
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
```

### Network Isolation
- Backend services only accessible via localhost
- Frontend services only accessible via localhost
- All external traffic goes through nginx
- SSL termination at nginx level

### Best Practices
1. Regular SSL certificate renewal monitoring
2. Keep nginx and Node.js updated
3. Monitor PM2 process health
4. Regular security audits
5. Implement rate limiting in nginx

## Monitoring and Maintenance

### Health Checks
```bash
# Quick health check script
#!/bin/bash
echo "Checking all services..."
curl -s https://app.flippi.ai/api/health | jq
curl -s https://green.flippi.ai/api/health | jq
curl -s https://blue.flippi.ai/api/health | jq
pm2 list
```

### Log Locations
```
Nginx access logs: /var/log/nginx/access.log
Nginx error logs:  /var/log/nginx/error.log
PM2 logs:          ~/.pm2/logs/
Application logs:  Managed by PM2
```

### Backup Considerations
- PM2 configuration: `pm2 save`
- Nginx configuration: `/etc/nginx/`
- SSL certificates: `/etc/letsencrypt/`
- Application code: Git repositories

## Conclusion

This networking setup provides a robust, efficient, and scalable architecture for the My Thrifting Buddy application. The migration from Docker to native services has improved performance while maintaining the flexibility of multiple environments for development, testing, and production.