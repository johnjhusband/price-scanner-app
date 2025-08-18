# Lessons Learned - Breaking the Loop

## The Problem Pattern
We keep breaking blue.flippi.ai with the same issues:
1. JavaScript bundle errors from bad dependencies
2. Nginx routing issues (React app catches all routes)
3. Database migrations not running
4. Scripts trying to do too much

## Why This Keeps Happening
1. **No local testing** - Pushing untested code directly to develop
2. **Script proliferation** - 80+ scripts, many duplicating functionality
3. **Copying between environments** - Instead of fixing root causes
4. **Fighting the system** - Trying to bypass CLAUDE.md restrictions

## The Right Way Forward

### 1. Local Testing First
```bash
cd mobile-app
npm install
npx expo export --platform web --output-dir test-dist
# Check the output BEFORE pushing
```

### 2. Understand the Deployment Flow
- develop → blue.flippi.ai (automated)
- staging → green.flippi.ai (automated)
- master → app.flippi.ai (automated)

### 3. Fix Root Causes, Not Symptoms
- **Bundle errors**: Fix package.json dependencies
- **Routing issues**: Fix nginx config templates
- **Database issues**: Add migrations to deployment workflow

### 4. Work Within CLAUDE.md Rules
- Cannot modify workflows → Fix the source code
- Cannot run on server → Make deployment self-healing
- Cannot create PRs → Test thoroughly before pushing

## Immediate Actions
1. **Stop creating new scripts**
2. **Test locally before pushing**
3. **Document what actually works**
4. **Clean up the 80+ scripts mess**

## What Actually Works
- green.flippi.ai works because it has:
  - No qrcode/lucide dependencies
  - Proper nginx routing order
  - Database already migrated
  
## Next Time
Before pushing ANY fix:
1. Can I test this locally?
2. Will this affect other environments?
3. Am I fixing the root cause or adding complexity?
4. Have I made this same fix before?