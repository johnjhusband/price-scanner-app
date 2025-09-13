# Development Workflow

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- npm or yarn
- Access to FlippiMaster repository

### Initial Setup
```bash
# Navigate to clean working directory
cd /Users/flippi/Documents/FlippiMaster/price-scanner-app

# Install dependencies
npm install

# Create .env file (if needed)
cp .env.example .env
```

## 📝 Development Process

### 1. Start from Clean Branch
```bash
# Ensure you're on develop
git checkout develop

# Pull latest changes
git pull origin develop

# Create feature branch (optional)
git checkout -b feature/your-feature
```

### 2. Make Changes
- Edit files in `mobile-app/` for frontend
- Edit files in `backend/` for API
- Test locally before committing
- Follow [[Coding-Practices]]

### 3. Local Testing
```bash
# Run development server
npm run dev

# Open browser to http://localhost:3000
```

### 4. Commit Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature"

# Push to develop
git push origin develop
```

## 🔄 Deployment Flow

```
Local Changes → Push to GitHub → GitHub Actions → Auto Deploy
```

### Branch Mapping
- `develop` → blue.flippi.ai (Dev)
- `staging` → green.flippi.ai (Staging)
- `master` → app.flippi.ai (Production)

## ✅ Best Practices

### Code Standards
- Use meaningful commit messages
- Follow existing code style
- Test before pushing
- See [[Coding-Practices]] for detailed rules

### Testing Checklist
- [ ] Feature works locally
- [ ] No console errors
- [ ] Mobile responsive
- [ ] API endpoints tested
- [ ] Database migrations run

## 🚫 What NOT to Do

- ❌ Never SSH to servers directly
- ❌ Never edit files on server
- ❌ Never commit sensitive data
- ❌ Never force push to main branches
- ❌ Never skip testing

## 📱 Mobile App Development

### React Native Components
```javascript
// Always check platform
{Platform.OS === 'web' && (
  <WebOnlyComponent />
)}

// Environment-specific features
{window.location.hostname === 'blue.flippi.ai' && (
  <BlueEnvironmentFeature />
)}
```

### Building for Web
```bash
# Build web version
npm run build:web

# Output in mobile-app/dist/
```

## 🔗 Related Pages

[[Architecture]] | [[Deployment-Guide]] | [[Troubleshooting]] | [[Coding-Practices]]