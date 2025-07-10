# My Thrifting Buddy

A simple app that analyzes photos of items and provides resale price estimates using AI.

## Version 0.1

This is a minimal viable product (MVP) with:
- Single-file backend (90 lines)
- Single-file frontend (170 lines)
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
npm run web
```

Open http://localhost:8080 in your browser.

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
```

## How It Works

1. User selects/takes a photo
2. Frontend sends image to backend
3. Backend calls OpenAI Vision API
4. AI analyzes the item and estimates resale value
5. Results displayed to user

## API Endpoints

- `GET /health` - Health check
- `POST /api/scan` - Image analysis

## Docker

Simple two-container setup:
- Backend on port 3000
- Frontend on port 8080

See deployment/docker-compose.yml for details.

## Requirements

- Node.js 18+
- OpenAI API key
- npm or yarn

## License

MIT