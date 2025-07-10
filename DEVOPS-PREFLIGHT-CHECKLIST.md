# DEVOPS PRE-DEPLOYMENT CHECKLIST

## Before Running docker compose up

### 1. Environment Files
- [ ] Verify backend/.env exists and contains all required variables:
  ```bash
  cat backend/.env | grep -E "JWT_ACCESS_SECRET|JWT_REFRESH_SECRET|OPENAI_API_KEY"
  ```
- [ ] Check docker-compose.yml has env_file directive for backend service

### 2. Required Files Check
- [ ] nginx/nginx.conf exists
- [ ] nginx/sites-enabled/ directory exists
- [ ] mobile-app/Dockerfile.web exists (if using mobile-web service)
- [ ] backend/Dockerfile.backend exists
- [ ] mobile-app/Dockerfile.frontend exists

### 3. Port Availability
- [ ] Port 80 (nginx/frontend) - `lsof -i :80`
- [ ] Port 443 (nginx SSL) - `lsof -i :443`
- [ ] Port 3000 (backend API) - `lsof -i :3000`
- [ ] Port 5432 (PostgreSQL) - `lsof -i :5432`
- [ ] Port 6379 (Redis) - `lsof -i :6379`
- [ ] Port 19006 (mobile web) - `lsof -i :19006`

### 4. Docker Status
- [ ] Docker daemon running: `docker info`
- [ ] Adequate disk space: `df -h` (need 3GB+ free)
- [ ] Clean old containers: `docker ps -a | grep Exit`
- [ ] No conflicting container names

### 5. Image Verification
- [ ] Backend image built: `docker images | grep backend`
- [ ] Frontend image built: `docker images | grep frontend`

### 6. Network Verification
- [ ] No conflicting networks: `docker network ls | grep thrifting`

## Quick Validation Script
```bash
#!/bin/bash
# Run this before deployment

echo "=== Pre-flight Check ==="

# Check env file
if [ ! -f backend/.env ]; then
  echo "❌ backend/.env missing"
  exit 1
fi

# Check required env vars
for var in JWT_ACCESS_SECRET JWT_REFRESH_SECRET OPENAI_API_KEY; do
  if ! grep -q "$var=" backend/.env; then
    echo "❌ Missing $var in backend/.env"
    exit 1
  fi
done

# Check ports
for port in 80 3000 5432 6379; do
  if lsof -i :$port >/dev/null 2>&1; then
    echo "⚠️  Port $port already in use"
  fi
done

# Check Docker
if ! docker info >/dev/null 2>&1; then
  echo "❌ Docker not running"
  exit 1
fi

echo "✅ Pre-flight check passed"
```

## Common Issues Prevention

1. **Environment Variables**: Always use env_file directive
2. **Networking**: Use container names for internal communication
3. **Volumes**: Ensure directories exist before mounting
4. **Dependencies**: Use depends_on with health checks
5. **Logs**: Always check `docker compose logs [service]` on failure