# Reddit Valuation System - Test Guide

## 🚀 Quick Test (2 minutes)

### 1. Create Test Valuation
Visit: `https://blue.flippi.ai/api/reddit/test`

This creates a sample Coach purse valuation. You'll see:
```json
{
  "success": true,
  "valuation": {
    "url": "/value/coach-test123",
    "qr_url": "/qr/value/coach-test123.svg",
    "print_url": "/qr/value/coach-test123/print"
  }
}
```

### 2. View the Valuation Page
Click the URL or go to: `https://blue.flippi.ai/value/coach-test123`

You should see:
- Coach purse image (or placeholder)
- Value range: $40-$200 (approximately)
- "Scan Your Similar Item" button
- QR tracking parameter in URL

### 3. Test QR Code
View QR: `https://blue.flippi.ai/qr/value/coach-test123.svg`
- Scan with phone
- Should redirect to valuation page with `?src=qr`

### 4. Print QR Sheet
Visit: `https://blue.flippi.ai/qr/value/coach-test123/print`
- Shows printable card with QR code
- Perfect for thrift stores

## 📊 Check Analytics

### View Recent Valuations
`https://blue.flippi.ai/api/valuations/recent`

### View Stats
`https://blue.flippi.ai/api/valuations/stats`

## 🧪 Advanced Testing

### Process Real Reddit Post
```bash
curl -X POST https://blue.flippi.ai/api/reddit/process \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "id": "abc123",
      "title": "Found Nike Air Max 90s for $20",
      "selftext": "Are these worth flipping?",
      "subreddit": "flipping",
      "author": "testuser",
      "created_utc": 1736784000
    }
  }'
```

## 🎯 What to Look For

### On Valuation Pages:
- ✅ Clean, mobile-friendly design
- ✅ Accurate value ranges
- ✅ Clear CTA to main scanner
- ✅ Source attribution to Reddit
- ✅ Confidence badges (High/Medium/Low)

### QR Codes:
- ✅ Scan successfully
- ✅ Track source as "qr"
- ✅ Work on mobile devices

### Tracking:
- ✅ Page views increment
- ✅ Click tracking works
- ✅ Stats update in real-time

## 🐛 Known Limitations (MVP)

1. **No RSS/Sitemap yet** - Coming in next iteration
2. **Basic image handling** - Some Reddit images may not display
3. **Manual processing** - No automatic Reddit monitoring yet
4. **Limited categories** - Will expand based on usage

## 💡 Use Cases to Test

1. **Thrift Store Scenario**
   - Print QR code
   - Place near similar items
   - Customer scans → sees value → uses Flippi

2. **Social Sharing**
   - Share valuation link
   - Track clicks from different sources
   - Monitor conversion to scans

3. **Widget Embed** (Coming Soon)
   - Embed on blog
   - Visitors see valuations
   - Click through to scanner

## 🚦 Success Metrics

- Page loads < 2 seconds
- QR scans track properly
- CTR from valuation → scanner > 10%
- No errors in console

## 🔧 Troubleshooting

### Page Not Found
- Check slug format
- Verify in database: `/api/valuations/recent`

### QR Not Working
- Try PNG version: `/qr/value/{slug}.png`
- Check QR size parameter

### No Value Shown
- OpenAI API key configured?
- Check server logs for errors

## Next Steps

Once MVP is working:
1. Add RSS feed
2. Auto-process Reddit posts
3. Create widget system
4. Add more distribution channels