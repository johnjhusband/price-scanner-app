# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"My Thrifting Buddy" - A **v2.0 production application** that helps users estimate resale values of secondhand items using AI-powered image analysis. The project consists of an enhanced Node.js/Express backend API and a feature-rich React Native mobile app with web deployment.

## Current Architecture (v2.0)

### Backend (`/backend`)
- **Framework**: Express.js with enhanced middleware
- **Main entry**: `server.js` 
- **Version**: 2.0.0
- **Database**: None (stateless design)
- **Authentication**: None (open API)
- **File Storage**: In-memory processing only
- **Key Features**:
  - Enhanced error handling and validation
  - Request timing middleware
  - Mac compatibility fixes
  - Improved CORS configuration
  - Comprehensive health endpoint
- **Dependencies**: 
  - cors
  - dotenv
  - express
  - multer
  - openai

### Mobile App (`/mobile-app`)
- **Framework**: React Native with Expo SDK 50
- **Main entry**: `App.js`
- **Version**: 2.0.0
- **State Management**: React hooks (useState, useEffect)
- **Features**:
  - Camera/image picker integration
  - Paste support (Ctrl/Cmd+V)
  - Drag and drop support
  - Enhanced UI with loading states
  - Error handling and retry logic
  - Mac compatibility fixes

## Infrastructure & Deployment

### Server Architecture
- **Host**: DigitalOcean Droplet (157.245.142.145)
- **OS**: Ubuntu 24.10
- **Web Server**: Nginx (native, not containerized)
- **Process Manager**: PM2 (not Docker)
- **SSL**: Let's Encrypt certificates
- **Node.js**: Version 18.x

### Three-Environment Setup
1. **Production** (app.flippi.ai)
   - Branch: master
   - Backend Port: 3000
   - Frontend Port: 8080
   - Status: Stable v2.0

2. **Staging** (green.flippi.ai)
   - Branch: staging
   - Backend Port: 3001
   - Frontend Port: 8081
   - Status: Testing v2.0

3. **Development** (blue.flippi.ai)
   - Branch: develop
   - Backend Port: 3002
   - Frontend Port: 8082
   - Status: Active development

## Essential Commands

### Local Development

#### Backend
```bash
cd backend
npm install                    # Install dependencies
npm start                      # Start server (port 3000)
npm run dev                    # Start with nodemon auto-reload
```

#### Mobile App
```bash
cd mobile-app
npm install                    # Install dependencies
# CRITICAL: Install web dependencies for production deployment
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo start                 # Start Expo development server
npx expo start --web           # Start web version
npx expo export:web            # Build for web deployment (creates dist/)
```

### Server Deployment

#### SSH Access
```bash
ssh root@157.245.142.145
# Password stored securely
```

#### PM2 Commands
```bash
pm2 list                       # View all running services
pm2 logs                       # View all logs
pm2 restart all                # Restart all services
pm2 save                       # Save current process list
pm2 monit                      # Real-time monitoring
```

#### Service Management
```bash
# Backend services
pm2 restart prod-backend       # Restart production backend
pm2 restart staging-backend    # Restart staging backend
pm2 restart dev-backend        # Restart development backend

# Frontend services
pm2 restart prod-frontend      # Restart production frontend
pm2 restart staging-frontend   # Restart staging frontend
pm2 restart dev-frontend       # Restart development frontend
```

## Environment Configuration

### Backend `.env` Variables
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Environment-specific ports
PORT=3000                      # 3001 for staging, 3002 for dev

# Optional
NODE_ENV=production            # or development, staging
```

**CRITICAL**: Each environment has its own `.env` file:
- `/var/www/app.flippi.ai/backend/.env` (PORT=3000)
- `/var/www/green.flippi.ai/backend/.env` (PORT=3001)
- `/var/www/blue.flippi.ai/backend/.env` (PORT=3002)

## API Endpoints

### Current Implementation (v2.0)

#### Health Check
```
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2025-07-14T00:00:00.000Z",
  "version": "2.0",
  "features": {
    "imageAnalysis": true,
    "cameraSupport": true,
    "pasteSupport": true,
    "dragDropSupport": true,
    "enhancedAI": true
  }
}
```

#### Image Analysis
```
POST /api/scan
Content-Type: multipart/form-data

Request:
- image: File (max 10MB)

Success Response:
{
  "success": true,
  "data": {
    "item": "Vintage Leather Jacket",
    "estimatedValue": "$45-65",
    "condition": "Good - minor wear on sleeves",
    "marketability": "High - vintage leather is in demand",
    "suggestedPrice": "$55",
    "profitPotential": "$30-40"
  }
}

Error Response:
{
  "success": false,
  "error": "Error description"
}
```

## Deployment Process

### Current Process (Manual with PM2)

1. **Update code on server**
```bash
# Connect to server
ssh root@157.245.142.145

# Navigate to environment
cd /var/www/app.flippi.ai      # or green.flippi.ai, blue.flippi.ai

# Update backend
cd backend
# (manually update files or use scp from local)
npm install --production
pm2 restart prod-backend

# Update frontend
cd ../mobile-app
# (manually update files or use scp from local)
npm install
npx expo export:web
pm2 restart prod-frontend
```

### Intended Process (Git-based)

1. **Push to GitHub**
```bash
git add .
git commit -m "Feature: description"
git push origin develop         # or staging, master
```

2. **Deploy via Git pull** (to be implemented)
```bash
# On server
cd /var/www/blue.flippi.ai     # or appropriate environment
git pull origin develop
cd backend && npm install --production
cd ../mobile-app && npm install && npx expo export:web
pm2 restart dev-backend dev-frontend
```

## GitHub Integration

### Branch Strategy
- **master**: Production-ready code
- **staging**: Testing and QA
- **develop**: Active development

### GitHub Actions Workflows
1. **backend-ci.yml**: Runs on push to any branch
   - Tests across Node 16, 18, 20
   - Linting and security audit
   - Unit tests (when implemented)

2. **test-and-track.yml**: E2E testing with issue creation
   - Playwright tests
   - Automatic issue creation for failures
   - Auto-closes issues when fixed

3. **issue-automation.yml**: Manages GitHub issues
   - Auto-assigns issues
   - Labels based on content
   - Links related PRs

## Nginx Configuration

### Site Structure
Each domain has its own nginx configuration:
- `/etc/nginx/sites-available/app.flippi.ai`
- `/etc/nginx/sites-available/green.flippi.ai`
- `/etc/nginx/sites-available/blue.flippi.ai`

### Routing Pattern
```nginx
# API routes
location /api {
    proxy_pass http://localhost:3000;  # or 3001, 3002
}

# Health check
location /health {
    proxy_pass http://localhost:3000;  # or 3001, 3002
}

# Frontend (everything else)
location / {
    proxy_pass http://localhost:8080;  # or 8081, 8082
}
```

## PM2 Ecosystem Configuration

Located at `/var/www/ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    // Production
    {
      name: 'prod-backend',
      script: '/var/www/app.flippi.ai/backend/server.js',
      cwd: '/var/www/app.flippi.ai/backend',
      env: { NODE_ENV: 'production', PORT: 3000 }
    },
    {
      name: 'prod-frontend',
      script: 'serve',
      args: '-s /var/www/app.flippi.ai/mobile-app/dist -l 8080',
      interpreter: 'npx'
    },
    // Staging and Dev follow same pattern...
  ]
};
```

## Monitoring & Debugging

### Check Service Status
```bash
# All services
pm2 status

# Specific service logs
pm2 logs prod-backend
pm2 logs prod-frontend

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### Test Endpoints
```bash
# From server
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health

# From external
curl https://app.flippi.ai/health
curl https://green.flippi.ai/health
curl https://blue.flippi.ai/health
```

## Security Considerations

1. **API Keys**: Stored in environment variables, never committed
2. **CORS**: Restricted to known domains
3. **File Uploads**: Limited to 10MB, images only
4. **SSL**: All production traffic uses HTTPS
5. **Firewall**: Only ports 22, 80, 443 open

## Common Issues & Solutions

### Frontend Returns 404
```bash
cd /var/www/[environment]/mobile-app
npx expo export:web
pm2 restart [environment]-frontend
```

### Backend Fails to Start
```bash
# Check logs
pm2 logs [environment]-backend

# Common issues:
# - Missing .env file
# - Missing OPENAI_API_KEY
# - Port already in use
```

### SSL Certificate Issues
```bash
# Check certificate status
certbot certificates

# Renew if needed
certbot renew
```

## Important Notes

1. **NO DOCKER**: We use PM2 and native services, not Docker
2. **Git Deployment**: Currently manual, transitioning to git-based
3. **Version**: All components are v2.0.0
4. **Stateless**: No database, all processing in-memory
5. **Blue-Green**: Environments rotate between blue/green for zero-downtime deployments

## Development Workflow

1. Work in develop branch (blue.flippi.ai)
2. Test thoroughly in development
3. Merge to staging branch (green.flippi.ai)
4. QA and testing in staging
5. After approval, merge to master (app.flippi.ai)
6. Production deployment only with management approval

## Future Enhancements (Roadmap)

- [ ] Automated git-based deployment
- [ ] Database integration for history
- [ ] User authentication system
- [ ] Batch image processing
- [ ] API rate limiting
- [ ] Comprehensive test suites
- [ ] Performance monitoring
- [ ] Auto-scaling capabilities

Remember: Always test in development first, then staging, before any production deployment!