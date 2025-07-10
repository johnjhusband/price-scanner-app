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