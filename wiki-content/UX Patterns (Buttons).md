# UX Patterns (Buttons)

## 🔘 Button Design System

### Overview

Consistent button patterns across the Flippi platform ensure a cohesive user experience. All buttons follow accessibility guidelines and platform-specific best practices.

## 🎨 Button Types

### Primary Button (BrandButton)
- **Use**: Main actions (Sign In, Analyze, Submit)
- **Style**: Black background, white text
- **Example**: "Make 📸 Beautiful! ✨"

### Secondary Button
- **Use**: Secondary actions
- **Style**: White background, black border
- **Example**: "Cancel", "Skip"

### Accent Button
- **Use**: Promotional or special actions
- **Style**: Brand purple (#6A4DFF)
- **Example**: "Upgrade to Pro"

### Ghost Button
- **Use**: Tertiary actions
- **Style**: Transparent with text only
- **Example**: "Learn More"

### Outline Button
- **Use**: Alternative actions
- **Style**: Border only, no fill
- **Example**: "Upload Photo"

## 📏 Design Specifications

### Sizing
- **Height**: 52px (mobile), 48px (web)
- **Min Width**: 140px
- **Padding**: 16px horizontal, 12px vertical
- **Border Radius**: 12px

### Typography
- **Font**: System default (SF Pro, Roboto)
- **Size**: 16px (mobile), 14px (web)
- **Weight**: 600 (semi-bold)
- **Letter Spacing**: 0.5px

### Touch Targets
- **Minimum**: 44x44pt (iOS), 48x48dp (Android)
- **Spacing**: 8px minimum between buttons
- **Active Area**: Extends 8px beyond visual bounds

## 🎯 States

### Default State
- Full opacity
- Normal colors
- Cursor pointer (web)

### Hover State (Web Only)
- 10% darker background
- Transition: 200ms ease
- Scale: 1.02

### Active/Pressed State
- Opacity: 0.8
- Scale: 0.98
- No delay on touch

### Disabled State
- Opacity: 0.5
- No hover effects
- Cursor: not-allowed

### Loading State
- Show spinner
- Disable interactions
- Keep button size stable

## 🔧 Implementation

### React Native Component
```javascript
<BrandButton
  variant="primary"
  onPress={handlePress}
  disabled={isLoading}
  icon={<CameraIcon />}
>
  Take Photo
</BrandButton>
```

### Platform Differences
- **iOS**: Uses system haptics on press
- **Android**: Shows ripple effect
- **Web**: Hover states and focus rings

## ♿ Accessibility

### Requirements
- **ARIA labels**: Descriptive action text
- **Color contrast**: 4.5:1 minimum
- **Focus indicators**: Visible keyboard navigation
- **Screen reader**: Announces state changes

### Best Practices
- Use semantic button elements
- Provide text alternatives for icons
- Ensure keyboard operability
- Test with screen readers

## 📱 Platform-Specific Patterns

### iOS Patterns
- Respect system button styles
- Use SF Symbols for icons
- Follow Human Interface Guidelines

### Android Patterns
- Material Design elevation
- Ripple effects on touch
- Follow Material Guidelines

### Web Patterns
- Hover and focus states
- Keyboard shortcuts where appropriate
- Progressive enhancement

## 🎯 Common Patterns

### Button Groups
- Equal width buttons in groups
- 8px spacing between buttons
- Stack vertically on small screens

### Call-to-Action (CTA)
- One primary CTA per screen
- Place in thumb-friendly zones
- Use action-oriented text

### Icon Buttons
- 24x24px icons
- 48x48px touch target
- Optional text labels

## 🚨 Common Issues

### Issue: Buttons Not Responding
- Check disabled state
- Verify z-index
- Test touch target size

### Issue: Inconsistent Styling
- Use BrandButton component
- Check variant prop
- Verify theme provider

### Issue: Poor Contrast
- Test in light/dark modes
- Use contrast checker tools
- Follow WCAG guidelines

## 📝 Button Text Guidelines

### Do's
- ✅ Use action verbs: "Sign In", "Upload"
- ✅ Be concise: 2-3 words max
- ✅ Be specific: "Delete Photo" not "Delete"

### Don'ts
- ❌ Don't use "Click here"
- ❌ Avoid technical jargon
- ❌ Don't use all caps (except CTAs)

## 🔗 Related Pages

- [[Architecture]] - Component structure
- [[Development-Workflow]] - Implementation guide
- [[Common-Issues]] - Troubleshooting

[[Home]] | [[Admin Dashboard]] | [[Tech Stack]]