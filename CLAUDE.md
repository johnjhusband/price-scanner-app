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
npx expo start                          # Start Expo development server
npx expo start --clear                  # Start with cleared cache
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

- [ ] Set all production environment variables
- [ ] Run database migrations
- [ ] Configure S3 bucket and CloudFront
- [ ] Set up monitoring (Sentry, logs)
- [ ] Configure rate limiting for production
- [ ] Update mobile app API URLs
- [ ] Test all critical paths
- [ ] Set up CI/CD pipeline
- [ ] Configure SSL certificates
- [ ] Set up database backups