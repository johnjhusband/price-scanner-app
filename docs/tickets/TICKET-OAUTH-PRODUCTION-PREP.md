# 🎫 Ticket: OAuth Production Deployment Preparation

## Summary
Preparation checklist and scripts for deploying OAuth to production (app.flippi.ai).

## Current Status
- ✅ Development (blue.flippi.ai): OAuth working (returns 302)
- ⏳ Staging (green.flippi.ai): Scripts deployed, awaiting execution
- ❌ Production (app.flippi.ai): OAuth not configured (returns 200)

## Production Deployment Plan

### 1. Pre-Deployment Checklist
- [ ] Verify OAuth works on staging (returns 302)
- [ ] Backup production nginx configuration
- [ ] Ensure production OAuth credentials are configured
- [ ] Schedule maintenance window if needed

### 2. Nginx Configuration Required
Production nginx needs the OAuth location block:
```nginx
location /auth {
    proxy_pass http://localhost:3000;  # Note: Production uses port 3000
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 3. Production-Specific Script
Create `scripts/apply-production-oauth-fix.sh`:
- Use port 3000 (not 3001 like staging)
- Update nginx config for app.flippi.ai
- Include production-specific SSL paths

### 4. Deployment Workflow Update
Update `.github/workflows/deploy-production.yml` to:
- Run OAuth fix script after code deployment
- Verify OAuth endpoint returns 302
- Log results for monitoring

### 5. Verification Steps
```bash
# Before deployment
curl -I https://app.flippi.ai/auth/google  # Should return 200

# After deployment
curl -I https://app.flippi.ai/auth/google  # Should return 302
```

## Risk Mitigation
- Scripts include backup and rollback functionality
- OAuth fix is non-blocking to prevent deployment failures
- Test thoroughly on staging before production

## Timeline
1. Confirm staging OAuth works (immediate)
2. Create production-specific scripts (30 minutes)
3. Update production workflow (15 minutes)
4. Deploy to production (10 minutes)
5. Verify OAuth functionality (5 minutes)

## Success Criteria
- Production OAuth endpoint returns 302
- Users can log in with Google
- No disruption to existing functionality