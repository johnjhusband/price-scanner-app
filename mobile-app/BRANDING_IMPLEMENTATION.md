# Flippi.ai Branding Implementation Guide

## 🎨 Overview

This document outlines the complete Flippi.ai branding implementation for the price scanner app, following Apple's Human Interface Guidelines with a minimal, accessible design system.

## 📁 File Structure

```
mobile-app/
├── components/
│   ├── FlippiLogo.js          # Two-tone logo component
│   └── BrandButton.js         # Branded button component
├── theme/
│   └── brandColors.js         # Complete brand color system
├── assets/
│   ├── flippi-favicon.png     # Favicon (needs to be added)
│   └── fonts/                 # Font files directory
├── App-branded.js             # Branded version of main app
├── web-styles.css             # Web-specific hover states
├── app.json                   # Updated app configuration
└── BRANDING_IMPLEMENTATION.md # This file
```

## 🎯 Brand Implementation Features

### ✅ Completed Features

1. **App Name Change**: "My Thrifting Buddy" → "flippi.ai"
2. **Logo Display**: Two-tone "flippi.ai" logo with proper styling
3. **Favicon Integration**: Configured for web and mobile
4. **Brand Colors**: Complete color system implementation
5. **Poppins Font**: Typography system with all weights
6. **Button Styling**: Branded buttons with hover states

### 🎨 Brand Color System (Updated)

```javascript
// Core UI Colors - WCAG AAA Compliant
primary: '#000000'           // Pure black - All buttons and primary actions
text: '#000000'              // Pure black - Maximum readability
textSecondary: '#3C3C43'     // Apple system gray - Secondary text
background: '#FFFFFF'        // Pure white - Clean canvas
surface: '#F2F2F7'           // Apple surface gray - Cards and panels
border: '#C7C7CC'            // Apple separator - Visible to all

// Special Use Colors (Limited Application)
success: '#10B981'           // Emerald green - Real Score only
accent: '#F59E0B'            // Amber - Numerical values only (prices, scores)
error: '#FF453A'             // Apple red - Error states

// Button System
- All buttons: Black (#000000) background with white text
- Google Sign-In: White background with slate border
- No amber or blue buttons anymore
```

### 🔤 Typography System

- **Font Family**: San Francisco / System Fonts
  - `-apple-system, BlinkMacSystemFont, system-ui, Roboto, Arial, sans-serif`
- **Weights**: All weights from ultraLight (100) to black (900)
- **Sizes**: ADA compliant scale from 14px minimum to 48px
- **Line Heights**: 1.1 to 1.8 for optimal readability

## 🚀 Setup Instructions

### 1. Asset Setup

**Required Assets to Add:**
- Place `flippi-favicon.png` in `mobile-app/assets/`
- Add any additional logo variations to `mobile-app/assets/`

### 2. Font Loading

**Web (Automatic):**
- Google Fonts automatically loaded via CSS
- Poppins font family applied globally

**Mobile:**
- Fonts will use system fallbacks
- Consider adding local font files for offline support

### 3. Component Usage

```javascript
// Logo Component
import FlippiLogo from './components/FlippiLogo';

<FlippiLogo size="large" />  // Options: small, medium, large, xlarge

// Brand Button Component
import BrandButton from './components/BrandButton';

<BrandButton 
  title="Analyze Image"
  variant="primary"  // Options: primary, secondary
  onPress={handlePress}
  disabled={false}
/>
```

### 4. Theme Usage

```javascript
import { brandColors, typography, componentColors } from './theme/brandColors';

// Use in styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: brandColors.background,
  },
  title: {
    fontFamily: typography.bodyFont,
    fontWeight: typography.weights.semiBold,
    color: brandColors.text,
  },
  numericalValue: {
    color: '#F59E0B',  // Amber for numbers only
  },
  realScore: {
    color: '#10B981',  // Emerald green for Real Score
  },
});
```

## 🎨 Design Guidelines

### Logo Usage
- **Two-tone styling**: "flippi" in charcoal gray, ".ai" in light gray
- **Responsive sizing**: 4 size options (small, medium, large, xlarge)
- **Centered alignment**: Always center the logo component

### Button Guidelines
- **Primary buttons**: Black (#000000) with white text
- **Secondary buttons**: Black (#000000) with white text
- **Outline buttons**: Transparent with black border
- **Google Sign-In**: White background, slate border, black text
- **Hover states**: Subtle darkening (#111827) for black buttons
- **Minimum size**: 52px height, 140px width
- **Border radius**: 14px for Apple-style appearance

### Color Usage
- **Backgrounds**: Pure white (#FFFFFF) for main areas
- **Text**: Pure black (#000000) for primary text
- **Numerical Values**: Amber (#F59E0B) for prices and scores
- **Real Score**: Emerald green (#10B981) to differentiate from prices
- **Style Tier Badge**: Light gray backgrounds with matching borders
- **Trending Labels**: Gray italic text for movement indicators

## 🌐 Web-Specific Features

### Hover States
- Button hover effects with color transitions
- Upload area hover with border color changes
- Logo hover with subtle scale animation
- Camera button hover effects

### Responsive Design
- Desktop layout with max-width container
- Improved spacing on larger screens
- Custom scrollbar styling
- Focus states for accessibility

### CSS Classes
```css
.brand-button-primary:hover    /* Primary button hover */
.brand-button-secondary:hover  /* Secondary button hover */
.upload-area:hover            /* Upload area hover */
.flippi-logo:hover           /* Logo hover */
.capture-button:hover        /* Camera button hover */
```

## 📱 Mobile Considerations

### Platform Differences
- **iOS/Android**: Use system font fallbacks
- **Web**: Full Poppins font support
- **Hover states**: Only active on web browsers
- **Touch interactions**: Optimized for mobile gestures

### Performance
- Font loading optimized for web
- Image assets properly sized
- CSS animations hardware-accelerated

## 🔧 Customization

### Adding New Colors
```javascript
// In brandColors.js
export const brandColors = {
  // ... existing colors
  newColor: '#HEXCODE',
};
```

### Creating New Components
```javascript
// Follow the pattern in existing components
import { brandColors, typography } from '../theme/brandColors';

const styles = StyleSheet.create({
  component: {
    backgroundColor: brandColors.coolWhite,
    fontFamily: typography.fontFamily,
  },
});
```

### Modifying Typography
```javascript
// In brandColors.js
export const typography = {
  // ... existing typography
  sizes: {
    // ... existing sizes
    custom: '18px',
  },
};
```

## 🧪 Testing Checklist

### Visual Testing
- [ ] Logo displays correctly on all screen sizes
- [ ] Button colors match brand guide
- [ ] Typography renders properly
- [ ] Hover states work on web
- [ ] Favicon displays in browser tab
- [ ] App name shows as "flippi.ai"

### Functional Testing
- [ ] Buttons respond to touch/click
- [ ] Upload area accepts all input methods
- [ ] Camera functionality works
- [ ] Results display with proper styling
- [ ] Score colors are appropriate

### Cross-Platform Testing
- [ ] Web browser (Chrome, Safari, Firefox)
- [ ] iOS simulator
- [ ] Android emulator
- [ ] Mobile web browsers

## 📋 Next Steps

1. **Add favicon asset** to `mobile-app/assets/flippi-favicon.png`
2. **Test on all platforms** to ensure consistency
3. **Update backend branding** if needed
4. **Consider adding** additional brand assets (logos, icons)
5. **Document any** platform-specific adjustments needed

## 🎯 Brand Compliance

This implementation follows Apple Human Interface Guidelines:
- ✅ WCAG AAA compliant color contrasts
- ✅ Minimal black and white design
- ✅ Amber reserved for numerical values only
- ✅ No "Halloween" color combinations
- ✅ Consistent typography using system fonts
- ✅ Larger touch targets (52px minimum)
- ✅ Clean icon system (Feather icons)

---

## 📱 Icon System

### Lucide Icons License
- **License Type**: ISC License (MIT-compatible)
- **Attribution**: Not required but appreciated
- **Commercial Use**: Allowed
- **Implementation**: Using @expo/vector-icons for compatibility

### Icon Usage
- **Feather Icons**: Primary icon set
- **Size**: 20-24px for UI elements
- **Color**: Match text color or use brandColors
- **Examples**:
  - Thumbs up/down for feedback
  - Camera, upload, clipboard for actions
  - Dollar sign, search, trending for value props

## 🎨 Recent UI/UX Updates

### Issue #100 Implementation
1. **Real Score Color**: Changed from amber to emerald green (#10B981)
2. **Trending Labels**: Added italic gray styling for "Moves When Ready" text
3. **Style Tier Badge**: Redesigned with light backgrounds and borders
4. **Font Standardization**: All weights use typography constants

### Button Hierarchy (Bug #97)
1. **Take Photo** - Primary black button (most important)
2. **Upload Photo** - Outline button (secondary)
3. **Paste Image** - Ghost button (tertiary)

---

**Last Updated**: UI/UX improvements from issue #100
**Version**: 2.0
**Status**: Live on blue.flippi.ai 