# Native-Ready Development Checklist

## Goal: Build for web now, but don't block native apps later

### ✅ DO's for This Release

#### 1. Use Dimensions API Instead of Platform.OS for Layout
```javascript
// ✅ GOOD - Works for web now, native later
const { width } = Dimensions.get('window');
const isMobile = width < 768;

// ❌ BAD - Will break native apps
const isMobile = Platform.OS !== 'web';
```

#### 2. Keep Platform-Specific Code Isolated
```javascript
// ✅ GOOD - Easy to extend later
const storageService = {
  save: async (key, value) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    }
    // TODO: Add AsyncStorage for native
  }
};

// ❌ BAD - Scattered throughout code
localStorage.setItem('key', value); // Web only!
```

#### 3. Use React Native Components
```javascript
// ✅ GOOD - Works on all platforms
import { View, Text, TouchableOpacity } from 'react-native';

// ❌ BAD - Web only
<div> <span> <button>
```

#### 4. Structure Styles for Future Platform Specifics
```javascript
// ✅ GOOD - Ready for platform styles
const styles = StyleSheet.create({
  container: {
    padding: 16, // Works everywhere
    ...Platform.select({
      web: { maxWidth: 1200 },
      // ios: { ... } // Easy to add later
      // android: { ... }
    })
  }
});
```

#### 5. Abstract Third-Party Services
```javascript
// ✅ GOOD - Easy to swap implementations
const CameraService = {
  capture: async () => {
    if (Platform.OS === 'web') {
      // Current web implementation
    }
    // TODO: Native camera later
  }
};
```

### ❌ DON'Ts for This Release

1. **Don't use web-only APIs directly**
   - No direct `window.` or `document.` calls
   - No direct `localStorage` calls
   - No inline styles with web-only units (vh, vw)

2. **Don't assume Platform.OS correlates with device type**
   - Platform.OS === 'web' doesn't mean desktop
   - Future: Platform.OS === 'ios' could be iPad

3. **Don't hardcode navigation**
   - Keep navigation centralized
   - Will need React Navigation later

4. **Don't use web-specific image handling**
   - Use React Native Image component
   - Prepare for native image caching

### 🎯 Priority Changes for Current Release

1. **Issue #88: Replace Platform.OS with Dimensions** ✅
   - This is the MOST important change
   - Prevents major refactoring later

2. **Abstract Storage** (Quick win)
   ```javascript
   // services/storage.js
   export default {
     get: (key) => localStorage.getItem(key),
     set: (key, value) => localStorage.setItem(key, value),
     remove: (key) => localStorage.removeItem(key)
   };
   ```

3. **Centralize Camera Logic** (Moderate effort)
   - Move camera code to separate service
   - Makes native camera swap easier

4. **Use StyleSheet.create()** (Already doing ✅)
   - Continue using React Native styling
   - Avoid inline styles

### 📋 Quick Audit Checklist

Run these searches to find potential issues:

```bash
# Find direct web API usage
grep -r "window\." --include="*.js"
grep -r "document\." --include="*.js"
grep -r "localStorage" --include="*.js"

# Find Platform.OS layout decisions
grep -r "Platform\.OS.*?.*:" --include="*.js"

# Find web-only HTML elements
grep -r "<div\|<span\|<button" --include="*.js"
```

### 🚀 Future-Proofing Tips

1. **Comment TODOs for native**
   ```javascript
   // TODO: Native - Add AsyncStorage
   // TODO: Native - Handle Android back button
   // TODO: Native - Add push notifications
   ```

2. **Keep services modular**
   - One service per feature
   - Easy to swap implementations

3. **Test on mobile browsers**
   - Chrome mobile ≈ Android WebView
   - Safari mobile ≈ iOS WebView

### ✨ The Good News

- Expo React Native is already set up ✅
- Most components are React Native ✅
- StyleSheet.create() is used ✅
- Just need to fix Platform.OS usage and abstract web APIs

### 🎯 Minimum Changes for Native-Ready

1. **Fix Issue #88** (Platform.OS → Dimensions)
2. **Abstract localStorage** (30 min task)
3. **Keep camera code isolated** (already mostly done)
4. **Document web-only code** (add TODO comments)

This approach ensures you can ship to web now while making native apps a smooth addition later, not a rewrite!