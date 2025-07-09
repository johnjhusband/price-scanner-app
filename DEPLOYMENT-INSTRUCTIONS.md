# DEPLOYMENT INSTRUCTIONS - Development Environment

## Prerequisites
- Docker Engine v20+ with Docker Compose v2
- 3GB free disk space
- Backend .env file configured (see Backend Setup below)

## Clean Up Previous Installation (if needed)
```bash
# Navigate to project directory first
cd /root/price-scanner-app

# Stop and remove all containers
docker compose down

# Remove all data volumes (for fresh start)
docker compose down -v

# Clean up Docker system (optional - frees disk space)
docker system prune -f
```

## Backend Setup
The backend `.env` file is already configured in the `backend/` directory.

To verify it has your OpenAI API key:
```bash
# Check if OPENAI_API_KEY is set
grep OPENAI_API_KEY backend/.env
```

## Deploy Development Environment
```bash
# 1. Navigate to project directory
cd /root/price-scanner-app

# 2. (Optional) Run validation script to check prerequisites
./validate-deployment.sh

# 3. Deploy all services
docker compose up -d

# 4. CRITICAL: Run database migrations (creates required tables)
docker compose exec backend npm run db:migrate
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379) 
- Backend API (port 3000)
- Frontend web app (served via Nginx)
- Nginx reverse proxy (port 80)
- Mobile web interface (port 19006)

**Step 4 is critical** - it creates the users, scan_history, and refresh_tokens tables required for authentication.

## Verify Deployment
```bash
# Check all services are running
docker compose ps

# View logs if needed
docker compose logs -f backend
```

## Access Application
- Main Frontend: http://localhost
- Backend API: http://localhost:3000
- Mobile Web: http://localhost:19006

## Development Features
- Database persists between restarts
- Logs available via `docker compose logs [service-name]`
- Code changes in backend: restart with `docker compose restart backend`
- Code changes requiring rebuild: see "Rebuilding After Code Changes" section

## Rebuilding and Redeploying After Code Changes

### Complete Clean and Rebuild Process

When source code changes require new Docker images:

```bash
# 1. Navigate to project directory
cd /root/price-scanner-app

# 2. Stop all running containers
docker compose down

# 3. Clean up old images and build cache
docker system prune -f
docker image prune -f

# 4. Rebuild all images with latest code
docker compose build

# 5. Deploy with new images
docker compose up -d

# 6. Verify all services are running
docker compose ps
```

### Rebuild Specific Service Only

```bash
# Stop and rebuild specific service
docker compose stop backend
docker compose build backend
docker compose up -d backend
```

### Force Complete Rebuild (No Cache)

```bash
# When having issues with cached layers
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Stop Application
```bash
# Stop all services
docker compose down

# Stop and remove all data (fresh start)
docker compose down -v
```