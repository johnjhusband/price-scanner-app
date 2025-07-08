# DEPLOYMENT INSTRUCTIONS

## Prerequisites
- Docker Engine v20+ with Docker Compose v2
- 3GB free disk space
- Clean port availability (80, 443, 3000, 5432, 6379, 19006)

## Deploy Application
```bash
# 1. Navigate to project directory
cd /root/price-scanner-app

# 2. Validate prerequisites (optional but recommended)
./validate-deployment.sh

# 3. Deploy
docker compose up -d
```

Wait 10 seconds for all health checks to pass.

## Verify Success
```bash
docker compose ps
```

All services must show "Up" status:
- thrifting_buddy_api (healthy)
- thrifting_buddy_db (healthy)  
- thrifting_buddy_redis (healthy)
- thrifting_buddy_nginx
- thrifting_buddy_mobile_web

## Access Application
- Frontend: http://localhost
- Backend API: http://localhost:3000
- Mobile Web: http://localhost:19006

## Stop Application
```bash
docker compose down
```

## Production Deployment
```bash
docker compose -f docker-compose.prod.yml up -d
```