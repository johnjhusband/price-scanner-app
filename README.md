# My Thrifting Buddy

A simple app that analyzes photos of items and provides resale price estimates using AI.

## Version 0.1.0

This is a minimal viable product (MVP) with:
- Single-file backend (109 lines)
- Single-file frontend (175 lines)
- No database, no authentication, no complexity
- Direct OpenAI Vision API integration

## Quick Start

### Backend

```bash
cd backend
npm install
# Add your OpenAI API key to .env file
npm start
```

### Frontend

```bash
cd mobile-app
npm install
# Install web dependencies
npx expo install react-native-web react-dom @expo/metro-runtime
npm run web
```

Open http://localhost:8080 in your browser.

## Docker Deployment

```bash
cd deployment
docker-compose up
```

Access at:
- Frontend: http://localhost:8080
- Backend API: http://localhost:3000

## Architecture

```
backend/
  server.js      # Express API server
  package.json   # Only 5 dependencies
  .env          # Contains OPENAI_API_KEY

mobile-app/
  App.js        # React Native app
  package.json  # Expo dependencies
  app.json      # Expo configuration

deployment/
  docker-compose.yml  # Simple 2-container setup
```

## How It Works

1. User selects/takes a photo
2. Photo is sent to backend API
3. Backend calls OpenAI Vision API
4. AI analyzes item and returns:
   - Item name
   - Price range estimate
   - Recommended selling platform
   - Condition assessment
5. Results displayed to user

## API Endpoint

### POST /api/scan
- Accept: multipart/form-data
- Field: `image` (file)
- Returns: JSON with analysis results

### GET /health
- Returns: Server status

## Requirements

- Node.js 20+
- Docker (optional)
- OpenAI API key

## Environment Variables

Create `backend/.env`:
```
OPENAI_API_KEY=your_key_here
PORT=3000
```

## What's NOT Included (v0.1.0)

- User authentication
- Database storage
- Search history
- File persistence
- Rate limiting
- Error logging
- Multiple endpoints
- Testing suite

## Future Plans

This is a proof-of-concept. Future versions may add databases, authentication, and more features.