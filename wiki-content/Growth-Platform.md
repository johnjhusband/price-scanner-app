# Growth Platform

## 🚀 Overview

The Growth Platform automatically generates SEO-optimized content from Reddit discussions about item valuations. It creates blog posts at `/value/{slug}` to drive organic traffic.

## 🔄 How It Works

### 1. Reddit Monitoring
- **RSS Feeds** (not API - avoids rate limits)
- Monitors subreddits like r/whatsthisworth
- Checks for new valuation questions
- Runs every 4 hours via cron

### 2. Content Generation
- AI analyzes Reddit posts
- Creates valuation guides
- Generates SEO-optimized content
- Publishes to `/value/{slug}`

### 3. Two Systems (Parallel)
1. **Valuations** (Active) - `/value/` routes
2. **Content Generated** (Unused) - Legacy system

## 📊 Architecture

### Backend Routes
```
/api/growth/questions - Reddit posts
/api/growth/content - Generated content
/api/growth/trigger - Manual monitoring
/growth/questions - Admin UI
```

### Database Tables
- `valuation_questions` - Reddit posts
- `valuations` - Generated blog posts
- `content_generated` - Legacy table (unused)

### Frontend Routes
```
/value/{slug} - Blog post pages
/value - Blog index (future)
```

## 🎯 Admin Interface

### Access Growth Dashboard
1. Sign in with admin email
2. Navigate to `/growth/questions`
3. Select posts to convert
4. Generate blog content

### Manual Monitoring
```javascript
// Trigger Reddit check
POST /api/growth/admin/trigger-monitoring
```

## 📝 Content Structure

### Generated Blog Posts
```markdown
# [Item] Valuation Guide

## Quick Answer
Estimated value: $X - $Y

## Detailed Analysis
- Condition factors
- Market trends
- Comparison data

## Authentication Tips
- How to verify
- Common fakes
- Expert resources
```

### SEO Optimization
- Target long-tail keywords
- Rich snippets markup
- Internal linking
- Meta descriptions

## 🔧 Configuration

### Environment Variables
```bash
REDDIT_CHECK_ENABLED=true
REDDIT_CHECK_INTERVAL=14400000  # 4 hours
OPENAI_API_KEY=sk-...
```

### RSS Feeds Monitored
```javascript
subreddits: [
  'whatsthisworth',
  'vintage',
  'antiques',
  'flipping'
]
```

## 📈 Performance Metrics

### Key Metrics
- Posts discovered daily
- Conversion rate to blogs
- Organic traffic growth
- Top performing content

### Success Indicators
- 10+ posts/day discovered
- 30% conversion rate
- Growing organic traffic
- Low bounce rate

## 🚨 Common Issues

### Reddit Feed Down
- Check RSS feed URL
- Verify subreddit exists
- Test with curl

### Content Not Generating
- Check OpenAI credits
- Verify API key
- Review error logs

### Routes Not Working
- Run nginx fix scripts
- Check PM2 backend
- Verify route configuration

## 🛠️ Maintenance

### Daily Tasks
1. Check monitoring status
2. Review generated content
3. Approve/edit posts
4. Monitor traffic

### Weekly Tasks
1. Analyze top content
2. Adjust keywords
3. Update templates
4. Review performance

## 📊 Analytics

### Track Success
- Google Analytics events
- Search Console data
- User engagement
- Conversion metrics

### A/B Testing
- Title variations
- Content length
- CTA placement
- Image usage

## 🔮 Future Enhancements

### Planned Features
- Auto-publishing
- Image generation
- Video summaries
- Newsletter integration
- Social sharing

### Expansion Ideas
- More subreddits
- Other platforms
- User submissions
- Expert network

## 🔗 Technical Details

### Nginx Configuration
```nginx
location ^~ /value {
  proxy_pass http://localhost:3002;
}

location ^~ /growth {
  proxy_pass http://localhost:3002;
}
```

### Fix Scripts
- `fix-growth-routes.sh`
- `ensure-growth-routes.sh`
- `fix-nginx-comprehensive.sh`

## 💡 Best Practices

### Content Quality
- Verify accuracy
- Add real value
- Cite sources
- Update regularly

### SEO Strategy
- Research keywords
- Optimize titles
- Use headers properly
- Include FAQs

## 📧 Support

For growth platform issues: teamflippi@gmail.com

[[Home]] | [[Admin Dashboard]] | [[Metrics & Reporting]]