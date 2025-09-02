# 🎫 Ticket #005: Fix Postinstall Script CI/CD Compatibility

## Summary
Replace sudo-based postinstall script with check-only version to prevent npm install failures in CI/CD.

## Problem
- `backend/package.json` postinstall runs `fix-staging-nginx.sh`
- Script uses sudo commands that fail in GitHub Actions
- Errors hidden by `2>/dev/null || true`
- Prevents OAuth configuration from being applied

## Original Issue
```json
"postinstall": "bash ../scripts/fix-staging-nginx.sh 2>/dev/null || true"
```

Script contained:
```bash
sudo sed -i '/^}$/i\    # OAuth routes\n    location /auth {\n        proxy_pass http://localhost:3001;...
sudo nginx -t && sudo nginx -s reload
```

## Solution Implemented
1. Created `scripts/postinstall-nginx-check.sh` - check-only script
2. Updated package.json to use non-modifying script
3. Nginx updates handled by deployment workflow instead

## New Postinstall Script
```bash
#!/bin/bash
# Check nginx config without modifying
if grep -q "location /auth" "$NGINX_CONFIG"; then
    echo "✅ OAuth routes already configured"
else
    echo "⚠️  OAuth routes missing from nginx config"
    echo "   Run fix-staging-nginx-oauth.sh as root to fix"
fi
exit 0  # Always succeed
```

## Benefits
- npm install always succeeds
- Clear indication when manual intervention needed
- No hidden failures
- Separation of concerns

## Status
- ✅ Check-only postinstall script created
- ✅ Package.json updated
- ✅ Deployment workflow handles nginx updates