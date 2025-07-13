# Networking Strategy and Architecture

## Overview
This document describes the networking setup for the My Thrifting Buddy application, which uses a blue-green deployment strategy with Docker containers and nginx routing.

## Current Architecture

### Domains and Routing
- **app.flippi.ai** - Production environment (NEVER touch without explicit permission)
- **blue.flippi.ai** - Blue staging environment (currently active for testing)
- **green.flippi.ai** - Green staging environment (being upgraded to v2.0)

### Docker Network
All containers run on a shared Docker bridge network: `thrifting_buddy_network`

This allows containers to communicate using their container names as hostnames.

### Container Naming Convention
- Production: `thrifting_buddy_api`, `thrifting_buddy_frontend`, `thrifting_buddy_nginx`
- Blue: `blue_backend`, `blue_frontend`
- Green: `green_backend`, `green_frontend`

## Nginx Configuration

### Main Nginx Container
A single nginx container (`thrifting_buddy_nginx`) handles SSL termination and routing for all environments.

Location: Running as a Docker container, configs in `/etc/nginx/conf.d/`

### SSL Certificates
- Using Let's Encrypt via certbot
- Main cert: `/etc/letsencrypt/live/app.flippi.ai/`
- Blue/Green use the app.flippi.ai cert (no wildcard cert available)

### Routing Configuration

#### Production (app.flippi.ai)
```nginx
location /api -> thrifting_buddy_api:3000
location /health -> thrifting_buddy_api:3000
location / -> thrifting_buddy_frontend:8080
```

#### Blue (blue.flippi.ai)
```nginx
location /api -> blue_backend:3000
location /health -> blue_backend:3000
location / -> blue_frontend:8080
```

#### Green (green.flippi.ai)
```nginx
location /api -> green_backend:3000
location /health -> green_backend:3000
location / -> green_frontend:8080
```

## Key Issues Encountered

### 1. Container Name Resolution
**Problem**: Nginx couldn't resolve container names like `blue_backend`

**Solution**: All containers must be on the same Docker network. Blue/Green containers connect to `thrifting_buddy_network`.

### 2. CORS Configuration
**Problem**: Frontend couldn't reach backend due to CORS

**Solution**: Backend uses `cors({ origin: true, credentials: true })` to allow all origins during development.

### 3. API_URL Configuration
**Problem**: Frontend needs to know where to send API requests

**Solution**: 
```javascript
const API_URL = Platform.OS === 'web' 
  ? '' // Same domain - nginx routes /api to backend
  : Platform.OS === 'ios'
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';
```

### 4. HTTPS Requirement for Camera
**Problem**: getUserMedia (camera) requires HTTPS

**Solution**: All domains use HTTPS via Let's Encrypt certificates

## Deployment Process

### Adding New Environment Config
1. Create nginx config file with routing rules
2. Copy to nginx container: `docker cp config.conf thrifting_buddy_nginx:/etc/nginx/conf.d/`
3. Test config: `docker exec thrifting_buddy_nginx nginx -t`
4. Reload: `docker exec thrifting_buddy_nginx nginx -s reload`

### Container Deployment
1. Build images locally
2. Save as tar.gz: `docker save image:tag | gzip > image.tar.gz`
3. Transfer to server via scp
4. Load on server: `gunzip -c image.tar.gz | docker load`
5. Update docker-compose.yml with new image tags
6. Deploy: `docker compose up -d`

## Network Diagnostics

### Check Container Networks
```bash
docker network inspect thrifting_buddy_network
docker inspect container_name | grep -A5 Networks
```

### Test Container Connectivity
```bash
docker exec nginx_container ping backend_container
```

### Check Nginx Routing
```bash
docker exec thrifting_buddy_nginx cat /etc/nginx/conf.d/*.conf
```

## Important Notes

1. **NEVER modify production (app.flippi.ai) without explicit permission**
2. Blue and Green share the main nginx container with production
3. All containers must be on `thrifting_buddy_network` for name resolution
4. The server IP is 157.245.142.145
5. SSL certs are shared from app.flippi.ai (no wildcard cert)

## Common Commands

### View all nginx configs
```bash
docker exec thrifting_buddy_nginx ls -la /etc/nginx/conf.d/
```

### Check container logs
```bash
docker logs container_name --tail 50
```

### Test endpoint
```bash
curl -s https://blue.flippi.ai/health
curl -s https://blue.flippi.ai/api/scan -X POST
```

## Troubleshooting

### API calls return 404
- Check nginx config exists for the domain
- Verify backend container is running
- Ensure containers are on same network

### API calls return 502
- Backend container crashed or not running
- Container names don't match nginx config
- Network connectivity issue

### Frontend loads but API fails
- CORS issue (check backend CORS config)
- API_URL misconfigured in frontend
- Nginx routing incorrect