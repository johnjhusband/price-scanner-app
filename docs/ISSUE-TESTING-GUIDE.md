# Flippi.ai Issue Testing Guide

This guide provides specific testing procedures for GitHub issues and features.

## Issue Testing Status Overview

### ⚠️ Critical Finding: Authentication Code Was Removed
Issues #47, #48, #59, and #61 had backend implementations that were **removed** during the transition to Google OAuth. These issues should be re-tagged as "implementation-removed" or reopened if the features are still needed.

## Testing Procedures by Issue

### ✅ Currently Testable Issues

#### Image Upload Features (#19-23)
```bash
# Test gallery upload
curl -X POST https://blue.flippi.ai/api/scan \
  -F "image=@test.jpg" \
  -F "description=vintage jacket"

# Verify camera functionality (manual test)
# 1. Visit https://blue.flippi.ai
# 2. Click "Take Photo"
# 3. Capture and analyze image

# Test drag-and-drop (desktop only)
# 1. Open browser console
# 2. Drag image file onto upload area
# 3. Verify preview and analysis

# Test paste functionality
# 1. Copy image to clipboard
# 2. Focus on page and press Ctrl/Cmd+V
# 3. Verify image appears and can be analyzed
```

#### Price Analysis Features (#24-25, #39-40)
```bash
# Test resale price estimation
curl -X POST https://blue.flippi.ai/api/scan \
  -F "image=@luxury-item.jpg" \
  -F "description=Louis Vuitton authentic"

# Expected response includes:
# - price_range: "$900-$1,200"
# - authenticity_score: "85%"
# - trending_score: 72
# - recommended_platform: "The RealReal"
# - recommended_live_platform: "Whatnot"
```

#### High-End Product Fix (#50)
```bash
# Test with luxury item
curl -X POST https://blue.flippi.ai/api/scan \
  -F "image=@luxury.jpg" \
  -F "description=Hermès Birkin bag"

# Verify price_range handles comma formatting correctly
# Should show "$9,000-$12,000" not "$9,000-$1"
```

#### Feedback API (#62-63)
```bash
# Test feedback submission
curl -X POST https://blue.flippi.ai/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "feedback": "Great app for resellers!",
    "rating": 5
  }'

# Verify persistence
ssh root@157.245.142.145
sqlite3 /tmp/flippi-feedback.db "SELECT * FROM feedback;"
```

### ❌ Not Currently Testable (Code Removed)

#### Authentication Features
- **#47 Scan History**: Required user authentication to link scans
- **#48 JWT Authentication**: Replaced with Google OAuth
- **#59 Email Capture**: User table structure changed
- **#61 Security Standards**: Some features removed (rate limiting still exists)

### 📋 Open Issues (Not Yet Implemented)
- #45: Send GitHub Repository Link
- #49: Build Internal Trends Database
- #52-58: Frontend auth components

## Quick Test All Features Script

```bash
#!/bin/bash
# test-all-features.sh

echo "🧪 Testing Flippi.ai Features..."

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s https://blue.flippi.ai/health | jq '.'

# Test image analysis
echo "2. Testing image analysis..."
curl -X POST https://blue.flippi.ai/api/scan \
  -F "image=@test.jpg" \
  -F "description=test item" \
  -o result.json

# Check result
if grep -q "success.*true" result.json; then
  echo "✅ Image analysis working"
else
  echo "❌ Image analysis failed"
fi

# Test feedback API
echo "3. Testing feedback API..."
FEEDBACK_RESPONSE=$(curl -s -X POST https://blue.flippi.ai/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"feedback": "Test feedback", "rating": 5}')

if echo "$FEEDBACK_RESPONSE" | grep -q "success"; then
  echo "✅ Feedback API working"
else
  echo "❌ Feedback API failed"
fi

echo "✅ Testing complete!"
```

## Manual Testing Checklist

### Full User Flow Test
1. [ ] Visit https://blue.flippi.ai
2. [ ] Verify Google Sign-In button appears
3. [ ] Complete OAuth flow
4. [ ] Test image upload via:
   - [ ] Gallery selection
   - [ ] Camera capture
   - [ ] Drag and drop
   - [ ] Clipboard paste
5. [ ] Add optional description
6. [ ] Click "Go" button
7. [ ] Verify analysis results include:
   - [ ] Item name and price range
   - [ ] Style tier (Entry/Designer/Luxury)
   - [ ] Platform recommendations
   - [ ] Authenticity score
   - [ ] Trending score with label
   - [ ] Market insights
8. [ ] Check disclaimer text appears
9. [ ] Click "Scan Another Item"
10. [ ] Submit feedback via API

### Performance Testing
```bash
# Test with large image (8-9MB)
curl -X POST https://blue.flippi.ai/api/scan \
  -F "image=@large-image.jpg" \
  -w "\nTotal time: %{time_total}s\n"

# Should complete in < 5 seconds
```

### Database Verification
```bash
# SSH to server (read-only access)
ssh root@157.245.142.145

# Check feedback database
sqlite3 /tmp/flippi-feedback.db ".tables"
sqlite3 /tmp/flippi-feedback.db "SELECT COUNT(*) FROM feedback;"

# Check users table (OAuth)
sqlite3 /tmp/flippi-feedback.db "SELECT COUNT(*) FROM users;"
```

## Issue Sign-Off Checklist

Before marking an issue as fully tested:
1. [ ] Feature works as described in issue
2. [ ] No console errors in browser
3. [ ] API returns expected format
4. [ ] Error cases handled gracefully
5. [ ] Works on mobile and desktop
6. [ ] Performance is acceptable
7. [ ] No security vulnerabilities
8. [ ] Documentation updated if needed
9. [ ] No regression in other features
10. [ ] Can be demoed to stakeholders

## Monitoring During Testing

```bash
# Watch PM2 processes
pm2 monit

# Check logs for errors
pm2 logs dev-backend --lines 50

# Monitor system resources
htop

# Check Nginx logs
tail -f /var/log/nginx/error.log
```

## Rollback Procedures

### Quick Rollback (if issues found)
```bash
cd /var/www/blue.flippi.ai
git log --oneline -5  # Find last good commit
git reset --hard <commit-hash>
pm2 restart dev-backend dev-frontend
```

### Full Rollback
```bash
# Restore from backup
cd /var/www/blue.flippi.ai
git fetch origin develop
git reset --hard origin/develop~1  # Previous commit
cd backend && npm install
cd ../mobile-app && npm install && npm run build
pm2 restart all
```

## Notes on Removed Features

The following features were implemented but later removed during the OAuth transition:
- JWT-based authentication system
- User signup/login endpoints
- Scan history tracking per user
- Email capture in users table
- Some security middleware (helmet.js)

If these features are needed again, they would need to be reimplemented to work with the current Google OAuth system.