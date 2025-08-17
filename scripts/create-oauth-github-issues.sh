#!/bin/bash
# Create GitHub Issues for OAuth deployment tickets

echo "Creating GitHub Issues for OAuth deployment..."

# Issue #75
gh issue create \
  --title "OAuth NGINX Configuration Scripts" \
  --body "## Summary
Created robust OAuth fix scripts to manage and enforce OAuth NGINX config updates for staging and production environments.

## Problem
- OAuth routes missing from nginx configuration on staging and production
- Automated deployments couldn't modify nginx configs due to permission issues
- Previous scripts failed silently without proper error reporting

## Solution Implemented
1. Created \`scripts/apply-staging-oauth-fix.sh\`
   - Conditionally applies OAuth config if it doesn't already exist
   - Includes comprehensive logging and debugging output
   - Performs curl-based endpoint verification (expects 302)

2. Created \`scripts/force-staging-oauth-fix.sh\`
   - Forcefully rewrites NGINX config with OAuth location block
   - Always updates, even if OAuth routes appear to exist
   - Includes detailed debugging and verification steps

3. Updated \`.github/workflows/deploy-staging.yml\`
   - Runs OAuth fix script immediately after code pull
   - Includes OAuth status curl check in deployment
   - Already runs as root via SSH, no sudo needed

## Status
- ✅ Scripts created and tested
- ✅ Deployment workflow updated
- ⏳ Awaiting deployment execution" \
  --label "deployment" \
  --label "oauth"

# Issue #76
gh issue create \
  --title "OAuth Deployment Workflow Updates" \
  --body "## Summary
Updated staging deployment workflow to automatically apply OAuth nginx configuration during deployments.

## Problem
- OAuth configuration was not being applied during automated deployments
- Manual intervention was required after each deployment
- Scripts existed but weren't being executed properly

## Changes Made
The staging deployment workflow now:
- Executes OAuth fix scripts after pulling latest code
- Checks for multiple script variations to ensure compatibility
- Logs OAuth status after deployment
- Continues deployment even if OAuth fix fails (non-blocking)

## Script Execution Order
\`\`\`bash
# After git pull, the workflow checks for scripts in this order:
1. scripts/fix-staging-oauth-verbose.sh
2. scripts/fix-staging-nginx-oauth.sh
3. scripts/apply-staging-oauth-fix.sh
4. scripts/force-staging-oauth-fix.sh
\`\`\`

## Status
- ✅ Workflow updated
- ✅ Multiple fallback scripts provided
- ⏳ Awaiting deployment execution" \
  --label "deployment" \
  --label "workflow"

# Issue #77
gh issue create \
  --title "OAuth Production Deployment Preparation" \
  --body "## Summary
Preparation checklist and scripts for deploying OAuth to production (app.flippi.ai).

## Current Status
- ✅ Development (blue.flippi.ai): OAuth working (returns 302)
- ⏳ Staging (green.flippi.ai): Scripts deployed, awaiting execution
- ❌ Production (app.flippi.ai): OAuth not configured (returns 200)

## Production Deployment Plan
- [ ] Verify OAuth works on staging (returns 302)
- [ ] Backup production nginx configuration
- [ ] Ensure production OAuth credentials are configured
- [ ] Create production-specific OAuth fix script (port 3000)
- [ ] Update production deployment workflow
- [ ] Deploy and verify

## Key Difference
Production uses port 3000 (not 3001 like staging)

## Verification
\`\`\`bash
# Before deployment
curl -I https://app.flippi.ai/auth/google  # Should return 200

# After deployment
curl -I https://app.flippi.ai/auth/google  # Should return 302
\`\`\`

## Status
- ⏳ Awaiting staging confirmation
- ⏳ Production scripts pending" \
  --label "production" \
  --label "oauth"

# Issue #78
gh issue create \
  --title "Remove Sudo from OAuth Fix Scripts" \
  --body "## Summary
Remove sudo privilege escalation from OAuth fix scripts to ensure compatibility with CI/CD environment.

## Problem
- Scripts contained internal sudo escalation logic
- Auto-escalating to sudo is unreliable in CI/CD environments
- GitHub Actions doesn't permit internal privilege escalation

## Code Removed
\`\`\`bash
if [ ! -w \"\$NGINX_CONFIG\" ] && [ \"\$EUID\" -ne 0 ]; then
    echo \"⚠️  Need sudo access to modify nginx config\"
    exec sudo \"\$0\" \"\$@\"
fi
\`\`\`

## Solution
- Scripts now assume they're running with appropriate permissions
- Deployment workflows must explicitly invoke scripts with sudo if needed
- GitHub Actions SSH connection already runs as root

## Status
- ✅ Sudo logic removed from all scripts
- ✅ Scripts assume proper permissions
- ✅ Deployment workflow runs as root" \
  --label "ci/cd" \
  --label "security"

# Issue #79
gh issue create \
  --title "Fix Postinstall Script CI/CD Compatibility" \
  --body "## Summary
Replace sudo-based postinstall script with check-only version to prevent npm install failures in CI/CD.

## Problem
- \`backend/package.json\` postinstall runs \`fix-staging-nginx.sh\`
- Script uses sudo commands that fail in GitHub Actions
- Errors hidden by \`2>/dev/null || true\`

## Solution Implemented
1. Created \`scripts/postinstall-nginx-check.sh\` - check-only script
2. Updated package.json to use non-modifying script
3. Nginx updates handled by deployment workflow instead

## Benefits
- npm install always succeeds
- Clear indication when manual intervention needed
- No hidden failures
- Separation of concerns

## Status
- ✅ Check-only postinstall script created
- ✅ Package.json updated
- ✅ Deployment workflow handles nginx updates" \
  --label "ci/cd" \
  --label "npm"

echo "✅ GitHub Issues created successfully!"