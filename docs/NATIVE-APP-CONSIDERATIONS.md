# Native App Development Considerations

## Current Status
- **Framework**: React Native with Expo (supports iOS, Android, and Web)
- **Problem**: Current code heavily favors web, not optimized for native

## Critical Issues for Native Apps

### 1. Platform-Specific Code Needs Proper Implementation
Current problematic pattern:
```javascript
// BAD - assumes platform = form factor
Platform.OS === 'web' ? webStyle : mobileStyle

// GOOD - proper platform handling
Platform.select({
  ios: iosStyle,
  android: androidStyle,
  web: webStyle
})
```

### 2. Native-Specific Features Not Implemented
- **Camera**: Using web camera API, not native camera
- **Permissions**: No proper permission flows for iOS/Android
- **Storage**: Using localStorage (web-only), not AsyncStorage
- **Navigation**: No native navigation (React Navigation needed)
- **Deep Linking**: Not configured for app URLs

### 3. UI/UX Differences Not Considered

#### iOS Specific:
- Safe areas (notch, home indicator)
- iOS design language (no Material Design)
- iOS gestures (swipe back)
- iOS-specific fonts (SF Pro)

#### Android Specific:
- Back button handling
- Material Design 3 guidelines
- Android-specific permissions
- Different status bar handling

### 4. Missing Native Functionality
- Push notifications
- Biometric authentication
- Native share sheets
- App Store/Play Store optimization
- Offline functionality
- Background tasks

## Required Updates to UX Tickets

### Update Issue #88: Responsive Design
Add:
- Platform.select for iOS/Android specific styles
- Safe area handling for iOS
- Proper status bar spacing
- Native-specific touch feedback

### New Issue #100: Native Navigation Implementation
- React Navigation setup
- Bottom tabs (native style)
- Stack navigation for flows
- Deep linking configuration

### New Issue #101: Native Camera Integration
- expo-camera for native camera
- Proper permission flows
- Native image picker
- Camera roll access

### New Issue #102: Platform-Specific UI
- iOS: Human Interface Guidelines
- Android: Material Design 3
- Platform-specific components
- Native fonts and icons

### New Issue #103: App Store Preparation
- App icons (multiple sizes)
- Splash screens
- Store descriptions
- Screenshots for different devices
- App Store Connect / Play Console setup

## Development Approach

### Phase 1: Fix Web Responsive (current tickets)
- Make web app truly responsive
- Clean up Platform.OS misuse

### Phase 2: Native Foundation
- Proper platform detection
- Native navigation
- Platform-specific styles

### Phase 3: Native Features
- Camera/permissions
- Push notifications
- Native storage

### Phase 4: Store Deployment
- Build configurations
- Store assets
- Beta testing
- Release process

## Testing Requirements
- iPhone (various sizes)
- iPad
- Android phones (various vendors)
- Android tablets
- Physical device testing (not just simulators)

## Code Structure Recommendation
```
/components
  /common          # Shared components
  /ios            # iOS-specific components
  /android        # Android-specific components
  /web            # Web-specific components
```

## Key Decisions Needed
1. Will native apps have feature parity with web?
2. Native-first or web-first design?
3. Tablet support for native apps?
4. Offline functionality requirements?
5. Push notification strategy?