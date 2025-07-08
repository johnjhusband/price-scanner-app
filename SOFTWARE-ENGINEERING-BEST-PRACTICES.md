# Software Engineering Best Practices

This document outlines the software engineering standards and practices for the My Thrifting Buddy project.

## Table of Contents
1. [Core Principles](#core-principles)
2. [Automatic Bug Logging](#automatic-bug-logging)
3. [Architecture Decisions](#architecture-decisions)
4. [Code Quality Standards](#code-quality-standards)
5. [Development Workflow](#development-workflow)
6. [Testing Requirements](#testing-requirements)
7. [Security Practices](#security-practices)
8. [Performance Guidelines](#performance-guidelines)
9. [Documentation Standards](#documentation-standards)

## Core Principles

### 1. Simplicity First
- Choose boring technology over cutting edge
- Implement the simplest solution that works
- Avoid premature optimization
- No external dependencies without explicit approval

### 2. Self-Contained Architecture
- Application must be fully functional without cloud services
- All data stored locally by default
- No vendor lock-in
- Easy to deploy on any server

### 3. Explicit Over Implicit
- Clear function and variable names
- Obvious code flow
- No magic numbers or strings
- Configuration in environment variables

## Automatic Bug Logging

### Error Log Structure
All bugs and issues MUST be logged to `/error-log.txt` with the following format:

```
ISSUE TITLE IN CAPS:
--------------------
Date: YYYY-MM-DD
Issue: Brief description
Priority: CRITICAL|HIGH|MEDIUM|LOW

Error Message:
[Actual error output]

Root Cause:
[Analysis of why this happened]

Impact:
[What functionality is affected]

[Team] Action Required:
[Specific steps to fix]

Status: NEW|IN_PROGRESS|RESOLVED|WONT_FIX
```

### Automatic Logging Implementation

#### Backend Error Handler
```javascript
// src/middleware/errorLogger.js
const fs = require('fs').promises;
const path = require('path');

async function logError(error, context) {
  const timestamp = new Date().toISOString();
  const logEntry = `
${error.name?.toUpperCase() || 'ERROR'}:
--------------------
Date: ${timestamp}
Issue: ${error.message}
Priority: ${error.priority || 'MEDIUM'}

Error Message:
${error.stack}

Context:
${JSON.stringify(context, null, 2)}

Status: NEW
--------------------

`;
  
  const logPath = path.join(__dirname, '../../../error-log.txt');
  await fs.appendFile(logPath, logEntry);
}

module.exports = { logError };
```

#### Frontend Error Boundary
```javascript
// src/components/ErrorBoundary.js
class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Send to backend for logging
    apiService.logError({
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      context: 'Frontend Error Boundary'
    });
  }
}
```

### Error Categories

1. **CRITICAL**: Application cannot start or core functionality broken
2. **HIGH**: Major feature unavailable but app still runs
3. **MEDIUM**: Feature partially broken or degraded performance
4. **LOW**: Minor issues, UI glitches, or non-blocking errors

## Architecture Decisions

### Approved Technology Stack
- **Backend**: Node.js, Express.js, PostgreSQL
- **Frontend**: React Native, Expo
- **Infrastructure**: Docker, local file storage
- **Testing**: Jest, Supertest

### Forbidden Without Approval
- Cloud services (AWS, GCP, Azure)
- External databases
- Third-party authentication providers
- Proprietary APIs
- Subscription services

### File Storage
- Images stored in `backend/uploads/`
- Served via Express static middleware
- No cloud storage services
- Automatic thumbnail generation

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
const MAX_UPLOAD_SIZE = 10485760; // 10MB
const API_TIMEOUT = 30000; // 30 seconds

// Classes: PascalCase
class UserService { }
class ImageProcessor { }
```

### Function Rules
1. Single responsibility - one function, one job
2. Maximum 50 lines per function
3. Maximum 3 parameters (use object for more)
4. Always handle errors explicitly
5. Return early for edge cases

### Error Handling
```javascript
// Good: Specific error handling
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  await logError(error, { operation: 'riskyOperation', userId });
  
  if (error.code === 'ENOENT') {
    throw new NotFoundError('Resource not found');
  }
  
  throw new ServerError('Operation failed', error);
}

// Bad: Generic catch
try {
  return await riskyOperation();
} catch (error) {
  console.log(error);
  throw error;
}
```

## Development Workflow

### Pre-Commit Checklist
1. [ ] Code runs locally without errors
2. [ ] All tests pass (`npm test`)
3. [ ] No linting errors (`npm run lint`)
4. [ ] Dependencies in package.json
5. [ ] No hardcoded secrets
6. [ ] Error cases handled
7. [ ] Changes logged if fixing bug

### Branch Strategy
```
master (production)
├── feature/user-authentication
├── feature/image-upload
├── fix/login-error
└── hotfix/critical-bug
```

### Commit Messages
```
feat: Add user registration endpoint
fix: Resolve login timeout issue
docs: Update API documentation
test: Add unit tests for auth service
refactor: Simplify image processing logic
```

## Testing Requirements

### Unit Test Coverage
- Minimum 80% code coverage
- All API endpoints tested
- Error scenarios included
- Mock external dependencies

### Test Structure
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', password: 'secure123' };
      
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

### Integration Tests
- Test API endpoints end-to-end
- Include authentication flow
- Test file upload scenarios
- Verify database transactions

## Security Practices

### Authentication
- JWT tokens with refresh mechanism
- Passwords hashed with bcrypt (12 rounds)
- Session fingerprinting
- Rate limiting on auth endpoints

### Input Validation
```javascript
// Always validate user input
const schema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  username: Joi.string().alphanum().min(3).max(30)
});

const { error, value } = schema.validate(req.body);
if (error) {
  throw new ValidationError(error.details[0].message);
}
```

### File Upload Security
- Validate file type by magic numbers
- Limit file size
- Sanitize filenames
- Store outside web root
- Scan for malicious content

## Performance Guidelines

### Database Optimization
- Use indexes for frequently queried fields
- Implement connection pooling
- Use transactions for multi-step operations
- Paginate large result sets

### API Performance
- Implement response caching
- Use compression (gzip)
- Optimize images before storage
- Lazy load relationships

### Frontend Performance
- Compress images before upload
- Implement virtual scrolling for lists
- Use React.memo for expensive components
- Cache API responses appropriately

## Documentation Standards

### Code Documentation
```javascript
/**
 * Processes and stores uploaded image
 * @param {Buffer} imageBuffer - Raw image data
 * @param {string} filename - Original filename
 * @param {string} userId - User ID for ownership
 * @returns {Promise<Object>} Upload result with URLs
 * @throws {ValidationError} If image is invalid
 * @throws {StorageError} If save fails
 */
async function processImage(imageBuffer, filename, userId) {
  // Implementation
}
```

### API Documentation
- Document all endpoints in README
- Include request/response examples
- List all possible error codes
- Specify rate limits

### Change Documentation
- Update CHANGELOG.md for features
- Log bugs in error-log.txt
- Document breaking changes
- Update .env.example for new variables

## Monitoring and Debugging

### Logging Strategy
```javascript
// Use structured logging
logger.info('User login attempt', {
  userId: user.id,
  ip: req.ip,
  timestamp: new Date().toISOString()
});

logger.error('Database connection failed', {
  error: error.message,
  host: dbConfig.host,
  attempt: retryCount
});
```

### Debug Mode
- Enable with DEBUG=true
- Log SQL queries in development
- Show detailed error messages
- Enable source maps

### Performance Monitoring
- Log slow queries (>100ms)
- Track API response times
- Monitor memory usage
- Alert on error rate spikes

## Deployment Checklist

### Pre-Deployment
1. [ ] All tests pass
2. [ ] No console.log statements
3. [ ] Environment variables documented
4. [ ] Database migrations tested
5. [ ] Error handling comprehensive
6. [ ] Security scan completed
7. [ ] Performance tested

### Post-Deployment
1. [ ] Verify all services running
2. [ ] Test critical user flows
3. [ ] Check error logs
4. [ ] Monitor performance
5. [ ] Verify backups working

## Anti-Patterns to Avoid

### Never Do This
1. **No unauthorized dependencies**: Don't add cloud services without approval
2. **No global variables**: Use proper module exports
3. **No synchronous file operations**: Always use async
4. **No passwords in code**: Use environment variables
5. **No infinite loops**: Always have exit conditions
6. **No eval() or Function()**: Security risk
7. **No prototype pollution**: Validate all inputs

### Code Smells
- Functions over 50 lines
- Deeply nested callbacks
- Duplicate code blocks
- Magic numbers/strings
- Dead code
- TODO comments older than 1 week
- Commented out code

## Incident Response

### When Things Break
1. **Identify**: Check error logs and monitoring
2. **Isolate**: Determine affected components
3. **Communicate**: Update team on status
4. **Fix**: Implement and test solution
5. **Document**: Log in error-log.txt
6. **Post-mortem**: Analyze root cause
7. **Prevent**: Add tests/monitoring

### Rollback Strategy
- Keep last 3 deployments
- Database migration rollback scripts
- Feature flags for risky changes
- Automated rollback on high error rate

## Future-Proofing

### Scalability Considerations
- Design for horizontal scaling
- Use stateless architecture
- Implement caching strategy
- Database read replicas ready

### Maintainability
- Keep dependencies updated
- Regular security audits
- Automated testing pipeline
- Clear upgrade paths

### Knowledge Transfer
- Document all decisions
- Maintain runbooks
- Record architecture decisions
- Keep README current

---

Last Updated: 2025-07-07
Version: 1.0.0