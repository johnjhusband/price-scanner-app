# Product Requirements Document (PRD)
# Growth Automation Service

## Executive Summary

The Growth Automation Service is a standalone microservice that handles all growth-related features for Flippi, including Reddit monitoring, content generation, and analytics tracking. It operates independently from the main backend service to ensure scalability and maintainability.

## Overview

### Purpose
Separate growth automation features from the core application to:
- Improve system stability and performance
- Enable independent scaling of growth features
- Simplify maintenance and debugging
- Prevent growth tasks from impacting core functionality

### Current State
Growth features are currently embedded within the main backend service, causing:
- Increased complexity in the main codebase
- Resource contention between core features and growth automation
- Difficult debugging when growth features fail
- Inability to scale growth features independently

### Proposed Solution
Create a dedicated `growth.js` service that runs as a separate PM2 process on port 3003, handling all growth-related functionality.

## Features

### 1. Reddit Monitoring
- **Description**: Monitors specified subreddits for valuation questions
- **Functionality**:
  - Fetches posts from Reddit using both JSON API and RSS feeds
  - Filters posts based on relevance keywords
  - Stores relevant posts in `reddit_questions` table
  - Runs on configurable intervals (default: 30 minutes)

### 2. Content Generation
- **Description**: Generates SEO-optimized content from Reddit questions
- **Functionality**:
  - Processes unprocessed Reddit questions
  - Generates blog posts, social media content, marketplace listings
  - Tracks content performance metrics
  - Stores generated content in `content_generated` table

### 3. Growth Analytics
- **Description**: Tracks and reports on growth metrics
- **Functionality**:
  - Monitors content views, clicks, shares, conversions
  - Provides platform breakdown analytics
  - Exports analytics data in various formats
  - Real-time dashboard updates

### 4. Complete Growth Dashboard UI
- **Description**: Standalone web interface for all growth/marketing features
- **Functionality**:
  - **Overview Tab**: Real-time stats, recent questions, key metrics
  - **Questions Tab**: Browse unprocessed Reddit posts, generate content on-demand
  - **Content Tab**: View all generated content, filter by type, track performance
  - **Analytics Tab**: Interactive charts, platform breakdowns, export reports
  - Fully self-contained UI served by growth service
  - No dependency on main application frontend

## Technical Architecture

### Service Structure
```
growth.js (Main Service)
├── Routes
│   ├── /api/growth/* - Public API endpoints
│   ├── /growth/* - Admin dashboard pages
│   └── /api/growth/analytics/* - Analytics endpoints
├── Modules
│   ├── redditMonitor.js - Reddit post monitoring
│   ├── redditAutomation.js - Automated Reddit processing
│   └── contentGenerator.js - AI content generation
└── Database
    ├── reddit_questions - Stores Reddit posts
    ├── content_generated - Stores generated content
    └── automation_runs - Tracks automation history
```

### API Endpoints

#### Public API
- `POST /api/growth/monitor/reddit` - Trigger Reddit monitoring
- `GET /api/growth/status` - Get growth automation status
- `GET /api/growth/questions` - Get unprocessed questions
- `POST /api/growth/generate/:postId` - Generate content for specific post
- `GET /api/growth/content` - Get generated content

#### Analytics API
- `POST /api/growth/analytics/track` - Track content metrics
- `GET /api/growth/analytics/content/:id` - Get content analytics
- `GET /api/growth/analytics/platform` - Get platform breakdown
- `GET /api/growth/analytics/export` - Export analytics data

### Configuration

#### Environment Variables
```bash
GROWTH_PORT=3003                    # Service port
ENABLE_REDDIT_AUTOMATION=true       # Enable/disable automation
REDDIT_AUTOMATION_INTERVAL=30       # Minutes between runs
NODE_ENV=production                 # Environment
```

#### PM2 Configuration
```javascript
{
  name: 'dev-growth',
  script: './growth.js',
  cwd: '/var/www/blue.flippi.ai',
  env: {
    NODE_ENV: 'development',
    GROWTH_PORT: 3003,
    ENABLE_REDDIT_AUTOMATION: 'true',
    REDDIT_AUTOMATION_INTERVAL: '30'
  }
}
```

### Database Schema

#### reddit_questions
```sql
CREATE TABLE reddit_questions (
  id INTEGER PRIMARY KEY,
  post_id TEXT UNIQUE,
  subreddit TEXT,
  title TEXT,
  author TEXT,
  url TEXT,
  selftext TEXT,
  created_utc INTEGER,
  score INTEGER,
  num_comments INTEGER,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### content_generated
```sql
CREATE TABLE content_generated (
  id INTEGER PRIMARY KEY,
  source_id TEXT,
  source_type TEXT DEFAULT 'reddit',
  title TEXT,
  content TEXT,
  seo_keywords TEXT,
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP,
  page_views INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Implementation Plan

### Phase 1: Service Creation
1. Create growth.js service file ✅
2. Set up PM2 configuration ✅
3. Configure nginx routing for /api/growth/*
4. Test service health endpoint

### Phase 2: Code Migration
1. Move growth routes from backend/server.js
2. Update imports and dependencies
3. Test all endpoints functionality
4. Remove growth code from main backend

### Phase 3: Deployment
1. Deploy to development environment
2. Test Reddit monitoring functionality
3. Verify analytics tracking
4. Deploy to production

### Phase 4: Monitoring
1. Set up logging and alerts
2. Monitor service performance
3. Track automation success rates
4. Optimize based on metrics

## Success Metrics

1. **Service Reliability**
   - 99.9% uptime for growth service
   - Zero impact on main backend performance

2. **Automation Performance**
   - Successfully monitor 5 subreddits every 30 minutes
   - Process 100+ Reddit posts daily
   - Generate 20+ content pieces daily

3. **Resource Efficiency**
   - Reduce main backend memory usage by 20%
   - Independent scaling of growth features
   - Faster deployment cycles

## Security Considerations

1. **API Security**
   - Rate limiting on public endpoints
   - Authentication for admin endpoints
   - Input validation on all routes

2. **Data Protection**
   - Sanitize Reddit content before storage
   - Secure API keys in environment variables
   - Regular database backups

## Future Enhancements

1. **Additional Platforms**
   - Twitter/X monitoring
   - TikTok trend analysis
   - Instagram hashtag tracking

2. **Advanced Analytics**
   - Predictive content performance
   - A/B testing framework
   - ROI tracking

3. **Automation Features**
   - Auto-publishing to platforms
   - Scheduled content releases
   - Multi-language support

## Conclusion

The Growth Automation Service will significantly improve Flippi's architecture by isolating growth features into a dedicated microservice. This separation enables better performance, easier maintenance, and independent scaling while maintaining all current functionality.