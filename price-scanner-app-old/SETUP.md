# Price Scanner App - Setup Guide

## Prerequisites

Before setting up the Price Scanner app, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** package manager
- **Expo CLI** - Install globally: `npm install -g @expo/cli`
- **OpenAI API Key** - Get one from [OpenAI Platform](https://platform.openai.com/)

For mobile development:
- **Expo Go app** on your phone (iOS/Android)
- Or **Android Studio** / **Xcode** for emulators

## Quick Start

### 1. Backend Setup

```bash
# Navigate to backend directory
cd price-scanner-app/backend

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your OpenAI API key
# OPENAI_API_KEY=your_openai_api_key_here

# Start the backend server
npm start
```

The backend will run on `http://localhost:3000`

### 2. Mobile App Setup

```bash
# Navigate to mobile app directory
cd price-scanner-app/mobile-app

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### 3. Running the App

1. **On Physical Device:**
   - Install Expo Go from App Store/Google Play
   - Scan the QR code from the terminal
   
2. **On Emulator:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)

## Detailed Setup Instructions

### Backend Configuration

1. **Environment Variables** (`.env` file):
```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:19006,exp://localhost:19000
```

2. **Available Scripts:**
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm test           # Run tests (when implemented)
```

3. **API Endpoints:**
- `GET /health` - Health check
- `POST /api/analyze` - Analyze image (multipart form)
- `POST /api/analyze-base64` - Analyze image (base64)

### Mobile App Configuration

1. **API Configuration:**
   - Edit `src/services/apiService.js`
   - Update `API_BASE_URL` for production deployment

2. **Available Scripts:**
```bash
npx expo start              # Start development server
npx expo start --clear      # Start with cleared cache
npx expo build:android      # Build Android APK
npx expo build:ios          # Build iOS IPA
```

## Development Workflow

### Testing the App

1. **Start Backend:**
```bash
cd backend
npm start
```

2. **Start Mobile App:**
```bash
cd mobile-app
npx expo start
```

3. **Test Flow:**
   - Open app on device/emulator
   - Tap "Start Scanning" on home screen
   - Use "Test Analysis" button (camera not fully implemented yet)
   - View results with pricing and condition tips

### Adding Real Camera Functionality

The current camera screen is simplified. To add full camera functionality:

1. Install additional dependencies:
```bash
cd mobile-app
npx expo install expo-camera expo-image-picker
```

2. Update `CameraScreen.js` with actual camera implementation
3. Handle image capture and base64 conversion
4. Send captured images to the backend API

## Deployment

### Backend Deployment (Heroku Example)

1. **Prepare for deployment:**
```bash
cd backend
# Add start script to package.json if not present
```

2. **Deploy to Heroku:**
```bash
heroku create your-app-name
heroku config:set OPENAI_API_KEY=your_key_here
git push heroku main
```

3. **Update mobile app API URL:**
```javascript
// In mobile-app/src/services/apiService.js
const API_BASE_URL = 'https://your-app-name.herokuapp.com/api';
```

### Mobile App Deployment

1. **Build for Production:**
```bash
cd mobile-app
npx expo build:android  # For Android
npx expo build:ios      # For iOS
```

2. **Publish to App Stores:**
   - Follow Expo's guide for app store submission
   - Or use EAS Build for more control

## Troubleshooting

### Common Issues

1. **Backend won't start:**
   - Check if port 3000 is available
   - Verify OpenAI API key is set correctly
   - Check Node.js version (should be 16+)

2. **Mobile app can't connect to backend:**
   - Ensure backend is running on correct port
   - Check API_BASE_URL in apiService.js
   - Verify devices are on same network (for development)

3. **OpenAI API errors:**
   - Verify API key is valid and has credits
   - Check rate limits
   - Ensure proper error handling

### Development Tips

1. **Enable debugging:**
   - Use React Native Debugger
   - Check Expo DevTools
   - Monitor backend logs

2. **Performance optimization:**
   - Optimize image sizes before sending to API
   - Implement caching for repeated requests
   - Add loading states for better UX

## Next Steps

### Planned Features

1. **Enhanced Camera:**
   - Real-time camera preview
   - Image cropping and editing
   - Multiple image capture

2. **Advanced Analysis:**
   - Barcode/QR code scanning
   - Brand recognition improvements
   - Historical price tracking

3. **User Features:**
   - Save analysis history
   - Favorite items
   - Price alerts

4. **Platform Integration:**
   - Direct listing to platforms
   - Price comparison tools
   - Market trend analysis

## Support

For issues or questions:
1. Check this setup guide
2. Review the main README.md
3. Check Expo documentation
4. Review OpenAI API documentation

## License

This project is for educational/personal use. Please respect OpenAI's usage policies and terms of service. 