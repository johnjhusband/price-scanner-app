# Marketing Automation Guide

## Overview

The Flippi.ai marketing automation system monitors Reddit for thrift store finds and automatically creates SEO-optimized blog/valuation pages. This drives organic traffic without requiring manual intervention.

**MVP Focus**: Currently processing ALL posts from r/ThriftStoreHauls with images to test the end-to-end automation flow.

## Components

### 1. Reddit Monitor (`backend/growth/redditAutomation.js`)
- **MVP**: Monitors r/ThriftStoreHauls only
- Processes ALL posts with images (no keyword filtering)
- Creates blog entries with valuations when possible
- Respects rate limits (2 seconds between posts)

### 2. Automation Control (`/admin/automation`)
- Web dashboard for starting/stopping automation
- Shows real-time status and statistics
- Manual trigger for immediate runs
- Configurable run intervals (default: 30 minutes)

### 3. Reddit Admin (`/admin/reddit`) 
- Manual processing of individual posts
- Testing valuation generation
- Viewing recent valuations

## Quick Start

### Option 1: Web Interface (Recommended)
1. Navigate to https://blue.flippi.ai/admin/automation
2. Click "Start Automation"
3. Set interval (default 30 minutes)
4. Monitor progress in real-time

### Option 2: Command Line
```bash
cd backend
node startAutomation.js
```

### Option 3: Add to PM2 (Production)
```bash
pm2 start backend/startAutomation.js --name "flippi-automation"
pm2 save
```

## Monitored Subreddits

- **r/ThriftStoreHauls** - People showing thrift finds
- **r/whatsthisworth** - Direct valuation questions
- **r/vintage** - Vintage item identification
- **r/Antiques** - Antique valuations
- **r/Flipping** - Resellers asking about items

## Keywords Detected

The system looks for posts containing:
- worth, value, "how much"
- "what is this", "found this"
- thrift, goodwill, estate sale
- garage sale, yard sale, flea market
- authenticate, "real or fake", "legit check"

## How It Works

1. **Fetch Posts**: Gets latest 25 posts from each subreddit
2. **Filter**: Only processes posts with images and keywords
3. **Check Duplicates**: Skips already processed posts
4. **Generate Valuation**: Uses AI to analyze and create page
5. **Create SEO Page**: Publishes at flippi.ai/value/[slug]
6. **Track Analytics**: Monitors views and conversions

## Valuation Pages Include

- Item analysis with estimated value
- QR code for mobile sharing
- "Scan with Flippi" CTA button
- SEO-optimized content
- Social sharing features

## Safety Features

- No Reddit account required (uses public JSON API)
- Rate limiting between requests
- Duplicate detection
- Error handling and logging
- Graceful failure recovery

## Monitoring

Check automation status:
- **Web**: https://blue.flippi.ai/admin/automation
- **API**: GET /api/automation/status
- **Logs**: PM2 logs or console output

## Statistics Tracked

- Total posts processed
- Posts skipped (duplicates)
- Processing errors
- 24-hour valuation count
- Breakdown by subreddit

## Manual Controls

### Start Automation
```bash
curl -X POST https://blue.flippi.ai/api/automation/start \
  -H "X-Admin-Key: flippi-automate-2025" \
  -H "Content-Type: application/json" \
  -d '{"interval": 30}'
```

### Stop Automation
```bash
curl -X POST https://blue.flippi.ai/api/automation/stop \
  -H "X-Admin-Key: flippi-automate-2025"
```

### Run Once
```bash
curl -X POST https://blue.flippi.ai/api/automation/run \
  -H "X-Admin-Key: flippi-automate-2025"
```

## Best Practices

1. **Start Small**: Begin with 30-60 minute intervals
2. **Monitor Initially**: Watch first few runs for issues
3. **Check Quality**: Review generated valuations
4. **Track Conversions**: Monitor CTR on valuation pages
5. **Adjust Keywords**: Update if getting irrelevant posts

## Troubleshooting

### Automation Not Finding Posts
- Check if subreddits are active
- Verify keywords match current posts
- Look for Reddit API changes

### High Skip Rate
- Normal if automation runs frequently
- Most posts processed on first run
- Only new posts processed after

### Errors Processing
- Check OpenAI API key/limits
- Verify database is writable
- Look for Reddit rate limiting

## Future Enhancements

- [ ] Add more subreddits
- [ ] Reply to posts with valuation link (requires OAuth)
- [ ] A/B test different page formats
- [ ] Track conversion to app usage
- [ ] Add Facebook groups monitoring
- [ ] Create weekly performance reports

## Security Note

The admin key `flippi-automate-2025` is hardcoded for development. In production:
1. Set `ADMIN_AUTOMATION_KEY` environment variable
2. Use strong, unique key
3. Rotate regularly
4. Never commit to git