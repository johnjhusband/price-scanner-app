# Flippi.ai QA Testing Checklist

## 🧪 Core Functionality Tests

### 1. Authentication Flow
- [ ] **Google OAuth Login**
  - [ ] Click "Sign in with Google"
  - [ ] Complete Google auth
  - [ ] Verify redirect to app
  - [ ] Check user name displays correctly
  
- [ ] **Session Persistence**
  - [ ] Login and refresh page
  - [ ] Verify still logged in
  - [ ] Close browser, reopen, verify session
  
- [ ] **Logout**
  - [ ] Click Exit button
  - [ ] Verify logged out
  - [ ] Verify redirected to login

### 2. Image Analysis - All Methods
- [ ] **Camera Capture**
  - [ ] Click camera icon
  - [ ] Take photo
  - [ ] Verify analysis runs
  - [ ] Check results display
  
- [ ] **Upload Photo**
  - [ ] Click upload button
  - [ ] Select image file
  - [ ] Verify analysis runs
  - [ ] Check results display
  
- [ ] **Paste Image (Desktop)**
  - [ ] Copy image to clipboard
  - [ ] Press Ctrl/Cmd+V in app
  - [ ] Verify paste detected
  - [ ] Check analysis runs
  
- [ ] **Drag & Drop (Desktop)**
  - [ ] Drag image file to drop zone
  - [ ] Verify upload triggered
  - [ ] Check analysis runs

### 3. Analysis Results Validation
- [ ] **Price Information**
  - [ ] Verify price range shows (e.g., $50-$150)
  - [ ] Check buy price displays (e.g., $30)
  - [ ] Verify style tier (Entry/Designer/Luxury)
  
- [ ] **Scores Display**
  - [ ] Real Score shows as number (not %)
  - [ ] Trending score shows /100
  - [ ] Trending label displays correctly
  
- [ ] **Platform Recommendations**
  - [ ] Standard platform shows (eBay, Poshmark, etc.)
  - [ ] Live platform shows (TikTok Shop, etc.)
  - [ ] Condition assessment visible
  
- [ ] **Additional Info**
  - [ ] Market insights display
  - [ ] Selling tips show
  - [ ] Environmental tag appears

### 4. Share & Download Features
- [ ] **Download Image**
  - [ ] Click download button after analysis
  - [ ] Verify image downloads
  - [ ] Open downloaded image
  - [ ] Check all info displays correctly
  - [ ] Verify Real Score shows without %
  
- [ ] **Share on Twitter/X**
  - [ ] Click Twitter share button
  - [ ] Verify opens Twitter with pre-filled text
  - [ ] Check link included
  
- [ ] **Instagram Story (Download)**
  - [ ] Click Instagram button
  - [ ] Verify story format image downloads
  - [ ] Check 9:16 aspect ratio

### 5. Payment & Limits
- [ ] **Free Flip Counter**
  - [ ] Check shows "20 free flips remaining"
  - [ ] Scan an item
  - [ ] Verify counter decreases to 19
  
- [ ] **Pricing Modal**
  - [ ] Click pricing link in header
  - [ ] Verify modal opens
  - [ ] Check shows $1 for 5 scans
  - [ ] Close modal with X
  
- [ ] **Limit Reached**
  - [ ] Use up free flips (or simulate)
  - [ ] Try another scan
  - [ ] Verify upgrade prompt appears

### 6. Feedback System
- [ ] **Classic Feedback**
  - [ ] Complete analysis
  - [ ] Click "No" on accuracy
  - [ ] Fill feedback form
  - [ ] Submit feedback
  - [ ] Verify thank you message
  
- [ ] **FlippiBot Chat**
  - [ ] Click chat icon in feedback
  - [ ] Type message
  - [ ] Verify bot responds
  - [ ] Complete conversation
  - [ ] Check feedback submitted
  
- [ ] **Voice Input (Chrome/Safari)**
  - [ ] Click microphone icon
  - [ ] Allow permissions if prompted
  - [ ] Speak feedback
  - [ ] Verify text appears
  - [ ] Submit voice feedback

### 7. Admin Dashboard (Admin Users Only)
- [ ] **Access Control**
  - [ ] Login as admin (john@husband.llc)
  - [ ] Verify admin button visible
  - [ ] Login as regular user
  - [ ] Verify admin button hidden
  
- [ ] **Feedback Tab**
  - [ ] View feedback list
  - [ ] Check sentiment badges
  - [ ] Verify pagination works
  - [ ] Test export function
  
- [ ] **User Activity Tab**
  - [ ] View user list
  - [ ] Check high-value badges
  - [ ] Verify scan counts
  - [ ] Check last seen dates
  
- [ ] **Growth Dashboard**
  - [ ] Click Growth Automation
  - [ ] Check stats display
  - [ ] Click "Monitor Reddit"
  - [ ] Verify questions load
  - [ ] Test content generation

### 8. Edge Cases & Error Handling
- [ ] **Invalid Image Types**
  - [ ] Try uploading .txt file
  - [ ] Verify error message
  - [ ] Try uploading >10MB image
  - [ ] Check size limit error
  
- [ ] **Network Issues**
  - [ ] Upload image
  - [ ] Turn off wifi mid-analysis
  - [ ] Verify error handling
  - [ ] Check retry option
  
- [ ] **Empty States**
  - [ ] Click download before analysis
  - [ ] Verify "analyze first" message
  - [ ] Access feedback with no results
  - [ ] Check appropriate messaging

### 9. Mobile Responsiveness
- [ ] **Phone (375px)**
  - [ ] All buttons accessible
  - [ ] Text readable
  - [ ] Images scale properly
  - [ ] Navigation works
  
- [ ] **Tablet (768px)**
  - [ ] Layout adjusts properly
  - [ ] Two-column views work
  - [ ] Modals display correctly
  
- [ ] **Desktop (1200px+)**
  - [ ] Full layout displays
  - [ ] Hover states work
  - [ ] All features accessible

### 10. Cross-Browser Testing
- [ ] **Chrome (Latest)**
  - [ ] All features work
  - [ ] Voice input functions
  - [ ] Downloads work
  
- [ ] **Safari (Latest)**
  - [ ] All features work
  - [ ] Voice input functions
  - [ ] Downloads work
  
- [ ] **Firefox (Latest)**
  - [ ] Core features work
  - [ ] Note any limitations
  
- [ ] **Mobile Safari (iOS)**
  - [ ] Camera access works
  - [ ] Upload functions
  - [ ] Touch interactions smooth
  
- [ ] **Chrome Mobile (Android)**
  - [ ] Camera access works
  - [ ] Upload functions
  - [ ] Touch interactions smooth

## 🚨 Critical Path Tests (Priority)

1. **New User Flow**
   - [ ] Land on homepage
   - [ ] Sign in with Google
   - [ ] Upload/capture first image
   - [ ] View analysis results
   - [ ] Try to share/download
   - [ ] Use 2-3 free flips
   - [ ] See pricing modal

2. **Returning User Flow**
   - [ ] Already logged in
   - [ ] Quick photo capture
   - [ ] Analysis completes
   - [ ] Download results
   - [ ] Provide feedback

3. **Power User Flow**
   - [ ] Rapid multiple scans
   - [ ] Hit free limit
   - [ ] View pricing
   - [ ] Use voice feedback
   - [ ] Access admin (if applicable)

## 📝 Test Data Suggestions

### Good Test Images:
1. Designer handbag (Coach, Kate Spade)
2. Vintage clothing item
3. Electronics (iPhone, headphones)
4. Shoes (Nike, Adidas)
5. Home decor item
6. Luxury item (for Real Score testing)

### Edge Case Images:
1. Blurry photo
2. Multiple items in frame
3. Poor lighting
4. Extreme close-up
5. Black & white photo
6. Screenshot of item

## ✅ Sign-Off Checklist

- [ ] All critical paths tested
- [ ] No console errors in browser
- [ ] Performance acceptable (<3s analysis)
- [ ] Mobile experience smooth
- [ ] Downloads working correctly
- [ ] New features functional (Voice, FlippiBot, Growth)
- [ ] Admin features restricted properly
- [ ] Payment limits enforced

## 🐛 Bug Reporting Template

**Issue Title**: [Feature] - Brief description

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:

**Actual Result**:

**Browser/Device**:

**Screenshot/Video**: (if applicable)

**Priority**: P0/P1/P2/P3