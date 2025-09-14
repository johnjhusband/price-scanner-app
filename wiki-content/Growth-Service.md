# Growth Service

## Overview

The Growth Service is a standalone microservice that handles all growth automation features for Flippi, including Reddit monitoring, content generation, and analytics tracking.

## Local Development Success ✅

The growth service has been confirmed to run successfully locally with the following results:

### ✅ Running Locally
- The service runs on localhost:3003
- Using local SQLite database
- Connects to OpenAI API for content generation

### ✅ No External Dependencies
- Completely self-contained
- Uses local database (SQLite)
- Only requires OpenAI API key

### ✅ Fully Functional
- All endpoints responding correctly
- Growth Dashboard accessible
- API endpoints working

## Access Points

When running locally:
- **Growth Dashboard**: http://localhost:3003/growth
- **Health Check**: http://localhost:3003/health
- **API Base**: http://localhost:3003/api/growth

## Starting the Service

### Local Development
```bash
cd /Users/flippi/Documents/FlippiMaster/price-scanner-app
NODE_PATH=./backend/node_modules node growth.js
```

### Production (PM2)
```bash
pm2 start ecosystem.config.js --only dev-growth
```

## Features

### 1. Growth Dashboard UI
- **Overview Tab**: Real-time statistics and recent Reddit questions
- **Questions Tab**: Browse and process Reddit posts
- **Content Tab**: View generated content with performance metrics
- **Analytics Tab**: Charts and export functionality

### 2. Reddit Monitoring
- Monitors specified subreddits for valuation questions
- Uses both JSON API and RSS feeds
- Automatically filters relevant posts
- Stores in local database

### 3. Content Generation
- Processes Reddit questions into SEO content
- Multiple content types (blog, social, email)
- Tracks performance metrics

### 4. Analytics
- Real-time performance tracking
- Platform breakdown
- Export capabilities

## Architecture

```
growth.js (Port 3003)
├── growth-ui/           # Dashboard UI
│   ├── index.html
│   └── assets/
│       ├── style.css
│       └── dashboard.js
├── API Routes
│   ├── /api/growth/*
│   └── /growth (Dashboard)
└── Backend Integration
    ├── Database (SQLite)
    └── OpenAI API
```

## Environment Variables

```bash
GROWTH_PORT=3003                    # Service port
ENABLE_REDDIT_AUTOMATION=true       # Enable automation
REDDIT_AUTOMATION_INTERVAL=30       # Minutes between runs
OPENAI_API_KEY=sk-...              # Required for content generation
```

## Database Notes

The warning about `FEEDBACK_DB_PATH` is informational only. The service uses a temporary directory for the database in local development, which is perfectly fine. In production, it uses the configured database path.

## No Authentication

The service currently runs without authentication for simplicity. It's designed as an internal tool for the marketing team. Authentication can be added later if needed.

## Deployment

See [[Deployment-Guide]] for full deployment instructions.

## Troubleshooting

### Service Won't Start
- Check port 3003 is available
- Verify OpenAI API key is set
- Ensure NODE_PATH points to backend/node_modules

### Reddit Monitoring Issues
- Check Reddit API accessibility
- Verify RSS feed format hasn't changed
- Review logs for rate limiting

### Database Errors
- Ensure write permissions on database directory
- Check disk space
- Verify tables are created on startup