# Blue Environment Setup

## 📍 Server Details
- **IP**: 137.184.24.201
- **URL**: https://blue.flippi.ai
- **Branch**: develop
- **Deploy**: Automatic on push

## 🏗️ Architecture
- **Backend**: Node.js/Express on port 3002
- **Frontend**: React Native Web (Expo)
- **Process Manager**: PM2
- **Web Server**: Nginx
- **Database**: SQLite

## 📁 Directory Structure
```
/var/www/blue.flippi.ai/
├── backend/          # API server
├── mobile-app/       # Frontend
│   └── dist/        # Built files
├── scripts/         # Deployment scripts
└── nginx-templates/ # Nginx configs
```

## 🔄 Recent Changes
- Sept 2025: Rebuilt from scratch on new server
- Clean architecture following new principles
- Added "Building Blue!" indicator

## 🚧 Testing Changes
1. Make changes in `/Users/flippi/Documents/FlippiMaster/price-scanner-app`
2. Push to develop branch
3. Watch deployment at: https://github.com/johnjhusband/price-scanner-app/actions
4. Verify at: https://blue.flippi.ai

[[Troubleshooting]]