# Backend Test Plan - My Thrifting Buddy

## Overview
This document outlines the comprehensive testing strategy for the My Thrifting Buddy backend API. The backend handles authentication, image analysis, and data management for the thrifting price estimation application.

## Test Structure
```
backend/
├── src/
│   ├── __tests__/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── routes/__tests__/
│   ├── services/__tests__/
│   └── utils/__tests__/
```

## Unit Tests

### 1. Authentication Service Tests (`src/services/__tests__/authService.test.js`)
**Status**: Partially implemented

**Test Cases**:
- ✅ Password hashing and verification
- ✅ JWT token generation and verification
- ✅ User registration with validation
- ✅ Login with email/username
- ✅ Session management
- ❌ Token refresh mechanism (needs implementation)
- ❌ Account lockout after failed attempts (needs implementation)
- ❌ Email verification flow (needs implementation)

### 2. OpenAI Service Tests (`src/services/__tests__/openaiService.test.js`)
**Status**: Not implemented

**Test Cases**:
- Mock OpenAI API responses for different item types
- Handle API errors (rate limits, timeouts, invalid responses)
- Validate response JSON structure
- Test image buffer to base64 conversion
- Verify proper error messages for user feedback
- Test retry logic for transient failures

**Example Test Structure**:
```javascript
describe('OpenAIService', () => {
  describe('analyzeImage', () => {
    test('should analyze clothing items correctly', async () => {
      // Mock OpenAI response
      // Test analysis
      // Verify response format
    });
    
    test('should handle API rate limits gracefully', async () => {
      // Mock 429 response
      // Verify proper error handling
    });
  });
});
```

### 3. Upload Service Tests (`src/services/__tests__/uploadService.test.js`)
**Status**: Not implemented

**Test Cases**:
- File type validation (MIME type and magic numbers)
- File size limit enforcement (10MB default)
- S3 upload with proper permissions
- Image optimization with Sharp
- Virus scanning placeholder
- Duplicate detection via SHA-256 hash
- Filename sanitization

### 4. Token Service Tests (`src/services/auth/__tests__/tokenService.test.js`)
**Status**: Not implemented

**Test Cases**:
- Access token generation with proper claims
- Refresh token generation with family tracking
- Token rotation on refresh
- Fingerprint validation
- Cleanup of expired tokens
- Concurrent refresh handling
- Token blacklisting on logout

### 5. Database/Model Tests (`src/models/__tests__/`)
**Status**: Not implemented

**Test Cases**:
- User model validation
- Scan history model validation
- Refresh token model operations
- Database transaction rollbacks
- Connection pool management
- Migration execution and rollback

## Integration Tests

### 1. API Route Tests

#### Auth Routes (`src/routes/__tests__/auth.test.js`)
**Status**: Partially implemented

**Additional Test Cases Needed**:
- Rate limiting on login endpoint
- Refresh token endpoint
- Logout all sessions
- Profile update with validation
- Password reset flow
- Email verification

#### Scan Routes (`src/routes/__tests__/scan.test.js`)
**Status**: Not implemented

**Test Cases**:
- Image upload with authentication
- Anonymous image upload with restrictions
- Scan history retrieval with pagination
- Search functionality
- Favorite marking
- Scan deletion with ownership check
- Invalid image format rejection

### 2. Middleware Tests (`src/middleware/__tests__/`)
**Status**: Not implemented

**Test Cases**:
- Error handler middleware (different error types)
- Authentication middleware (valid/invalid/expired tokens)
- File upload middleware (size/type validation)
- Rate limiting middleware (per endpoint limits)
- CORS middleware (allowed origins)
- Request ID generation

## End-to-End Tests

### 1. Complete Authentication Flow (`src/__tests__/e2e/auth.e2e.test.js`)
```javascript
describe('Authentication E2E', () => {
  test('complete auth lifecycle', async () => {
    // 1. Register new user
    // 2. Login and receive tokens
    // 3. Access protected resource
    // 4. Refresh token when expired
    // 5. Logout and verify access denied
    // 6. Attempt to use refresh token after logout
  });
});
```

### 2. Image Analysis Flow (`src/__tests__/e2e/scan.e2e.test.js`)
```javascript
describe('Scan E2E', () => {
  test('authenticated user scan flow', async () => {
    // 1. Login user
    // 2. Upload image
    // 3. Wait for analysis
    // 4. Verify response format
    // 5. Check scan saved to history
    // 6. Retrieve from history
    // 7. Update notes
    // 8. Delete scan
  });
  
  test('anonymous user scan flow', async () => {
    // 1. Upload without auth
    // 2. Verify rate limiting
    // 3. No history saved
  });
});
```

### 3. Error Recovery Flow (`src/__tests__/e2e/error-recovery.e2e.test.js`)
```javascript
describe('Error Recovery E2E', () => {
  test('handles service failures gracefully', async () => {
    // 1. Simulate OpenAI service down
    // 2. Verify proper error response
    // 3. Simulate S3 upload failure
    // 4. Verify cleanup and error response
  });
});
```

## Performance Tests

### 1. Load Testing
- Concurrent image uploads (target: 100 concurrent users)
- Database query performance under load
- Memory usage during image processing
- Response time targets:
  - Auth endpoints: < 200ms
  - Image upload: < 2s
  - Analysis completion: < 10s

### 2. Stress Testing
- Maximum file size handling
- Rate limit behavior under attack
- Database connection pool exhaustion
- Memory leak detection

## Security Tests

### 1. Authentication Security
- SQL injection attempts
- JWT manipulation
- Brute force protection
- Session fixation
- CSRF protection

### 2. File Upload Security
- Malicious file upload attempts
- Directory traversal
- File type spoofing
- Zip bomb protection
- XXE injection

### 3. API Security
- Rate limiting effectiveness
- CORS policy enforcement
- Input validation bypass attempts
- Authorization checks

## Test Data Management

### 1. Test Fixtures
```javascript
// fixtures/users.js
exports.testUsers = {
  valid: {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!@#'
  },
  admin: {
    email: 'admin@example.com',
    username: 'admin',
    password: 'Admin123!@#'
  }
};

// fixtures/images.js
exports.testImages = {
  validJpeg: 'test-images/valid-item.jpg',
  validPng: 'test-images/valid-item.png',
  oversized: 'test-images/oversized.jpg',
  malicious: 'test-images/malicious.txt'
};
```

### 2. Database Seeding
- Test user accounts
- Sample scan history
- Various item categories
- Edge case data

## Test Execution

### 1. Local Development
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.test.js

# Run in watch mode
npm run test:watch
```

### 2. CI/CD Pipeline
```yaml
# .github/workflows/test.yml
test:
  - npm run test:unit
  - npm run test:integration
  - npm run test:e2e
  - npm run test:security
```

### 3. Coverage Requirements
- Overall: 80% minimum
- Critical paths: 100%
- New code: 90% minimum

## Test Environment Setup

### 1. Environment Variables
```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/thrifting_test
JWT_SECRET=test-secret
OPENAI_API_KEY=test-key
AWS_ACCESS_KEY_ID=test-key
AWS_SECRET_ACCESS_KEY=test-secret
```

### 2. Mock Services
- Mock OpenAI responses
- LocalStack for S3 testing
- In-memory database for unit tests

## Continuous Improvement

### 1. Test Metrics
- Track test execution time
- Monitor flaky tests
- Coverage trends
- Bug escape rate

### 2. Test Review Process
- PR must include tests
- Test code reviews
- Regular test refactoring
- Performance baseline updates

## AI-Assisted Test Execution Methods

### What I Can Execute Directly

1. **API Testing via Command Line**
```bash
# Health check
curl http://localhost:3000/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123!"}'

# Test image upload
curl -X POST http://localhost:3000/api/scan \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@test-image.jpg"
```

2. **Run Existing Test Suites**
```bash
cd backend
npm test                    # Run all tests
npm test -- --coverage     # With coverage report
npm test auth.test.js      # Specific test file
```

3. **Load Testing**
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/health

# Using curl in a loop
for i in {1..100}; do
  curl -s http://localhost:3000/health &
done
```

4. **Create and Run Test Scripts**
```javascript
// api-test-runner.js
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function runTests() {
  // Test registration
  const regResponse = await axios.post('http://localhost:3000/api/auth/register', {
    email: 'test@example.com',
    username: 'testuser',
    password: 'Test123!'
  });
  
  // Test login
  const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
    emailOrUsername: 'test@example.com',
    password: 'Test123!'
  });
  
  const token = loginResponse.data.token;
  
  // Test image upload
  const form = new FormData();
  form.append('image', fs.createReadStream('test-image.jpg'));
  
  const scanResponse = await axios.post('http://localhost:3000/api/scan', form, {
    headers: {
      ...form.getHeaders(),
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('All tests passed!');
}

runTests().catch(console.error);
```

### What I Cannot Do
- Manually click buttons in a browser
- Visually verify UI elements
- Test touch/swipe gestures
- Interact with native mobile apps

### Recommended Automated Testing Setup

1. **Puppeteer for Web UI Testing**
```javascript
// Install: npm install puppeteer
// Then I can write and run browser automation tests
```

2. **Newman for API Testing**
```bash
# Install: npm install -g newman
# Run Postman collections from command line
newman run backend-api-tests.json
```

3. **Jest for All Test Types**
```bash
# Already configured in package.json
npm test
```

## Next Steps

1. **Immediate Priority**:
   - Run existing tests and analyze coverage
   - Create API test scripts for all endpoints
   - Set up Puppeteer for UI automation

2. **Short Term**:
   - Implement missing unit tests
   - Create load testing scripts
   - Set up CI/CD test pipeline

3. **Long Term**:
   - Automated security testing
   - Chaos engineering tests
   - Multi-region testing