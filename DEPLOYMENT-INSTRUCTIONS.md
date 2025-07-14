# DEPLOYMENT INSTRUCTIONS - v0.1.0 Simplified

## Prerequisites
- Docker Engine v20+ with Docker Compose v2
- 1GB free disk space
- Backend .env file with OpenAI API key

## Backend Setup
Create `.env` file in the `backend/` directory:
```bash
# backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## Deploy Application
```bash
# 1. Navigate to deployment directory
cd deployment

# 2. Start both services
docker-compose up -d
```

This will start:
- Backend API (port 3000)
- Frontend web app (port 8080)

## Verify Deployment
```bash
# Check services are running
docker-compose ps

# View logs if needed
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Access Application
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000
- Health check: http://localhost:3000/health

## Rebuilding After Code Changes

### Quick Rebuild
```bash
cd deployment
docker-compose down
docker-compose build
docker-compose up -d
```

### Clean Rebuild (if having issues)
```bash
cd deployment
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

### Backend won't start
- Check OPENAI_API_KEY is set in backend/.env
- Verify .env file is in backend/ directory (not project root)

### Frontend build fails
- Install web dependencies first:
  ```bash
  cd mobile-app
  npx expo install react-native-web react-dom @expo/metro-runtime
  npm install
  ```

### CORS errors
- Backend is configured to accept requests from localhost:8080 and localhost:3000
- Check frontend is accessing backend at correct URL

### Docker space issues
```bash
docker system prune -af  # Remove all unused images/containers
docker volume prune -f   # Remove unused volumes
```

## Stop Application
```bash
cd deployment
docker-compose down
```

## What's NOT in v0.1.0
- No database (PostgreSQL not implemented)
- No Redis cache
- No authentication/users
- No nginx reverse proxy
- No data persistence between container restarts