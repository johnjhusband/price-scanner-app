# Buttons Not Working

## 🔘 Troubleshooting Button Issues

### Button Doesn't Respond to Taps/Clicks

#### 1. Check If Button is Disabled
Some buttons are disabled until certain conditions are met:
- **"Analyze" button** - Disabled until an image is selected
- **"Sign In" button** - May be disabled during loading
- Look for grayed-out appearance (50% opacity)

#### 2. Clear Cache and Reload
**Web (blue.flippi.ai, app.flippi.ai):**
- Mac: Cmd + Shift + R
- Windows: Ctrl + Shift + R
- Mobile: Pull down to refresh

**Mobile App:**
- Close app completely
- Reopen app

#### 3. Check Internet Connection
Buttons may not work if:
- No internet connection
- Slow connection causing timeouts
- Server temporarily unavailable

### Platform-Specific Issues

#### iOS Issues
- **Small buttons**: Ensure you're tapping the center
- **3D Touch**: Try a normal tap instead of force touch
- **Update iOS**: Some older versions have touch issues

#### Android Issues  
- **Overlay apps**: Close apps that create overlays (screen filters, etc.)
- **Developer options**: Disable "Show taps" if enabled
- **Touch sensitivity**: Check display settings

#### Web Browser Issues
- **Pop-up blockers**: May block Google Sign-In
- **JavaScript disabled**: Enable JavaScript in browser settings
- **Browser extensions**: Try incognito/private mode
- **Old browser**: Update to latest version

### Specific Button Problems

#### "Sign in with Google" Not Working
1. Check pop-up blocker isn't blocking Google
2. Clear cookies for accounts.google.com
3. Try different browser
4. Disable ad blockers temporarily

#### "Take Photo" Button Issues (Mobile)
1. Grant camera permissions in Settings
2. Close other camera apps
3. Restart device if camera frozen

#### "Upload Photo" Not Opening Gallery
1. Grant photo library permissions
2. Check storage isn't full
3. Try selecting from "Files" instead

#### Analyze Button Stays Disabled
1. Ensure image fully uploaded (check for spinner)
2. Image may be too large (>10MB)
3. Try a different image format (JPG, PNG)

### Visual Feedback Issues

Buttons should show:
- **Slight fade** when pressed (80% opacity)
- **Shadow** on primary buttons
- **Color change** on hover (web only)

If missing:
- Hard refresh the page
- Update the app
- Report as visual bug

### Emergency Fixes

#### Nothing Works?
1. **Force quit** app and restart
2. **Sign out** and sign back in
3. **Reinstall** app (mobile)
4. **Try different device** to isolate issue

#### Web Specific
```javascript
// Open browser console (F12) and run:
localStorage.clear();
location.reload();
```

## 🐛 Reporting Button Bugs

If buttons still not working:

1. Note which button (exact text)
2. What platform (iOS/Android/Web)
3. What happens when pressed (nothing/error/wrong action)
4. Screenshot if possible
5. Email: support@flippi.ai

### Known Issues Being Fixed
- None currently - buttons should be working on all platforms

[[Home]] | [[Common-Issues]] | [[Troubleshooting]]