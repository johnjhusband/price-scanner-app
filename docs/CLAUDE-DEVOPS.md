# CLAUDE-DEVOPS.md

## DevOps Standards and Practices

### Role Definition
As the DevOps specialist, I handle infrastructure, deployment pipelines, and operational concerns. I DO NOT modify application code - that's the software team's responsibility.

## Core Responsibilities

### 1. Infrastructure as Code
- **Dockerfiles**: Create and maintain build definitions
- **Docker Compose**: Design service orchestration
- **CI/CD Pipelines**: Automate build, test, deploy processes
- **Infrastructure Templates**: Define cloud resources

### 2. Handoff Points
**DevOps Provides:**
- Dockerfile templates
- docker-compose.yml configurations
- Build/deployment scripts
- Infrastructure documentation
- Monitoring setup

**Software Team Provides:**
- Working application code
- Complete package.json/package-lock.json
- Environment variable requirements
- Test suites
- Application documentation

## Critical Docker Standards

### Pre-Build Verification (ALWAYS)
```bash
# 1. Verify application runs locally
cd backend && npm start    # Must succeed
cd mobile-app && npm start # Must succeed

# 2. Check disk space
df -h  # Need 2-3x final image size free

# 3. Clean Docker environment
docker system prune -f
docker builder prune -f
```

### Dockerfile Best Practices

#### 1. Image Selection
```dockerfile
# GOOD: Specific version, minimal base
FROM node:20-alpine

# BAD: Latest tag, large base
FROM node:latest
```

#### 2. Layer Optimization
```dockerfile
# GOOD: Combined commands, single layer
RUN apk add --no-cache curl git && \
    rm -rf /var/cache/apk/*

# BAD: Multiple layers, no cleanup
RUN apk add curl
RUN apk add git
```

#### 3. Build Order (Cache Efficiency)
```dockerfile
# Order: least → most frequently changing
WORKDIR /app
COPY package*.json ./     # Changes rarely
RUN npm ci                # Cached if package*.json unchanged
COPY . .                  # Changes frequently
```

#### 4. Multi-Stage Builds
```dockerfile
# Build stage - includes dev dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - minimal size
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

### Docker Compose Standards

#### Development vs Production
```yaml
# docker-compose.yml (Development)
services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/app  # Hot reload
    ports:
      - "3000:3000"    # Direct access

# docker-compose.prod.yml (Production)
services:
  backend:
    image: registry/backend:${VERSION}
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 1G
    networks:
      - internal      # No direct access
```

#### Network Security
```yaml
networks:
  frontend:
    driver: bridge    # Public facing
  backend:
    driver: bridge
    internal: true    # Internal only
```

### Environment Management

#### Never Store Secrets in Images
```dockerfile
# BAD: Secrets in Dockerfile
ENV API_KEY=secret123

# GOOD: Runtime injection
ENV API_KEY=${API_KEY}
```

#### .env File Handling
```yaml
# Development: env_file
env_file: ./backend/.env

# Production: External secrets
environment:
  API_KEY: ${API_KEY}  # From CI/CD
```

## Operational Standards

### Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 256M
```

### Logging
```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

## Build & Deploy Process

### 1. Build Pipeline
```bash
# Always in this order
docker system prune -f          # Clean first
docker build -t app:latest .    # Build
docker image prune -f           # Clean after
```

### 2. Deployment Sequence
```bash
# 1. Validate images exist
docker images | grep app

# 2. Deploy with health checks
docker-compose up -d

# 3. Verify health
docker-compose ps
docker-compose logs --tail=50

# 4. Rollback if needed
docker-compose down
docker-compose up -d --scale app=0
```

## Troubleshooting Guide

### Common Issues & Solutions

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| Build fails - no space | `df -h` shows >95% | Run cleanup commands |
| Container exits immediately | Check logs: `docker logs <id>` | Missing env vars or deps |
| Package not found | Build succeeds, runtime fails | Software team issue |
| Network unreachable | Container can't reach DB | Check network config |
| High memory usage | `docker stats` | Add resource limits |

### Docker Space Management
```bash
# Regular maintenance (weekly)
docker system df                # Check usage
docker container prune -f       # Remove stopped
docker image prune -a -f       # Remove unused
docker volume prune -f         # Remove orphaned
docker builder prune -f        # Clear build cache

# Emergency cleanup (when full)
docker system prune -a -f      # Remove everything unused
```

## Monitoring Standards

### Container Metrics
- CPU usage < 80% sustained
- Memory usage < 90% limit
- Restart count = 0
- Health check passing

### Log Aggregation
- Centralized logging (ELK/CloudWatch)
- Structured JSON format
- Retention: 30 days minimum
- Alert on error patterns

## Security Standards

### Image Security
1. **Scan images**: Use Trivy/Clair
2. **Non-root user**: UID > 10000
3. **No secrets**: Use runtime injection
4. **Minimal base**: Alpine preferred
5. **Update regularly**: Monthly rebuilds

### Network Security
1. **Internal networks**: For backend services
2. **Named networks**: Not default bridge
3. **Firewall rules**: Explicit port exposure
4. **TLS termination**: At load balancer

## Handoff Documentation

### For Software Team
When reporting issues:
1. Exact error message
2. Where it occurs (build/runtime)
3. What's needed to fix
4. Impact on deployment

### For Deployment Team
Provide:
1. Image names and tags
2. Environment variables needed
3. Port mappings
4. Health check endpoints
5. Rollback procedures

## Continuous Improvement

### Performance Optimization
- Monitor build times
- Reduce image sizes
- Optimize layer caching
- Implement build parallelization

### Automation Goals
- Zero-downtime deployments
- Automated rollbacks
- Self-healing services
- Predictive scaling

## Emergency Procedures

### Service Down
1. Check health: `docker-compose ps`
2. Check logs: `docker-compose logs service`
3. Restart: `docker-compose restart service`
4. Rollback: Use previous image tag

### Disk Full
1. Stop non-critical services
2. Run emergency cleanup
3. Identify growth source
4. Implement retention policies

### High Load
1. Scale horizontally: `docker-compose scale app=4`
2. Check resource limits
3. Implement caching
4. Add load balancer