# Staging Test Checklist for Flippi.ai

## Overview
This checklist should be completed after deploying to staging (green.flippi.ai) before promoting to production.

## Core Functionality Tests

### 1. Authentication & Access
- [ ] Google OAuth login works
- [ ] User session persists across page refreshes
- [ ] Logout functionality works
- [ ] Legal pages accessible without login (/terms, /privacy, /mission, /contact)

### 2. Image Analysis Flow
- [ ] **Upload from Gallery**
  - [ ] Select image from device
  - [ ] Image preview displays correctly
  - [ ] Can add text description
  - [ ] Analysis completes successfully
  
- [ ] **Camera Capture** (Mobile/Tablet)
  - [ ] Camera permission request works
  - [ ] Camera interface opens
  - [ ] Photo capture works
  - [ ] Preview shows captured image
  - [ ] Analysis works with camera photo
  
- [ ] **Paste Image** (Desktop)
  - [ ] Ctrl/Cmd+V pastes image
  - [ ] Pasted image displays in preview
  - [ ] Analysis works with pasted image
  
- [ ] **Drag & Drop** (Desktop)
  - [ ] Can drag image onto drop zone
  - [ ] Drop zone highlights on hover
  - [ ] Dropped image displays correctly
  - [ ] Analysis works with dropped image

### 3. Analysis Results
- [ ] Item name displays correctly
- [ ] Price range shows realistic values
- [ ] Style tier (Entry/Designer/Luxury) appropriate
- [ ] Real Score displays with explanation
- [ ] Sellability score and label show
- [ ] Platform recommendations make sense
- [ ] Market insights relevant
- [ ] Selling tips helpful
- [ ] Environmental impact tag displays
- [ ] DHGate warning appears when Real Score ≤ 40

### 4. Feedback System
- [ ] "Was this analysis helpful?" prompt appears
- [ ] Yes/No buttons work
- [ ] Text field shows "Have an idea for Flippi? We're listening."
- [ ] Feedback submits successfully
- [ ] Thank you message appears after submission

### 5. Admin Features (Authorized Users Only)
- [ ] Admin button visible for authorized emails
- [ ] Admin dashboard opens
- [ ] Feedback list loads and displays
- [ ] Search functionality works
- [ ] Filter by sentiment works
- [ ] Sort options work
- [ ] Pattern detection alerts visible
- [ ] Can create manual overrides
- [ ] Weekly report generation works
- [ ] Export functionality (JSON/CSV) works

### 6. Share Features
- [ ] **Share on X**
  - [ ] Opens X/Twitter with pre-filled text
  - [ ] Includes item name and profit calculation
  - [ ] Link to Flippi included
  
- [ ] **Download Image**
  - [ ] Square share image generates
  - [ ] Downloaded image includes item photo
  - [ ] Brand, scores, and data visible
  - [ ] Image saves to device
  
- [ ] **Instagram Story** (Mobile)
  - [ ] Story format image generates
  - [ ] 1080x1920 dimensions
  - [ ] Downloads for manual sharing

### 7. UI/UX Elements
- [ ] "Start your first flip 💕" message displays
- [ ] Orange "Scan Another Item" button works
- [ ] Loading states display during analysis
- [ ] Error messages clear and helpful
- [ ] Mobile responsive design works
- [ ] Desktop 2-column layout displays correctly
- [ ] All buttons and links functional
- [ ] Mission modal opens from info icon

### 8. Performance Tests
- [ ] Page loads in < 3 seconds
- [ ] Image analysis completes in < 5 seconds
- [ ] No console errors in browser
- [ ] No 500 errors in responses
- [ ] Memory usage reasonable
- [ ] Mobile performance acceptable

### 9. Cross-Browser Testing
- [ ] **Chrome** - All features work
- [ ] **Safari** - All features work
- [ ] **Firefox** - All features work
- [ ] **Edge** - All features work
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

### 10. Edge Cases
- [ ] Large image file (8-10MB) handled gracefully
- [ ] Wrong file type shows appropriate error
- [ ] Network interruption handled
- [ ] Multiple rapid submissions prevented
- [ ] Empty description field accepted
- [ ] Very long description truncated appropriately

## Payment System Tests (When Implemented)

### Free Tier
- [ ] First 3 flips work without payment
- [ ] Flip counter displays correctly
- [ ] Upgrade modal appears on 4th flip

### Payment Flow
- [ ] $1 single flip payment works
- [ ] $9/month subscription works
- [ ] Stripe checkout opens correctly
- [ ] Success redirect works
- [ ] Payment unlocks features immediately

### Subscription Management
- [ ] Pro users have unlimited flips
- [ ] Subscription status displays
- [ ] Cancel subscription works
- [ ] Reactivation works

## Deployment Verification

### Backend
- [ ] PM2 processes running (pm2 status)
- [ ] No restart loops
- [ ] Logs clean (pm2 logs staging-backend)
- [ ] API endpoints responding
- [ ] Database accessible
- [ ] Environment variables set

### Frontend
- [ ] Build completed successfully
- [ ] Static files serving
- [ ] No 404s on assets
- [ ] Routing works correctly

### Infrastructure
- [ ] SSL certificate valid
- [ ] Nginx configuration correct
- [ ] Health endpoint responding
- [ ] No 502 errors

## Known Issues to Verify Fixed

### From Release-004
- [ ] ✅ Backend no longer suppresses analysis when Real Score ≤ 30
- [ ] ✅ DHGate detection triggers at score = 40
- [ ] ✅ Friendly "dupe" warnings instead of harsh messages
- [ ] ⚠️ Share image includes uploaded photo (Issue #127)

## Sign-Off

### Testing Complete
- [ ] All core features tested
- [ ] No critical bugs found
- [ ] Performance acceptable
- [ ] Ready for production

**Tested By:** _________________  
**Date:** _________________  
**Notes:** _________________

## Rollback Criteria

If any of these occur, consider rollback:
- [ ] Authentication completely broken
- [ ] Analysis fails > 50% of time
- [ ] Database errors preventing operation
- [ ] Security vulnerability discovered
- [ ] Major UI rendering issues

## Post-Deployment Monitoring

After going to production, monitor:
- [ ] Error rate stays below 1%
- [ ] Response times < 2 seconds
- [ ] No memory leaks
- [ ] User complaints minimal
- [ ] Feedback system collecting data