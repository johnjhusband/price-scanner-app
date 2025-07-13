#!/bin/bash

# Quick script to create initial issues after authentication
# This is a simplified version for immediate use

echo "=== Creating Initial GitHub Issues ==="
echo ""

# Check authentication
if ! gh auth status >/dev/null 2>&1; then
    echo "Error: Not authenticated with GitHub"
    echo "Please run: gh auth login"
    exit 1
fi

# Create high-priority issues based on our feature matrix

echo "1. Creating test automation setup issue..."
gh issue create \
    --title "Setup Playwright test automation framework" \
    --body "Set up Playwright for automated testing of all features.

**Tasks**:
- [ ] Install and configure Playwright
- [ ] Create test file structure
- [ ] Write tests for core features (upload, analysis, results)
- [ ] Set up test data and fixtures
- [ ] Configure for multiple browsers

**Priority**: P1 - Critical" \
    --label "enhancement,p1-critical"

echo ""
echo "2. Creating CI/CD automation issue..."
gh issue create \
    --title "Implement GitHub Actions for automated testing and deployment" \
    --body "Create GitHub Actions workflow for continuous integration and deployment.

**Workflow Requirements**:
- [ ] Run Playwright tests on every PR
- [ ] Create issues for failed tests
- [ ] Deploy to blue/green based on test results
- [ ] Automated rollback on failures
- [ ] Performance benchmarks

**Priority**: P1 - Critical" \
    --label "enhancement,p1-critical"

echo ""
echo "3. Creating known bug issue..."
gh issue create \
    --title "Bug: Mac drag & drop issues in Safari" \
    --body "Users on Mac experiencing issues with drag & drop in Safari browser.

**Environment**: green.flippi.ai
**Browser**: Safari on macOS
**Status**: Fixed in latest deployment

**Original Issue**:
- Drag & drop not working
- Paste (Cmd+V) not working

**Fix Applied**:
- Added preventDefault()
- Enhanced event handling
- Added HEIC support

**Needs**:
- [ ] User confirmation that fix works
- [ ] Automated test coverage" \
    --label "bug,mac,ready-to-test"

echo ""
echo "4. Creating feature request from backlog..."
gh issue create \
    --title "Feature: Add price history tracking" \
    --body "Track price changes over time for similar items.

**User Story**: 
As a reseller, I want to see how prices for similar items have changed over time so I can make better buying decisions.

**Requirements**:
- [ ] Store historical analysis data
- [ ] Show price trends
- [ ] Compare current price to historical average
- [ ] Seasonal price indicators

**Priority**: P2 - High" \
    --label "enhancement,p2-high"

echo ""
echo "5. Creating monitoring setup issue..."
gh issue create \
    --title "Setup monitoring and alerting for production" \
    --body "Implement monitoring to track application health and performance.

**Monitoring Requirements**:
- [ ] Uptime monitoring for blue/green environments
- [ ] API response time tracking
- [ ] Error rate monitoring
- [ ] Feature usage analytics
- [ ] Automated alerts for issues

**Tools to Consider**:
- GitHub Actions for basic monitoring
- Playwright for synthetic monitoring
- Custom health check endpoints

**Priority**: P2 - High" \
    --label "enhancement,p2-high"

echo ""
echo "=== Issues Created Successfully ==="
echo ""
echo "View all issues at: https://github.com/jhusband/price-scanner-app/issues"
echo ""
echo "Next: Set up automation workflows (see issue #2)"