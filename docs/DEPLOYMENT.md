# Flippi.ai Deployment Guide

Last Updated: July 26, 2025

## Overview

This is the consolidated deployment documentation for the Flippi.ai application. The app runs on a single DigitalOcean droplet with three environments using PM2 process manager and Nginx.

**Important Changes**: 
- The application now includes Google OAuth authentication
- SQLite database stores both user data and feedback
- JWT tokens for session management

## Server Architecture

```
Single Server (157.245.142.145)
├── Production (app.flippi.ai) 
│   ├── Backend: Port 3000
│   ├── Frontend: Port 8080
│   └── Branch: master
├── Staging (green.flippi.ai)
│   ├── Backend: Port 3001
│   ├── Frontend: Port 8081
│   └── Branch: staging
└── Development (blue.flippi.ai)
    ├── Backend: Port 3002
    ├── Frontend: Port 8082
    └── Branch: develop
```

## Prerequisites

- Ubuntu 24.10 server
- Node.js 18.x
- PM2 (`npm install -g pm2`)
- Nginx
- Git
- SSL certificates (Let's Encrypt)
- OpenAI API key
- Google OAuth credentials
- GitHub SSH deploy key configured

## Environment Configuration

### Backend .env Files

Each environment requires its own `.env` file with OAuth configuration:

```bash
# /var/www/app.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
NODE_ENV=production
DATABASE_PATH=/var/lib/flippi/flippi.db

# OAuth Configuration
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://app.flippi.ai

# /var/www/green.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=staging
DATABASE_PATH=/var/lib/flippi-staging/flippi.db

# OAuth Configuration
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://green.flippi.ai

# /var/www/blue.flippi.ai/backend/.env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3002
NODE_ENV=development
DATABASE_PATH=/var/lib/flippi-dev/flippi.db

# OAuth Configuration
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=https://blue.flippi.ai
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `https://app.flippi.ai/auth/google/callback`
   - `https://green.flippi.ai/auth/google/callback`
   - `https://blue.flippi.ai/auth/google/callback`
6. Copy Client ID and Client Secret to .env files

## Database Information

### SQLite Database

Each environment has its own SQLite database storing users and feedback:

- **Production**: `/var/lib/flippi/flippi.db`
- **Staging**: `/var/lib/flippi-staging/flippi.db`
- **Development**: `/var/lib/flippi-dev/flippi.db`

### Database Schema

```sql
-- Users table (OAuth)
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  googleId TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  lastLoginAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Feedback table
CREATE TABLE feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scanData TEXT NOT NULL,
  userDescription TEXT,
  imageData TEXT,
  rating INTEGER,
  comments TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Important Database Notes

1. **Not in Git**: Database files are in `.gitignore`
2. **Automatic Creation**: Database created on first use
3. **Persistence**: Database files persist between deployments
4. **Permissions**: Must be writable by app user
5. **Backup**: Regular backups recommended

## Automated Deployment (GitHub Actions)

### How It Works

Deployments are triggered automatically when pushing to specific branches:

- `develop` branch → blue.flippi.ai
- `staging` branch → green.flippi.ai  
- `master` branch → app.flippi.ai

### GitHub Actions Workflow

The deployment workflow:

1. Connects to server via SSH
2. Resets local changes
3. Pulls latest code
4. Installs dependencies (including passport)
5. Builds frontend with Expo
6. Restarts PM2 services
7. Reloads Nginx

### For Developers

1. **Work in develop branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Make changes and push**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin develop
   ```

3. **Deployment happens automatically**

## Manual Deployment Process

If automated deployment fails:

### 1. SSH to Server
```bash
ssh root@157.245.142.145
```

### 2. Navigate to Environment
```bash
cd /var/www/blue.flippi.ai    # Development
# OR
cd /var/www/green.flippi.ai   # Staging
# OR
cd /var/www/app.flippi.ai     # Production
```

### 3. Update Code
```bash
git reset --hard HEAD
git clean -fd
git pull origin [branch-name]
```

### 4. Install Dependencies
```bash
# Backend (includes passport dependencies)
cd backend
npm install --production

# Frontend
cd ../mobile-app
npm install
```

### 5. Database Setup (First Time Only)
```bash
# Create database directory
sudo mkdir -p /var/lib/flippi-dev
sudo chown www-data:www-data /var/lib/flippi-dev

# Database auto-creates on first use
```

### 6. Build Frontend
```bash
npx expo export --platform web --output-dir dist
```

### 7. Restart Services
```bash
# Development
pm2 restart dev-backend dev-frontend

# Staging
pm2 restart staging-backend staging-frontend

# Production
pm2 restart prod-backend prod-frontend
```

### 8. Reload Nginx
```bash
nginx -s reload
```

## PM2 Configuration

Services are configured in `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'dev-backend',
      script: './backend/server.js',
      cwd: '/var/www/blue.flippi.ai',
      env: {
        NODE_ENV: 'development',
        PORT: 3002
      }
    },
    {
      name: 'dev-frontend',
      script: 'npx',
      args: 'serve -s /var/www/blue.flippi.ai/mobile-app/dist -l 8082',
      cwd: '/var/www/blue.flippi.ai/mobile-app'
    }
  ]
};
```

### Common PM2 Commands

```bash
pm2 list                    # View all services
pm2 logs [service-name]     # View logs
pm2 restart [service-name]  # Restart service
pm2 show [service-name]     # Show service details
pm2 monit                   # Real-time monitoring
```

## Nginx Configuration

Each domain config includes OAuth and legal page routes:

```nginx
server {
    server_name blue.flippi.ai;
    
    # Backend API routes
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }
    
    # OAuth routes
    location /auth {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3002;
    }
    
    # Legal pages
    location = /terms {
        alias /var/www/blue.flippi.ai/mobile-app/terms.html;
    }
    
    location = /privacy {
        alias /var/www/blue.flippi.ai/mobile-app/privacy.html;
    }
    
    # Frontend catch-all
    location / {
        root /var/www/blue.flippi.ai/mobile-app/dist;
        try_files $uri /index.html;
    }
    
    # SSL configuration
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/blue.flippi.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/blue.flippi.ai/privkey.pem;
}
```

## Dependencies

### Backend Dependencies
```json
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "openai": "^4.47.1",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0"
  }
}
```

## Troubleshooting

### OAuth Login Not Working

1. **Check OAuth credentials**:
   ```bash
   cat /var/www/blue.flippi.ai/backend/.env | grep GOOGLE
   ```

2. **Verify callback URLs** in Google Console match environment

3. **Check JWT secret** is set:
   ```bash
   cat /var/www/blue.flippi.ai/backend/.env | grep JWT_SECRET
   ```

4. **Test OAuth endpoint**:
   ```bash
   curl https://blue.flippi.ai/auth/google -I
   ```

### Backend 502 Error

1. **Check PM2 status**:
   ```bash
   pm2 show dev-backend
   pm2 logs dev-backend --lines 50
   ```

2. **Verify all env variables**:
   ```bash
   cat /var/www/blue.flippi.ai/backend/.env
   ```

3. **Check passport initialization**:
   ```bash
   pm2 logs dev-backend | grep passport
   ```

### Database Issues

1. **Check database exists**:
   ```bash
   ls -la /var/lib/flippi-dev/flippi.db
   ```

2. **Check permissions**:
   ```bash
   ls -ld /var/lib/flippi-dev
   # Should be writable by www-data
   ```

3. **View database content**:
   ```bash
   sqlite3 /var/lib/flippi-dev/flippi.db
   .tables
   SELECT COUNT(*) FROM users;
   .quit
   ```

### Frontend Shows Old Content

1. **Clear PM2 cache**:
   ```bash
   pm2 restart dev-frontend --update-env
   ```

2. **Verify build completed**:
   ```bash
   ls -la /var/www/blue.flippi.ai/mobile-app/dist/
   ```

3. **Force rebuild**:
   ```bash
   cd /var/www/blue.flippi.ai/mobile-app
   rm -rf dist
   npx expo export --platform web --output-dir dist
   ```

## Security Considerations

1. **Environment Variables**:
   - Never commit .env files
   - Use strong JWT_SECRET (min 32 chars)
   - Rotate OAuth credentials periodically

2. **Database Security**:
   - Regular backups
   - Restricted file permissions
   - No direct internet access

3. **HTTPS Only**:
   - All OAuth callbacks use HTTPS
   - Secure cookies in production

4. **Dependencies**:
   ```bash
   npm audit
   npm audit fix
   ```

## Backup and Recovery

### Database Backup
```bash
# Automated daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
cp /var/lib/flippi/flippi.db /backup/flippi-prod-$DATE.db
cp /var/lib/flippi-staging/flippi.db /backup/flippi-staging-$DATE.db
cp /var/lib/flippi-dev/flippi.db /backup/flippi-dev-$DATE.db

# Keep only last 7 days
find /backup -name "flippi-*.db" -mtime +7 -delete
```

### Configuration Backup
```bash
# Backup all .env files
tar -czf /backup/env-files-$(date +%Y%m%d).tar.gz \
  /var/www/*/backend/.env

# Backup nginx configs
cp -r /etc/nginx/sites-available /backup/nginx-$(date +%Y%m%d)
```

## Quick Reference

### Environment URLs
- Production: https://app.flippi.ai
- Staging: https://green.flippi.ai
- Development: https://blue.flippi.ai

### Service Ports
- Production: Backend 3000, Frontend 8080
- Staging: Backend 3001, Frontend 8081
- Development: Backend 3002, Frontend 8082

### Common Issues & Solutions
- **"Authentication required"**: User needs to log in via Google
- **502 Error**: Backend crashed - check PM2 logs
- **OAuth redirect error**: Check callback URLs in Google Console
- **"Analysis Failed"**: Check OpenAI API key
- **Database locked**: Too many concurrent writes - implement retry logic

### Required Environment Variables
```bash
# API Keys
OPENAI_API_KEY=sk-...

# OAuth
JWT_SECRET=random-32-char-string
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
FRONTEND_URL=https://[domain]

# Database
DATABASE_PATH=/var/lib/flippi[-env]/flippi.db

# Server
PORT=300X
NODE_ENV=production|staging|development
```

## Monitoring

### Health Checks
```bash
# All environments
curl https://app.flippi.ai/health
curl https://green.flippi.ai/health
curl https://blue.flippi.ai/health
```

### User Activity
```bash
# Check recent logins
sqlite3 /var/lib/flippi/flippi.db \
  "SELECT email, lastLoginAt FROM users ORDER BY lastLoginAt DESC LIMIT 10;"

# Count total users
sqlite3 /var/lib/flippi/flippi.db \
  "SELECT COUNT(*) as total_users FROM users;"
```

## Future Improvements

1. **OAuth Providers**: Add Facebook, Apple Sign-In
2. **Session Management**: Redis for scalability
3. **Rate Limiting**: Implement per-user limits
4. **Analytics**: Track user engagement
5. **Automated Testing**: Jest for API tests
6. **CI/CD Pipeline**: Automated testing before deploy

## Support

For deployment issues:
1. Check PM2 logs first
2. Verify all environment variables
3. Test OAuth flow manually
4. Check GitHub Actions logs
5. Email: teamflippi@gmail.com