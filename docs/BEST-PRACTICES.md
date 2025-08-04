# Flippi.ai Best Practices Guide

This document consolidates all development, operational, and engineering best practices for the Flippi.ai project.

## Table of Contents
1. [Development Best Practices](#development-best-practices)
2. [Code Quality Standards](#code-quality-standards)
3. [Testing Best Practices](#testing-best-practices)
4. [Security Best Practices](#security-best-practices)
5. [Performance Guidelines](#performance-guidelines)
6. [DevOps & Operations](#devops--operations)
7. [API Design Standards](#api-design-standards)
8. [Frontend Best Practices](#frontend-best-practices)
9. [Documentation Standards](#documentation-standards)
10. [Git Workflow](#git-workflow)

## Development Best Practices

### Core Principles
1. **Test locally first** - Don't rely solely on deployment environments
2. **Small, focused commits** - One feature or fix per commit
3. **Document as you go** - Update docs alongside code changes
4. **Handle errors gracefully** - Provide user-friendly error messages
5. **Security first** - Validate all inputs, sanitize outputs
6. **Performance matters** - Monitor response times and resource usage

### Development Workflow
1. Start from `develop` branch
2. Create feature branches (`feature/your-feature`)
3. Test thoroughly before pushing
4. Push to GitHub to trigger auto-deployment
5. Verify on blue.flippi.ai before merging

### Environment Variables
```bash
# Always use .env files, never hardcode
OPENAI_API_KEY=your_key_here
SESSION_SECRET=secure_random_string
GOOGLE_CLIENT_ID=oauth_client_id
GOOGLE_CLIENT_SECRET=oauth_client_secret
```

## Code Quality Standards

### Naming Conventions
```javascript
// Functions: verb + noun
async function validateUser(userId) { }
function calculateTotal(items) { }

// Variables: descriptive nouns
const userProfile = { };
const itemCount = 10;

// Constants: SCREAMING_SNAKE_CASE
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10MB
const API_TIMEOUT = 30000; // 30 seconds

// React Components: PascalCase
const ImageUploader = () => { };
const ResultsDisplay = () => { };
```

### JavaScript/Node.js Standards
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
const MAX_FILE_SIZE = 10 * 1024 * 1024;
let processingCount = 0;

// Early returns for cleaner code
function validateInput(data) {
  if (!data) return false;
  if (!data.image) return false;
  return true;
}
```

### React Native Standards
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
    backgroundColor: brandColors.offWhite,
  },
});
```

### Function Guidelines
- Single responsibility - one function, one job
- Maximum 50 lines per function
- Maximum 3 parameters (use object for more)
- Always handle errors explicitly
- Return early for edge cases

## Testing Best Practices

### Testing Philosophy
1. **Shift Left**: Test early in development
2. **Automate Everything**: If you test it twice, automate it
3. **Fail Fast**: Quick feedback prevents costly fixes
4. **Test in Production**: Monitor real user experiences
5. **Environment Parity**: Dev → Staging → Production

### Testing Pyramid
```
         /\
        /  \     E2E Tests (10%)
       /    \    - Critical user journeys
      /      \   - Playwright tests
     /--------\
    /          \ Integration Tests (30%)
   /            \ - API endpoint tests
  /              \ - Component integration
 /----------------\
/                  \ Unit Tests (60%)
                    - Business logic
                    - Component tests
```

### Test Structure
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com' };
      
      // Act
      const user = await userService.createUser(userData);
      
      // Assert
      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
    });
    
    it('should throw error for duplicate email', async () => {
      // Test error scenarios
    });
  });
});
```

### API Testing
```javascript
// Test all endpoints
describe('API Endpoints', () => {
  test('GET /health returns 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
  });

  test('POST /api/scan requires image', async () => {
    const response = await request(app).post('/api/scan');
    expect(response.status).toBe(400);
  });
});
```

## Security Best Practices

### Authentication & Authorization
- Use Google OAuth 2.0 for user authentication
- Store JWT tokens in HTTPOnly cookies
- Implement proper session management
- Set appropriate token expiration times

### Input Validation
```javascript
// Always validate user input
const { body, validationResult } = require('express-validator');

router.post('/api/feedback',
  body('feedback').isString().trim().isLength({ min: 1, max: 1000 }),
  body('rating').isInt({ min: 1, max: 5 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Process valid input
  }
);
```

### File Upload Security
- Validate MIME types
- Check file extensions
- Limit file size (10MB max)
- Sanitize filenames
- Store files outside web root
- Use virus scanning for production

### API Security
- Implement rate limiting
- Use CORS appropriately
- Add security headers (Helmet.js)
- Validate all inputs
- Sanitize all outputs
- Log security events

## Performance Guidelines

### Backend Optimization
- Use connection pooling for databases
- Implement response caching where appropriate
- Compress responses with gzip
- Optimize images before storage
- Use pagination for large datasets
- Monitor memory usage

### Frontend Optimization
- Lazy load components
- Optimize images before upload
- Implement virtual scrolling for lists
- Use React.memo for expensive components
- Minimize re-renders
- Cache API responses appropriately

### OpenAI API Optimization
- Use GPT-4o-mini for cost efficiency
- Implement caching for similar requests
- Minimize prompt length
- Batch requests when possible
- Monitor token usage

## DevOps & Operations

### PM2 Best Practices

#### Process Management
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'prod-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log'
  }]
};
```

#### Log Rotation
```bash
# Install and configure
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

#### Zero-Downtime Deployments
```bash
# Graceful reload
pm2 reload prod-backend

# Update environment variables
pm2 restart prod-backend --update-env
```

### Nginx Configuration
- Enable gzip compression
- Configure proper timeouts
- Implement security headers
- Use SSL/TLS best practices
- Monitor access logs

### Monitoring
- Set up health check endpoints
- Monitor process memory and CPU
- Track API response times
- Set up alerts for failures
- Log all errors comprehensively

## API Design Standards

### RESTful Principles
- Use proper HTTP methods (GET, POST, PUT, DELETE)
- Return appropriate status codes
- Version your API (/api/v1/)
- Use consistent naming conventions
- Document all endpoints

### Response Format
```javascript
// Success response
{
  "success": true,
  "data": {
    "item_name": "Vintage Jacket",
    "price_range": "$50-75"
  }
}

// Error response
{
  "success": false,
  "error": "Invalid image format",
  "hint": "Please upload a JPEG or PNG image"
}
```

### Error Handling
```javascript
// Consistent error responses
class AppError extends Error {
  constructor(message, statusCode, hint) {
    super(message);
    this.statusCode = statusCode;
    this.hint = hint;
  }
}

// Usage
throw new AppError('Image too large', 413, 'Please use an image under 10MB');
```

## Frontend Best Practices

### Component Structure
- Keep components small and focused
- Use functional components with hooks
- Implement proper error boundaries
- Handle loading states gracefully
- Optimize for mobile first

### State Management
- Use React hooks for local state
- Implement proper data flow
- Avoid unnecessary re-renders
- Cache API responses
- Handle offline scenarios

### UI/UX Guidelines
- Follow brand guidelines strictly
- Ensure WCAG accessibility compliance
- Test on multiple devices
- Implement proper loading indicators
- Provide clear error messages

## Documentation Standards

### Code Documentation
```javascript
/**
 * Processes and analyzes uploaded image
 * @param {Buffer} imageBuffer - Raw image data
 * @param {string} description - Optional user description
 * @returns {Promise<Object>} Analysis results
 * @throws {ValidationError} If image is invalid
 */
async function analyzeImage(imageBuffer, description) {
  // Implementation
}
```

### README Updates
- Keep README current with changes
- Document all environment variables
- Include setup instructions
- Add troubleshooting section
- Maintain changelog

### API Documentation
- Document all endpoints
- Include request/response examples
- List possible error codes
- Specify rate limits
- Update with version changes

## Git Workflow

### Branch Strategy
```
master (production) → app.flippi.ai
├── staging (pre-production) → green.flippi.ai
│   └── develop (main development) → blue.flippi.ai
│       ├── feature/new-feature
│       ├── fix/bug-fix
│       └── chore/maintenance
```

#### Automated Deployments
- Push to `develop` → Auto-deploys to blue.flippi.ai
- Push to `staging` → Auto-deploys to green.flippi.ai
- Push to `master` → Auto-deploys to app.flippi.ai

#### Branch Protection Rules
- `master`: Requires management approval, only accepts PRs from staging
- `staging`: Requires testing confirmation, only accepts PRs from develop
- `develop`: Active development, accepts PRs from feature branches

### Commit Messages
```bash
# Format: type: description

feat: Add image analysis endpoint
fix: Resolve memory leak in image processing
docs: Update API documentation
test: Add unit tests for auth service
refactor: Simplify error handling logic
chore: Update dependencies
```

### Pull Request Guidelines
1. Create from feature branch
2. Target develop branch (never master)
3. Include clear description
4. Add screenshots for UI changes
5. Ensure all tests pass
6. Request code review

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Tested on mobile device
- [ ] API endpoints verified

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
```

### Issue Management

#### Testing Checklist Template
When ready for testing, add this checklist:
```markdown
## Testing Checklist
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Manual testing completed
- [ ] Tested in development environment
- [ ] Tested in staging environment
- [ ] Performance verified
- [ ] Security review completed
```

#### Implementation Summary Template
When closing issues, document what was done:
```markdown
## Implementation Summary
**Backend Changes**: [List files and endpoints]
**Frontend Changes**: [List components and screens]
**Database Changes**: [List schema updates]
**API Changes**: [List new/modified endpoints]
**Testing**: [Automated/Manual tests added]
**Deployment**: [Which environments]
```

## Anti-Patterns to Avoid

### Never Do This
1. **No hardcoded secrets** - Use environment variables
2. **No console.log in production** - Use proper logging
3. **No synchronous file operations** - Always use async
4. **No unlimited loops** - Always have exit conditions
5. **No ignored errors** - Handle all error cases
6. **No direct database queries in routes** - Use service layer

### Code Smells
- Functions over 50 lines
- Deeply nested callbacks
- Duplicate code blocks
- Magic numbers/strings
- Dead code
- TODO comments older than 1 week
- Commented out code

## Quick Reference Checklist

### Before Committing
- [ ] Code runs without errors
- [ ] Tests pass
- [ ] No linting errors
- [ ] Environment variables documented
- [ ] No hardcoded values
- [ ] Error cases handled
- [ ] Documentation updated

### Before Deploying
- [ ] All tests pass
- [ ] Performance acceptable
- [ ] Security scan complete
- [ ] Documentation current
- [ ] Rollback plan ready
- [ ] Monitoring configured

Remember: Good practices lead to maintainable code, happy users, and peaceful deployments!