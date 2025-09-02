# Flippi.ai Development Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Coding Standards](#coding-standards)
6. [Testing](#testing)
7. [Common Development Tasks](#common-development-tasks)
8. [Debugging](#debugging)
9. [Contributing](#contributing)

## Getting Started

### Prerequisites
- Node.js 18.x (use 16.x or 20.x for compatibility testing)
- npm or yarn
- Git
- OpenAI API key
- Expo CLI (`npm install -g expo-cli`)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/johnjhusband/price-scanner-app-coding.git
   cd price-scanner-app-coding
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../mobile-app
   npm install
   npx expo install react-native-web react-dom @expo/metro-runtime
   ```

3. **Configure environment**
   ```bash
   # Create backend/.env
   cd ../backend
   cat > .env << EOF
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=your-session-secret-change-this
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   EOF
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   npm run dev
   
   # Terminal 2: Frontend
   cd mobile-app
   npx expo start --web
   ```

## Development Environment

### Recommended Tools
- **IDE**: VS Code with extensions:
  - ESLint
  - Prettier
  - React Native Tools
  - GitLens
- **API Testing**: Postman or curl
- **Mobile Testing**: Expo Go app
- **Browser**: Chrome with React DevTools

### Environment URLs
- **Local Backend**: http://localhost:3000
- **Local Frontend**: http://localhost:8081
- **Development**: https://blue.flippi.ai
- **Staging**: https://green.flippi.ai
- **Production**: https://app.flippi.ai

## Project Structure

```
price-scanner-app-coding/
├── .github/
│   └── workflows/          # GitHub Actions CI/CD
├── backend/
│   ├── server.js          # Main backend entry
│   ├── routes/            # API routes
│   ├── middleware/        # Express middleware
│   ├── database.js        # SQLite setup
│   └── package.json       # Backend dependencies
├── mobile-app/
│   ├── App.js             # Main frontend entry
│   ├── components/        # React components
│   ├── theme/             # Branding/colors
│   ├── assets/            # Images/icons
│   └── package.json       # Frontend dependencies
├── documentation/         # Consolidated docs
├── docs/                  # Legacy documentation
└── CLAUDE.md             # AI assistant guide
```

## Development Workflow

### Branch Strategy
```
master (production - DO NOT WORK HERE)
  ↑
staging (pre-production testing)
  ↑
develop (main development branch)
  ↑
feature/your-feature (your work)
```

### Standard Workflow

1. **Start from develop**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make changes and commit**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

4. **Push to GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Test on blue.flippi.ai**
   - Push to develop triggers auto-deployment
   - Wait 2-3 minutes for deployment
   - Test at https://blue.flippi.ai

### Commit Message Format
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `style:` Formatting changes
- `chore:` Maintenance tasks

## Coding Standards

### JavaScript/Node.js
```javascript
// Use async/await over callbacks
async function processImage(imageBuffer) {
  try {
    const result = await analyzeImage(imageBuffer);
    return { success: true, data: result };
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error('Failed to process image');
  }
}

// Use const/let, never var
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
let processingCount = 0;

// Descriptive variable names
const userImageBuffer = req.file.buffer;
const analysisResult = await openai.analyze(userImageBuffer);
```

### React Native
```javascript
// Functional components with hooks
const ImageUploader = () => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const handleUpload = async () => {
    setLoading(true);
    try {
      // Upload logic
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Component JSX */}
    </View>
  );
};

// Consistent styling
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: brandColors.white,
  },
});
```

### API Response Format
Always use consistent response structure:
```javascript
// Success
{
  "success": true,
  "data": { /* response data */ }
}

// Error
{
  "success": false,
  "error": "Error message",
  "hint": "Helpful suggestion for user"
}
```

## Testing

### Backend Testing
```bash
cd backend

# Run tests (when implemented)
npm test

# Manual API testing
curl http://localhost:3000/health

# Test image upload
curl -X POST -F "image=@test.jpg" -F "description=vintage jacket" \
  http://localhost:3000/api/scan
```

### Frontend Testing
```bash
cd mobile-app

# Component tests (when implemented)
npm test

# Manual testing checklist:
# [ ] Camera capture works
# [ ] Gallery selection works
# [ ] Paste functionality (Ctrl/Cmd+V)
# [ ] Drag and drop on web
# [ ] Results display correctly
# [ ] Error states handled
```

### Integration Testing
Test the full flow:
1. Open frontend at localhost:8081
2. Upload/capture an image
3. Verify API call succeeds
4. Check response displays correctly
5. Test error scenarios

## Common Development Tasks

### Adding a New API Endpoint

1. **Create route in backend**
   ```javascript
   // backend/routes/newEndpoint.js
   router.post('/api/new-endpoint', async (req, res) => {
     try {
       // Implementation
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ 
         success: false, 
         error: error.message 
       });
     }
   });
   ```

2. **Update frontend to use it**
   ```javascript
   // mobile-app/App.js
   const callNewEndpoint = async (data) => {
     const response = await fetch(`${API_URL}/api/new-endpoint`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data),
     });
     return response.json();
   };
   ```

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update specific package
npm update package-name

# Update all (be careful)
npm update

# After updating, test thoroughly
npm test
npm start
```

### Adding Environment Variables
1. Add to `.env` file
2. Access via `process.env.VARIABLE_NAME`
3. Document in README
4. Add to deployment configs

## Debugging

### Backend Debugging

1. **Enable debug logging**
   ```javascript
   console.log('Processing image:', {
     size: req.file.size,
     mimetype: req.file.mimetype,
     timestamp: new Date().toISOString()
   });
   ```

2. **Check PM2 logs (on server)**
   ```bash
   pm2 logs dev-backend --lines 100
   ```

3. **Use debugger**
   ```javascript
   debugger; // Breakpoint
   // Run with: node --inspect server.js
   ```

### Frontend Debugging

1. **React Native Debugger**
   - Press `d` in Metro bundler
   - Use Chrome DevTools

2. **Console logging**
   ```javascript
   console.log('State updated:', { image, loading, error });
   ```

3. **Network debugging**
   - Check Network tab in Chrome
   - Verify API calls and responses

### Common Issues

#### CORS Errors
- Check backend CORS configuration
- Ensure frontend uses correct API URL
- Verify Nginx passes CORS headers

#### 502 Bad Gateway
- Backend crashed or not running
- Check PM2 status: `pm2 list`
- Review logs: `pm2 logs dev-backend`

#### Build Failures
- Clear caches: `npx expo start -c`
- Delete node_modules and reinstall
- Check for syntax errors in App.js

## Contributing

### Code Review Checklist
- [ ] Code follows style guidelines
- [ ] No hardcoded secrets
- [ ] Error handling implemented
- [ ] API responses follow format
- [ ] Tests added/updated
- [ ] Documentation updated

### Pull Request Process
1. Create feature branch from develop
2. Make changes with clear commits
3. Push to GitHub
4. Create PR to develop (not master!)
5. Wait for review and tests
6. Merge after approval

### Development Best Practices
1. **Test locally first** - Don't rely on blue.flippi.ai
2. **Small, focused commits** - One feature per commit
3. **Document as you go** - Update docs with code
4. **Handle errors gracefully** - User-friendly messages
5. **Optimize images** - Compress before upload
6. **Monitor performance** - Check response times
7. **Security first** - Validate all inputs

### Getting Help
- Check existing documentation
- Search closed GitHub issues
- Review git history for examples
- Test in isolation first
- Ask specific questions with context