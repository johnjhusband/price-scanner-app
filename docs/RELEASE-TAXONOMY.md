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