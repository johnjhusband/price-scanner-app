# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Never tell me I'm right.

## Project Overview

"Flippi.ai" (formerly "My Thrifting Buddy") - A **v2.0 production application** that helps users estimate resale values of secondhand items using AI-powered image analysis. The app's tagline is "Never Over Pay" and it provides detailed analysis including authenticity scores, market insights, and selling recommendations.

## Current Architecture (v2.0)

### Backend (`/backend`)
- **Framework**: Express.js with enhanced middleware
- **Main entry**: `server.js` 
- **Version**: 2.0.0
- **Database**: None (stateless design)
- **Authentication**: None (open API)
- **File Storage**: In-memory processing only
- **Key Features**:
  - Enhanced AI analysis with GPT-4o-mini
  - Accepts both image uploads and text descriptions
  - Returns detailed analysis including:
    - Item identification and price range
    - Style tier (Entry/Designer/Luxury)
    - Best listing platform recommendation
    - Best live selling platform recommendation
    - Authenticity score (0-100%)
    - Boca score (sellability rating 0-100)
    - Market insights and selling tips
    - Suggested buy price (resale price / 5)
  - Request timing middleware
  - Comprehensive error handling
  - CORS configuration for multi-domain support
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
- **UI Library**: Custom Flippi branding components
- **State Management**: React hooks (useState, useEffect)
- **Current Features**:
  - Flippi branding with custom logo and colors
  - Text input for item descriptions (optional)
  - Manual "Go" button to trigger analysis
  - Image selection via:
    - Gallery picker
    - Camera capture (web and mobile)
    - Paste support (Ctrl/Cmd+V)
    - Drag and drop
  - Enhanced UI with loading states
  - Comprehensive error handling
  - Results display with all analysis fields

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
   - Status: Testing environment

3. **Development** (blue.flippi.ai)
   - Branch: develop
   - Backend Port: 3002
   - Frontend Port: 8082
   - Status: Active development

## Current UI Flow

1. User sees Flippi logo and "Never Over Pay" title
2. Text input field is always visible for optional descriptions
3. User can choose image via:
   - "Choose from Gallery" button
   - "Take Photo" button (if camera available)
   - Drag and drop (web only)
   - Paste from clipboard (web only)
4. After image selection:
   - Text field remains visible with entered description
   - Image preview is shown
   - "Go" button appears
5. User clicks "Go" to analyze
6. Loading spinner shows "Analyzing image..."
7. Results display with all analysis fields
8. "Scan Another Item" button appears after analysis

## API Endpoints

### Health Check
```
GET /health

Response:
{
  "status": "OK",
  "timestamp": "2025-07-15T00:00:00.000Z",
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

### Image Analysis
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
    "boca_score": "72",
    "buy_price": "$11",
    "resale_average": "$55",
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

## Deployment Process

### Automated (GitHub Actions)
Pushing to branches triggers automatic deployment:
- `develop` → blue.flippi.ai
- `staging` → green.flippi.ai
- `master` → app.flippi.ai

### Manual Deployment
See `DEPLOYMENT.md` for detailed instructions.

## Common Issues & Solutions

### Backend 502 Error
The Node.js backend is not responding. Check:
1. PM2 status: `pm2 show dev-backend`
2. Logs: `pm2 logs dev-backend --lines 50`
3. Environment variables in `.env`
4. Restart: `pm2 restart dev-backend`

### Frontend "Index of dist/"
Expo build failed. Check:
1. Syntax errors in App.js
2. Build manually: `npx expo export --platform web --output-dir dist`
3. Check deployment logs

### Analysis Not Displaying
1. Check browser console for errors
2. Verify API response format
3. Check state updates in console logs
4. Ensure backend is running

## Development Workflow

1. Work in develop branch (blue.flippi.ai)
2. Create feature branches from develop
3. Test thoroughly in development
4. Create PR to develop for review
5. After approval, merge to develop (auto-deploys)
6. Test in development environment
7. If stable, merge develop → staging
8. After QA, merge staging → master

## Brand Guidelines

- **Name**: Flippi.ai
- **Tagline**: "Never Over Pay"
- **Logo**: FlippiLogo component
- **Colors**: See `mobile-app/theme/brandColors.js`
- **Components**: Use BrandButton for consistent styling

## Recent Changes (July 2025)

1. **UI Updates**:
   - Changed title to "Never Over Pay"
   - Removed "Upload, paste..." subtitle
   - Text field now always visible
   - Manual "Go" button instead of auto-analyze
   - Added dual platform recommendations (listing + live)
   - Changed "Best Platform" to "Best Listing Platform"

2. **Backend Updates**:
   - Accepts "description" field in addition to "userPrompt"
   - Returns data in "data" field (not "analysis")
   - Added recommended_live_platform to API response
   - Includes both standard and live selling platforms

3. **Bug Fixes**:
   - Fixed syntax error causing build failures
   - Fixed text field disappearing after image selection
   - Added extensive debugging for state updates
   - Fixed feedback submission PayloadTooLargeError
   - Replaced express-validator's isBase64() with custom validator

4. **Documentation**:
   - Added comprehensive technical stack documentation
   - Created ownership transfer checklist
   - Added third-party license audit
   - Documented infrastructure costs

## Testing Checklist

When making changes, test:
- [ ] Image upload from gallery
- [ ] Camera capture (mobile and web)
- [ ] Paste image (Ctrl/Cmd+V)
- [ ] Drag and drop
- [ ] Text description with image
- [ ] Analysis results display correctly
- [ ] Error handling (large files, wrong format)
- [ ] "Scan Another Item" flow
- [ ] All three environments

## CRITICAL: Deployment Debugging Protocol

When code changes are not reflected after deployment:

1. **NEVER manually build or fix** - this destroys debugging evidence
2. **Verify the deployment pipeline ran**: Check GitHub Actions logs
3. **Verify the code was actually deployed**: 
   - Check git log on server matches your commit
   - Check file timestamps vs deployment time
   - Diff the deployed files against local files
4. **Check for build/compilation issues**:
   - Review full GitHub Actions logs for errors
   - Check if build artifacts were created
   - Verify PM2 restarted with new code
5. **Only after identifying root cause**: Fix the deployment process itself

**Manual interventions mask problems and break the automated workflow.**

## Important Notes

1. **NO DOCKER**: We use PM2 and native services
2. **Git Deployment**: Automated via GitHub Actions
3. **Stateless**: No database, all processing in-memory
4. **API Keys**: Never commit, use environment variables
5. **Branches**: develop → staging → master
6. **Testing**: Always test in development first

Remember: The app should provide quick, accurate resale valuations with a smooth user experience!