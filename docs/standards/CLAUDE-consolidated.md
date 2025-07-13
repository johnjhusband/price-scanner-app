# CLAUDE.md (Consolidated) - v0.1.0

## CRITICAL RULES - MUST FOLLOW
- At start of EVERY response, internally review ALL rules before ANY action
- Execute EXACTLY what is asked - nothing more, nothing less
- NEVER: apologize, tell user they're right/wrong, take actions without explicit instruction
- Wait for direct commands. If something fails, report and STOP
- Give ONE recommendation. Give SIMPLE answers first (1-3 sentences max)
- NEVER create files unless absolutely necessary. ALWAYS prefer editing existing files

## Project: My Thrifting Buddy (v0.1.0 - Simplified)
AI-powered resale value estimation proof-of-concept with minimal Express.js backend + React Native frontend

### Current Architecture (v0.1.0)
- **Backend**: Express.js (109 lines), OpenAI Vision API only
- **Frontend**: React Native/Expo SDK 50 (175 lines), basic UI
- **Docker**: Two simple containers (backend + frontend)
- **NO**: Database, Auth, Redis, S3, User accounts, Rate limiting

## Essential Commands

### Quick Start
```bash
# Backend
cd backend && npm install && npm start

# Frontend (with web support)
cd mobile-app && npm install && npx expo install react-native-web react-dom @expo/metro-runtime && npx expo start

# Docker
cd deployment && docker-compose up
```

### API Endpoints (v0.1.0)
- Health: `GET /health`
- Scan: `POST /api/scan` (multipart/form-data)

## Critical Setup Requirements

### 1. Backend .env (MUST be in `/backend` directory)
```bash
OPENAI_API_KEY=your_key_here  # Only required variable
PORT=3000                      # Optional
```

### 2. Web Dependencies (MUST install before Docker)
```bash
cd mobile-app
npx expo install react-native-web react-dom @expo/metro-runtime
npm install  # Update package-lock.json
```

## Docker Commands
```bash
# Clean before building
docker system prune -f && docker builder prune -f

# Build and run
cd deployment
docker-compose up

# Individual builds
docker build -f backend/Dockerfile.backend -t thrifting-buddy/backend:latest ./backend
docker build -f mobile-app/Dockerfile.frontend-node -t thrifting-buddy/frontend:latest ./mobile-app
```

## Common Fixes (v0.1.0)

| Issue | Fix |
|-------|-----|
| OpenAI API error | Check OPENAI_API_KEY in backend/.env |
| CORS error | Backend allows localhost:3000 and :8080 |
| Docker build fails | Run web dependency install first |
| No .env file | Create backend/.env with OPENAI_API_KEY |

## What's NOT Implemented (v0.1.0)
- PostgreSQL database
- JWT authentication  
- User registration/login
- S3 file storage
- Search history
- Rate limiting
- Error logging to file
- Testing infrastructure
- Multiple API endpoints
- Redis caching
- Nginx proxy

## Current Limitations
- In-memory processing only
- No data persistence
- No user accounts
- Basic error handling
- Minimal validation

## File Locations
- Backend code: `/backend/server.js`
- Frontend code: `/mobile-app/App.js`
- Docker compose: `/deployment/docker-compose.yml`
- Backend Dockerfile: `/backend/Dockerfile.backend`
- Frontend Dockerfile: `/mobile-app/Dockerfile.frontend-node`