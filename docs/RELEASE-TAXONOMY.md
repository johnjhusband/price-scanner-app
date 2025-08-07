# Flippi.ai Release Taxonomy

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