# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is "My Thrifting Buddy" - a **simplified v0.1.0 proof-of-concept** application that helps users estimate resale values of secondhand items using AI-powered image analysis. The project consists of a minimal Node.js/Express backend API and a basic React Native mobile app.

## Current Architecture (v0.1.0)

### Backend (`/backend`)
- **Framework**: Express.js (minimal setup)
- **Main entry**: `server.js` (109 lines)
- **Database**: None implemented
- **Authentication**: None implemented
- **File Storage**: In-memory processing only
- **Dependencies**: 
  - cors
  - dotenv
  - express
  - multer
  - openai

### Mobile App (`/mobile-app`)
- **Framework**: React Native with Expo SDK 50
- **Main entry**: `App.js` (175 lines)
- **State Management**: Basic React useState
- **Features**:
  - Camera/image picker integration
  - Simple API call to backend
  - Basic UI for displaying results

## Essential Commands

### Backend Development
```bash
cd backend
npm install                              # Install dependencies
npm start                               # Start server (port 3000)
npm run dev                             # Start with nodemon auto-reload
```

### Mobile App Development
```bash
cd mobile-app
npm install                             # Install dependencies
# CRITICAL: Install web dependencies for Docker support
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo start                          # Start Expo development server
npx expo start --web                    # Start web version
```

## Environment Configuration

### Backend `.env` variables (minimal):
```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here

# Optional
PORT=3000
NODE_ENV=development
```

**CRITICAL**: The `.env` file MUST be placed in the `/backend` directory

## API Endpoints

### Current Implementation (v0.1.0)
- `GET /health` - Server health check
- `POST /api/scan` - Analyze image (multipart/form-data)

## Docker Configuration
 Docker Deployment Best Practices - ALWAYS FOLLOW

  Building Docker Images for Deployment

  ALWAYS use --no-cache when building for deployment:
  docker compose build --no-cache backend
  docker compose build --no-cache frontend
  # OR
  docker compose build --no-cache

  Pre-Deployment Verification

  ALWAYS verify your changes are in the image BEFORE deploying:
  # Check that your code changes are actually in the built image
  docker run --rm <image-name> cat /app/server.js | grep "your-changed-line"

  Image Tagging

  ALWAYS check what image tags the server expects:
  ssh server "cat /path/to/docker-compose.yml | grep image:"

  ALWAYS tag your images to match:
  # If server uses :v0.1.1, tag accordingly
  docker tag thrifting-buddy/backend:latest thrifting-buddy/backend:v0.1.1
  docker tag thrifting-buddy/frontend:latest thrifting-buddy/frontend:v0.1.1

  Deployment Commands

  ALWAYS save and deploy with the correct tags:
  # Save with version tag that matches server's docker-compose.yml
  docker save thrifting-buddy/backend:v0.1.1 thrifting-buddy/frontend:v0.1.1 | gzip > images.tar.gz
  scp images.tar.gz root@server:/root/
  ssh root@server "gunzip -c images.tar.gz | docker load && cd /project && docker compose down && docker     
   compose up -d"

  Post-Deployment Verification

  ALWAYS verify the fix is actually running:
  ssh server "docker exec <container-name> cat /app/server.js | grep 'changed-line'"

  Summary: The Golden Rule

  Never trust Docker's cache when deploying fixes. Always build with --no-cache and verify changes are       
  in the image before AND after deployment.

### Docker Files
- **Backend**: `backend/Dockerfile.backend` - Simple Node.js container
- **Frontend**: `mobile-app/Dockerfile.frontend-node` - Expo web build

### Docker Compose
- **Location**: `deployment/docker-compose.yml`
- **Services**: backend (port 3000) and frontend (port 8080)
- **No databases or additional services**

### Docker Commands
```bash
# From deployment directory
cd deployment
docker-compose up                    # Start both services
docker-compose down                  # Stop services

# Individual builds
docker build -f backend/Dockerfile.backend -t thrifting-buddy/backend:latest ./backend
docker build -f mobile-app/Dockerfile.frontend-node -t thrifting-buddy/frontend:latest ./mobile-app
```

## Current Limitations (v0.1.0)

### NOT Implemented:
- PostgreSQL database
- Redis caching
- JWT authentication
- User accounts/registration
- S3 file storage
- Search history
- Rate limiting
- Comprehensive error logging
- Nginx reverse proxy
- Testing infrastructure
- Database migrations
- Multiple API endpoints

### What Works:
- Basic image upload and analysis
- OpenAI Vision API integration
- Simple mobile/web UI
- Basic Docker containerization

## Development Notes

1. **Simplicity First**: This is a minimal proof-of-concept
2. **No Database**: All processing is stateless
3. **No Auth**: Completely open API
4. **Basic Error Handling**: Minimal error responses
5. **In-Memory Only**: No persistent storage

## Troubleshooting

### Common Issues

1. **OpenAI API Key Missing**:
   - Ensure OPENAI_API_KEY is set in backend/.env
   - Restart backend after adding key

2. **CORS Errors**:
   - Backend allows localhost:8080 and localhost:3000
   - Check if frontend is running on expected port

3. **Docker Build Failures**:
   - Ensure web dependencies installed: `npx expo install react-native-web react-dom @expo/metro-runtime`
   - Clean Docker cache: `docker system prune -f`

## Future Roadmap

This v0.1.0 is a simplified foundation. Future versions may add:
- Database integration
- User authentication
- File storage
- Search history
- Advanced features documented in other files

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

## CRITICAL: Deep Planning and Dependency Analysis

**STOP. THINK. PLAN. EXECUTE.**

### You MUST follow this process for EVERY change:

1. **DEEP ANALYSIS PHASE** (Think for at least 30 seconds):
   - What is the current state of ALL environments?
   - What exactly needs to change?
   - What are ALL the dependencies?
   - What could break?
   - What are the unintended consequences?
   - Will this affect other environments (prod, test, dev)?

2. **COMPREHENSIVE PLANNING**:
   - Write out EVERY step needed
   - Map ALL configuration changes
   - Identify ALL files that need modification
   - List ALL commands in exact order
   - Plan for rollback if something fails
   - Consider port conflicts, network conflicts, DNS issues
   - Think about SSL certificates, nginx routing, Docker networks

3. **DEPENDENCY MAPPING**:
   - Frontend → API communication paths
   - Port mappings (what's using 80, 443, 3000, 8080?)
   - Docker container names and networks
   - SSL certificate paths and domains
   - Environment variables in all components
   - Nginx routing rules for each domain

4. **RISK ASSESSMENT**:
   - **NEVER bring down production**
   - What happens if this fails halfway?
   - How do we rollback?
   - Are we affecting any running services?
   - Will this break existing functionality?

5. **EXECUTION RULES**:
   - Create a SINGLE comprehensive script
   - Test commands locally first if possible
   - Include verification steps
   - No iterative guessing - get it right the first time
   - If you're not 100% sure, ASK the user

### COMMUNICATION RULES:
- **DEFAULT TO SIMPLE ANSWERS** - One paragraph or less
- **Only provide detailed explanations when explicitly asked**
- **Get to the point immediately**
- **No walls of text unless requested**
- **If asked "how", give the shortest working answer**
- **Answer the question first, then offer to expand if needed**
- **Use bullet points for clarity when listing multiple items**

### Example of FAILED approach (what you've been doing):
1. Try to add blue environment
2. Breaks production
3. Try to fix production
4. Breaks blue
5. Try random nginx configs
6. More breaking
7. Hours wasted

### Example of CORRECT approach:
1. Analyze: Production on ports 80/443, need blue on separate ports
2. Plan: Blue on 8080/8443, separate Docker network, no conflicts
3. Map: All container names, networks, ports documented
4. Risk: Production untouched, blue isolated
5. Execute: One script, works first time

**NEVER assume a change is isolated. ALWAYS trace through the full request flow.**
**NEVER make changes without a complete plan.**
**NEVER bring down production.**

## Blue-Green Deployment Strategy

### Environment Structure:
1. **PRODUCTION**: app.flippi.ai (only updated after management approval)
2. **TEST**: Alternates between blue.flippi.ai OR green.flippi.ai (stable version for testing)
3. **DEV**: Alternates between blue.flippi.ai OR green.flippi.ai (in-progress development)

### Current State:
- **Production**: app.flippi.ai → Green code (v0.1.0)
- **Test**: green.flippi.ai → Green code (stable)
- **Dev**: blue.flippi.ai → Blue code (development)

### Code Organization:
```
price-scanner-app/
├── CLAUDE.md (AI instructions - always in root)
├── prod/
│   ├── backend/
│   │   ├── server.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md (backend-specific docs)
│   ├── mobile-app/
│   │   ├── App.js
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md (frontend-specific docs)
│   └── deployment/
│       ├── docker-compose.yml
│       ├── nginx.conf
│       └── DEPLOYMENT.md (deployment instructions)
├── blue/
│   └── [complete copy with own documentation]
├── green/
│   └── [complete copy with own documentation]
├── scripts/
│   ├── deploy-*.sh
│   └── README.md (script usage)
├── shared/
│   └── .env (sensitive configs)
└── docs/
    ├── STANDARDS.md (coding standards only)
    ├── BEST_PRACTICES.md (guidelines only)
    └── ARCHITECTURE.md (system design only)
```

### Documentation Rules:
1. **CLAUDE.md** stays in root for AI access
2. **Co-located docs** - Documentation lives WITH the code it describes
3. **Version-specific** - Each environment (prod/blue/green) has its own docs
4. **No orphaned docs** - When code moves, docs move with it
5. **Standards separate** - Only best practices and standards in /docs
6. **Implementation docs** - README.md and DEPLOYMENT.md travel with code

### File Organization Rules:
1. **Complete separation** - prod, blue, and green are isolated
2. **No root pollution** - Only CLAUDE.md and folders in root
3. **Clean up after yourself** - Delete temporary files after use
4. **Single source** - Each environment is self-contained

### Deployment Cycle:
1. **Develop** on current Dev environment (blue or green)
2. When features are complete, **Dev becomes Test** for thorough testing
3. The other color **becomes new Dev** environment
4. After testing + management approval, **Test graduates to Production**
5. **Alternate** between blue and green for Dev/Test roles

### Key Rules:
- Production (app.flippi.ai) ONLY updates with explicit management approval
- Never modify stable code directly - always work in the Dev environment
- All changes must go through Dev → Test → Production pipeline
- Blue and Green code/containers are kept separate until promotion
