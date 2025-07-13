# Docker Containerization Best Practices

## The Golden Rule of Containerization

**Every container must be self-contained and portable.**

If it needs source code, configuration files, or any external dependencies to run, it's not properly containerized.

## Core Principles

### 1. Immutability
- Containers are built once, run anywhere
- No runtime modifications
- Configuration through environment variables only
- If you need to change code, rebuild the image

### 2. Portability
```yaml
# BAD: Depends on local files
services:
  app:
    volumes:
      - ./src:/app/src  # Will fail on new server

# GOOD: Everything in the image
services:
  app:
    image: myapp:latest  # Self-contained
```

### 3. Single Responsibility
- One process per container
- One service per container
- Database separate from application
- Web server separate from app server

## Image Building Best Practices

### 1. Multi-Stage Builds
```dockerfile
# Build stage - includes build tools
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage - only runtime
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

### 2. Layer Optimization
```dockerfile
# BAD: Invalidates cache frequently
COPY . .
RUN npm install

# GOOD: Leverages build cache
COPY package*.json ./
RUN npm ci
COPY . .
```

### 3. Security
```dockerfile
# Create non-root user
RUN addgroup -g 10001 -S appuser && \
    adduser -S appuser -u 10001 -G appuser

# Own the necessary files
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser
```

## Development vs Production

### Development
```yaml
# docker-compose.override.yml
services:
  backend:
    volumes:
      - ./backend:/app  # Hot reload for development
    environment:
      NODE_ENV: development
```

### Production
```yaml
# docker-compose.prod.yml
services:
  backend:
    image: registry/backend:v1.2.3  # No volumes!
    environment:
      NODE_ENV: production
```

## Configuration Management

### 1. Build-Time vs Runtime
```dockerfile
# Build-time (baked into image)
ARG BUILD_VERSION
RUN echo $BUILD_VERSION > /app/version.txt

# Runtime (from environment)
ENV API_KEY=${API_KEY}
```

### 2. Environment Variables
```yaml
# BAD: Hardcoded values
environment:
  DATABASE_URL: postgresql://user:pass@localhost:5432/db

# GOOD: Configurable
environment:
  DATABASE_URL: ${DATABASE_URL}
```

### 3. Secrets Management
- Never in Dockerfile
- Never in image layers
- Use runtime injection
- Consider secret management tools

## Container Orchestration

### 1. Health Checks
```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1
```

### 2. Graceful Shutdown
```javascript
process.on('SIGTERM', async () => {
  await server.close();
  await db.disconnect();
  process.exit(0);
});
```

### 3. Resource Limits
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 512M
    reservations:
      cpus: '0.25'
      memory: 128M
```

## Data Management

### 1. Volumes for Persistence
```yaml
volumes:
  postgres_data:    # Database files
  redis_data:       # Cache persistence
  uploads:          # User uploads
```

### 2. Stateless Applications
- Sessions in Redis, not memory
- Files in object storage, not local disk
- Logs to stdout, not files

### 3. Backup Strategy
```yaml
backup:
  image: postgres:15-alpine
  volumes:
    - postgres_data:/data:ro
    - ./backups:/backup
  command: pg_dump -h postgres -U user db > /backup/dump.sql
```

## Networking

### 1. Service Discovery
```yaml
# Use service names, not IPs
DATABASE_URL: postgresql://user:pass@postgres:5432/db
REDIS_URL: redis://redis:6379
```

### 2. Internal Networks
```yaml
networks:
  backend:
    internal: true  # No external access
  frontend:
    external: true  # Internet facing
```

## Testing Containerization

### 1. Portability Test
```bash
# Build on one machine
docker build -t myapp:test .
docker save myapp:test > myapp.tar

# Load on different machine
docker load < myapp.tar
docker run myapp:test  # Must work without source code
```

### 2. Clean Environment Test
```bash
# Remove everything
docker system prune -a
# Pull and run - must work
docker run registry/myapp:latest
```

## Common Anti-Patterns

### 1. Source Code Dependencies
```yaml
# WRONG: Requires source code on server
volumes:
  - ./src:/app/src
  - ./config:/app/config
```

### 2. Local File References
```dockerfile
# WRONG: Assumes local file exists
COPY /home/user/secrets.env .
```

### 3. Host Dependencies
```dockerfile
# WRONG: Assumes host has tools
RUN apt-get install -y $(cat /host/packages.txt)
```

### 4. Mutable Containers
```yaml
# WRONG: Installing packages at runtime
command: bash -c "npm install && npm start"
```

## Deployment Readiness Checklist

- [ ] Image runs without volume mounts
- [ ] No source code needed on server
- [ ] Configuration via environment only
- [ ] Health checks implemented
- [ ] Graceful shutdown handling
- [ ] Resource limits defined
- [ ] Non-root user
- [ ] No secrets in image
- [ ] Logging to stdout
- [ ] Tagged with version

## The Containerization Test

Ask yourself: **"Can I deploy this container on a fresh server with just the image and environment variables?"**

If the answer is no, it's not properly containerized.

## Real-World Example

### Problem Case (Mobile-Web Service)
```yaml
# Current - NOT properly containerized
mobile-web:
  build:
    context: ./mobile-app
    dockerfile: Dockerfile.web
  volumes:
    - ./mobile-app:/app  # Depends on source!
  command: npx expo start --web
```

### Proper Solution
```yaml
# Development (with hot reload)
mobile-web:
  image: myapp/mobile-web:latest
  volumes:
    - ./mobile-app:/app  # OK for dev only
  environment:
    NODE_ENV: development

# Production (self-contained)
mobile-web:
  image: myapp/mobile-web:latest
  # No volumes! Everything in image
  environment:
    NODE_ENV: production
```

## Summary

Proper containerization means:
1. **Build once, run anywhere**
2. **No external dependencies**
3. **Configuration through environment**
4. **Immutable and versioned**
5. **Security built-in**

If you can't `docker run image:tag` on a clean server and have it work, you haven't containerized properly.