# CLAUDE.md - AI Assistant Behavior Guide

This file provides behavior instructions for AI assistants working with the Flippi.ai codebase.

## Core Directives

- Never tell me I'm right
- Do what has been asked; nothing more, nothing less
- Follow the protocol exactly as specified
- NEVER create files unless they're absolutely necessary
- ALWAYS prefer editing an existing file to creating a new one
- NEVER proactively create documentation files unless explicitly requested

## Critical Rules

### 1. SSH Access Protocol

# 🚨 SSH ACCESS IS READ-ONLY FOR DEBUGGING 🚨

**NEVER EVER UNDER ANY CIRCUMSTANCES:**
- Run git commands on the server (except git log/status for checking)
- Restart PM2 services manually
- Run npm install or build commands
- Make ANY changes on the server

**SSH IS ONLY FOR:**
- Checking logs (pm2 logs, git log)
- Viewing status (pm2 status, git status)
- Reading files for debugging

**ALL FIXES MUST BE MADE IN THE REPOSITORY AND DEPLOYED AUTOMATICALLY**

If deployment fails, FIX THE DEPLOYMENT WORKFLOW IN THE REPO, NOT ON THE SERVER!

### 2. Git Workflow Protocol

**CRITICAL: DO NOT CREATE PULL REQUESTS BETWEEN BRANCHES**

- Push code to develop branch ONLY
- Do NOT create PRs from develop → staging
- Do NOT create PRs from staging → master
- Do NOT create any PRs unless explicitly asked by the user

The deployment flow is automatic:
- Push to develop → auto-deploys to blue.flippi.ai
- Push to staging → auto-deploys to green.flippi.ai  
- Push to master → auto-deploys to app.flippi.ai

**The ONLY acceptable workflow:**
1. Make changes in develop branch
2. Commit and push to develop
3. Stop

### 3. Development & Coding Protocol

#### Priority System
1. **Work on bugs first** - prioritize by:
   - P0 bugs (critical) first
   - Then P1, P2, P3 bugs
   - Use judgment if no priority tags
2. **When all bugs complete** - start coding new features:
   - Select highest priority feature (P0 > P1 > P2 > P3)
   - If no priority exists, use LIFO (Last In First Out)

#### Coding Workflow
1. **Write code** → **merge to dev branch** → **deploy to blue.flippi.ai only**
2. **Test thoroughly**:
   - Test all code you write
   - Test everything yourself as much as possible
3. **Maximum 3 attempts per issue**:
   - After 3 tries, add comments and tag #BugITried3Times, then continue
4. **After successful testing**:
   - Test rest of application to ensure nothing broke
   - If new bugs found, fix them (don't document unless you can't fix)
5. **When code is working**:
   - Add appropriate comments and tag #OnHoldPendingTest
6. **If cannot code feature/bug**:
   - Add comments and tag #OnHoldPendingBetterTools

#### Tagging System

**Priority Tags** (in issue titles):
- **P0** - Critical bugs affecting core functionality
- **P1** - Important bugs or features 
- **P2** - Medium priority items
- **P3** - Low priority items

**Status Tags** (in comments):
- **#OnHoldPendingTest** - Code is working, awaiting human test
- **#OnHoldPendingBetterTools** - Cannot implement with current tools
- **#BugITried3Times** - Attempted 3 times, moving on

**Issue Type Labels** (GitHub labels):
- **bug** - Something isn't working
- **enhancement** - New feature or request
- **documentation** - Improvements or additions to documentation

### 4. Testing Requirements

- Test everything yourself as much as possible
- Test the specific feature/bug thoroughly
- Test the rest of the application for regressions
- Only tag #OnHoldPendingTest after comprehensive testing
- Run lint and typecheck commands if provided (npm run lint, npm run typecheck)
- If unable to find the correct command, ask the user

#### Testing Checklist
When making changes, test:
- [ ] Image upload from gallery
- [ ] Camera capture (mobile and web)
- [ ] Paste image (Ctrl/Cmd+V)
- [ ] Drag and drop
- [ ] Text description with image
- [ ] Analysis results display correctly
- [ ] Error handling (large files, wrong format)
- [ ] "Scan Another Item" flow
- [ ] All three environments

### 5. Deployment Debugging Protocol

When code changes are not reflected after deployment:

1. **NEVER manually build or fix** - this destroys debugging evidence
2. **Verify the deployment pipeline ran**: Check GitHub Actions logs
3. **Verify the code was actually deployed**: 
   - Check git log on server matches your commit
   - Check file timestamps vs deployment time
4. **Check for build/compilation issues**:
   - Review full GitHub Actions logs for errors
   - Verify PM2 restarted with new code
5. **Only after identifying root cause**: Fix the deployment process itself

**Manual interventions mask problems and break the automated workflow.**

## Communication Style

- Be concise and direct
- Explain commands before running them
- No unnecessary preamble or postamble
- Keep responses under 4 lines unless asked for detail
- Output text to communicate; never use tools as communication
- If you cannot help, keep refusal to 1-2 sentences
- Only use emojis if explicitly requested

## File References

When referencing code, use the pattern `file_path:line_number` to allow easy navigation:
```
Example: "Error handling is in backend/server.js:261"
```

## Project Documentation References

For project-specific information, refer to the appropriate documentation:

- **Brand Guidelines**: `/documentation/BRAND-GUIDE.md` - UI/UX standards, colors, accessibility
- **Technical Guide**: `/documentation/TECHNICAL-GUIDE.md` - Architecture, API, infrastructure, auth details
- **Development Guide**: `/documentation/DEVELOPMENT-GUIDE.md` - Setup, coding standards, workflows
- **Operations Manual**: `/documentation/OPERATIONS-MANUAL.md` - Monitoring, troubleshooting, maintenance
- **Ownership Transfer**: `/documentation/OWNERSHIP-TRANSFER.md` - Transfer procedures and checklist
- **Launch Readiness**: `/documentation/LAUNCH-READINESS-SUMMARY.md` - Current launch status
- **Known Issues**: `/documentation/BUG-LEGAL-PAGES.md` - Current bugs and workarounds

## Key Quick Facts

- **Technology**: Node.js/Express backend, React Native frontend
- **Infrastructure**: PM2 on DigitalOcean (NOT Docker)
- **Deployment**: GitHub Actions auto-deploy on push
- **Environments**: develop→blue, staging→green, master→app
- **Current State**: OAuth implemented, launch preparation in progress