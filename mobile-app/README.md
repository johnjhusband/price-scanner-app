# My Thrifting Buddy Mobile App v2.0

React Native application for scanning and valuing secondhand items.

## Features

- **Camera Integration**: Take photos directly in-app
- **Image Picker**: Select from device gallery
- **Paste Support**: Ctrl/Cmd+V to paste images
- **Drag & Drop**: Drag images directly onto the app
- **Real-time Analysis**: AI-powered item valuation
- **Cross-platform**: iOS, Android, and Web support
- **Mac Compatibility**: Fixed clipboard and input issues

## Requirements

- Node.js 16+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app (for mobile testing)

## Installation

```bash
npm install

# CRITICAL for web deployment:
npx expo install react-native-web react-dom @expo/metro-runtime
```

## Development

### Start Development Server
```bash
# All platforms
npx expo start

# Web only
npx expo start --web

# Clear cache
npx expo start -c
```

### Platform-Specific Commands
```bash
# iOS Simulator
npx expo start --ios

# Android Emulator
npx expo start --android

# Web Browser
npx expo start --web
```

## Configuration

### API Endpoint
Edit `App.js` to set your backend URL:
```javascript
const API_URL = 'https://app.flippi.ai/api/scan';
```

### Environment URLs
- Development: http://localhost:3000
- Production: https://app.flippi.ai
- Staging: https://green.flippi.ai
- Dev: https://blue.flippi.ai

## Building for Production

### Web Build
```bash
# Install webpack dependencies
npm install --save-dev @expo/webpack-config

# Build for web
npx expo export:web

# Output will be in dist/ directory
```

### Mobile Builds
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Deployment

### Web Deployment with PM2
```bash
# Build the web version
npx expo export:web

# Serve with PM2
pm2 start "npx serve -s dist -l 8080" --name "frontend-prod"
```

### Environment-Specific Ports
- Production: 8080 (app.flippi.ai)
- Staging: 8081 (green.flippi.ai)
- Development: 8082 (blue.flippi.ai)

## Project Structure

```
mobile-app/
├── App.js              # Main application component
├── app.json            # Expo configuration
├── package.json        # Dependencies
├── dist/               # Web build output
└── assets/             # Images and static files
```

## Key Features Implementation

### Camera Support
```javascript
// Uses expo-image-picker
const result = await ImagePicker.launchCameraAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.Images,
  quality: 0.8,
});
```

### Paste Support (Web)
```javascript
// Listens for paste events
window.addEventListener('paste', handlePaste);
```

### Drag & Drop (Web)
```javascript
// Drag and drop zone with visual feedback
<View onDrop={handleDrop} onDragOver={handleDragOver}>
```

## Testing

### Manual Testing
1. Test camera capture on mobile devices
2. Test image selection from gallery
3. Test paste functionality (Ctrl+V) on web
4. Test drag & drop on web
5. Verify API responses display correctly

### API Integration Test
```bash
# Test with sample image
curl -X POST -F "image=@test.jpg" https://app.flippi.ai/api/scan
```

## Troubleshooting

### Common Issues

1. **"Metro bundler not found"**
   ```bash
   npx expo start -c  # Clear cache
   ```

2. **Web build fails**
   ```bash
   # Ensure web dependencies installed
   npx expo install react-native-web react-dom @expo/metro-runtime
   ```

3. **CORS errors**
   - Check backend CORS configuration
   - Ensure using correct API endpoint

4. **Camera not working**
   - Check app permissions
   - Test on real device (not simulator)

### Mac-Specific Fixes
- Clipboard paste fixed with proper event handling
- Keyboard shortcuts use Cmd instead of Ctrl
- Drag & drop compatibility ensured

## Performance Optimization

1. **Image Compression**: Images resized before upload
2. **Loading States**: Visual feedback during processing
3. **Error Boundaries**: Graceful error handling
4. **Lazy Loading**: Components loaded as needed

## Security Considerations

1. **HTTPS Only**: API calls use secure connections
2. **Input Validation**: File type and size checks
3. **Error Handling**: No sensitive data in error messages
4. **CORS**: Restricted to authorized domains

## Version History

- **v2.0** (Current) - Enhanced UI, paste/drag support, Mac fixes
- **v0.1.0** - Initial MVP with basic camera support

## Future Enhancements

1. Offline support with image queue
2. History of scanned items
3. Batch scanning mode
4. Social sharing features
5. Price tracking over time

## License

Proprietary - All rights reserved