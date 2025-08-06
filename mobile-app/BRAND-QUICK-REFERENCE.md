# Flippi.ai Brand Quick Reference

## 🎨 Color Rules (Strict)

### UI Colors
- **All Buttons**: Black (#000000) background, white text
- **Text**: Black (#000000) primary, gray (#3C3C43) secondary
- **Backgrounds**: White (#FFFFFF) main, light gray (#F2F2F7) cards

### Special Use Only
- **Amber (#F59E0B)**: ONLY for numerical values (prices, scores, counts)
- **Emerald (#10B981)**: ONLY for Real Score (to differentiate from price)
- **NO blue or amber buttons** - all CTAs are black

### Google Sign-In Exception
- White background, slate border, black text
- Follows Google's branding guidelines

## 🔤 Typography

```javascript
fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, Roboto, Arial, sans-serif'

// Weights
regular: '400'
medium: '500'
semiBold: '600'
bold: '700'

// Minimum sizes
body: 17px
small: 15px
caption: 14px (minimum)
```

## 🎯 Component Guidelines

### Buttons
```javascript
// Primary (most important)
backgroundColor: '#000000'
color: '#FFFFFF'
minHeight: 52px

// Outline (secondary)
backgroundColor: 'transparent'
borderColor: '#000000'
color: '#000000'

// Ghost (tertiary)
backgroundColor: 'transparent'
color: '#000000'
```

### Numerical Emphasis
```javascript
// Prices, values
color: '#F59E0B' // Amber
fontWeight: '600'

// Real Score only
color: '#10B981' // Emerald green
fontWeight: '600'
```

### Style Tier Badge
- Light gray backgrounds
- Matching border colors
- Small, uppercase text
- Rounded corners (20px)

## ✅ Do's
- Use black for all action buttons
- Use amber only for numbers
- Use system fonts
- Maintain 52px minimum button height
- Use Feather icons from @expo/vector-icons

## ❌ Don'ts
- No blue buttons
- No amber buttons
- No "Halloween" orange/black combinations
- No custom fonts
- No emojis in UI (use icons)

## 📱 Icons
- **Primary Set**: Feather icons
- **Size**: 20-24px
- **Implementation**: @expo/vector-icons
- **Examples**: thumbs-up, camera, upload, dollar-sign

---
Last Updated: After issue #100 implementation