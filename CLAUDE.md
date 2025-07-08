# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "My Thrifting Buddy" - a full-stack application that helps users estimate resale values of secondhand items using AI-powered image analysis. The project consists of a Node.js/Express backend API and a React Native mobile app.

## Architecture

### Backend (`/backend`)
- **Framework**: Express.js with comprehensive security middleware
- **Main entry**: `server.js`
- **Database**: PostgreSQL with Knex.js ORM
- **Authentication**: JWT with access/refresh token pattern
- **File Storage**: AWS S3 with image optimization
- **Monitoring**: Winston logging, Sentry error tracking
- **Security**: Helmet, CORS, rate limiting, input validation
- **Key Services**:
  - `authService.js` - JWT authentication with refresh tokens
  - `openaiService.js` - OpenAI Vision API integration
  - `uploadService.js` - Secure file upload with S3
  - `tokenService.js` - Token management and rotation

### Mobile App (`/mobile-app`)
- **Framework**: React Native with Expo SDK 50
- **State Management**: Context API (Auth, AppState, ScanHistory)
- **Navigation**: React Navigation v6
- **UI Library**: React Native Paper (Material Design 3)
- **Security**: Expo SecureStore for sensitive data
- **Key Features**:
  - Camera integration with compression
  - Offline support with pending actions
  - Platform-specific optimizations
  - Error boundaries for crash protection
  - Network-aware API calls with retry logic

### Database Schema
```sql
-- Users table
users (id, email, username, password_hash, is_active, email_verified, created_at)

-- Scan history
scan_history (id, user_id, image_url, item_name, platform_prices, confidence_score, scanned_at)

-- Refresh tokens
refresh_tokens (id, user_id, token, family, fingerprint, used, expires_at)
```

## Essential Commands

### Backend Development
```bash
cd backend
npm install                              # Install dependencies
cp env.example .env                      # Create environment file
npm run migrate                          # Run database migrations
npm run seed                             # Seed database (dev only)
npm start                               # Start production server
npm run dev                             # Start with auto-reload
npm run test                            # Run test suite
npm run lint                            # Run ESLint
```

### Mobile App Development
```bash
cd mobile-app
npm install                             # Install dependencies
# CRITICAL: Install web dependencies for Docker support
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo start                          # Start Expo development server
npx expo start --clear                  # Start with cleared cache
npx expo start --web                    # Start web version
npx expo run:ios                        # Run on iOS simulator
npx expo run:android                    # Run on Android emulator
npx expo build:ios                      # Build iOS app
npx expo build:android                  # Build Android app
```

### Testing
```bash
# Backend API testing
cd backend
npm test                                # Run all tests
npm run test:auth                       # Test auth endpoints
npm run test:scan                       # Test scan endpoints

# Mobile app testing
cd mobile-app
npm test                                # Run Jest tests
npm run test:e2e                        # Run E2E tests
```

## Environment Configuration

### CRITICAL: Environment File Location
- **Backend**: The `.env` file MUST be placed in the `/backend` directory, NOT at the project root
- **Frontend**: The mobile app does not require a `.env` file - it uses dynamic API URL detection
- **Docker**: The backend Dockerfile expects `.env` to be in the backend directory for proper build context

### Backend `.env` variables:
```bash
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/thrifting_buddy

# Authentication
JWT_ACCESS_SECRET=<32+ char secret>
JWT_REFRESH_SECRET=<32+ char secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# AWS S3
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
S3_BUCKET_NAME=thrifting-buddy-images
AWS_REGION=us-east-1

# Security
ALLOWED_ORIGINS=http://localhost:19006,exp://localhost:19000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE_MB=10

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
LOG_TO_FILE=true
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout current session
- `POST /api/auth/logout-all` - Logout all sessions
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Scan Operations
- `POST /api/scan` - Analyze image (multipart/form-data)
- `GET /api/scan/history` - Get user's scan history
- `GET /api/scan/search?q=query` - Search scans
- `GET /api/scan/:id` - Get scan details
- `PUT /api/scan/:id` - Update scan
- `DELETE /api/scan/:id` - Delete scan

### Health & Status
- `GET /health` - Server health check
- `GET /api/scan/health` - Scan service health

## Security Best Practices Implemented

### Backend
1. **Authentication**:
   - JWT with separate access/refresh tokens
   - Token rotation on refresh
   - Session fingerprinting
   - Account lockout after failed attempts
   - Strong password requirements

2. **File Upload**:
   - Magic number verification
   - File type validation
   - Size limits
   - Virus scanning placeholder
   - S3 private storage

3. **API Security**:
   - Rate limiting per endpoint
   - Input validation with Joi
   - SQL injection prevention
   - XSS protection
   - CSRF protection

### Mobile App
1. **Data Storage**:
   - SecureStore for tokens
   - AsyncStorage for non-sensitive data
   - No hardcoded secrets

2. **Network**:
   - Certificate pinning ready
   - API retry logic
   - Network state monitoring

## Development Workflow

1. **Feature Development**:
   - Create feature branch from `master`
   - Implement with proper error handling
   - Add tests for new functionality
   - Run linting and tests
   - Create PR with detailed description

2. **Database Changes**:
   - Create migration file
   - Test migration up/down
   - Update models and validation
   - Document schema changes

3. **API Changes**:
   - Update OpenAPI documentation
   - Version endpoints if breaking
   - Update mobile app API client
   - Test backward compatibility

## Docker Configuration

### Docker Files
The project uses separate Dockerfiles for frontend and backend to ensure clear separation of concerns:

- **Backend**: `backend/Dockerfile.backend`
  - Multi-stage build for optimized image size
  - Includes all runtime dependencies (Cairo, image processing libs)
  - Non-root user for security
  - Health checks included
  - Production-ready with proper error handling

- **Frontend**: `mobile-app/Dockerfile.frontend`
  - Multi-stage build with Expo web export
  - Nginx for static file serving
  - Security headers and CSP configured
  - SPA routing support
  - Gzip compression enabled

### Docker Compose Files
- **Development**: `docker-compose.yml`
  - Hot-reloading with volume mounts
  - All services exposed for debugging
  - Simplified configuration

- **Production**: `docker-compose.prod.yml`
  - Resource limits and reservations
  - Health checks on all services
  - Network isolation (backend network is internal only)
  - Automated backup service
  - Logging configuration
  - Scaling support with replicas

### Services Architecture
```yaml
Services:
├── postgres (PostgreSQL 15 Alpine)
├── redis (Redis 7 Alpine with persistence)
├── backend (Node.js Express API)
├── frontend (React Native Web via Nginx)
├── nginx (Load balancer/Reverse proxy)
└── backup (Automated database backups)

Networks:
├── frontend (172.20.0.0/24) - Public facing
└── backend (172.21.0.0/24) - Internal only
```

### Docker Commands

#### CRITICAL: Pre-Docker Checklist
Before creating or modifying Docker configurations:
1. **Install web dependencies for mobile app**:
   ```bash
   cd mobile-app
   npx expo install react-native-web react-dom @expo/metro-runtime
   npm install  # Update package-lock.json
   npx expo start --web  # Test web support works
   ```
2. **Verify dependencies**: Check all require() statements in the code match package.json dependencies
3. **Test locally**: Ensure the application runs successfully outside Docker first
4. **Build test**: Always build and run Docker images locally before committing

#### CRITICAL: When Writing Code
When adding new code or modifying existing code:
1. **Update package.json immediately**: When adding any require() or import statement for an npm package, add it to package.json BEFORE moving on
2. **Run npm install**: ALWAYS run npm install after modifying package.json to update package-lock.json
3. **Commit both files**: Always commit package.json and package-lock.json together
4. **Test the code runs**: Actually run the code (npm start) to verify all dependencies are present
5. **Never assume packages exist**: Always check package.json before using a package in code

#### CRITICAL: Package-Lock Management
**NEVER modify package.json without updating package-lock.json:**
1. After ANY change to package.json, run `npm install` immediately
2. Docker builds use `npm ci` which REQUIRES package-lock.json to be in sync
3. If package-lock.json is out of sync, Docker builds WILL FAIL
4. Always commit package.json and package-lock.json in the same commit

#### CRITICAL: Docker Space Management
**Docker accumulates layers and cache that MUST be cleaned regularly:**
1. **After failed builds**: ALWAYS run cleanup commands
   ```bash
   docker system prune -f        # Remove stopped containers, dangling images
   docker builder prune -f       # Remove build cache
   ```
2. **Check space before building**: Run `df -h` to ensure adequate space
3. **Monitor Docker usage**: Run `docker system df` to see what's using space
4. **Failed build cleanup sequence**:
   ```bash
   # After any failed Docker build, run this sequence:
   docker ps -a                  # Check for failed containers
   docker container prune -f     # Remove stopped containers
   docker images                 # Check for dangling images
   docker image prune -f         # Remove dangling images
   docker builder prune -f       # Clean build cache
   ```
5. **Manual cleanup approach**: Clean up when you know it's needed (after failures, before builds)
6. **Space requirements**: Docker builds need 2-3x the final image size in temporary space
7. **No automated cleanup**: Don't set up automated cleanup - be intentional about when to clean

### Docker Best Practices

#### 1. Base Image Selection
- Use official and verified images from trusted repositories
- Choose minimal base images that match requirements
- Avoid using 'latest' tag - use specific version tags
- Prefer Alpine or slim variants for smaller size

#### 2. Layer Optimization
- Minimize the number of layers by combining RUN commands
- Sort multi-line arguments alphabetically for maintainability
- Each RUN instruction creates a new layer - concatenate where possible

#### 3. Build Cache Optimization
- Order instructions from least to most frequently changing
- Put RUN commands near the top, COPY commands near the bottom
- Put CMD/ENTRYPOINT at the end
- Docker reuses cached layers when possible

#### 4. Package Management
- Only install necessary packages
- Use --no-install-recommends flag to avoid redundant dependencies
- Always combine apt-get update with apt-get install in same RUN statement
- Clean up package manager cache after installation

#### 5. Multi-stage Builds
- Use multi-stage builds to create smaller final images
- Build/compile in one stage, copy only necessary artifacts to final stage
- Reduces image size by excluding build dependencies

#### 6. File Management
- Use .dockerignore file to exclude unnecessary files
- Similar to .gitignore, prevents unwanted files from entering build context
- Reduces build context size and improves build performance

#### 7. User Permissions
- Run containers as non-root user
- Create user with UID above 10,000
- Set proper file permissions for the user

#### 8. General Practices
- Lint Dockerfiles as part of CI pipeline
- Never include secrets or credentials in Dockerfile
- Document your Dockerfiles with comments
- Keep images small and focused on single purpose

```bash
# Pre-Docker verification (MUST DO FIRST)
cd backend && npm install && npm start    # Verify backend starts
cd mobile-app && npm install && npm start # Verify frontend starts

# CRITICAL: Docker Build Process with Housekeeping
# Always follow this sequence for builds:

# 1. Check disk space
df -h                                # Ensure adequate space (need 2-3x image size)

# 2. Clean up before building
docker ps -a                         # Check what's running
docker system prune -f               # Clean stopped containers and dangling images
docker builder prune -f              # Clean build cache

# 3. Build your images
docker-compose build                 # For development
# OR
docker build -f backend/Dockerfile.backend -t thrifting-buddy/backend:latest ./backend
docker build -f mobile-app/Dockerfile.frontend -t thrifting-buddy/frontend:latest ./mobile-app

# 4. Clean up after successful build
docker image prune -f                # Remove old dangling images

# Development
docker-compose up                    # Start all services
docker-compose logs -f backend       # Follow backend logs
docker-compose exec backend sh       # Access backend shell

# Production
docker-compose -f docker-compose.prod.yml up -d     # Deploy in detached mode
docker-compose -f docker-compose.prod.yml ps        # Check service status
docker-compose -f docker-compose.prod.yml down      # Stop all services

# Individual services (without compose)
docker run -p 3000:3000 --env-file .env thrifting-buddy/backend
docker run -p 80:80 thrifting-buddy/frontend
```

### Docker Security
1. **Non-root users** in all containers
2. **Read-only root filesystems** where possible
3. **Security headers** in Nginx configuration
4. **Network isolation** - Backend services on internal network
5. **.dockerignore files** prevent sensitive files from being included
6. **Health checks** on all services for monitoring

### Docker Best Practices Implemented
- Multi-stage builds for smaller images
- Layer caching optimization
- Explicit COPY instructions (no COPY .)
- Fixed versions for base images
- Proper signal handling for graceful shutdown
- Resource limits to prevent container sprawl
- Volume mounts for persistent data
- Named volumes for better management

## Performance Optimizations

### Backend
- Connection pooling (database, S3)
- Response compression (gzip)
- Image optimization with Sharp
- Graceful shutdown handling
- Health check degraded mode

### Mobile App
- Image compression before upload
- API response caching
- FlatList optimization
- Platform-specific code
- Lazy component loading

## Known Issues and TODOs

1. **Pending Implementation**:
   - Redis caching integration
   - Email verification flow
   - Push notifications
   - Social login (OAuth)
   - Payment integration

2. **Current Limitations**:
   - Camera mock button (fully implemented but needs testing)
   - No automated E2E tests
   - Limited offline functionality

3. **Performance Considerations**:
   - Large image processing can be slow
   - Database indexes need optimization
   - CDN setup for images pending

## Code Conventions

### CRITICAL: Dependency Management
1. **Before using ANY npm package**: Check if it exists in package.json
2. **When adding require('package-name')**: Immediately add to package.json dependencies
3. **ALWAYS run npm install** after modifying package.json to update package-lock.json
4. **Never commit code** without verifying it runs (npm start)
5. **Commit package.json and package-lock.json together** - NEVER commit one without the other
6. **Docker requirement**: Docker builds use `npm ci` which fails if package-lock.json is out of sync

### Backend
- CommonJS modules (require/module.exports)
- Async/await for asynchronous code
- Custom error classes for different scenarios
- Middleware for cross-cutting concerns
- Service layer for business logic

### Mobile App
- ES6 modules (import/export)
- React hooks for state management
- Context API for global state
- Platform-specific code in separate files
- Memoization for expensive operations

### General
- Error responses: `{ error: string, code: string, details?: any }`
- Success responses: `{ success: true, data: any }`
- ISO 8601 timestamps
- UUID for record IDs
- Semantic versioning

## Troubleshooting

### Common Issues

1. **API Connection Failed**:
   - Check backend is running on port 3000
   - Verify CORS configuration
   - Check network connectivity
   - Review API base URL in mobile app

2. **Database Errors**:
   - Ensure PostgreSQL is running
   - Check DATABASE_URL is correct
   - Run migrations: `npm run migrate`
   - Check connection pool settings

3. **Authentication Issues**:
   - Verify JWT secrets are set
   - Check token expiration times
   - Clear SecureStore on mobile
   - Verify refresh token rotation

4. **Image Upload Failures**:
   - Check file size limits
   - Verify S3 credentials
   - Check CORS policy on S3
   - Review image format support

## Deployment Checklist

- [ ] Install web dependencies in mobile-app: `npx expo install react-native-web react-dom @expo/metro-runtime`
- [ ] Set all production environment variables
- [ ] Place .env file in backend directory (NOT project root)
- [ ] Run database migrations
- [ ] Configure S3 bucket and CloudFront
- [ ] Set up monitoring (Sentry, logs)
- [ ] Configure rate limiting for production
- [ ] Update mobile app API URLs
- [ ] Test all critical paths
- [ ] Set up CI/CD pipeline
- [ ] Configure SSL certificates
- [ ] Set up database backups