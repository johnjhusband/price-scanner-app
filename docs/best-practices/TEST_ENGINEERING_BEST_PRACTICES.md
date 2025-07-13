# Test Engineering Best Practices

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Test Automation Strategy](#test-automation-strategy)
3. [Automatic Bug Logging](#automatic-bug-logging)
4. [Test Categories and Coverage](#test-categories-and-coverage)
5. [CI/CD Integration](#cicd-integration)
6. [Performance Testing](#performance-testing)
7. [Security Testing](#security-testing)
8. [Test Data Management](#test-data-management)
9. [Monitoring and Observability](#monitoring-and-observability)
10. [Cost Optimization](#cost-optimization)

## Testing Philosophy

### Core Principles
1. **Shift Left**: Test early and often in the development cycle
2. **Automate Repetitive Tasks**: If you do it twice, automate it
3. **Fail Fast**: Quick feedback loops prevent costly fixes later
4. **Test in Production**: Monitor real user experiences
5. **Data-Driven Decisions**: Measure everything, guess nothing

### The Testing Pyramid
```
         /\
        /  \     E2E Tests (10%)
       /    \    - Critical user journeys only
      /      \   - Expensive to maintain
     /--------\
    /          \ Integration Tests (30%)
   /            \ - API contracts
  /              \ - Service boundaries
 /----------------\
/                  \ Unit Tests (60%)
                    - Fast, isolated, numerous
```

## Test Automation Strategy

### 1. Immediate Wins (ROI < 1 week)
```javascript
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:api": "node scripts/api-test-runner.js",
    "test:load": "k6 run scripts/load-test.js"
  }
}
```

### 2. Progressive Enhancement
- **Week 1**: Unit tests for critical business logic
- **Week 2**: API integration tests
- **Week 3**: UI automation for happy paths
- **Month 2**: Performance baselines
- **Month 3**: Security scanning

### 3. Tool Selection Matrix
| Need | Free Option | Paid Option | When to Upgrade |
|------|------------|-------------|-----------------|
| Unit Testing | Jest | N/A | Always free |
| API Testing | Supertest | Postman Pro | >50 endpoints |
| UI Testing | Puppeteer | BrowserStack | >4 hrs/month manual |
| Load Testing | k6 OSS | k6 Cloud | >10k users |
| Visual Testing | BackstopJS | Percy | >5 deploys/week |
| Security | OWASP ZAP | Snyk | Production apps |

## Automatic Bug Logging

### 1. Test Failure Auto-Reporting
```javascript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    ['./test-reporters/bug-logger.js', {
      jiraProject: 'THRIFT',
      githubRepo: 'owner/repo',
      slackWebhook: process.env.SLACK_WEBHOOK
    }]
  ]
};

// test-reporters/bug-logger.js
class BugLogger {
  constructor(globalConfig, options) {
    this.options = options;
    this.failures = [];
  }

  onTestResult(test, testResult) {
    if (testResult.numFailingTests > 0) {
      testResult.testResults
        .filter(t => t.status === 'failed')
        .forEach(failedTest => {
          this.logBug(failedTest, test.path);
        });
    }
  }

  async logBug(failedTest, testPath) {
    const bug = {
      title: `Test Failure: ${failedTest.title}`,
      description: this.formatDescription(failedTest),
      labels: ['test-failure', 'automated'],
      assignee: this.getCodeOwner(testPath),
      priority: this.calculatePriority(failedTest)
    };

    // Log to GitHub Issues
    if (this.options.githubRepo) {
      await this.createGitHubIssue(bug);
    }

    // Log to JIRA
    if (this.options.jiraProject) {
      await this.createJiraTicket(bug);
    }

    // Alert on Slack
    if (this.options.slackWebhook) {
      await this.sendSlackAlert(bug);
    }
  }

  formatDescription(failedTest) {
    return `
## Test Failure Details
**Test**: ${failedTest.fullName}
**Duration**: ${failedTest.duration}ms
**Failure Time**: ${new Date().toISOString()}

### Error Message
\`\`\`
${failedTest.failureMessages.join('\n')}
\`\`\`

### Stack Trace
\`\`\`
${failedTest.failureDetails?.[0]?.stack || 'No stack trace available'}
\`\`\`

### Steps to Reproduce
1. Run: \`npm test -- ${failedTest.ancestorTitles.join(' ')}\`
2. The test "${failedTest.title}" will fail

### Environment
- Node: ${process.version}
- OS: ${process.platform}
- Branch: ${process.env.GIT_BRANCH || 'unknown'}
- Commit: ${process.env.GIT_COMMIT || 'unknown'}
    `;
  }

  calculatePriority(failedTest) {
    // Critical path tests get high priority
    if (failedTest.fullName.includes('auth') || 
        failedTest.fullName.includes('payment')) {
      return 'P1';
    }
    // Flaky tests get lower priority
    if (this.isFlaky(failedTest)) {
      return 'P3';
    }
    return 'P2';
  }

  async createGitHubIssue(bug) {
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const [owner, repo] = this.options.githubRepo.split('/');
    
    // Check if issue already exists
    const existing = await octokit.search.issuesAndPullRequests({
      q: `repo:${owner}/${repo} is:issue "${bug.title}"`
    });

    if (existing.data.total_count === 0) {
      await octokit.issues.create({
        owner,
        repo,
        title: bug.title,
        body: bug.description,
        labels: bug.labels,
        assignees: [bug.assignee]
      });
    }
  }
}

module.exports = BugLogger;
```

### 2. Production Error Tracking
```javascript
// error-tracker.js
const Sentry = require('@sentry/node');

class ErrorTracker {
  constructor() {
    this.bugPatterns = new Map();
    this.initializeSentry();
  }

  initializeSentry() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      beforeSend: (event, hint) => {
        // Automatically create bugs for new error patterns
        this.checkAndLogNewBug(event, hint);
        return event;
      }
    });
  }

  async checkAndLogNewBug(event, hint) {
    const errorKey = this.generateErrorKey(event);
    
    if (!this.bugPatterns.has(errorKey)) {
      this.bugPatterns.set(errorKey, {
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date()
      });

      // Auto-create bug for new error pattern
      await this.createBugTicket({
        title: `Production Error: ${event.exception?.values?.[0]?.type}`,
        description: this.formatProductionError(event),
        priority: this.calculateErrorPriority(event),
        labels: ['production-error', 'auto-generated']
      });
    } else {
      // Update existing pattern
      const pattern = this.bugPatterns.get(errorKey);
      pattern.count++;
      pattern.lastSeen = new Date();
      
      // Escalate if error rate increases
      if (pattern.count > 10 && this.shouldEscalate(pattern)) {
        await this.escalateBug(errorKey, pattern);
      }
    }
  }

  generateErrorKey(event) {
    const error = event.exception?.values?.[0];
    return `${error?.type}-${error?.value}-${error?.stacktrace?.frames?.[0]?.function}`;
  }
}
```

### 3. Flaky Test Detection
```javascript
// flaky-test-detector.js
class FlakyTestDetector {
  constructor() {
    this.testHistory = new Map();
    this.flakyThreshold = 0.2; // 20% failure rate
  }

  recordTestResult(testName, passed) {
    if (!this.testHistory.has(testName)) {
      this.testHistory.set(testName, {
        runs: 0,
        failures: 0,
        lastFailures: []
      });
    }

    const history = this.testHistory.get(testName);
    history.runs++;
    
    if (!passed) {
      history.failures++;
      history.lastFailures.push(new Date());
    }

    // Check if test is flaky
    if (history.runs >= 10) {
      const failureRate = history.failures / history.runs;
      if (failureRate > this.flakyThreshold && failureRate < 0.8) {
        this.reportFlakyTest(testName, history);
      }
    }
  }

  async reportFlakyTest(testName, history) {
    const bug = {
      title: `Flaky Test: ${testName}`,
      description: `
This test has been identified as flaky.

**Failure Rate**: ${((history.failures / history.runs) * 100).toFixed(1)}%
**Total Runs**: ${history.runs}
**Recent Failures**: ${history.lastFailures.slice(-5).join(', ')}

### Recommended Actions
1. Add retry logic to the test
2. Investigate timing issues
3. Check for external dependencies
4. Consider quarantining until fixed
      `,
      labels: ['flaky-test', 'technical-debt'],
      priority: 'P3'
    };

    await this.createBugTicket(bug);
  }
}
```

## Test Categories and Coverage

### 1. Unit Tests (Target: 80% Coverage)
```javascript
// Best practices for unit tests
describe('AuthService', () => {
  // Group related tests
  describe('password hashing', () => {
    // Use descriptive test names
    test('should hash passwords with bcrypt rounds from config', async () => {
      // Arrange
      const password = 'Test123!';
      const expectedRounds = 12;
      
      // Act
      const hash = await AuthService.hashPassword(password);
      
      // Assert
      expect(hash).not.toBe(password);
      expect(bcrypt.getRounds(hash)).toBe(expectedRounds);
    });

    // Test edge cases
    test('should handle empty password gracefully', async () => {
      await expect(AuthService.hashPassword('')).rejects.toThrow('Password required');
    });
  });
});
```

### 2. Integration Tests (Target: 100% API Coverage)
```javascript
// api.integration.test.js
describe('API Integration Tests', () => {
  let app;
  let token;

  beforeAll(async () => {
    app = await setupTestApp();
    token = await getTestToken();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Image Analysis Flow', () => {
    test('should analyze image end-to-end', async () => {
      // Upload image
      const uploadResponse = await request(app)
        .post('/api/scan')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', 'test-fixtures/sample-item.jpg')
        .expect(200);

      expect(uploadResponse.body).toMatchObject({
        analysis: {
          itemIdentification: expect.any(Object),
          priceEstimates: expect.any(Object)
        },
        confidence: expect.stringMatching(/High|Medium|Low/)
      });

      // Verify saved to history
      const historyResponse = await request(app)
        .get('/api/scan/history')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(historyResponse.body.data).toContainEqual(
        expect.objectContaining({
          id: uploadResponse.body.scanId
        })
      );
    });
  });
});
```

### 3. E2E Tests (Target: Critical Paths Only)
```javascript
// Critical user journeys only
describe('E2E: First Time User Journey', () => {
  test('should complete first scan without account', async () => {
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="scan-now"]');
    await page.setInputFiles('input[type="file"]', 'test-images/vintage-jacket.jpg');
    await page.click('[data-testid="analyze"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="results"]', { timeout: 30000 });
    
    // Verify results displayed
    const results = await page.textContent('[data-testid="price-estimate"]');
    expect(results).toMatch(/\$\d+/);
  });
});
```

## CI/CD Integration

### 1. GitHub Actions Configuration
```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run unit tests
      run: npm run test:ci
      env:
        JEST_JUNIT_OUTPUT_DIR: ./test-results
    
    - name: Run integration tests
      run: npm run test:integration
      if: matrix.node-version == '18.x'
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      if: matrix.node-version == '18.x'
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-results-${{ matrix.node-version }}
        path: test-results
    
    - name: Check coverage thresholds
      run: |
        coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$coverage < 80" | bc -l) )); then
          echo "Coverage ${coverage}% is below 80% threshold"
          exit 1
        fi

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Run security audit
      run: npm audit --audit-level=moderate
    
    - name: Run OWASP dependency check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'my-thrifting-buddy'
        path: '.'
        format: 'HTML'

  performance-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
    - uses: actions/checkout@v3
    
    - name: Run k6 performance tests
      uses: k6io/action@v0.1
      with:
        filename: scripts/performance-test.js
        cloud: true
      env:
        K6_CLOUD_TOKEN: ${{ secrets.K6_CLOUD_TOKEN }}
```

### 2. Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test:changed"
    }
  },
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "jest --bail --findRelatedTests"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

## Performance Testing

### 1. Load Test Script
```javascript
// scripts/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up
    { duration: '5m', target: 50 },  // Stay at 50 users
    { duration: '2m', target: 100 }, // Peak load
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests under 500ms
    errors: ['rate<0.05'],            // Error rate under 5%
  },
};

export default function () {
  // Test API endpoints
  const responses = http.batch([
    ['GET', `${__ENV.API_URL}/health`],
    ['GET', `${__ENV.API_URL}/api/scan/health`],
  ]);

  responses.forEach(res => {
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    }) || errorRate.add(1);
  });

  sleep(1);
}
```

### 2. Performance Monitoring
```javascript
// performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      responseTime: [],
      throughput: [],
      errorRate: [],
      cpuUsage: [],
      memoryUsage: []
    };
  }

  middleware() {
    return (req, res, next) => {
      const start = process.hrtime.bigint();
      
      res.on('finish', () => {
        const duration = Number(process.hrtime.bigint() - start) / 1e6; // ms
        
        this.recordMetric('responseTime', {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          duration
        });

        // Alert on performance degradation
        if (duration > 1000) {
          this.createPerformanceBug({
            title: `Slow API Response: ${req.method} ${req.path}`,
            description: `Response took ${duration}ms (threshold: 1000ms)`,
            priority: 'P2'
          });
        }
      });

      next();
    };
  }
}
```

## Security Testing

### 1. Security Test Suite
```javascript
// security.test.js
describe('Security Tests', () => {
  describe('SQL Injection', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousInputs = [
        "admin' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --"
      ];

      for (const input of maliciousInputs) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            emailOrUsername: input,
            password: 'password'
          });

        expect(response.status).toBe(401);
        expect(response.body).not.toContain('SQL');
      }
    });
  });

  describe('XSS Prevention', () => {
    test('should sanitize user input', async () => {
      const xssPayloads = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        'javascript:alert("XSS")'
      ];

      for (const payload of xssPayloads) {
        const response = await request(app)
          .post('/api/scan/notes')
          .set('Authorization', `Bearer ${token}`)
          .send({ notes: payload });

        expect(response.status).toBe(200);
        // Verify stored value is sanitized
        const stored = await db.query('SELECT notes FROM scans WHERE id = ?', [response.body.id]);
        expect(stored[0].notes).not.toContain('<script>');
      }
    });
  });
});
```

### 2. Automated Security Scanning
```bash
#!/bin/bash
# security-scan.sh

# OWASP ZAP API Scan
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t http://localhost:3000/openapi.json \
  -f openapi \
  -r zap-report.html

# Dependency vulnerability check
npm audit --json > npm-audit.json
npx snyk test --json > snyk-report.json

# Container scanning (if using Docker)
trivy image myapp:latest --format json > trivy-report.json

# Combine reports and create issues
node scripts/process-security-reports.js
```

## Test Data Management

### 1. Test Data Factory
```javascript
// test-utils/factories.js
const { faker } = require('@faker-js/faker');

class TestDataFactory {
  static user(overrides = {}) {
    return {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: 'Test123!@#',
      fullName: faker.person.fullName(),
      ...overrides
    };
  }

  static scan(overrides = {}) {
    return {
      imageUrl: faker.image.url(),
      itemName: faker.commerce.productName(),
      category: faker.helpers.arrayElement(['Clothing', 'Electronics', 'Books']),
      condition: faker.helpers.arrayElement(['Excellent', 'Good', 'Fair', 'Poor']),
      priceEstimates: {
        ebay: { min: faker.number.int({ min: 10, max: 50 }), max: faker.number.int({ min: 51, max: 100 }) },
        facebook: { min: faker.number.int({ min: 10, max: 50 }), max: faker.number.int({ min: 51, max: 100 }) }
      },
      ...overrides
    };
  }

  static async seed(db, counts = { users: 10, scans: 50 }) {
    const users = [];
    const scans = [];

    // Create users
    for (let i = 0; i < counts.users; i++) {
      const user = await db.user.create(this.user());
      users.push(user);
    }

    // Create scans
    for (let i = 0; i < counts.scans; i++) {
      const user = faker.helpers.arrayElement(users);
      const scan = await db.scan.create({
        ...this.scan(),
        userId: user.id
      });
      scans.push(scan);
    }

    return { users, scans };
  }
}

module.exports = TestDataFactory;
```

### 2. Test Database Management
```javascript
// test-utils/test-db.js
class TestDatabase {
  async setup() {
    // Create isolated test database
    this.dbName = `test_${Date.now()}_${process.pid}`;
    await this.createDatabase(this.dbName);
    await this.runMigrations();
  }

  async teardown() {
    await this.dropDatabase(this.dbName);
  }

  async reset() {
    // Fast table truncation for tests
    const tables = ['users', 'scans', 'refresh_tokens'];
    await Promise.all(
      tables.map(table => 
        this.query(`TRUNCATE TABLE ${table} CASCADE`)
      )
    );
  }

  transaction(fn) {
    return this.knex.transaction(async (trx) => {
      try {
        const result = await fn(trx);
        await trx.rollback(); // Always rollback test transactions
        return result;
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    });
  }
}
```

## Monitoring and Observability

### 1. Test Metrics Dashboard
```javascript
// test-metrics.js
class TestMetrics {
  constructor() {
    this.prometheus = require('prom-client');
    this.register = new this.prometheus.Registry();
    
    // Define metrics
    this.testDuration = new this.prometheus.Histogram({
      name: 'test_duration_seconds',
      help: 'Test execution duration',
      labelNames: ['test_suite', 'test_name', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    });

    this.testCount = new this.prometheus.Counter({
      name: 'test_executions_total',
      help: 'Total test executions',
      labelNames: ['test_suite', 'status']
    });

    this.flakyTests = new this.prometheus.Gauge({
      name: 'flaky_tests_count',
      help: 'Number of identified flaky tests',
      labelNames: ['test_suite']
    });

    this.register.registerMetric(this.testDuration);
    this.register.registerMetric(this.testCount);
    this.register.registerMetric(this.flakyTests);
  }

  recordTest(suite, name, duration, status) {
    this.testDuration.observe({ test_suite: suite, test_name: name, status }, duration);
    this.testCount.inc({ test_suite: suite, status });
  }

  getMetrics() {
    return this.register.metrics();
  }
}
```

### 2. Real User Monitoring
```javascript
// rum-integration.js
class RealUserMonitoring {
  constructor() {
    this.errors = [];
    this.slowTransactions = [];
  }

  trackError(error, context) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      userAgent: context.userAgent,
      userId: context.userId,
      timestamp: new Date().toISOString()
    };

    this.errors.push(errorData);

    // Auto-create bug for new error patterns
    if (this.isNewErrorPattern(errorData)) {
      this.createBugFromRUM(errorData);
    }
  }

  trackPerformance(transaction) {
    if (transaction.duration > 3000) {
      this.slowTransactions.push(transaction);
      
      // Alert on performance regression
      if (this.isPerformanceRegression(transaction)) {
        this.createPerformanceBug(transaction);
      }
    }
  }
}
```

## Cost Optimization

### 1. Test Execution Optimization
```javascript
// Parallel test execution
export const config = {
  maxWorkers: '50%',
  testTimeout: 30000,
  bail: 1, // Stop on first failure in CI
  cache: true,
  cacheDirectory: '/tmp/jest_cache',
  
  // Only run affected tests
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  
  // Optimize for CI
  ...(process.env.CI && {
    coverageReporters: ['json', 'lcov'],
    reporters: ['default', 'jest-junit'],
    testResultsProcessor: 'jest-junit'
  })
};
```

### 2. Resource Usage Monitoring
```javascript
// Monitor test resource usage
class TestResourceMonitor {
  constructor() {
    this.startTime = Date.now();
    this.startCpu = process.cpuUsage();
    this.startMem = process.memoryUsage();
  }

  report() {
    const duration = Date.now() - this.startTime;
    const cpu = process.cpuUsage(this.startCpu);
    const mem = process.memoryUsage();

    const report = {
      duration: `${duration}ms`,
      cpu: {
        user: `${cpu.user / 1000}ms`,
        system: `${cpu.system / 1000}ms`
      },
      memory: {
        rss: `${(mem.rss / 1024 / 1024).toFixed(2)}MB`,
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)}MB`
      },
      costEstimate: this.estimateCost(duration, mem.rss)
    };

    // Alert if tests are getting expensive
    if (report.costEstimate > 0.10) {
      console.warn(`Test suite cost: $${report.costEstimate.toFixed(4)} - Consider optimization`);
    }

    return report;
  }

  estimateCost(durationMs, memoryBytes) {
    // Rough CI/CD cost estimation
    const computeHours = durationMs / 1000 / 60 / 60;
    const gbHours = (memoryBytes / 1024 / 1024 / 1024) * computeHours;
    const costPerGbHour = 0.10; // Typical CI/CD pricing
    
    return gbHours * costPerGbHour;
  }
}
```

## Testing Checklist

### Before Every PR
- [ ] All tests pass locally
- [ ] Coverage meets thresholds (80% minimum)
- [ ] No console.log or debug statements
- [ ] New features have tests
- [ ] Integration tests for API changes
- [ ] Performance tests for critical paths

### Before Every Release
- [ ] Full E2E test suite passes
- [ ] Security scan shows no high vulnerabilities
- [ ] Performance benchmarks meet SLAs
- [ ] Load tests pass at 2x expected traffic
- [ ] All flaky tests fixed or quarantined
- [ ] Test data cleaned from staging

### Monthly Maintenance
- [ ] Review and fix flaky tests
- [ ] Update test dependencies
- [ ] Optimize slow tests
- [ ] Archive old bug reports
- [ ] Review test coverage gaps
- [ ] Update performance baselines

## Conclusion

Effective test engineering is about finding the right balance between automation and manual testing, speed and thoroughness, cost and coverage. By following these best practices and implementing automatic bug logging, you can maintain high quality while optimizing costs.

Remember: The goal isn't 100% test coverage—it's 100% confidence in your deployments.