# Release Notes - release-001
**Version:** release-001  
**Date:** August 3-4, 2025  
**Environments:** blue.flippi.ai (✅ deployed), green.flippi.ai (✅ deployed)

## 🎯 Overview
This release focuses on improving authentication, AI accuracy, environmental impact awareness, and overall user experience. Major improvements include stricter authenticity scoring for luxury items, visual replica detection fixes, and new environmental impact messaging.

## ✨ New Features

### Environmental Impact Tagging (Issue #87)
- **What's New:** Each analyzed item now displays an environmental impact message
- **Examples:** "♻️ Saves 35 showers", "♻️ Saves water for 60 cups of coffee"
- **Categories:** Automatically detects bags, apparel, shoes, kitchenware, toys, and accessories
- **Display:** Green container below analysis results

### Mission Page
- **What's New:** Company mission and values now accessible from login screen
- **Access:** Click "Mission" link in login footer
- **Design:** Full-screen modal with brand-compliant styling

## 🐛 Bug Fixes

### Authentication (Issue #84)
- **Fixed:** 502 Bad Gateway error when using Google Sign-In
- **Impact:** Users can now successfully authenticate with Google

### AI Accuracy Improvements
- **Issue #85 - Low Authenticity Pricing:**
  - Items with ≤30% authenticity now show $5-$50 price range
  - Platform recommendations display "Unknown" for suspected replicas
  - Market insights show clear warning message
  
- **Issue #86 - Visual Replica Detection:**
  - AI now properly analyzes images to detect replicas visually
  - No longer relies solely on text keywords
  - Restored previous accuracy levels

### Luxury Brand Scoring (Issue #81)
- **Improved:** Stricter scoring for luxury brands (Louis Vuitton, Chanel, Gucci, etc.)
- **Default:** Assumes luxury items might be replicas unless clear authenticity markers found
- **Keywords:** Items with "replica", "inspired", "DHGate" etc. capped at 20% authenticity

## 🎨 UI/UX Updates

### Brand Updates
- **Trademark:** Updated from "Flippi LLC" to "Boca Belle" throughout
- **Footer:** New disclaimer text: "*ai makes mistakes. check important info"
- **Login Footer:** "By entering, you agree to our Terms and Privacy · Contact · Mission"

### Legal Pages
- **Improved:** Consistent brand formatting across all legal pages
- **New Routes:** /mission and /contact pages now accessible
- **Design:** Soft Cream background with Deep Teal headers

## 🔧 Technical Improvements

### Code Quality (Issue #82)
- **Removed:** All console.log statements from production code
- **Retained:** Console.error for critical debugging

### Infrastructure
- **Added:** Post-deployment nginx configuration scripts
- **Fixed:** Legal pages routing to serve static HTML instead of React app
- **Improved:** Deployment workflows for better reliability

## 📊 Performance
- Image analysis: < 5 seconds
- Page load time: < 3 seconds
- Mobile responsiveness: Optimized

## 🔄 Migration Notes
- No database migrations required
- OAuth configuration may need manual nginx updates on some environments

## 📝 Known Issues
- OAuth nginx configuration requires manual application on staging/production
- SSL certificate for flippi.ai root domain pending (Issue #83)

## 🚀 Deployment Status
- **blue.flippi.ai:** ✅ Deployed and tested
- **green.flippi.ai:** ✅ Deployed August 4, 2025
- **app.flippi.ai:** ⏳ Pending

## 📖 Documentation
- Updated CLAUDE.md with latest behavior guidelines
- Created comprehensive UX improvement tickets for next release
- Added deployment troubleshooting guides

## 🙏 Acknowledgments
Thank you to the development team for the rapid implementation of these critical fixes and features.

---
*For technical details, see [RELEASE-TAXONOMY.md](./RELEASE-TAXONOMY.md)*