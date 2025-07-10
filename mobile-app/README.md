# My Thrifting Buddy Frontend

React Native app for scanning items and getting resale price estimates.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the app:
   ```bash
   # For web
   npm run web
   
   # For iOS
   npm run ios
   
   # For Android  
   npm run android
   ```

## Features

- **Web**: File picker for image selection
- **Mobile**: Camera integration for photo capture
- Displays price analysis from backend API

## Configuration

The app expects the backend to be running at:
- Web: `http://localhost:3000`
- iOS Simulator: `http://localhost:3000`
- Android Emulator: `http://10.0.2.2:3000`

## Building for Web

```bash
npx expo export --platform web --output-dir dist
```

The `dist` folder can then be served by any static web server.