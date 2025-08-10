# Flippi.ai Release Taxonomy

## release-004 — August 10, 2025 (READY FOR PRODUCTION)

**Summary:**  
Comprehensive feedback learning system with pattern detection, manual overrides, admin dashboard, and remaining UI updates from Issue #122.

### ✅ Included Changes:

#### Feedback Learning System (Issue #128)
- 🧠 **Pattern Detection Engine**
  - Monitors negative feedback for recurring issues
  - Auto-flags patterns after 10+ occurrences
  - Tracks brand, category, and platform issues
  - Console notifications when patterns detected

- 🔧 **Manual Override System**
  - Admin-controlled price/score adjustments
  - Supports percentage or fixed value changes
  - Automatically applies during analysis
  - Tracks application count

- 📊 **Weekly Summary Reports**
  - Automated feedback analysis every Sunday
  - Shows sentiment breakdown and common issues
  - Identifies most affected brands
  - Tracks active patterns and overrides

- 👨‍💼 **Admin Dashboard**
  - Full React interface for feedback management
  - Search, filter, and sort capabilities
  - Pattern and override management
  - Detailed view with original analysis
  - Access limited to authorized users

#### UI/UX Improvements (Issue #122)
- 💬 **Feedback Prompt Update**
  - Changed to "Have an idea for Flippi? We're listening."
  - Removed "(optional)" label

- 👤 **Admin Access**
  - Added admin button for authorized users
  - Current admins: john@flippi.ai, tarahusband@gmail.com, teamflippi@gmail.com, tara@edgy.co

### ⚠️ Known Defects:

1. **🔴 CRITICAL: Share Image Not Loading** (Issue #127)
   - Downloads occur but image is blank
   - Multiple fix attempts unsuccessful
   - Affects brand sharing functionality

2. **🟡 MEDIUM: Backend Analysis Suppression** (Issue #124)
   - Detailed insights lost when Real Score ≤ 30
   - Generic text replaces specific findings

3. **🟢 LOW: Temporary Database Storage**
   - Feedback DB uses /tmp/ directory
   - Data may be lost on server restart
   - Need to set FEEDBACK_DB_PATH

### 📝 Technical Details:
- Version: 2.3.0
- New database tables: 4 (pattern_detection, manual_overrides, weekly_reports, feedback_analysis)
- New API endpoints: 9
- Enhanced feedback table with analysis_id
- No new external dependencies

### 🚀 Deployment Notes:
1. Run database migrations (automatic on startup)
2. Set FEEDBACK_DB_PATH to persistent location
3. Verify admin email access list
4. Monitor pattern detection logs
5. Generate initial weekly report after deployment

---

# Flippi.ai Release Taxonomy

## release-003 — August 8, 2025

**Summary:**  
UI/UX improvements, Real Score enhancements, and critical bug fixes for authenticity detection.

### ✅ Included Changes:

#### UI/UX Improvements
- 🎨 **Issue #122:** Master UI/UX updates
  - Enhanced share image with actual photo and more data (brand, scores, environmental impact)
  - Changed "Scan Another Item" button to orange accent color
  - Updated feedback prompt text to "Was this analysis helpful?"
  - Fixed flip message persistence between scans
  
- 📊 **Issue #123:** Real Score explanation enhancements
  - Added dynamic explanation text based on score percentage
  - Added second sentence with specific details about what was detected
  - Added info icon that opens mission modal for more context
  - Explanations now focus on authenticity signals, not just photo quality

#### Authenticity & Warnings
- ⚠️ **Issue #125:** Friendly dupe warnings
  - Changed from suppressing prices to showing all data with soft warning
  - Replaced "fake/authenticity concern" language with "may be a dupe"
  - Added subtle yellow alert with Lucide AlertTriangle icon
  - Keeps all valuable data visible: pricing, Real Score, platforms

#### Bug Fixes
- 🐛 **Issue #126:** Fixed DHGate detection threshold
  - Changed warning trigger from `score < 40` to `score <= 40`
  - DHGate and other replica sources now properly trigger warnings
  - Affects all detections that cap Real Score at exactly 40

- 🖼️ **Issue #127:** Fixed share image not including uploaded photo ✅
  - Share image now properly displays the item photo
  - Added data URL prefix to base64 image when missing
  - Uses imageBase64 as primary source (always available after analysis)
  - Fixed issue where imageBase64 lacked "data:image/jpeg;base64," prefix
  - Fallback placeholder only shows if image truly can't be loaded

### 📝 Notes:
- Version bumped to 2.3.0
- Focus on being a helpful friend, not authentication police
- All changes maintain pricing intelligence as primary goal

---

## release-001 — August 3-4, 2025

**Summary:**  
Comprehensive release including authentication fixes, AI improvements, environmental features, and brand updates. Deployed to blue.flippi.ai and staging.

### ✅ Included Changes:

#### Core Fixes
- 🛡 **Issue #84:** Fix 502 Bad Gateway on Google Authentication
- 📊 **Issue #81:** Stricter authenticity scoring for luxury brands
- 🧹 **Issue #82:** Remove `console.log` statements from production
- ™️ **Issue #80:** Update trademarks to "Boca Belle" throughout app

#### AI & Pricing Improvements  
- 💰 **Issue #85:** Fix pricing for low authenticity items (≤30% = $5-$50)
- 🔍 **Issue #86:** Fix AI visual replica detection
- 🎯 Simplified AI prompts for better visual analysis
- ⚠️ Platform recommendations show "Unknown" for suspected replicas

#### New Features
- ♻️ **Issue #87:** Environmental Impact Tagging
  - Messages like "♻️ Saves 35 showers" based on item category
  - Auto-detection for bags, apparel, shoes, kitchenware, toys, accessories
  - Green container display below analysis results

#### UI/UX Updates
- 📄 **Mission Page:** New mission modal accessible from login screen
- 📱 **Footer Updates:** 
  - Disclaimer moved to footer: "*ai makes mistakes. check important info"
  - Login footer: "By entering, you agree to our Terms and Privacy · Contact · Mission"
- 🎨 **Legal Pages:** Consistent brand formatting for all legal pages
- 📊 **UX Research:** Comprehensive analysis and improvement tickets created

#### Infrastructure
- 🔧 Post-deployment scripts for nginx configuration
- 📋 Legal pages routing fixes (/terms, /privacy, /mission, /contact)
- 🚀 Successful deployment to blue.flippi.ai and green.flippi.ai

### 📝 Notes:
- OAuth nginx configuration still needs manual application on staging/production
- All features thoroughly tested on blue environment before staging deployment

---

## release-002 — August 7, 2025

**Summary:**  
Visual polish and infrastructure fixes based on investor feedback. Warmer UI, social sharing features, and critical nginx SSL fixes.

### ✅ Included Changes:

#### Visual Polish (Issue #117)
- 🎨 **Warmer Button Styling:** Changed from black to neutral-900 (#18181b)
- 🧹 **UI Cleanup:** Removed duplicate "Paste Image" button
- 💕 **Welcome Message:** Added "Start your first flip 💕" for logged-in users
- 📊 **Style Tier:** Changed from button to simple text display
- 🖥️ **Desktop Layout:** 2-column responsive grid for results
- 🌟 **Warmer Background:** Light gray (#fafafa) for logged-in state

#### Social Features
- 🐦 **Issue #114:** Share on X with auto-generated profit tweets
- 📸 **Issue #115:** Instagram Story receipt generation (1080x1920px)
- 🎬 **Issue #116:** TikTok feature ticket created

#### Infrastructure Fixes
- 🚨 **Legal Pages SSL:** Fixed critical nginx configuration issue
  - Created missing SSL configuration files
  - Added fix to all deployment workflows
  - Comprehensive documentation added

#### Developer Experience
- 📚 Updated CLAUDE.md with SSL issue quick fix
- 📝 Created incident report documentation
- 🔧 Enhanced deployment troubleshooting guide

### 📝 Notes:
- Version bumped to 2.2.0
- Ready for staging and production deployment
- All investor feedback items addressed

---