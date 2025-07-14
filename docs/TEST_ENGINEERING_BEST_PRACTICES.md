# Test Engineering Best Practices - v2.0

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Test Automation Strategy](#test-automation-strategy)
3. [GitHub Actions Integration](#github-actions-integration)
4. [Test Categories and Coverage](#test-categories-and-coverage)
5. [PM2 and Nginx Testing](#pm2-and-nginx-testing)
6. [API Testing](#api-testing)
7. [Frontend Testing](#frontend-testing)
8. [Performance Testing](#performance-testing)
9. [Security Testing](#security-testing)
10. [Three-Environment Testing Strategy](#three-environment-testing-strategy)

## Testing Philosophy

### Core Principles
1. **Shift Left**: Test early and often in the development cycle
2. **Automate Repetitive Tasks**: If you do it twice, automate it
3. **Fail Fast**: Quick feedback loops prevent costly fixes later
4. **Test in Production**: Monitor real user experiences with health checks
5. **Environment Parity**: Test in dev → staging → production pipeline

### The Testing Pyramid for v2.0
```
         /\
        /  \     E2E Tests (10%)
       /    \    - Critical user journeys
      /      \   - Playwright integration tests
     /--------\
    /          \ Integration Tests (30%)
   /            \ - API endpoint tests
  /              \ - PM2 process tests
 /----------------\ - Nginx routing tests
/                  \ Unit Tests (60%)
                    - Backend logic tests
                    - Frontend component tests
```

## Test Automation Strategy

### Current GitHub Actions Workflows

#### 1. Backend CI (`backend-ci.yml`)
```yaml
# Tests across Node.js 16, 18, 20
- name: Run tests
  run: |
    cd backend
    npm test
    npm run lint
    npm audit
```

#### 2. E2E Testing (`test-and-track.yml`)
```yaml
# Playwright tests with automatic issue creation
- name: Run Playwright tests
  run: npx playwright test
- name: Create GitHub issue for failures
  if: failure()
  uses: actions/github-script@v6
```

#### 3. Issue Automation (`issue-automation.yml`)
- Auto-assigns issues
- Labels based on content
- Links related PRs

### Test Scripts Configuration
```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch", 
    "test:coverage": "jest --coverage",
    "test:api": "node scripts/api-test.js",
    "test:health": "node scripts/health-check.js",
    "test:e2e": "playwright test",
    "lint": "eslint .",
    "audit": "npm audit"
  }
}
```

## GitHub Actions Integration

### Branch-Based Testing Strategy
- **develop** → Runs all tests, deploys to blue.flippi.ai
- **staging** → Full test suite + deployment to green.flippi.ai  
- **master** → Production-ready tests + manual approval for app.flippi.ai

### Automated Issue Creation
When tests fail, GitHub Actions automatically:
1. Creates detailed issue with failure logs
2. Assigns to appropriate team member
3. Labels with priority and component
4. Links to failed commit
5. Auto-closes when tests pass again

```javascript
// .github/workflows/test-and-track.yml snippet
if (failures.length > 0) {
  await github.rest.issues.create({
    title: `Test Failures in ${context.ref}`,
    body: `## Failed Tests\n${failures.map(f => `- ${f}`).join('\n')}`,
    labels: ['bug', 'test-failure', 'auto-created']
  });
}
```

## Test Categories and Coverage

### 1. Unit Tests (Backend)
```javascript
// backend/tests/server.test.js
describe('Health Endpoint', () => {
  test('returns v2.0 health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.version).toBe('2.0');
    expect(response.body.features.imageAnalysis).toBe(true);
  });
});

describe('Image Analysis API', () => {
  test('requires image file', async () => {
    const response = await request(app).post('/api/scan');
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
```

### 2. Frontend Component Tests
```javascript
// mobile-app/tests/App.test.js
describe('App Component', () => {
  test('renders camera button', () => {
    render(<App />);
    expect(screen.getByText('Take Photo')).toBeInTheDocument();
  });

  test('handles paste events', async () => {
    render(<App />);
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: { files: [mockImageFile] }
    });
    fireEvent(window, pasteEvent);
    // Assert image processing starts
  });
});
```

## PM2 and Nginx Testing

### PM2 Process Testing
```bash
#!/bin/bash
# scripts/test-pm2.sh

test_pm2_processes() {
  echo "Testing PM2 processes..."
  
  # Check all processes are online
  OFFLINE_PROCESSES=$(pm2 list --json | jq -r '.[] | select(.pm2_env.status != "online") | .name')
  
  if [ -n "$OFFLINE_PROCESSES" ]; then
    echo "❌ Offline processes: $OFFLINE_PROCESSES"
    exit 1
  fi
  
  echo "✅ All PM2 processes online"
}

test_process_restart() {
  echo "Testing PM2 restart capability..."
  
  pm2 restart prod-backend
  sleep 5
  
  if ! curl -sf http://localhost:3000/health > /dev/null; then
    echo "❌ Backend failed to restart properly"
    exit 1
  fi
  
  echo "✅ PM2 restart successful"
}
```

### Nginx Routing Tests
```bash
#!/bin/bash
# scripts/test-nginx.sh

test_nginx_routing() {
  echo "Testing Nginx routing..."
  
  # Test SSL redirects
  for domain in app.flippi.ai green.flippi.ai blue.flippi.ai; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://$domain")
    if [ "$HTTP_STATUS" != "301" ]; then
      echo "❌ HTTP redirect failed for $domain: $HTTP_STATUS"
      exit 1
    fi
  done
  
  # Test HTTPS endpoints
  for domain in app.flippi.ai green.flippi.ai blue.flippi.ai; do
    if ! curl -sf "https://$domain/health" > /dev/null; then
      echo "❌ HTTPS health check failed for $domain"
      exit 1
    fi
  done
  
  echo "✅ All Nginx routing tests passed"
}
```

## API Testing

### Health Check Tests
```javascript
// scripts/api-test.js
const environments = [
  { name: 'production', url: 'https://app.flippi.ai' },
  { name: 'staging', url: 'https://green.flippi.ai' },
  { name: 'development', url: 'https://blue.flippi.ai' }
];

async function testHealthEndpoints() {
  for (const env of environments) {
    try {
      const response = await fetch(`${env.url}/health`);
      const data = await response.json();
      
      console.assert(data.status === 'OK', `${env.name} health check failed`);
      console.assert(data.version === '2.0', `${env.name} version mismatch`);
      console.assert(data.features.imageAnalysis === true, `${env.name} missing features`);
      
      console.log(`✅ ${env.name} health check passed`);
    } catch (error) {
      console.error(`❌ ${env.name} health check failed:`, error.message);
      process.exit(1);
    }
  }
}
```

### API Functionality Tests
```javascript
async function testImageAnalysisAPI() {
  const testImage = new FormData();
  testImage.append('image', fs.createReadStream('test/fixtures/sample.jpg'));
  
  const response = await fetch('https://app.flippi.ai/api/scan', {
    method: 'POST',
    body: testImage
  });
  
  const result = await response.json();
  
  console.assert(result.success === true, 'API scan should succeed');
  console.assert(result.data.item, 'Should return item description');
  console.assert(result.data.estimatedValue, 'Should return estimated value');
  
  console.log('✅ Image analysis API test passed');
}
```

## Frontend Testing

### Playwright E2E Tests
```javascript
// tests/e2e/user-journey.spec.js
const { test, expect } = require('@playwright/test');

test('complete image analysis workflow', async ({ page }) => {
  await page.goto('https://green.flippi.ai');
  
  // Test camera functionality
  await page.click('[data-testid="camera-button"]');
  await page.setInputFiles('[data-testid="file-input"]', 'test/fixtures/jacket.jpg');
  
  // Wait for analysis
  await expect(page.locator('[data-testid="analysis-result"]')).toBeVisible();
  await expect(page.locator('[data-testid="estimated-value"]')).toContainText('$');
  
  console.log('✅ Complete user journey test passed');
});

test('paste image functionality', async ({ page }) => {
  await page.goto('https://blue.flippi.ai');
  
  // Simulate paste event
  await page.evaluate(() => {
    const event = new ClipboardEvent('paste', {
      clipboardData: new DataTransfer()
    });
    window.dispatchEvent(event);
  });
  
  // Verify paste handling
  await expect(page.locator('[data-testid="paste-indicator"]')).toBeVisible();
});
```

### Mobile App Testing
```javascript
// mobile-app/tests/camera.test.js
describe('Camera Integration', () => {
  test('requests camera permissions', async () => {
    const mockRequestPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
    ImagePicker.requestCameraPermissionsAsync = mockRequestPermissions;
    
    render(<CameraComponent />);
    fireEvent.press(screen.getByText('Take Photo'));
    
    expect(mockRequestPermissions).toHaveBeenCalled();
  });
});
```

## Performance Testing

### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'https://app.flippi.ai'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Health check load test"
    requests:
      - get:
          url: "/health"
  - name: "API scan load test"
    requests:
      - post:
          url: "/api/scan"
          formData:
            image: "test/fixtures/sample.jpg"
```

### PM2 Memory Monitoring
```javascript
// scripts/monitor-memory.js
const pm2 = require('pm2');

function monitorMemoryUsage() {
  pm2.list((err, processes) => {
    processes.forEach(proc => {
      const memoryMB = proc.pm2_env.memory / 1024 / 1024;
      if (memoryMB > 500) {
        console.warn(`⚠️ High memory usage: ${proc.name} using ${memoryMB}MB`);
      }
    });
  });
}
```

## Security Testing

### API Security Tests
```javascript
// tests/security/api-security.test.js
describe('API Security', () => {
  test('rejects oversized files', async () => {
    const largeFile = Buffer.alloc(11 * 1024 * 1024); // 11MB file
    const response = await request(app)
      .post('/api/scan')
      .attach('image', largeFile, 'large.jpg');
    
    expect(response.status).toBe(413);
  });

  test('validates file types', async () => {
    const response = await request(app)
      .post('/api/scan')
      .attach('image', 'malicious.exe');
    
    expect(response.status).toBe(400);
  });
});
```

### SSL Certificate Testing
```bash
#!/bin/bash
# scripts/test-ssl.sh

test_ssl_certificates() {
  for domain in app.flippi.ai green.flippi.ai blue.flippi.ai; do
    echo "Testing SSL for $domain..."
    
    # Test certificate validity
    echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | \
      openssl x509 -noout -checkend 86400
    
    if [ $? -ne 0 ]; then
      echo "❌ SSL certificate issue for $domain"
      exit 1
    fi
  done
  
  echo "✅ All SSL certificates valid"
}
```

## Three-Environment Testing Strategy

### Environment-Specific Tests
```javascript
// scripts/environment-tests.js
const testSuites = {
  development: [
    'unit-tests',
    'api-functionality',
    'basic-e2e'
  ],
  staging: [
    'unit-tests',
    'integration-tests',
    'full-e2e-suite',
    'performance-tests',
    'security-scans'
  ],
  production: [
    'health-checks',
    'smoke-tests',
    'ssl-verification',
    'uptime-monitoring'
  ]
};

async function runEnvironmentTests(environment) {
  const tests = testSuites[environment];
  console.log(`Running ${environment} test suite: ${tests.join(', ')}`);
  
  for (const test of tests) {
    await runTestSuite(test, environment);
  }
}
```

### Deployment Pipeline Testing
```bash
#!/bin/bash
# scripts/deployment-pipeline-test.sh

test_deployment_pipeline() {
  echo "Testing complete deployment pipeline..."
  
  # 1. Test development deployment
  deploy_and_test "blue.flippi.ai" "develop" || exit 1
  
  # 2. Test staging deployment
  deploy_and_test "green.flippi.ai" "staging" || exit 1
  
  # 3. Verify production is unaffected
  test_environment_health "app.flippi.ai" || exit 1
  
  echo "✅ Deployment pipeline test complete"
}
```

## Best Practices Summary

1. **Automate Everything**: Use GitHub Actions for CI/CD
2. **Test Early**: Run tests on every commit
3. **Environment Parity**: Test the same way in all environments
4. **Monitor Production**: Continuous health checks
5. **Fast Feedback**: Quick test execution and reporting
6. **Visual Testing**: Playwright for UI validation
7. **API Contract Testing**: Validate all endpoints
8. **Security First**: Test for common vulnerabilities
9. **Performance Baselines**: Monitor response times
10. **Documentation**: Keep test documentation current

## Quick Reference

### Run All Tests Locally
```bash
# Backend tests
cd backend && npm test

# Frontend tests  
cd mobile-app && npm test

# E2E tests
npx playwright test

# API tests
node scripts/api-test.js

# Infrastructure tests
./scripts/test-pm2.sh && ./scripts/test-nginx.sh
```

### Environment Health Checks
```bash
# Check all environments
for env in app green blue; do
  curl -s https://$env.flippi.ai/health | jq .
done
```

Remember: Testing is not just about finding bugs—it's about building confidence in your deployments and ensuring a great user experience.