# Flippi.ai Architecture Guide

## Overview

This document provides a comprehensive guide to the Flippi.ai architecture, consolidating all technical details that future AI assistants need to effectively work with this codebase. It covers the complete stack from infrastructure to application code.

## Table of Contents
1. [Infrastructure Overview](#infrastructure-overview)
2. [Networking Architecture](#networking-architecture)
3. [Application Architecture](#application-architecture)
4. [GitHub & Version Control](#github--version-control)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Key Technical Decisions](#key-technical-decisions)
7. [Operational Knowledge](#operational-knowledge)

## Infrastructure Overview

### Server Details
- **Provider**: DigitalOcean Droplet
- **IP Address**: 157.245.142.145
- **OS**: Ubuntu 24.10
- **Access**: SSH as root (password protected)
- **Resources**: Single VPS hosting all three environments

### Environment Architecture
```
Single Server (157.245.142.145)
├── Production (app.flippi.ai) 
│   ├── Backend: Port 3000
│   ├── Frontend: Port 8080
│   ├── Branch: master
│   └── Path: /var/www/app.flippi.ai
├── Staging (green.flippi.ai)
│   ├── Backend: Port 3001
│   ├── Frontend: Port 8081
│   ├── Branch: staging
│   └── Path: /var/www/green.flippi.ai
└── Development (blue.flippi.ai)
    ├── Backend: Port 3002
    ├── Frontend: Port 8082
    ├── Branch: develop
    └── Path: /var/www/blue.flippi.ai
```

### Technology Stack
- **Runtime**: Node.js 18.x
- **Process Manager**: PM2 (NOT Docker)
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (auto-renewing)
- **No Database**: Stateless design
- **No Auth**: Open API

## Networking Architecture

### Request Flow
1. **Client** → Makes HTTPS request to `app.flippi.ai`
2. **DNS** → Resolves to 157.245.142.145
3. **Nginx** → Receives on port 443, terminates SSL
4. **Routing**:
   - `/api/*` → Proxied to backend (port 3000)
   - `/health` → Proxied to backend
   - `/*` → Proxied to frontend (port 8080)
5. **Response** → Flows back through Nginx to client

### Port Mapping
```
External (HTTPS:443) → Nginx → Internal Services:
- app.flippi.ai/api    → localhost:3000 (prod backend)
- app.flippi.ai/*      → localhost:8080 (prod frontend)
- green.flippi.ai/api  → localhost:3001 (staging backend)
- green.flippi.ai/*    → localhost:8081 (staging frontend)
- blue.flippi.ai/api   → localhost:3002 (dev backend)
- blue.flippi.ai/*     → localhost:8082 (dev frontend)
```

### Nginx Configuration
- **Location**: `/etc/nginx/sites-available/[domain]`
- **Features**:
  - SSL termination
  - Reverse proxy
  - HTTPS redirect
  - WebSocket support
  - CORS headers passed through

### SSL Certificates
- **Provider**: Let's Encrypt
- **Management**: Certbot with auto-renewal
- **Locations**: `/etc/letsencrypt/live/[domain]/`
- **Renewal**: Cron job runs twice daily

## Application Architecture

### Backend (`/backend`)
```javascript
// Technology
- Framework: Express.js
- Main file: server.js
- Dependencies: cors, dotenv, express, multer, openai

// API Endpoints
GET  /health     → Health check with features
POST /api/scan   → Image analysis endpoint

// Key Features
- Stateless design (no sessions/database)
- OpenAI GPT-4o-mini integration
- Accepts image + optional text description
- Returns comprehensive analysis
- In-memory processing only
```

### Frontend (`/mobile-app`)
```javascript
// Technology
- Framework: React Native (Expo SDK 50)
- Main file: App.js
- Platform: iOS, Android, Web

// Key Features
- Camera/gallery image selection
- Paste support (Ctrl/Cmd+V)
- Drag & drop on web
- Text description input
- "Never Over Pay" branding
- Flippi.ai custom theme
```

### API Response Format
```json
{
  "success": true,
  "data": {
    "item_name": "Vintage Leather Jacket",
    "price_range": "$45-65",
    "style_tier": "Designer",
    "recommended_platform": "The RealReal",
    "condition": "Good condition",
    "authenticity_score": "85%",
    "boca_score": "72",
    "buy_price": "$11",
    "resale_average": "$55",
    "market_insights": "Trending...",
    "selling_tips": "Highlight...",
    "brand_context": "This brand...",
    "seasonal_notes": "Best in fall..."
  },
  "processing": {
    "fileSize": 57046,
    "processingTime": 2341,
    "version": "2.0"
  }
}
```

## GitHub & Version Control

### Repository Structure
```
price-scanner-app-coding/
├── .github/workflows/      # GitHub Actions
├── backend/               # Express API
├── mobile-app/           # React Native app
├── docs/                 # Documentation
├── CLAUDE.md            # AI assistant guide
├── ARCHITECTURE.md      # This file
└── README.md           # Project overview
```

### Branch Strategy
```
master (production)
  ↑
staging (testing)
  ↑
develop (active development)
  ↑
feature/* (feature branches)
```

### GitHub Actions Workflows
1. **deploy-develop.yml** → Triggered on push to develop
2. **deploy-staging.yml** → Triggered on push to staging
3. **deploy-production.yml** → Triggered on push to master
4. **backend-ci.yml** → Tests on all branches
5. **test-and-track.yml** → E2E tests with issue creation

### Deployment Process
```bash
# Automatic deployment on push
git push origin develop  # → Deploys to blue.flippi.ai
git push origin staging  # → Deploys to green.flippi.ai
git push origin master   # → Deploys to app.flippi.ai

# What happens:
1. GitHub Action triggered
2. SSH to server as root
3. Navigate to environment directory
4. Git reset --hard HEAD (clear local changes)
5. Git pull origin [branch]
6. npm install (backend & frontend)
7. npx expo export --platform web (build frontend)
8. pm2 restart [services]
9. Health check verification
```

## Deployment Pipeline

### PM2 Process Management
```bash
# Process naming convention
prod-backend    → Production backend (port 3000)
prod-frontend   → Production frontend (port 8080)
staging-backend → Staging backend (port 3001)
staging-frontend → Staging frontend (port 8081)
dev-backend     → Development backend (port 3002)
dev-frontend    → Development frontend (port 8082)

# Common commands
pm2 list                    # View all processes
pm2 logs [name]            # View specific logs
pm2 restart [name]         # Restart process
pm2 monit                  # Real-time monitoring
pm2 save                   # Save configuration
```

### Environment Variables
All environments share a single `.env` file:
```bash
# /var/www/shared/.env
OPENAI_API_KEY=sk-...
```

PORT is managed by PM2 ecosystem config:
- Production: 3000
- Staging: 3001
- Development: 3002

### Build Process
```bash
# Frontend build (Expo web export)
cd mobile-app
npm install
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo export --platform web --output-dir dist

# Frontend serving
pm2 start "npx serve -s dist -l 8080" --name "prod-frontend"
```

## Key Technical Decisions

### Why Stateless?
- **Simplicity**: No database complexity
- **Privacy**: No user data stored
- **Speed**: Instant access, no login required
- **Cost**: No database hosting costs
- **Maintenance**: Less to manage and secure

### Why PM2 Instead of Docker?
- **Resource Efficiency**: 40% less memory usage
- **Simplicity**: Direct process management
- **Performance**: No container overhead
- **Debugging**: Easier log access and troubleshooting

### Why Three Environments?
- **Risk Mitigation**: Test changes before production
- **Continuous Deployment**: Each branch auto-deploys
- **Blue-Green Ready**: Can swap environments if needed
- **Development Freedom**: Experiment without affecting users

### API Design Choices
- **RESTful**: Simple, well-understood pattern
- **Multipart Forms**: Standard for file uploads
- **JSON Responses**: Consistent success/error format
- **No Versioning**: Single version, backward compatible

## Operational Knowledge

### Common Issues & Solutions

#### 502 Bad Gateway
```bash
# Backend crashed or not running
pm2 list                          # Check if running
pm2 logs dev-backend --lines 50  # Check error logs
cat /var/www/shared/.env         # Verify API key exists
pm2 restart dev-backend          # Restart service
```

#### Frontend Shows "Index of dist/"
```bash
# Expo build failed
cd /var/www/blue.flippi.ai/mobile-app
npx expo export --platform web --output-dir dist
# Check for syntax errors in App.js
pm2 restart dev-frontend
```

#### SSL Certificate Issues
```bash
certbot certificates      # Check status
certbot renew            # Manual renewal
nginx -s reload          # Reload after renewal
```

### Health Monitoring
```bash
# Quick health check all environments
curl https://app.flippi.ai/health
curl https://green.flippi.ai/health
curl https://blue.flippi.ai/health

# Check specific backend directly
curl http://localhost:3002/health
```

### Log Locations
```
PM2 logs:    pm2 logs [process-name]
Nginx logs:  /var/log/nginx/error.log
             /var/log/nginx/access.log
```

### Performance Metrics
- **API Response Time**: ~2-3 seconds (AI processing)
- **Image Size Limit**: 10MB
- **Memory Usage**: ~45MB per backend, ~38MB per frontend
- **Typical Load**: Low traffic, personal project

## What Future AIs Need to Know

### Critical Context
1. **No Docker** - Despite old files mentioning it, we use PM2
2. **No Database** - Completely stateless by design
3. **No Auth** - Open API, no user accounts
4. **Three Environments** - All on one server, different ports
5. **Auto-Deploy** - Push to branch triggers deployment

### Key Files to Check
1. **CLAUDE.md** - Primary technical reference
2. **backend/server.js** - Entire backend logic
3. **mobile-app/App.js** - Entire frontend logic
4. **docs/DEPLOYMENT.md** - Deployment procedures
5. **.github/workflows/** - CI/CD configuration

### Development Workflow
1. Create feature branch from develop
2. Make changes locally
3. Test with local backend/frontend
4. Push to feature branch
5. Create PR to develop
6. Merge triggers auto-deploy to blue.flippi.ai
7. Test on blue environment
8. Merge develop → staging → master

### Security Considerations
- API key in environment variables only
- HTTPS enforced via Nginx
- CORS restricted to known domains
- No user data stored anywhere
- File uploads processed in memory only

### Maintenance Tasks
- Monitor PM2 processes daily
- Check SSL renewal monthly
- Update Node.js quarterly
- Review logs for errors weekly
- Test all health endpoints regularly

## Conclusion

This architecture prioritizes simplicity, performance, and ease of maintenance. The stateless design eliminates complexity while the three-environment setup enables safe continuous deployment. Future modifications should maintain this simplicity-first approach.