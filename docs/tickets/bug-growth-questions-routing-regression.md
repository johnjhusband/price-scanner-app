# Bug: Growth Questions Routing Regression

**Labels**: bug, regression, blue, routing, priority-high  
**Environment**: blue.flippi.ai  
**Date Reported**: August 18, 2025  

## Issue Description

When navigating from Growth tab to Questions in the blue environment, the app incorrectly routes to the Upload Photo page instead of rendering the Questions page at `/growth/questions`.

## Symptoms
- Click Growth → Questions → Shows Upload Photo page
- Direct navigation to `/growth/questions` may also fail
- Regression appeared after Release 006 deployment

## Fix & Prevention Plan

### Root Cause Analysis
- [ ] Router link, guard, or nginx fallback causing incorrect routing
- [ ] Possible SPA catch-all rule intercepting growth routes
- [ ] Missing or incorrect route configuration in frontend

### Implementation Tasks

#### 1. Unit Tests
- [ ] Route mounts QuestionsPage when navigating to `/growth/questions`
- [ ] Test router configuration includes explicit growth routes

#### 2. E2E Tests (Cypress/Playwright)
- [ ] From Growth tab, click Questions → assert URL `/growth/questions`
- [ ] Assert "Questions Found" text visible
- [ ] Test back navigation returns to `/growth`

#### 3. Route Guards
- [ ] Explicit route map: `/growth/questions` → QuestionsPage
- [ ] No implicit redirects or fallbacks for growth paths
- [ ] Verify route priority order

#### 4. Navigation Flow
- [ ] Back nav: "Back to Automation Control" → `/growth`
- [ ] Breadcrumb navigation works correctly

#### 5. Nginx Configuration
- [ ] Ensure growth block precedes SPA fallback
- [ ] CI smoke test: `curl /growth/questions` and grep page marker
- [ ] Verify nginx routing order in all environments

#### 6. Feature Flags
- [ ] Page does not depend on transient flags in Blue
- [ ] Remove any environment-specific conditionals

#### 7. Release Testing
- [ ] Add to Release-006 checklist
- [ ] Include in regression test suite

## Acceptance Criteria

- [ ] Direct load `/growth/questions` renders QuestionsPage with no console errors
- [ ] In-app nav Growth → Questions renders same page
- [ ] Back button returns to `/growth`
- [ ] Unit + E2E tests pass in CI
- [ ] Nginx smoke test passes
- [ ] Ticket linked to failing commit and RCA attached

## RCA (Root Cause Analysis)

**Symptom**: Questions → Upload Photo  
**Trigger**: Release 006 deployment - nginx configuration not updated  
**Fault**: Missing `/growth` location block in nginx configuration  
**Impact**: Growth UI inaccessible - all `/growth/*` routes fall through to React app  
**Fix**: Added `post-deploy-all-routes.sh` to deployment workflow  
**Prevention**: Tests added, nginx check added, deployment workflow updated  

### Technical Details:
1. Frontend correctly navigates to `/growth/questions` via `window.location.href`
2. Backend has the route properly configured in `growthAdmin.js`
3. Nginx was missing the `/growth` proxy configuration
4. Without proxy config, requests fall through to catch-all React route
5. React app shows default view (Upload Photo) for unknown routes  

## Documentation Updates

### docs/routing.md
- Canonical route map for `/growth`, `/growth/questions`, back-nav
- Route priority and precedence rules

### docs/nginx.md
- Snippet order (growth before SPA)
- CI curl check examples

### QA/checklists/release-006.md
- Add regression step for Growth → Questions

### CHANGELOG.md
- "Fix: Growth Questions routing regression in Blue; added tests & nginx guard"

## CI/CD Additions

### Smoke Tests
```bash
curl -fsS https://blue.flippi.ai/growth/questions | grep -q "Questions Found"
```

### E2E Job
- Headless run on Blue after deploy
- Block deployment if tests fail

## Testing Checklist

- [ ] Manual test: Growth → Questions navigation
- [ ] Manual test: Direct URL navigation
- [ ] Manual test: Back button functionality
- [ ] Automated unit tests pass
- [ ] Automated E2E tests pass
- [ ] Nginx configuration verified
- [ ] Smoke tests in CI pass

## Related Issues
- Release 006 deployment
- Growth route fixes from previous tickets

## Next Steps
1. Investigate root cause in routing configuration
2. Implement fix with tests
3. Deploy to blue for verification
4. Update documentation
5. Add to permanent test suite