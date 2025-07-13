# V2.0 Integration Plan for Green Environment

## Backend Integration (✓ Complete)
File: `green/backend/server-integrated.js`

### Features Added:
1. **Enhanced file validation** - Only allows image files, 10MB limit
2. **Request timing middleware** - Tracks processing time
3. **Enhanced health endpoint** - Version info and feature flags
4. **Better error messages** - User-friendly hints
5. **Enhanced AI prompt** - New fields:
   - authenticity_score (0-100%)
   - boca_score (0-100)
   - market_insights
   - selling_tips
   - brand_context
   - seasonal_notes
6. **Processing metadata** in response
7. **Error handling middleware**

## Frontend Integration (Pending)
File: `green/mobile-app/App.js`

### Features to Add:

#### 1. Desktop Camera Support
- Add `checkCameraAvailability()` function
- Check for videoinput devices on web platform
- Show camera button on desktop if camera available

#### 2. Drag & Drop Support
- Add state: `isDragOver`
- Add handlers: `handleDragOver`, `handleDragLeave`, `handleDrop`
- Add `processImageFile()` to handle dropped files
- Style the upload area with drag-over state

#### 3. Paste Support (Ctrl+V)
- Add `handlePaste` event listener
- Extract image from clipboard
- Process pasted images

#### 4. Enhanced UI
- ChatGPT-style upload area
- Drag & drop visual feedback
- Better button styling
- Enhanced results display

#### 5. New Score Displays
- Color-coded authenticity score
- Boca score with trend indicators
- Expandable details section for insights

### Key Functions to Add:

```javascript
// Desktop camera check
const checkCameraAvailability = async () => {
  if (Platform.OS !== 'web') return;
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasVideoDevice = devices.some(device => device.kind === 'videoinput');
    setHasCamera(hasVideoDevice);
  } catch (error) {
    console.log('Camera check failed:', error);
    setHasCamera(false);
  }
};

// Paste handler
const handlePaste = (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;
  for (let item of items) {
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) {
        processImageFile(file);
      }
      break;
    }
  }
};

// Process file (for drag/drop and paste)
const processImageFile = (file) => {
  if (!file.type.startsWith('image/')) {
    Alert.alert('Error', 'Please select an image file');
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    setImage(event.target.result);
    analyzeImage(event.target.result);
  };
  reader.readAsDataURL(file);
};
```

### State Variables to Add:
- `hasCamera` - whether desktop camera is available
- `isDragOver` - drag & drop visual state
- `showDetails` - expandable details section

### Important Fixes to Keep from Blue:
- Working `pickImage` function without `input.capture`
- CORS fixes
- Android TouchableOpacity compatibility
- Working camera component

## Next Steps:
1. Review `green/backend/server-integrated.js`
2. If backend looks good, replace `server.js` with it
3. Create integrated `App.js` with all frontend features
4. Test thoroughly before deployment