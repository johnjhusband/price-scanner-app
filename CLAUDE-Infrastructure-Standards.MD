# Infrastructure Standards for My Thrifting Buddy

This document outlines infrastructure standards and operational procedures for deploying and maintaining the My Thrifting Buddy application.

## Service Architecture

### Core Services
```yaml
Services:
├── postgres (PostgreSQL 15 Alpine) - Primary database
├── redis (Redis 7 Alpine) - Session cache with persistence
├── backend (Node.js Express API) - Application server
├── frontend (React Native Web/Nginx) - Static web server
├── nginx (Reverse Proxy) - Load balancer and SSL termination
└── backup (Automated backups) - Database backup service

Networks:
├── frontend (172.20.0.0/24) - Public-facing network
└── backend (172.21.0.0/24) - Internal-only network
```

### Port Mappings
- Backend API: 3000 (internal), exposed via nginx
- Frontend: 80/443 (public)
- PostgreSQL: 5432 (internal only)
- Redis: 6379 (internal only)

## Environment Standards

### File Locations
- **Backend .env**: MUST be in `/backend` directory
- **Frontend**: No .env needed (dynamic API detection)
- **Docker compose**: Use `.env` at project root for compose variables only

### Required Environment Variables
```bash
# Minimum required for backend operation
NODE_ENV=development|production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
JWT_ACCESS_SECRET=<32+ character string>
JWT_REFRESH_SECRET=<32+ character string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
OPENAI_API_KEY=<valid key>
AWS_ACCESS_KEY_ID=<valid key>
AWS_SECRET_ACCESS_KEY=<valid secret>
S3_BUCKET_NAME=<bucket name>
AWS_REGION=us-east-1
ALLOWED_ORIGINS=<comma-separated origins>
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE_MB=10
LOG_LEVEL=info
```

### Secret Generation
```bash
# Generate secure secrets
openssl rand -base64 32  # For JWT secrets
```

## Docker Standards

### Pre-Build Checklist
1. **Verify dependencies locally**
   ```bash
   cd backend && npm install && npm start
   cd mobile-app && npm install && npx expo start --web
   ```

2. **Install web dependencies** (mobile-app)
   ```bash
   npx expo install react-native-web react-dom @expo/metro-runtime
   npm install  # Update package-lock.json
   ```

3. **Check disk space**
   ```bash
   df -h  # Need 2-3x final image size free
   ```

4. **Clean Docker artifacts**
   ```bash
   docker system prune -f
   docker builder prune -f
   ```

### Build Process
```bash
# Standard build sequence
docker-compose build --no-cache  # Clean build
docker-compose build             # Normal build with cache

# Individual builds
docker build -f backend/Dockerfile.backend -t thrifting-buddy/backend:latest ./backend
docker build -f mobile-app/Dockerfile.frontend -t thrifting-buddy/frontend:latest ./mobile-app
```

### Space Management
```bash
# Regular cleanup (run before/after builds)
docker system prune -f       # Remove stopped containers, dangling images
docker builder prune -f      # Remove build cache
docker volume prune -f       # Remove unused volumes (careful!)

# Deep cleanup (when space critical)
docker system prune -af      # Remove ALL unused images
docker builder prune -af     # Remove ALL build cache

# Space monitoring
docker system df            # Show Docker disk usage
du -sh /var/lib/docker     # Total Docker directory size
```

### Container Security
1. **Non-root users**: All containers run as UID > 10000
2. **Read-only filesystems**: Where possible
3. **Network isolation**: Backend services on internal network
4. **Resource limits**: CPU and memory limits in production
5. **Health checks**: All services have health endpoints

## Deployment Procedures

### Development Deployment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Access container
docker-compose exec [service] sh

# Stop all services
docker-compose down
```

### Production Deployment
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Rolling update
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --no-deps backend
```

### Database Operations
```bash
# Run migrations
docker-compose exec backend npm run migrate

# Database backup
docker-compose exec backup /backup.sh

# Connect to database
docker-compose exec postgres psql -U postgres -d thrifting_buddy
```

## Monitoring and Health Checks

### Health Endpoints
- Backend: `GET /health`
- Backend services: `GET /api/scan/health`

### Log Locations
- Backend logs: Winston to stdout + file
- Nginx logs: `/var/log/nginx/`
- Application logs: Collected by Docker logging driver

### Metrics to Monitor
1. **System**: CPU, Memory, Disk usage
2. **Docker**: Container restarts, exit codes
3. **Application**: Response times, error rates
4. **Database**: Connection pool, query performance

## Troubleshooting Guide

### Common Issues

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| Container exits immediately | Check logs: `docker logs [container]` | Usually missing env vars or dependency issues |
| Cannot connect to backend | Check nginx logs and backend health | Verify CORS origins, check if backend is running |
| Database connection failed | Test connection from backend container | Check DATABASE_URL, ensure postgres is running |
| Out of disk space | `docker system df` | Run cleanup commands, check for large logs |
| Slow builds | Build cache corrupted | Use `--no-cache` flag, clean builder cache |

### Debug Commands
```bash
# Container inspection
docker ps -a                    # All containers including stopped
docker inspect [container]      # Full container details
docker logs --tail 50 -f [id]   # Follow last 50 log lines

# Network debugging
docker network ls               # List networks
docker network inspect [net]    # Network details
docker-compose exec backend ping postgres  # Test connectivity

# Resource usage
docker stats                    # Real-time resource usage
docker system events           # Real-time Docker events
```

## Backup and Recovery

### Backup Strategy
1. **Database**: Daily automated backups via backup service
2. **Uploads**: S3 versioning and lifecycle policies
3. **Configuration**: Version controlled in Git

### Recovery Procedures
```bash
# Restore database from backup
docker-compose exec postgres pg_restore -U postgres -d thrifting_buddy < backup.sql

# Restore from S3
aws s3 sync s3://backup-bucket/date/ ./restore/
```

## Security Procedures

### Regular Security Tasks
1. **Update base images** monthly
2. **Scan images** for vulnerabilities
3. **Rotate secrets** quarterly
4. **Review access logs** weekly

### Security Commands
```bash
# Scan Docker images
docker scan thrifting-buddy/backend:latest

# Check for secrets in images
docker history --no-trunc [image] | grep -i secret

# List running processes in container
docker-compose exec [service] ps aux
```

## Performance Optimization

### Docker Performance
1. **Use multi-stage builds** to reduce image size
2. **Order Dockerfile commands** by change frequency
3. **Minimize layers** by combining RUN commands
4. **Use .dockerignore** to exclude unnecessary files
5. **Enable BuildKit**: `export DOCKER_BUILDKIT=1`

### Resource Allocation (Production)
```yaml
# docker-compose.prod.yml
services:
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

## Compliance and Standards

### Required Practices
1. **Never commit secrets** to version control
2. **Always use specific image tags** (not :latest in production)
3. **Document all environment variables**
4. **Test migrations both up and down**
5. **Keep audit logs** of deployments

### Image Standards
- Base images: Official Alpine variants preferred
- Node.js: LTS versions only (currently 20.x)
- PostgreSQL: Latest stable (currently 15.x)
- Redis: Latest stable (currently 7.x)
- Nginx: Latest stable mainline

## Emergency Procedures

### Service Outage
1. Check health endpoints
2. Review recent deployments
3. Check resource usage
4. Review error logs
5. Rollback if necessary

### Rollback Procedure
```bash
# Tag current version
docker tag thrifting-buddy/backend:latest thrifting-buddy/backend:rollback

# Deploy previous version
docker-compose up -d --no-deps backend

# If database changes, rollback migrations
docker-compose exec backend npm run migrate:rollback
```

### Data Corruption
1. Stop affected services immediately
2. Identify extent of corruption
3. Restore from latest clean backup
4. Verify data integrity
5. Document incident

## Maintenance Windows

### Planned Maintenance
1. **Schedule**: During low-traffic hours
2. **Notification**: 24 hours advance notice
3. **Duration**: Maximum 2 hours
4. **Rollback plan**: Always prepared

### Maintenance Checklist
- [ ] Backup current state
- [ ] Test changes in staging
- [ ] Prepare rollback plan
- [ ] Monitor during deployment
- [ ] Verify post-deployment
- [ ] Update documentation