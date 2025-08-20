# QA Test Plan - Release 006

## Release Overview
Release 006 focuses on critical bug fixes and growth automation enhancements.

## Completed Items

### P0 - Critical Bugs Fixed

#### 1. Loading Screen Bug (#154)
**Issue**: "Requiring unknown module undefined" error preventing login on dev environment
**Resolution**: Added error handling for dynamic imports and updated lucide-react-native version

**Test Steps**:
1. Access blue.flippi.ai
2. Verify loading screen appears without errors
3. Verify app loads successfully
4. Test on mobile and web platforms

**Expected Result**: No module errors, smooth loading experience

#### 2. Share Image Layout for Whatnot (#155)
**Issue**: Share images needed layout adjustments for Whatnot marketing
**Resolution**: Updated to 75% image height, moved title 48px lower, condensed text

**Test Steps**:
1. Navigate to any item page
2. Click share button
3. Select image share option
4. Verify generated image layout:
   - Image takes 75% of height (810px of 1080px)
   - Title positioned at y=906px
   - Text properly condensed
   - Whatnot logo visible

**Expected Result**: Share images optimized for Whatnot marketing requirements

#### 3. Growth Route Redirect Bug
**Issue**: /growth routes redirecting to React app instead of backend
**Resolution**: Fixed nginx configuration to properly route growth endpoints

**Test Steps**:
1. Navigate to blue.flippi.ai/growth/questions
2. Navigate to blue.flippi.ai/growth/content
3. Test API endpoints:
   - GET /api/growth/status
   - GET /api/growth/questions
   - GET /api/growth/content

**Expected Result**: Growth routes load backend pages, not React app

### P1 - High Priority Enhancements

#### 4. QA Process Improvements (#151)
**Issue**: Need for structured QA workflow with checkpoints
**Resolution**: Implemented small-chunk workflow with Git checkpoint tags

**Test Steps**:
1. Review CLAUDE.md for QA process documentation
2. Verify checkpoint workflow:
   - 10-15 minute development chunks
   - Git tags for checkpoints
   - Clear task breakdown

**Expected Result**: Documented QA process available for future releases

### P2 - Medium Priority Features

#### 5. Growth Dashboard Analytics (#150)
**Issue**: No analytics tracking for growth content performance
**Resolution**: Comprehensive analytics system with tracking and visualization

**Test Steps**:
1. Navigate to Growth Dashboard
2. Click "Analytics" tab
3. Test analytics features:
   - View metrics (views, clicks, shares, conversions)
   - Change time ranges (24h, 7d, 30d, all)
   - View platform breakdown
   - Check top performing content
   - Verify CTR calculation
4. Test tracking:
   - Open growth content in new tab
   - Return to analytics and refresh
   - Verify view count increased
5. Test API endpoints:
   - POST /api/growth/analytics/view/:id
   - POST /api/growth/analytics/click/:id
   - POST /api/growth/analytics/share/:id
   - GET /api/growth/analytics/metrics/:id

**Expected Result**: Full analytics tracking and visualization working

## Pending Items (P3 - Low Priority)

### 6. Marketing Log & Flipps Page (#152)
**Status**: Not implemented in this release
**Reason**: Lower priority, scheduled for next release

### 7. Twitter Share Handle Fix (#153)
**Status**: Not implemented in this release
**Reason**: Lower priority, scheduled for next release

## Regression Testing

### Core Functionality
- [ ] Image upload from gallery works
- [ ] Camera capture works (mobile and web)
- [ ] Paste image (Ctrl/Cmd+V) works
- [ ] Drag and drop works
- [ ] Text description with image works
- [ ] Analysis results display correctly
- [ ] Error handling for large/wrong format files
- [ ] "Scan Another Item" flow works

### Authentication & User Flow
- [ ] Login/logout works properly
- [ ] User session persists
- [ ] Protected routes redirect correctly

### Legal Pages
- [ ] /terms loads correctly
- [ ] /privacy loads correctly
- [ ] /mission loads correctly
- [ ] /contact loads correctly
- [ ] Pages show HTML content, not React app

### API Health
- [ ] Backend health check: /api/health
- [ ] Database connection working
- [ ] File upload endpoints functional

## Environment Testing

### Development (blue.flippi.ai)
- [ ] All features work as expected
- [ ] No console errors
- [ ] Performance acceptable

### Staging (green.flippi.ai)
- [ ] Verify same functionality as development
- [ ] Test data isolation from production

### Production (app.flippi.ai)
- [ ] DO NOT DEPLOY - Release 006 is development only
- [ ] Verify existing Release 005 functionality intact

## Performance Checklist
- [ ] Page load time < 3 seconds
- [ ] Image upload/processing < 5 seconds
- [ ] No memory leaks in Growth Dashboard
- [ ] Analytics queries respond < 1 second

## Security Checklist
- [ ] No exposed API keys or tokens
- [ ] Authentication required for protected routes
- [ ] SQL injection prevention in analytics queries
- [ ] XSS prevention in user-generated content

## Mobile Testing
- [ ] Test on iOS Safari
- [ ] Test on Android Chrome
- [ ] Test responsive layouts
- [ ] Test touch interactions

## Browser Compatibility
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

## Known Issues
- Growth routes may need manual nginx fix if deployment fails
- Analytics data starts accumulating from deployment date

## QA Sign-off
- [ ] All P0 bugs verified fixed
- [ ] All P1 enhancements working as specified
- [ ] All P2 features tested and functional
- [ ] No critical regressions found
- [ ] Performance metrics acceptable
- [ ] Security review passed

## Release Notes

### Fixed
- Critical loading screen error preventing login
- Share image layout optimized for Whatnot (75% image height)
- Growth routes properly routing to backend

### Added
- Comprehensive QA process documentation
- Growth analytics tracking system
- Analytics dashboard with visualizations
- Platform breakdown and top content views

### Deferred
- Marketing log & Flipps page (P3)
- Twitter share handle fix (P3)

---

**Release Date**: TBD
**Tested By**: [Tester Name]
**Approved By**: [Approver Name]