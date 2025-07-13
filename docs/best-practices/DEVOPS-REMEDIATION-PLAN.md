# DevOps Remediation Plan

## Critical Issues Identified

### 1. Mobile-Web Service - NOT Containerized
**Current State**: Depends on source code via volume mount
**Impact**: Cannot deploy to new server without source code

### 2. Nginx Configuration - External Dependencies  
**Current State**: Requires config files from host
**Impact**: Not portable, requires exact file structure

### 3. Backend Development Mode - Volume Mounted
**Current State**: Source code mounted for hot reload
**Impact**: Dev/prod configs mixed, not clear separation

### 4. Security Violations
**Current State**: Services run as root, no health checks
**Impact**: Security vulnerabilities, no monitoring

## Remediation Plan

### Phase 1: Fix Mobile-Web Service (CRITICAL)

#### 1.1 Create Production Dockerfile
```dockerfile
# mobile-app/Dockerfile.mobile-web
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx expo export --platform web --output-dir dist

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY mobile-nginx.conf /etc/nginx/conf.d/default.conf
RUN addgroup -g 10001 -S nginx-user && \
    adduser -S nginx-user -u 10001 -G nginx-user && \
    chown -R nginx-user:nginx-user /var/cache/nginx && \
    chown -R nginx-user:nginx-user /usr/share/nginx/html
USER nginx-user
EXPOSE 19006
HEALTHCHECK CMD curl -f http://localhost:19006 || exit 1
```

#### 1.2 Build and Tag Image
```bash
docker build -f mobile-app/Dockerfile.mobile-web -t thrifting-buddy/mobile-web:latest ./mobile-app
```

#### 1.3 Update docker-compose.yml
```yaml
mobile-web:
  image: thrifting-buddy/mobile-web:latest
  ports:
    - "19006:19006"
  # Remove all volumes and build context
```

### Phase 2: Fix Nginx Configuration

#### 2.1 Create Nginx Image with Embedded Config
```dockerfile
# nginx/Dockerfile
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY sites-enabled /etc/nginx/sites-enabled
RUN addgroup -g 10001 -S nginx-user && \
    adduser -S nginx-user -u 10001 -G nginx-user && \
    chown -R nginx-user:nginx-user /var/cache/nginx
USER nginx-user
HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1
```

#### 2.2 Build Nginx Image
```bash
docker build -f nginx/Dockerfile -t thrifting-buddy/nginx:latest ./nginx
```

### Phase 3: Separate Dev and Prod Configurations

#### 3.1 Create docker-compose.override.yml for Development
```yaml
# docker-compose.override.yml (auto-loaded in dev)
services:
  backend:
    volumes:
      - ./backend:/app  # Hot reload for dev only
    environment:
      NODE_ENV: development
  
  # Development-only service
  mobile-web-dev:
    build:
      context: ./mobile-app
      dockerfile: Dockerfile.web
    volumes:
      - ./mobile-app:/app
    command: npx expo start --web --port 19006
```

#### 3.2 Clean Production Config
Remove all volume mounts from docker-compose.prod.yml

### Phase 4: Security Fixes

#### 4.1 Add Non-Root Users to All Services
- Backend: Already has nodejs user ✓
- Frontend: Already has nginx-user ✓
- Mobile-web: Needs non-root user
- Nginx: Needs non-root user

#### 4.2 Add Health Checks
- Backend: Already has health check ✓
- Nginx: Add health check
- Mobile-web: Add health check

### Phase 5: Environment Configuration

#### 5.1 Embed Default Configs in Images
Instead of env_file, use:
```dockerfile
# In Dockerfile
ENV NODE_ENV=production
# Override at runtime if needed
```

#### 5.2 Remove External Dependencies
- No config files from host
- No scripts from host
- Everything in the image

## Implementation Steps

### Week 1: Critical Fixes
1. [ ] Containerize mobile-web service properly
2. [ ] Build and test mobile-web image
3. [ ] Update docker-compose files

### Week 2: Configuration Management
1. [ ] Create nginx image with embedded config
2. [ ] Separate dev/prod configurations
3. [ ] Remove all production volume mounts

### Week 3: Security & Polish
1. [ ] Add non-root users to remaining services
2. [ ] Add health checks everywhere
3. [ ] Update deployment instructions

## Success Criteria

### The Portability Test
```bash
# On a fresh server with only Docker installed:
docker pull thrifting-buddy/backend:latest
docker pull thrifting-buddy/frontend:latest
docker pull thrifting-buddy/mobile-web:latest
docker pull thrifting-buddy/nginx:latest

# This must work without any source code:
docker compose -f docker-compose.prod.yml up -d
```

### Validation Checklist
- [ ] No volume mounts in production
- [ ] All services run as non-root
- [ ] Health checks on all services
- [ ] No external file dependencies
- [ ] Clear dev/prod separation
- [ ] Images are self-contained

## Current State vs Target State

### Current State
- 4 services violate portability
- Mixed dev/prod concerns
- Security issues (root users)
- External dependencies

### Target State
- All services self-contained
- Clear dev/prod separation
- Security best practices
- True portability

## Priority Order

1. **CRITICAL**: Mobile-web containerization (blocks deployment)
2. **HIGH**: Nginx configuration (security risk)
3. **MEDIUM**: Dev/prod separation (confusion risk)
4. **LOW**: Additional security hardening

## Estimated Effort

- Mobile-web fix: 2 hours
- Nginx containerization: 1 hour
- Configuration separation: 2 hours
- Security updates: 1 hour
- Testing: 2 hours

**Total: 8 hours of DevOps work**

## Risk Mitigation

- Test each change in isolation
- Keep existing configs as backup
- Document all changes
- Update deployment instructions
- Validate on clean environment

## Conclusion

My current DevOps work fails several best practices, particularly around portability and self-containment. The mobile-web service is the most critical violation, effectively making the deployment non-portable. This remediation plan addresses all identified gaps systematically.