# Flippi.ai Technical Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [API Reference](#api-reference)
5. [Infrastructure Details](#infrastructure-details)
6. [Deployment Pipeline](#deployment-pipeline)
7. [Security](#security)
8. [Database](#database)

## System Overview

Flippi.ai is a production application that helps users estimate resale values of secondhand items using AI-powered image analysis. The app's tagline is "Never Over Pay" and it provides detailed analysis including authenticity scores, market insights, and selling recommendations.

### Key Features
- AI-powered image analysis using OpenAI
- Real-time price estimation for secondhand items
- Platform recommendations (both standard and live selling)
- Authenticity and trending scores
- Web and mobile support via React Native
- Google OAuth 2.0 authentication for app access

## Architecture

### Three-Environment Setup
All environments run on a single DigitalOcean droplet (157.245.142.145):

```
Production (app.flippi.ai)
├── Backend: Port 3000
├── Frontend: Port 8080
├── Branch: master
└── Path: /var/www/app.flippi.ai

Staging (green.flippi.ai)
├── Backend: Port 3001
├── Frontend: Port 8081
├── Branch: staging
└── Path: /var/www/green.flippi.ai

Development (blue.flippi.ai)
├── Backend: Port 3002
├── Frontend: Port 8082
├── Branch: develop
└── Path: /var/www/blue.flippi.ai
```

### Request Flow
1. Client makes HTTPS request to domain (e.g., app.flippi.ai)
2. Nginx terminates SSL and routes request:
   - `/api/*` → Backend (Express.js)
   - `/health` → Backend health check
   - `/*` → Frontend (React Native Web)
3. Backend processes request, calls OpenAI if needed
4. Response flows back through Nginx to client

## Technology Stack

### Backend
- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.18.2
- **Main Entry**: `/backend/server.js`
- **Key Dependencies**:
  - `openai`: AI integration
  - `multer`: Image upload handling
  - `cors`: Cross-origin support
  - `better-sqlite3`: User and feedback storage
  - `express-validator`: Input validation
  - `passport`: Authentication framework
  - `passport-google-oauth20`: Google OAuth strategy
  - `express-session`: Session management
  - `jsonwebtoken`: JWT token generation

### Frontend
- **Framework**: React Native with Expo SDK 50
- **Platform**: Web (primary), iOS, Android
- **Main Entry**: `/mobile-app/App.js`
- **Key Features**:
  - Camera integration
  - Gallery picker
  - Paste support (Ctrl/Cmd+V)
  - Drag and drop
  - Custom Flippi branding

### Infrastructure
- **Process Manager**: PM2 (NOT Docker)
- **Web Server**: Nginx
- **SSL**: Let's Encrypt (auto-renewing)
- **Hosting**: DigitalOcean Droplet
- **Deployment**: GitHub Actions (automated)

## API Reference

### Base URLs
- Production: `https://app.flippi.ai`
- Staging: `https://green.flippi.ai`
- Development: `https://blue.flippi.ai`

### Endpoints

#### Health Check
```
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2025-07-24T00:00:00.000Z",
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
- image: File (required, max 10MB)
- description: String (optional)

Success Response:
{
  "success": true,
  "data": {
    "item_name": "Vintage Leather Jacket",
    "price_range": "$45-65",
    "style_tier": "Designer",
    "recommended_platform": "The RealReal",
    "recommended_live_platform": "Whatnot",
    "condition": "Good - minor wear on sleeves",
    "authenticity_score": "85%",
    "buy_price": "$11",
    "resale_average": "$55",
    "trending_score": 72,
    "trending_label": "Money Maker",
    "trending_breakdown": {
      "demand": 18,
      "velocity": 15,
      "platform": 10,
      "recency": 7,
      "scarcity": 6,
      "penalty": 4
    },
    "market_insights": "Vintage leather is trending...",
    "selling_tips": "Highlight the vintage aspects...",
    "brand_context": "This appears to be from...",
    "seasonal_notes": "Best selling season is fall..."
  },
  "processing": {
    "fileSize": 57046,
    "processingTime": 2341,
    "version": "2.0"
  }
}

Error Response:
{
  "success": false,
  "error": "Error description",
  "hint": "Helpful suggestion"
}
```

#### Authentication Endpoints
```
GET /auth/google
- Initiates Google OAuth flow
- Redirects to Google consent screen

GET /auth/google/callback
- Google OAuth callback URL
- Creates/updates user record
- Issues JWT token
- Redirects to app

GET /auth/logout
- Clears session
- Redirects to landing page

GET /auth/check
- Returns current authentication status
- Response: { authenticated: boolean, user: {...} }
```

#### Feedback API (Internal)
```
POST /api/feedback
Content-Type: application/json

Request:
{
  "feedback": "string",
  "image": "base64 string (optional)",
  "metadata": {
    "userAgent": "string",
    "timestamp": "ISO 8601"
  }
}
```

### Response Format Standards
- All responses include `success` boolean
- Success responses have `data` object
- Error responses have `error` string and optional `hint`
- HTTP status codes follow REST conventions

### Rate Limiting
Currently no rate limiting implemented. Future implementation will include:
- 100 requests per minute per IP
- 1000 requests per hour per IP

## Infrastructure Details

### Server Specifications
- **Provider**: DigitalOcean
- **IP Address**: 157.245.142.145
- **OS**: Ubuntu 24.10
- **Estimated Specs**: 2-4GB RAM, 1-2 CPUs
- **Monthly Cost**: $20-40

### PM2 Configuration
Process names follow environment pattern:
- `prod-backend`, `prod-frontend`
- `staging-backend`, `staging-frontend`
- `dev-backend`, `dev-frontend`

Each process configured in `/var/www/[domain]/ecosystem.config.js`

### Nginx Configuration
- Config files: `/etc/nginx/sites-available/[domain]`
- Features:
  - SSL termination
  - Reverse proxy to PM2 processes
  - CORS headers pass-through
  - WebSocket support
  - Gzip compression

### Environment Variables
Shared `.env` file at `/var/www/shared/.env`:
```bash
OPENAI_API_KEY=sk-...
SESSION_SECRET=your-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# PORT managed by PM2 config
# NODE_ENV managed by PM2 config
```

## Deployment Pipeline

### Automated Deployment
GitHub Actions triggers on branch push:
1. `develop` → blue.flippi.ai
2. `staging` → green.flippi.ai
3. `master` → app.flippi.ai

### Build Strategies (Updated August 2025)

#### Current: Server-side Build
**Workflows**: `deploy-develop.yml`, `deploy-staging.yml`, `deploy-production.yml`

**Process**:
1. GitHub Action connects via SSH
2. Navigates to environment directory
3. Git fetch and reset --hard to match remote
4. Backend: `npm install --production`
5. Frontend: `npm install && npx expo export --platform web --output-dir dist`
6. PM2 restart for both services
7. Nginx reload

**Key Fix (August 2025)**: Updated `expo-font` from `^13.3.2` to `~11.10.2` to fix Expo 50 compatibility issue that caused "Super expression must either be null or a function" errors.

#### Available: GitHub Actions Build
**Workflow**: `deploy-develop-v2.yml` (blue only)

**Process**:
1. GitHub builds frontend in clean environment
2. Transfers only built files via SCP
3. Server structure: `/frontend/dist/` (static files only)
4. PM2 serves static files, no node_modules on server

**Benefits**:
- Completely clean build environment
- No server cache contamination
- Smaller server footprint
- Predictable builds

**Trade-offs**:
- More complex workflow
- File transfer dependency
- Only implemented for development environment

### Manual Deployment
If automation fails:
```bash
ssh root@157.245.142.145
cd /var/www/blue.flippi.ai
git fetch origin develop
git reset --hard origin/develop
cd backend && npm install --production
cd ../mobile-app && npm install
npx expo export --platform web --output-dir dist
pm2 restart dev-backend dev-frontend
nginx -s reload
```

## Security

### Application Security
- **Authentication**: Google OAuth 2.0 with JWT tokens
  - Required for app access
  - Session management with secure cookies
  - JWT tokens for API authentication
- **File Validation**: MIME type, extension, and size checks
- **Rate Limiting**: Planned but not implemented
- **CORS**: Configured for known domains
- **HTTPS**: Enforced via Nginx redirect

### Server Security
- **Firewall**: Only ports 22, 80, 443 open
- **SSH**: Root access with password (consider key-only)
- **SSL**: Let's Encrypt with auto-renewal
- **Updates**: Manual OS updates required

### API Key Security
- OpenAI key stored in environment variables
- Never committed to repository
- Accessible only to root user

## Database

### SQLite Database
- **Purpose**: Store user accounts and feedback
- **Location**: `/tmp/flippi-feedback.db`
- **Tables**:

#### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  googleId TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### Feedback Table
```sql
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback TEXT NOT NULL,
  image TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

- **Note**: Database in /tmp may be cleared on reboot

### Authentication Flow
1. User clicks "Sign in with Google" on landing page
2. Redirected to Google OAuth consent screen
3. Google redirects back to `/auth/google/callback`
4. Backend creates/updates user record
5. JWT token issued and stored in session
6. User redirected to main app

### Session Management
- Sessions stored in memory (not persistent)
- 30-day cookie expiration
- Secure cookies in production (HTTPS only)
- JWT tokens for API authentication

## Performance Characteristics

### Response Times
- Health check: <100ms
- Image analysis: 2-4 seconds (OpenAI processing)
- Static assets: <200ms

### Resource Usage (per process)
- Backend: ~45MB RAM
- Frontend: ~38MB RAM
- CPU: Spikes during image processing

### Limitations
- Max image size: 10MB
- Single-threaded Node.js processes
- No caching implemented
- Sequential request processing

## Cost Breakdown

### Monthly Recurring Costs

#### Infrastructure (DigitalOcean)
**Estimated: $20-40/month**

Current setup (single droplet hosting 3 environments):
- Basic Droplet (2GB RAM, 1 CPU): $18/month
- Standard Droplet (4GB RAM, 2 CPU): $24/month  
- General Purpose (8GB RAM, 2 CPU): $48/month

Includes:
- 1-3 TB bandwidth (depending on plan)
- Automated backups: +20% of droplet cost (optional)
- Snapshots: $0.06/GB/month (if enabled)

#### OpenAI API Usage
**Estimated: $10-100/month** (highly variable)

Monthly projections based on usage:
- 1,000 scans: ~$0.20
- 10,000 scans: ~$2
- 100,000 scans: ~$20
- 500,000 scans: ~$100

#### Domain Names
**Fixed: $9/month total**
- app.flippi.ai: $36/year
- green.flippi.ai: $36/year
- blue.flippi.ai: $36/year

### Total Monthly Cost Summary
- **Minimum** (low usage): ~$30/month
  - Droplet: $20, OpenAI: $1, Domains: $9
- **Typical** (moderate usage): ~$60/month
  - Droplet: $30, OpenAI: $20, Domains: $9
- **Maximum** (high usage): ~$150/month
  - Droplet: $40, OpenAI: $100, Domains: $9

### Annual Projection
- Minimum: ~$360/year
- Typical: ~$720/year
- Maximum: ~$1,800/year

### Cost Optimization Tips
1. **Infrastructure**: Use single droplet for dev/staging, downsize if underutilized
2. **OpenAI**: Implement caching, rate limiting, shorter prompts
3. **Monitoring**: Set billing alerts, track usage metrics

## License Information

### Application License
- Proprietary (not specified in repository)
- Recommend adding LICENSE file

### Dependencies
- All dependencies use MIT or BSD licenses
- No GPL/copyleft obligations
- No commercial licenses required
- Full audit in THIRD-PARTY-LICENSES.md

## Recent Updates (July 2025)

### OAuth Implementation
- Added Google Sign-In requirement for app access
- JWT token-based authentication
- User data stored in SQLite database
- Session management with secure cookies
- Protected routes require authentication

### UI/UX Changes
- New landing page with luxury minimalistic design
- "Sign in with Google" button on landing
- Updated tagline: "Never Over Pay"
- Subtitle: "Know the price. Own the profit."
- Gold CTA button: "Start now. No card. Limited offer."
- Platform logos showcase (Whatnot, eBay, Poshmark, etc.)
- Mobile-optimized with reduced padding

### API Enhancements
- Trending score replaces Boca score (0-100 scale)
- Enhanced scoring algorithm with multiple factors
- Trending score labels (e.g., "Money Maker", "Hot Ticket")
- Improved market insights with 2025 data
- Dual platform recommendations (standard + live)

### Technical Updates
- Added passport and passport-google-oauth20
- Enhanced error handling throughout
- Fixed deployment pipeline issues
- Resolved mobile button wrapping issues
- Fixed hero image aspect ratio problems
- Legal pages served at /terms and /privacy

### Authentication History Note
Previous JWT-based authentication (issues #47, #48, #59, #61) was removed and replaced with Google OAuth 2.0. The earlier implementation included:
- JWT tokens for API authentication
- User signup/login endpoints
- Scan history tracking
- Email capture and storage

These features were replaced with simpler Google OAuth flow for the July 2025 launch.