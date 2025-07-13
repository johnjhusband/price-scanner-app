# Infrastructure & Deployment Best Practices

This document outlines best practices for infrastructure and deployment engineers working with containerized applications.

## Table of Contents
1. [Pre-Deployment Validation](#pre-deployment-validation)
2. [Automated Bug Logging](#automated-bug-logging)
3. [Environment Management](#environment-management)
4. [Container Orchestration](#container-orchestration)
5. [Monitoring & Health Checks](#monitoring--health-checks)
6. [Troubleshooting Workflow](#troubleshooting-workflow)
7. [Post-Deployment Verification](#post-deployment-verification)
8. [Rollback Procedures](#rollback-procedures)

## Pre-Deployment Validation

### Always Run Pre-Flight Checks
Before ANY deployment, validate the environment is ready:

```bash
#!/bin/bash
# Pre-deployment validation script

echo "=== Pre-Deployment Validation ==="

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not installed"
    exit 1
fi

# Check disk space
AVAILABLE_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$AVAILABLE_SPACE" -lt 3 ]; then
    echo "❌ Insufficient disk space: ${AVAILABLE_SPACE}GB (need 3GB)"
    exit 1
fi

# Check required files
REQUIRED_FILES=(
    "docker-compose.yml"
    "backend/.env"
    "backend/Dockerfile.backend"
    "mobile-app/Dockerfile.frontend"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing required file: $file"
        exit 1
    fi
done

# Validate environment files
if ! grep -q "OPENAI_API_KEY=" backend/.env; then
    echo "⚠️  Warning: OPENAI_API_KEY not set in backend/.env"
fi

echo "✅ Pre-deployment validation passed"
```

### Port Availability Check
```bash
# Check if required ports are available
PORTS=(80 443 3000 5432 6379)
for port in "${PORTS[@]}"; do
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null; then
        echo "❌ Port $port is already in use"
        exit 1
    fi
done
```

## Automated Bug Logging

### Implement Structured Error Logging

#### 1. Create Error Log Entry Function
```bash
log_error() {
    local ERROR_TYPE=$1
    local ERROR_MSG=$2
    local RESOLUTION=$3
    
    cat >> error-log.txt << EOF

$(date '+%Y-%m-%d %H:%M:%S') - ${ERROR_TYPE}
=====================================
Error: ${ERROR_MSG}
Container Status:
$(docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}")

Logs (last 20 lines):
$(docker compose logs --tail 20 2>&1)

Suggested Resolution: ${RESOLUTION}

Status: NEW - Awaiting resolution
Priority: $(determine_priority "$ERROR_TYPE")
=====================================
EOF
}
```

#### 2. Automated Health Check Monitoring
```bash
#!/bin/bash
# health-monitor.sh - Run this in background during deployment

monitor_deployment() {
    local TIMEOUT=300  # 5 minutes
    local INTERVAL=5   # Check every 5 seconds
    local ELAPSED=0
    
    while [ $ELAPSED -lt $TIMEOUT ]; do
        # Check all containers
        UNHEALTHY=$(docker compose ps --format json | jq -r '.[] | select(.Health != "healthy" and .Health != null) | .Name')
        
        if [ -n "$UNHEALTHY" ]; then
            for container in $UNHEALTHY; do
                log_error "CONTAINER_UNHEALTHY" \
                    "Container $container is not healthy" \
                    "Check logs: docker compose logs $container"
            done
        fi
        
        sleep $INTERVAL
        ELAPSED=$((ELAPSED + INTERVAL))
    done
}
```

#### 3. Deployment Wrapper Script
```bash
#!/bin/bash
# deploy.sh - Always use this instead of direct docker compose

deploy_application() {
    echo "Starting deployment with automated monitoring..."
    
    # Clean previous deployment
    docker compose down
    
    # Start monitoring in background
    monitor_deployment &
    MONITOR_PID=$!
    
    # Deploy
    if docker compose up -d; then
        echo "✅ Deployment command successful"
        
        # Wait for services to stabilize
        sleep 10
        
        # Verify all services are running
        if docker compose ps | grep -E "(Exit|Restarting)"; then
            log_error "DEPLOYMENT_PARTIAL_FAILURE" \
                "Some services failed to start" \
                "Check individual service logs"
        fi
    else
        log_error "DEPLOYMENT_FAILED" \
            "Docker compose up failed" \
            "Check docker-compose.yml syntax and Docker daemon"
    fi
    
    # Stop monitoring
    kill $MONITOR_PID 2>/dev/null
}
```

## Environment Management

### Best Practices for Environment Variables

1. **Never hardcode secrets in docker-compose.yml**
   ```yaml
   # BAD
   environment:
     API_KEY: "sk-actual-key-here"
   
   # GOOD
   env_file:
     - ./backend/.env
   ```

2. **Use env_file directive for service-specific variables**
   ```yaml
   backend:
     env_file:
       - ./backend/.env
   ```

3. **Override only what's necessary**
   ```yaml
   backend:
     env_file:
       - ./backend/.env
     environment:
       # Override DATABASE_URL to use container networking
       DATABASE_URL: postgresql://user:pass@postgres:5432/db
   ```

4. **Validate environment files before deployment**
   ```bash
   validate_env_file() {
       local ENV_FILE=$1
       local REQUIRED_VARS=(
           "JWT_ACCESS_SECRET"
           "JWT_REFRESH_SECRET"
           "OPENAI_API_KEY"
       )
       
       for var in "${REQUIRED_VARS[@]}"; do
           if ! grep -q "^${var}=" "$ENV_FILE"; then
               echo "❌ Missing required variable: $var in $ENV_FILE"
               return 1
           fi
       done
   }
   ```

## Container Orchestration

### Docker Compose Best Practices

1. **Always use health checks**
   ```yaml
   postgres:
     healthcheck:
       test: ["CMD-SHELL", "pg_isready -U postgres"]
       interval: 10s
       timeout: 5s
       retries: 5
   ```

2. **Define proper dependencies**
   ```yaml
   backend:
     depends_on:
       postgres:
         condition: service_healthy
       redis:
         condition: service_healthy
   ```

3. **Use restart policies wisely**
   ```yaml
   backend:
     restart: unless-stopped  # For production
     # restart: "no"         # For debugging
   ```

4. **Resource limits in production**
   ```yaml
   backend:
     deploy:
       resources:
         limits:
           cpus: '1'
           memory: 1G
         reservations:
           cpus: '0.5'
           memory: 512M
   ```

## Monitoring & Health Checks

### Implement Comprehensive Health Endpoints

1. **Basic health check**
   ```javascript
   app.get('/health', (req, res) => {
     res.status(200).json({ status: 'healthy' });
   });
   ```

2. **Detailed health check**
   ```javascript
   app.get('/health/detailed', async (req, res) => {
     const checks = {
       database: await checkDatabase(),
       redis: await checkRedis(),
       diskSpace: await checkDiskSpace(),
       memory: process.memoryUsage()
     };
     
     const healthy = Object.values(checks).every(check => check.healthy);
     res.status(healthy ? 200 : 503).json(checks);
   });
   ```

### Monitoring Script
```bash
#!/bin/bash
# monitor.sh - Real-time monitoring during deployment

watch -n 2 '
echo "=== Container Status ==="
docker compose ps
echo -e "\n=== Resource Usage ==="
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
echo -e "\n=== Recent Logs ==="
docker compose logs --tail 5
'
```

## Troubleshooting Workflow

### Standard Debugging Process

1. **Check container status**
   ```bash
   docker compose ps -a
   ```

2. **Review logs systematically**
   ```bash
   # All services
   docker compose logs
   
   # Specific service
   docker compose logs backend --tail 100
   
   # Follow logs
   docker compose logs -f backend
   ```

3. **Inspect failing containers**
   ```bash
   docker compose exec backend sh
   # If container is not running:
   docker run -it --entrypoint sh image_name
   ```

4. **Check resource constraints**
   ```bash
   docker system df
   docker stats
   ```

5. **Network debugging**
   ```bash
   docker compose exec backend ping postgres
   docker network inspect $(docker compose ps -q backend)
   ```

### Common Issues Quick Reference

| Issue | Check | Solution |
|-------|-------|----------|
| Container exits immediately | `docker logs container_name` | Usually missing env vars or failed healthcheck |
| Cannot connect between services | `docker network ls` | Use service names, not localhost |
| Port already in use | `lsof -i :PORT` | Change port or stop conflicting service |
| No space left on device | `docker system df` | Run `docker system prune -a` |
| Permissions error | `ls -la` in container | Check user in Dockerfile |

## Post-Deployment Verification

### Automated Verification Script
```bash
#!/bin/bash
# verify-deployment.sh

echo "=== Post-Deployment Verification ==="

# 1. Check all containers are running
if docker compose ps | grep -E "(Exit|Restarting)"; then
    echo "❌ Some containers are not running properly"
    exit 1
fi

# 2. Test health endpoints
ENDPOINTS=(
    "http://localhost:3000/health"
    "http://localhost"
)

for endpoint in "${ENDPOINTS[@]}"; do
    if curl -f -s "$endpoint" > /dev/null; then
        echo "✅ $endpoint is responding"
    else
        echo "❌ $endpoint is not responding"
        exit 1
    fi
done

# 3. Check database connectivity
docker compose exec -T backend npm run migrate:status || {
    echo "❌ Database connectivity check failed"
    exit 1
}

# 4. Verify volumes are mounted
docker compose exec -T backend ls -la uploads || {
    echo "❌ Upload directory not accessible"
    exit 1
}

echo "✅ All verification checks passed"
```

## Rollback Procedures

### Safe Rollback Process

1. **Tag current deployment**
   ```bash
   docker tag app:latest app:rollback-$(date +%Y%m%d-%H%M%S)
   ```

2. **Document current state**
   ```bash
   docker compose ps > deployment-state-$(date +%Y%m%d-%H%M%S).txt
   docker compose config > deployment-config-$(date +%Y%m%d-%H%M%S).yml
   ```

3. **Rollback script**
   ```bash
   #!/bin/bash
   # rollback.sh
   
   PREVIOUS_VERSION=$1
   
   if [ -z "$PREVIOUS_VERSION" ]; then
       echo "Usage: ./rollback.sh <version>"
       exit 1
   fi
   
   # Stop current deployment
   docker compose down
   
   # Restore previous version
   docker tag app:$PREVIOUS_VERSION app:latest
   
   # Deploy previous version
   docker compose up -d
   
   # Verify rollback
   ./verify-deployment.sh || {
       echo "❌ Rollback verification failed"
       exit 1
   }
   ```

## Infrastructure Handoff Checklist

Before marking deployment complete:

- [ ] All containers show "healthy" status
- [ ] Health endpoints return 200 OK
- [ ] No errors in last 100 lines of logs
- [ ] Resource usage is within limits
- [ ] Backup procedures are documented
- [ ] Rollback procedure is tested
- [ ] Monitoring is configured
- [ ] Error log is clean
- [ ] Documentation is updated
- [ ] Credentials are secured

## Continuous Improvement

### Post-Deployment Review
After each deployment, update this document with:
1. New issues encountered
2. Solutions that worked
3. Time-saving shortcuts discovered
4. Automation opportunities identified

### Error Pattern Analysis
Regularly review error-log.txt to identify:
1. Recurring issues
2. Common root causes
3. Preventable failures
4. Automation opportunities

Remember: Every deployment failure is an opportunity to improve the process. Document it, automate the fix, and prevent it from happening again.