# Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   GitHub Repo   │────▶│ GitHub Actions  │────▶│    Servers      │
│ price-scanner   │     │   Workflows     │     │ Blue/Green/Prod │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🔧 Tech Stack

### Frontend
- **Framework**: React Native (Expo)
- **Web Build**: React Native Web
- **State Management**: React Context API
- **Styling**: StyleSheet (React Native)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: SQLite
- **Process Manager**: PM2
- **Web Server**: Nginx

### Infrastructure
- **Hosting**: DigitalOcean Droplets
- **CI/CD**: GitHub Actions
- **Monitoring**: PM2 ecosystem
- **SSL**: Let's Encrypt

## 📁 Repository Structure

```
price-scanner-app/
├── .github/workflows/     # Deployment automation
├── backend/              # Express API server
│   ├── server.js        # Main server file
│   └── database/        # SQLite files
├── mobile-app/          # React Native app
│   ├── App.js          # Main app component
│   ├── dist/           # Web build output
│   └── package.json    # Dependencies
├── scripts/             # Deployment scripts
└── nginx-templates/     # Server configs
```

## 🔄 Data Flow

1. **User Action** → React Native App
2. **API Call** → Express Backend (port 3002)
3. **Database** → SQLite operations
4. **Response** → JSON back to frontend
5. **UI Update** → React state update

## 🚀 Deployment Pipeline

```
Developer → Git Push → GitHub Actions → Server Update
```

- No manual SSH deployments
- Automated builds and deployments
- Environment-specific workflows

## 🔒 Security

- API authentication tokens
- HTTPS only (SSL certificates)
- Environment variables for secrets
- No hardcoded credentials

[[Development-Workflow]] | [[API-Documentation]]